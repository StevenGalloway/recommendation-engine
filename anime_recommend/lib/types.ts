export interface Anime {
  anime_id: number;
  name: string;
  genre: string;
  type: string;
  episodes: number;
  rating: number;
  members: number;
  similarity_score: number;
  image_url?: string;
}

export interface RecommendationRequest {
  query: string;
  limit?: number;
}

export interface ApiError {
  detail: string;
}
