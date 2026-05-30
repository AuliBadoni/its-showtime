import type { Movie, SwipeRecord, TasteVector, Vote } from '../types/movie';

export const VECTOR_DIM = 13;

export const VOTE_WEIGHTS: Record<Vote, number> = {
  yes: 1.0,
  no: -0.5,
};

function l2Norm(vec: number[]): number {
  let sum = 0;
  for (const v of vec) sum += v * v;
  return Math.sqrt(sum);
}

function l2Normalize(vec: number[]): TasteVector | null {
  const norm = l2Norm(vec);
  if (norm === 0 || !Number.isFinite(norm)) return null;
  return vec.map((v) => v / norm);
}

/**
 * Weighted sum of movie feature vectors → L2-normalized 13-dim taste vector.
 * Returns null when no swipes resolve to a known movie, or the weighted sum
 * is the zero vector (e.g. zero swipes, or yes/no votes cancel exactly).
 */
export function computeTasteVector(
  swipes: SwipeRecord[],
  getVector: (tmdbId: number) => number[] | undefined,
): TasteVector | null {
  const sum = new Array<number>(VECTOR_DIM).fill(0);
  let contributed = 0;

  for (const swipe of swipes) {
    const vec = getVector(swipe.tmdb_id);
    if (!vec || vec.length !== VECTOR_DIM) continue;
    const w = VOTE_WEIGHTS[swipe.vote];
    for (let i = 0; i < VECTOR_DIM; i++) sum[i] += w * vec[i];
    contributed++;
  }

  if (contributed === 0) return null;
  return l2Normalize(sum);
}

/** Cosine similarity for arbitrary vectors; for unit vectors this is the dot product. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`cosineSimilarity: length mismatch (${a.length} vs ${b.length})`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** N×N symmetric matrix of cosine similarities. Diagonal is 1.0 for non-zero vectors. */
export function pairwiseCosineMatrix(vectors: number[][]): number[][] {
  const n = vectors.length;
  const out: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    out[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      out[i][j] = sim;
      out[j][i] = sim;
    }
  }
  return out;
}

/**
 * Average of member taste vectors, L2-normalized. Used later to rank catalog
 * movies for group recommendations.
 */
export function groupCentroid(vectors: number[][]): TasteVector | null {
  if (vectors.length === 0) return null;
  const sum = new Array<number>(VECTOR_DIM).fill(0);
  for (const v of vectors) {
    if (v.length !== VECTOR_DIM) continue;
    for (let i = 0; i < VECTOR_DIM; i++) sum[i] += v[i];
  }
  return l2Normalize(sum);
}

/** Convenience: build a swipe→vector lookup from a list of movies (e.g. the deck). */
export function vectorLookupFromMovies(movies: Movie[]): (tmdbId: number) => number[] | undefined {
  const map = new Map<number, number[]>(movies.map((m) => [m.tmdb_id, m.feature_vector]));
  return (tmdbId) => map.get(tmdbId);
}

export type Recommendation = {
  movie: Movie;
  groupScore: number;
  matchPercent: number;
};

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

/**
 * Rank movies for a group using a hybrid avg/min cosine score:
 *   groupScore = 0.5 * mean(perUserCos) + 0.5 * min(perUserCos)
 *
 * The min term penalizes movies any single member would dislike, so the top
 * pick is one nobody had to compromise on.
 *
 * `excludeIds` should include every movie already shown in the swipe deck —
 * since all NO votes are on the seed deck, excluding the deck is equivalent
 * to "exclude swiped + any-member-NO".
 */
export function recommendMovies(
  memberVectors: TasteVector[],
  catalog: Movie[],
  excludeIds: number[],
  topN = 3,
): Recommendation[] {
  if (memberVectors.length === 0) return [];
  const excluded = new Set(excludeIds);

  const scored: Recommendation[] = [];
  for (const movie of catalog) {
    if (excluded.has(movie.tmdb_id)) continue;
    if (!movie.feature_vector || movie.feature_vector.length !== VECTOR_DIM) continue;

    let sum = 0;
    let min = Number.POSITIVE_INFINITY;
    for (const v of memberVectors) {
      const s = cosineSimilarity(v, movie.feature_vector);
      sum += s;
      if (s < min) min = s;
    }
    const avg = sum / memberVectors.length;
    const groupScore = 0.5 * avg + 0.5 * min;
    const matchPercent = clamp(Math.round(groupScore * 100), 0, 100);
    scored.push({ movie, groupScore, matchPercent });
  }

  scored.sort((a, b) => b.groupScore - a.groupScore);
  return scored.slice(0, topN);
}
