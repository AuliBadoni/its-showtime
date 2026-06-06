# MP2 Reflection — it's showtime

## What did you build?

*it's showtime* is an async web app for friend groups picking what to watch together. A host creates a room with their name and a group name, gets a 4-digit invite code, and shares it. Each member joins, swipes yes/no on the same ten TMDB-seeded movies, and the app computes a personal taste vector. When everyone finishes, the results screen ranks the catalog by group fit and shows the top three picks as a swipeable poster carousel with a match percentage.

The stack is React + Vite + Tailwind with a mobile-first phone-frame layout, Supabase Postgres for groups/members/swipes/taste profiles, and a bundled offline catalog at `data/movies.json` (~200 movies). Deployed at https://its-showtime-eight.vercel.app.

## What decisions did you make?

Scope was the biggest change from MP2a. The original declaration combined swipe-based taste fingerprints with a blind auction, an LLM that wrote prose taste profiles, live TMDB calls, and a real-time Venn visualization. Per instructor feedback that this was a month of work rather than two weeks, I shipped the recommendation loop and deferred the auction and LLM to v2.

Three supporting calls: movie data lives in a one-time Python seed (`scripts/seed_movies.py` → `data/movies.json`) instead of live TMDB, so vectors are reproducible and there are no rate limits during UI work. Group sync is async polling in `GroupResults.tsx` rather than WebSockets, which matches the "swipe on your own time" use case. Fairness lives in `recommendMovies()` as `0.5 * avg + 0.5 * min` cosine similarity — a deterministic stand-in for the auction's max-min logic.

## What would you do differently?

The biggest gap is the LLM layer I cut for scope. Right now the results screen shows a match percentage and a poster carousel, but the number is opaque — users get no sense of *why* a movie fits the group or what tradeoffs were made. I would add an LLM pass after `recommendMovies()` returns the top candidates: feed it each member's swipe pattern, genre lean from their taste vector, and the hybrid group score, then ask it to write a short rationale per pick ("everyone liked thrillers; nobody vetoed long runtimes") and a one-line explanation of the match percentage. That was part of the original MP2a vision and would turn the cosine math into something people actually trust and act on, not just a green percentage above a poster.

Two smaller changes to the tool itself.

First, surface compatibility in the UI. `GroupResults.tsx` already computes a pairwise cosine matrix between members' taste vectors, but it only prints to the console — users see recommendations without ever seeing how compatible they are with each other, which was the visible-overlap promise from MP2a. A member×member match grid above the carousel would make the algorithm legible.

Second, harden the deploy path. The first Vercel build came back blank because `src/lib/supabase.ts` throws at import time when env vars are missing, and `src/App.tsx` statically imports every page, so the Supabase module loads on the intro screen. Lazy-loading the room routes and adding a `vercel.json` SPA rewrite from day one would have caught both problems before deploy.

## What does this work demonstrate?

The project covers six of the eight domains. Vibecoding shows in the Cursor-built React UI translated from Figma frames and the architecture pivot from Expo/iOS to a Vite web app. Code literacy is in `PLAN.md`, `docs/tmdb-vector.md` documenting the 13-dimension feature vector, and docstrings on `computeTasteVector()` and `createGroup()`. Data cleaning is `scripts/seed_movies.py` skipping bad TMDB rows, deduping by ID, retrying on HTTP 429, and validating per-bucket quotas before writing. API work spans the TMDB discover/detail endpoints in Python and the Supabase CRUD in `src/lib/groups.ts`, with keys kept in gitignored `.env` files. Critical judgment is visible in the scope cut and the Vercel diagnosis. Building a complete tool is the end-to-end shipped flow — though the blind auction and LLM copy remain declared but unbuilt.
