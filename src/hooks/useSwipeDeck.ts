import { useCallback, useMemo, useState } from 'react';
import { getMovieByTmdbId } from '../lib/movies';
import type { Movie, SwipeRecord, Vote } from '../types/movie';

export type SwipeDeck = {
  deck: Movie[];
  index: number;
  votes: SwipeRecord[];
  current: Movie | null;
  isDone: boolean;
  commit: (vote: Vote) => void;
  reset: () => void;
};

function resolveDeck(ids: number[]): Movie[] {
  const out: Movie[] = [];
  for (const id of ids) {
    const movie = getMovieByTmdbId(id);
    if (movie) out.push(movie);
  }
  return out;
}

export function useSwipeDeck(seedMovieIds: number[]): SwipeDeck {
  const [deck] = useState<Movie[]>(() => resolveDeck(seedMovieIds));
  const [index, setIndex] = useState(0);
  const [votes, setVotes] = useState<SwipeRecord[]>([]);

  const commit = useCallback(
    (vote: Vote) => {
      setIndex((prev) => {
        const movie = deck[prev];
        if (!movie) return prev;
        setVotes((vs) => [...vs, { tmdb_id: movie.tmdb_id, vote }]);
        return prev + 1;
      });
    },
    [deck],
  );

  const reset = useCallback(() => {
    setIndex(0);
    setVotes([]);
  }, []);

  return useMemo<SwipeDeck>(
    () => ({
      deck,
      index,
      votes,
      current: deck[index] ?? null,
      isDone: deck.length > 0 && index >= deck.length,
      commit,
      reset,
    }),
    [deck, index, votes, commit, reset],
  );
}
