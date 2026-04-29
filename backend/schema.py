from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    query: str
    limit: int = 10

class AnimeResponse(BaseModel):
    anime_id: int
    name: str
    genre: str
    type: str
    episodes: int
    rating: float
    members: int
    similarity_score: float