/**
 * Terminal demo for the taste-vector + cosine similarity scoring.
 *
 * Run: npm run score:demo
 *
 * Builds a deterministic 10-movie deck from data/movies.json, defines three
 * mock members with binary yes/no swipe patterns, computes each taste vector,
 * and prints the pairwise cosine matrix.
 */

import type { Movie, SeedBucket, SwipeRecord } from '../src/types/movie';
import { getCatalog } from '../src/lib/movies';
import {
  computeTasteVector,
  pairwiseCosineMatrix,
  vectorLookupFromMovies,
} from '../src/lib/scoring';

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

/** Deterministic 10-movie deck: round-robin one per bucket, sorted by tmdb_id within each. */
function buildFixedDeck(size = 10): Movie[] {
  const byBucket: Record<string, Movie[]> = {};
  for (const b of BUCKETS) byBucket[b] = [];
  for (const m of getCatalog()) {
    if (byBucket[m.seed_bucket]) byBucket[m.seed_bucket].push(m);
  }
  for (const b of BUCKETS) byBucket[b].sort((a, b2) => a.tmdb_id - b2.tmdb_id);

  const deck: Movie[] = [];
  let exhausted = 0;
  while (deck.length < size && exhausted < BUCKETS.length) {
    exhausted = 0;
    for (const b of BUCKETS) {
      const next = byBucket[b].shift();
      if (!next) {
        exhausted++;
        continue;
      }
      deck.push(next);
      if (deck.length >= size) break;
    }
  }
  return deck;
}

type MockMember = {
  name: string;
  /** Returns 'yes' if this member would like the movie, otherwise 'no'. */
  likes: (m: Movie) => boolean;
};

const MEMBERS: MockMember[] = [
  {
    name: 'Alex',
    likes: (m) => m.seed_bucket === 'action' || m.seed_bucket === 'thriller',
  },
  {
    name: 'Sam',
    likes: (m) => m.seed_bucket === 'comedy' || m.seed_bucket === 'romance',
  },
  {
    name: 'Jordan',
    // Mostly no — only says yes to highly-rated dramas.
    likes: (m) => m.seed_bucket === 'drama' && m.rating >= 8,
  },
];

function buildSwipes(member: MockMember, deck: Movie[]): SwipeRecord[] {
  return deck.map((m) => ({
    tmdb_id: m.tmdb_id,
    vote: member.likes(m) ? 'yes' : 'no',
  }));
}

function formatVector(v: number[] | null, decimals = 2): string {
  if (!v) return '<null>';
  return '[' + v.map((x) => x.toFixed(decimals)).join(', ') + ']';
}

function printMatrix(names: string[], matrix: number[][]) {
  const colWidth = Math.max(8, ...names.map((n) => n.length + 2));
  const pad = (s: string, w: number) => s.padStart(w, ' ');

  const header = pad('', colWidth) + names.map((n) => pad(n, colWidth)).join('');
  console.log(header);
  for (let i = 0; i < names.length; i++) {
    const row = pad(names[i], colWidth) +
      matrix[i].map((v) => pad(v.toFixed(2), colWidth)).join('');
    console.log(row);
  }
}

function main() {
  const deck = buildFixedDeck(10);
  console.log('Deck (10 movies):');
  for (const m of deck) {
    console.log(`  [${m.seed_bucket.padEnd(9)}] ${m.tmdb_id}  ${m.title} (${m.year})  rating=${m.rating}`);
  }
  console.log();

  const getVector = vectorLookupFromMovies(deck);
  const memberVectors: number[][] = [];
  const memberNames: string[] = [];

  for (const member of MEMBERS) {
    const swipes = buildSwipes(member, deck);
    const yesCount = swipes.filter((s) => s.vote === 'yes').length;
    const noCount = swipes.length - yesCount;
    const taste = computeTasteVector(swipes, getVector);

    console.log(`${member.name}  yes=${yesCount} no=${noCount}`);
    console.log(`  taste: ${formatVector(taste)}`);
    console.log();

    if (taste) {
      memberVectors.push(taste);
      memberNames.push(member.name);
    } else {
      console.log(`  (skipped from matrix: zero/empty taste vector)\n`);
    }
  }

  if (memberVectors.length < 2) {
    console.log('Not enough valid taste vectors to compute a similarity matrix.');
    return;
  }

  const matrix = pairwiseCosineMatrix(memberVectors);
  console.log('Cosine similarity:');
  printMatrix(memberNames, matrix);
}

main();
