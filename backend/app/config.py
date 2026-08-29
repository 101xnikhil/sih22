from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "LANDGUARD AI Backend"
    API_PREFIX: str = "/api"
    APP_VERSION: str = "0.1.0-prototype"
    BACKEND_URL: str = "http://127.0.0.1:8000"
    DATABASE_URL: str = "sqlite:///./landguard.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*",
    ]
    DEFAULT_NODE_ID: str = "LG-N01"
    SIMULATION_MODE: bool = True
    DEMO_MODE: bool = True
    DEMO_DISCLAIMER: str = "Controlled laboratory prototype demonstration"
    DEMO_STAGE_INTERVAL_SECONDS: int = 8

    # JWT Authentication & Authorization Settings
    JWT_SECRET_KEY: str = "landguard-super-secret-jwt-key-sih-2026-auth"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Cybersecurity & Edge Authorization Settings (Phase 14)
    GATEWAY_API_KEY: str = "landguard-edge-gw-sih2026-key"
    REQUIRE_API_KEY: bool = False
    AUTHORIZED_NODES: List[str] = ["LG-N01", "LG-N02", "LG-N03", "LG-N04"]


settings = Settings()
