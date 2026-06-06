# it's showtime

> Async group movie picker — everyone swipes on their own time, the app finds the movie that fits the whole group.

**Live app:** https://its-showtime-eight.vercel.app

---

## What it does

Picking a movie with friends usually takes longer than watching one. *it's showtime* fixes that with a short, async swipe loop:

1. One person creates a room and gets a **4-digit code** to share.
2. Everyone joins the same room from their own phone, on their own time.
3. Each person swipes **yes** or **no** on the same ten movies.
4. When the last person finishes, the **Results** screen shows the top three picks for the group, each with a match percentage.

The match score is built so the top pick is one **nobody had to compromise on** — a movie one person actively disliked won't bubble to the top just because two others loved it.

## Who it's for

- Friend groups of **2–5** who watch together (in person or remote).
- People who hate group-text negotiation about what to watch.
- Anyone with a phone browser — no app to install, no account to create, no login.

## How to use it

Just open **https://its-showtime-eight.vercel.app** on a phone or laptop.

- **Host:** tap *Create a room*, enter your name and a group name, share the 4-digit code.
- **Guests:** tap *Join room*, enter your name and the code.
- Everyone swipes the 10 movies. The Results screen appears once all members finish.

## Tech stack

- **React + Vite + Tailwind** for the UI (mobile-first, phone-frame layout).
- **Supabase Postgres** for group state, members, swipes, and taste profiles.
- **TMDB** for the movie catalog — pulled **once** by a Python seed script and saved to `data/movies.json` (~200 movies). The app never calls TMDB at runtime, so there are no rate limits and no API keys in the browser.
- **Scoring** in TypeScript: each member's swipes become a 13-dim "taste vector"; the group score is a hybrid `0.5 × avg + 0.5 × min` cosine similarity across members.

## Run it locally

You'll need Node 20+ and a free [Supabase](https://supabase.com/) project (URL + anon key).

```bash
git clone https://github.com/<your-username>/its-showtime.git
cd "its showtime"
npm install

# Add Supabase keys to .env.local at the repo root:
#   VITE_SUPABASE_URL=https://<your-project>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<your-anon-key>

npm run dev
```

The dev server prints a localhost URL — open it on a phone or browser and the flow is the same as the deployed version.

## Re-seed the movie catalog (optional)

Only needed if you want a fresher list of movies. Requires a free [TMDB API key](https://www.themoviedb.org/settings/api).

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Add your key to .env at the repo root:
#   TMDB_API_KEY=<your-tmdb-key>

python scripts/seed_movies.py
```

The script paginates TMDB across 8 genre buckets (200 movies total), dedupes, computes a 13-dim feature vector per movie, and writes `data/movies.json`. Re-run any time the catalog feels stale.

## Project documents

- [PLAN.md](PLAN.md) — build plan, architecture, and the v1 → v2 pivot history.
- [mp2.md](mp2.md) — competency evidence for HCDE 530 graders.
- [reflection.md](reflection.md) — end-of-quarter reflection on what shipped and what got cut.
- [docs/tmdb-vector.md](docs/tmdb-vector.md) — schema for the 13-dim taste vector.

## Credits

Movie data and posters from [The Movie Database (TMDB)](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.

Built by Auli for HCDE 530.
