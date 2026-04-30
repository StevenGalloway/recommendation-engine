import logging
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import numpy as np
import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from config import settings
from logging_config import setup_logging
from schema import AnimeResponse, RecommendationRequest

setup_logging(settings.log_level)
logger = logging.getLogger(__name__)


# ── Circuit breaker ──────────────────────────────────────────────────────────────


class CircuitBreaker:
    """
    Simple in-process circuit breaker for the Jikan external API.
    States: closed (normal) → open (failing, skip calls) → half-open (probe).
    """

    def __init__(self, failure_threshold: int = 3, reset_timeout: float = 60.0) -> None:
        self._failures = 0
        self._threshold = failure_threshold
        self._reset_timeout = reset_timeout
        self._opened_at: float | None = None
        self._state = "closed"

    @property
    def state(self) -> str:
        if self._state == "open" and self._opened_at is not None:
            if time.monotonic() - self._opened_at > self._reset_timeout:
                self._state = "half-open"
        return self._state

    def record_success(self) -> None:
        self._failures = 0
        self._state = "closed"
        self._opened_at = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self._threshold:
            self._state = "open"
            self._opened_at = time.monotonic()


jikan_circuit = CircuitBreaker(
    failure_threshold=settings.jikan_circuit_threshold,
    reset_timeout=settings.jikan_circuit_reset_seconds,
)


# ── Data loading ─────────────────────────────────────────────────────────────────

data_path = Path(__file__).parent / "data"
anime_df = pd.read_csv(data_path / "anime.csv")
rating_df = pd.read_csv(data_path / "rating.csv")

anime_df = anime_df[anime_df["rating"] != -1]
anime_df = anime_df.dropna(subset=["genre", "type"])
anime_df["genre"] = anime_df["genre"].fillna("")
anime_df["type"] = anime_df["type"].fillna("")
anime_df["rating"] = anime_df["rating"].fillna(0)
anime_df["rating"] = pd.to_numeric(anime_df["rating"], errors="coerce").fillna(0)

anime_df["content"] = anime_df["genre"] + " " + anime_df["type"]
tfidf = TfidfVectorizer(stop_words="english")
tfidf_matrix = tfidf.fit_transform(anime_df["content"])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

logger.info("data_loaded", extra={"anime_count": len(anime_df), "rating_count": len(rating_df)})


# ── App setup ────────────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("api_startup", extra={"version": "1.0.0", "anime_count": len(anime_df)})
    yield
    logger.info("api_shutdown")


