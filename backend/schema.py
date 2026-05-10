from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    query: str = Field(
        ...,
        description="Anime title, genre tag, or type to search for",
        examples=["Attack on Titan", "action", "Movie"],
        min_length=1,
    )
    limit: int = Field(
        10,
        ge=1,
        le=50,
        description="Maximum number of recommendations to return (1–50)",
    )


class AnimeResponse(BaseModel):
    anime_id: int = Field(..., description="MyAnimeList numeric ID")
    name: str = Field(..., description="Canonical anime title")
    genre: str = Field(..., description="Comma-separated genre tags")
    type: str = Field(..., description="Format: TV, Movie, OVA, or Special")
    episodes: int = Field(..., description="Episode count; 0 means ongoing or unknown")
    rating: float = Field(..., description="Community score on a 0–10 scale")
    members: int = Field(..., description="Number of community members who tracked this title")
    similarity_score: float = Field(
        ...,
        description="Cosine similarity to the query (0.0–1.0); 1.0 for genre/type matches",
    )
