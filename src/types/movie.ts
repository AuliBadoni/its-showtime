export type SeedBucket =
  | 'comedy'
  | 'drama'
  | 'thriller'
  | 'action'
  | 'horror'
  | 'romance'
  | 'scifi'
  | 'animation';

export type Movie = {
  tmdb_id: number;
  title: string;
  year: number;
  runtime: number;
  genres: string[];
  genre_ids: number[];
  rating: number;
  vote_count: number;
  popularity: number;
  poster_url: string;
  overview: string;
  feature_vector: number[];
  seed_bucket: SeedBucket;
};

export type Vote = 'yes' | 'no';

export type SwipeRecord = {
  tmdb_id: number;
  vote: Vote;
};

export type TasteVector = number[];
