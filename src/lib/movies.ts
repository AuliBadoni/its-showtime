import catalogJson from '../../data/movies.json';
import type { Movie, SeedBucket } from '../types/movie';

const CATALOG = catalogJson as Movie[];

const CATALOG_BY_ID = new Map<number, Movie>(CATALOG.map((m) => [m.tmdb_id, m]));

export function getCatalog(): Movie[] {
  return CATALOG;
}

export function getMovieByTmdbId(tmdbId: number): Movie | undefined {
  return CATALOG_BY_ID.get(tmdbId);
}

const BUCKETS: SeedBucket[] = [
  'comedy',
  'drama',
  'thriller',
  'action',
  'horror',
  'romance',
  'scifi',
  'animation',
];

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Stratified sample across `seed_bucket`. Pulls round-robin from shuffled
 * per-bucket queues so the 10-movie deck spans genres rather than clumping.
 */
export function pickSeedMovies(n = 10): Movie[] {
  const byBucket: Record<string, Movie[]> = {};
  for (const bucket of BUCKETS) byBucket[bucket] = [];
  for (const movie of CATALOG) {
    if (byBucket[movie.seed_bucket]) byBucket[movie.seed_bucket].push(movie);
  }
  for (const bucket of BUCKETS) byBucket[bucket] = shuffle(byBucket[bucket]);

  const order = shuffle(BUCKETS);
  const picks: Movie[] = [];
  let exhausted = 0;
  while (picks.length < n && exhausted < order.length) {
    exhausted = 0;
    for (const bucket of order) {
      const queue = byBucket[bucket];
      if (queue.length === 0) {
        exhausted++;
        continue;
      }
      picks.push(queue.shift()!);
      if (picks.length >= n) break;
    }
  }
  return picks;
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatGenres(genres: string[], max = 3): string {
  return genres.slice(0, max).join(', ');
}

/**
 * Vibe line: first sentence of the overview, trimmed to ~100 chars. Used until
 * a dedicated vibe field is added to the catalog.
 */
export function vibeLine(overview: string, maxLen = 100): string {
  if (!overview) return '';
  const sentenceEnd = overview.search(/[.!?]\s/);
  const sentence = sentenceEnd > 0 ? overview.slice(0, sentenceEnd + 1) : overview;
  if (sentence.length <= maxLen) return sentence;
  return sentence.slice(0, maxLen - 1).trimEnd() + '…';
}
