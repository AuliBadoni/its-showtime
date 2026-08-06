"""One-time TMDB → data/movies.json seeder.

Pulls ~2500 popular movies across genre buckets, dedupes globally, computes a
13-dim feature_vector per movie (see docs/tmdb-vector.md), and writes a single
JSON array to data/movies.json.

Usage:
    python scripts/seed_movies.py

Requires TMDB_API_KEY in the project root .env file.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np
import requests
from dotenv import load_dotenv
import os

TMDB_BASE = "https://api.themoviedb.org/3"
POSTER_BASE = "https://image.tmdb.org/t/p/w500"

GENRE_ORDER = [
    ("comedy", 35),
    ("drama", 18),
    ("thriller", 53),
    ("action", 28),
    ("horror", 27),
    ("romance", 10749),
    ("scifi", 878),
    ("animation", 16),
]

BUCKETS = [
    ("comedy", 35, 313),
    ("drama", 18, 313),
    ("thriller", 53, 313),
    ("action", 28, 313),
    ("horror", 27, 313),
    ("romance", 10749, 313),
    ("scifi", 878, 313),
    ("animation", 16, 313),
]

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = PROJECT_ROOT / "data" / "movies.json"


def tmdb_get(path: str, params: dict, api_key: str) -> dict:
    """GET a TMDB endpoint with one retry on HTTP 429."""
    params = {**params, "api_key": api_key}
    url = f"{TMDB_BASE}{path}"
    for attempt in range(2):
        resp = requests.get(url, params=params, timeout=15)
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "2"))
            time.sleep(retry_after)
            continue
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()
    return {}


def discover_page(genre_id: int, page: int, api_key: str) -> list[dict]:
    data = tmdb_get(
        "/discover/movie",
        {
            "with_genres": str(genre_id),
            "vote_count.gte": 500,
            "sort_by": "popularity.desc",
            "include_adult": "false",
            "page": page,
        },
        api_key,
    )
    return data.get("results", [])


def fetch_detail(tmdb_id: int, api_key: str) -> dict:
    return tmdb_get(f"/movie/{tmdb_id}", {}, api_key)


def parse_year(release_date: str | None) -> int | None:
    if not release_date or len(release_date) < 4:
        return None
    try:
        return int(release_date[:4])
    except ValueError:
        return None


def build_partial_vector(genre_ids: list[int], runtime: int, year: int, rating: float) -> list[float]:
    """Indices 0..10. Indices 11-12 are filled in a second pass."""
    vec = [0.0] * 13
    for i, (_, gid) in enumerate(GENRE_ORDER):
        if gid in genre_ids:
            vec[i] = 1.0
    vec[8] = min((runtime or 0) / 180.0, 1.0)
    vec[9] = float(np.clip((year - 1970) / 55.0, 0.0, 1.0))
    vec[10] = (rating or 0.0) / 10.0
    return vec


def collect_bucket(bucket: str, genre_id: int, quota: int, seen: set[int], api_key: str) -> list[dict]:
    """Paginate discover until the bucket quota is filled."""
    collected: list[dict] = []
    page = 1
    while len(collected) < quota:
        results = discover_page(genre_id, page, api_key)
        if not results:
            break

        for item in results:
            if len(collected) >= quota:
                break

            tmdb_id = item.get("id")
            if tmdb_id is None or tmdb_id in seen:
                continue
            if not item.get("poster_path"):
                continue
            if (item.get("vote_count") or 0) < 500:
                continue

            try:
                detail = fetch_detail(tmdb_id, api_key)
            except requests.HTTPError as e:
                print(f"  skip {tmdb_id}: detail fetch failed ({e})", file=sys.stderr)
                continue
            time.sleep(0.25)

            year = parse_year(detail.get("release_date") or item.get("release_date"))
            if year is None:
                continue

            poster_path = detail.get("poster_path") or item.get("poster_path")
            if not poster_path:
                continue

            genre_ids = [g["id"] for g in detail.get("genres", [])] or item.get("genre_ids", [])
            genres = [g["name"] for g in detail.get("genres", [])]
            runtime = detail.get("runtime") or 0
            rating = float(detail.get("vote_average") or item.get("vote_average") or 0.0)
            vote_count = int(detail.get("vote_count") or item.get("vote_count") or 0)
            popularity = float(detail.get("popularity") or item.get("popularity") or 0.0)

            movie = {
                "tmdb_id": tmdb_id,
                "title": detail.get("title") or item.get("title") or "",
                "year": year,
                "runtime": runtime,
                "genres": genres,
                "genre_ids": genre_ids,
                "rating": rating,
                "vote_count": vote_count,
                "popularity": popularity,
                "poster_url": f"{POSTER_BASE}{poster_path}",
                "overview": detail.get("overview") or item.get("overview") or "",
                "feature_vector": build_partial_vector(genre_ids, runtime, year, rating),
                "seed_bucket": bucket,
            }
            collected.append(movie)
            seen.add(tmdb_id)

        page += 1
        if page > 100:
            break

    return collected


def finalize_vectors(movies: list[dict]) -> None:
    """Fill indices 11-12 using log-normalization over the final catalog."""
    max_pop = max((m["popularity"] for m in movies), default=0.0)
    max_votes = max((m["vote_count"] for m in movies), default=0)
    pop_denom = np.log1p(max_pop) if max_pop > 0 else 1.0
    vote_denom = np.log1p(max_votes) if max_votes > 0 else 1.0

    for m in movies:
        pop_norm = float(np.clip(np.log1p(m["popularity"]) / pop_denom, 0.0, 1.0))
        vote_norm = float(np.clip(np.log1p(m["vote_count"]) / vote_denom, 0.0, 1.0))
        m["feature_vector"][11] = pop_norm
        m["feature_vector"][12] = vote_norm
        m["feature_vector"] = [round(x, 6) for x in m["feature_vector"]]


def main() -> int:
    load_dotenv(PROJECT_ROOT / ".env")
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        print("error: TMDB_API_KEY not set in .env", file=sys.stderr)
        return 1

    seen: set[int] = set()
    all_movies: list[dict] = []
    counts: dict[str, int] = {}

    for bucket, genre_id, quota in BUCKETS:
        print(f"fetching {bucket} (genre_id={genre_id}, quota={quota})...")
        movies = collect_bucket(bucket, genre_id, quota, seen, api_key)
        counts[bucket] = len(movies)
        all_movies.extend(movies)
        print(f"  -> {len(movies)}/{quota}")

    finalize_vectors(all_movies)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(all_movies, indent=2, ensure_ascii=False))

    print("\nper-bucket counts:")
    total = 0
    ok = True
    for bucket, _, quota in BUCKETS:
        got = counts.get(bucket, 0)
        total += got
        flag = "OK" if got >= quota else "SHORT"
        if got < quota:
            ok = False
        print(f"  {bucket:<10} {got}/{quota}  {flag}")
    print(f"\ntotal: {total}")
    print(f"output: {OUTPUT_PATH}")

    if not ok or total < 2500:
        print("\nseed incomplete: one or more buckets under quota", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
