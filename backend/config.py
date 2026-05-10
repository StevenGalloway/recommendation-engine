from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    log_level: str = "INFO"
    max_recommendations: int = 50
    rate_limit_recommend: str = "10/minute"
    jikan_timeout_seconds: float = 10.0
    jikan_max_retries: int = 3
    jikan_circuit_threshold: int = 3
    jikan_circuit_reset_seconds: float = 60.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
