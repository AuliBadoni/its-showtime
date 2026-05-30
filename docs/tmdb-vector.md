# TMDB `feature_vector` schema (13 dimensions)

Pre-computed at seed time in [scripts/seed_movies.py](../scripts/seed_movies.py) and consumed by the Expo app for taste-vector scoring. Python and TypeScript must use identical formulas so user vectors and movie vectors live in the same space.

## Vector layout

| Index | Feature   | Formula                                                        |
| ----- | --------- | -------------------------------------------------------------- |
| 0     | comedy    | `1.0` if TMDB `genre_id` 35 in `genre_ids`, else `0.0`         |
| 1     | drama     | `1.0` if TMDB `genre_id` 18 in `genre_ids`, else `0.0`         |
| 2     | thriller  | `1.0` if TMDB `genre_id` 53 in `genre_ids`, else `0.0`         |
| 3     | action    | `1.0` if TMDB `genre_id` 28 in `genre_ids`, else `0.0`         |
| 4     | horror    | `1.0` if TMDB `genre_id` 27 in `genre_ids`, else `0.0`         |
| 5     | romance   | `1.0` if TMDB `genre_id` 10749 in `genre_ids`, else `0.0`      |
| 6     | scifi     | `1.0` if TMDB `genre_id` 878 in `genre_ids`, else `0.0`        |
| 7     | animation | `1.0` if TMDB `genre_id` 16 in `genre_ids`, else `0.0`         |
| 8     | runtime   | `min(runtime / 180.0, 1.0)`; `0.0` if runtime is missing or 0  |
| 9     | year      | `clip((year - 1970) / 55.0, 0.0, 1.0)`                         |
| 10    | rating    | `vote_average / 10.0`                                          |
| 11    | popularity | `log1p(popularity) / log1p(max_popularity)`, clipped to `[0, 1]` |
| 12    | vote_count | `log1p(vote_count) / log1p(max_vote_count)`, clipped to `[0, 1]` |

`max_popularity` and `max_vote_count` are computed over the **final 200-movie catalog** (after dedupe and quota filling), so indices 11–12 are comparable across the bundled dataset.

## Genre order is fixed

The first 8 dimensions are positional. Do not reorder. Adding new genres requires a new schema version and a re-seed.

## Storage

Stored as a plain JSON array of 13 floats inside each movie record in [data/movies.json](../data/movies.json). NumPy is only used during seeding; the app loads the values as a normal `number[]`.

## Taste vector (app side)

For reference — not computed at seed time:

1. For each swipe, take that movie's `feature_vector`.
2. Multiply by weight: `yes = +1.0`, `meh = +0.3`, `no = -0.5`.
3. Sum across all swipes.
4. L2-normalize the resulting 13-dim vector.

Group compatibility uses cosine similarity between members' normalized vectors.