app = FastAPI(
    title="ANIMATCH API",
    description=(
        "Content-based anime recommendation engine using TF-IDF vectorization "
        "and cosine similarity. Search by title, genre, or type."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000, 2)
    logger.info(
        "http_request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


# ── Jikan API client ─────────────────────────────────────────────────────────────


@retry(
    stop=stop_after_attempt(settings.jikan_max_retries),
    wait=wait_exponential(multiplier=0.5, min=1, max=8),
    retry=retry_if_exception_type(httpx.HTTPError),
    reraise=True,
)
async def _jikan_request(query: str) -> dict:
    async with httpx.AsyncClient(timeout=settings.jikan_timeout_seconds) as client:
        response = await client.get(f"https://api.jikan.moe/v4/anime?q={query}&limit=1")
        response.raise_for_status()
        return response.json()


async def fetch_anime_from_jikan(query: str) -> dict | None:
    if jikan_circuit.state == "open":
        logger.warning("jikan_circuit_open", extra={"query": query})
        return None

    try:
        data = await _jikan_request(query)
        jikan_circuit.record_success()
        if data.get("data") and len(data["data"]) > 0:
            anime = data["data"][0]
            genres = ", ".join([g["name"] for g in anime.get("genres", [])])
            return {
                "name": anime.get("title", "Unknown"),
                "genre": genres or "Unknown",
                "type": anime.get("type", "Unknown"),
                "rating": anime.get("score", 0.0) or 0.0,
                "episodes": anime.get("episodes", 0) or 0,
                "members": anime.get("members", 0) or 0,
            }
    except Exception as exc:
        jikan_circuit.record_failure()
        logger.error(
            "jikan_fetch_failed",
            extra={"query": query, "error": str(exc), "circuit_state": jikan_circuit.state},
        )
    return None


# ── Routes ───────────────────────────────────────────────────────────────────────

v1 = APIRouter(prefix="/v1", tags=["v1"])


@app.get("/", tags=["info"])
def read_root():
    return {
        "message": "ANIMATCH Anime Recommendation API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/v1/health",
    }


@v1.get("/health", tags=["ops"])
def health_check():
    """Liveness + readiness probe. Reports data status and Jikan circuit state."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "data": {
            "anime_count": len(anime_df),
            "model_ready": cosine_sim is not None,
        },
        "jikan": {
            "circuit_state": jikan_circuit.state,
        },
    }


@v1.post("/recommend", response_model=list[AnimeResponse])
@limiter.limit(settings.rate_limit_recommend)
async def get_recommendations(request: Request, body: RecommendationRequest):
    """
    Get anime recommendations based on a query.

    Supports:
    - Anime title search (cosine similarity on best match)
    - Genre-based search
    - Type-based search (TV, Movie, OVA, Special)
    - Jikan API fallback for titles not in the local dataset
    """
    query = body.query.strip().lower()
    limit = min(body.limit, settings.max_recommendations)

    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    logger.info("recommend_request", extra={"query": query, "limit": limit})

    # 1. Search by name
    name_matches = anime_df[anime_df["name"].str.lower().str.contains(query, na=False)]

    if not name_matches.empty:
        best_match = name_matches.iloc[0]
        idx = anime_df[anime_df["anime_id"] == best_match["anime_id"]].index[0]

        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1 : limit + 1]

        anime_indices = [i[0] for i in sim_scores]
        recommendations = anime_df.iloc[anime_indices].copy()
        recommendations["similarity_score"] = [i[1] for i in sim_scores]

        logger.info("recommend_by_title", extra={"query": query, "count": len(recommendations)})

    else:
        # 2. Search by genre / type
        genre_matches = anime_df[anime_df["genre"].str.lower().str.contains(query, na=False)]
        type_matches = anime_df[anime_df["type"].str.lower().str.contains(query, na=False)]
        combined_matches = pd.concat([genre_matches, type_matches]).drop_duplicates()

        if combined_matches.empty:
            # 3. Jikan API fallback
            logger.info("recommend_fallback_jikan", extra={"query": query})
            jikan_data = await fetch_anime_from_jikan(body.query)

            if jikan_data:
                api_content = f"{jikan_data['genre']} {jikan_data['type']}"
                api_tfidf = tfidf.transform([api_content])
                api_similarities = cosine_similarity(api_tfidf, tfidf_matrix)[0]
                sim_indices = api_similarities.argsort()[-limit:][::-1]
                recommendations = anime_df.iloc[sim_indices].copy()
                recommendations["similarity_score"] = api_similarities[sim_indices]
            else:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"No anime found matching '{body.query}'. "
                        "Try different keywords or anime titles."
                    ),
                )
        else:
            recommendations = combined_matches.sort_values(
                by=["rating", "members"], ascending=[False, False]
            ).head(limit).copy()
            recommendations["similarity_score"] = 1.0

            logger.info(
                "recommend_by_genre_type", extra={"query": query, "count": len(recommendations)}
            )

    # Build response
    results = []
    for _, row in recommendations.iterrows():
        try:
            episodes_val = int(row["episodes"]) if pd.notna(row["episodes"]) else 0
        except (ValueError, TypeError):
            episodes_val = 0

        try:
            rating_val = float(row["rating"]) if pd.notna(row["rating"]) else 0.0
            if not (0 <= rating_val <= 10):
                rating_val = 0.0
        except (ValueError, TypeError):
            rating_val = 0.0

        try:
            similarity_val = float(row["similarity_score"]) if pd.notna(row["similarity_score"]) else 0.0
            if not (0 <= similarity_val <= 1):
                similarity_val = 0.0
        except (ValueError, TypeError):
            similarity_val = 0.0

        results.append(
            AnimeResponse(
                anime_id=int(row["anime_id"]),
                name=str(row["name"]),
                genre=str(row["genre"]),
                type=str(row["type"]),
                episodes=episodes_val,
                rating=rating_val,
                members=int(row["members"]),
                similarity_score=similarity_val,
            )
        )

    return results


@v1.get("/anime/{anime_id}")
def get_anime_details(anime_id: int):
    """Get details of a specific anime by ID."""
    anime = anime_df[anime_df["anime_id"] == anime_id]

    if anime.empty:
        raise HTTPException(status_code=404, detail="Anime not found")

    anime_data = anime.iloc[0]

    try:
        episodes_val = int(anime_data["episodes"]) if pd.notna(anime_data["episodes"]) else 0
    except (ValueError, TypeError):
        episodes_val = 0

    return {
        "anime_id": int(anime_data["anime_id"]),
        "name": str(anime_data["name"]),
        "genre": str(anime_data["genre"]),
        "type": str(anime_data["type"]),
        "episodes": episodes_val,
        "rating": float(anime_data["rating"]),
        "members": int(anime_data["members"]),
    }


@v1.get("/genres")
def get_genres():
    """Get the sorted list of all genres present in the dataset."""
    all_genres: set[str] = set()
    for genres in anime_df["genre"].dropna():
        all_genres.update([g.strip() for g in genres.split(",")])
    return {"genres": sorted(list(all_genres))}


app.include_router(v1)

# Prometheus metrics — registered last so all routes are instrumented
Instrumentator().instrument(app).expose(app)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
