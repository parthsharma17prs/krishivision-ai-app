import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KrishiVision AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "krishivision-ai-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Application Mode
    DEMO_MODE: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_TYPE: str = "sqlite"  # "sqlite", "postgres", or "firebase"
    DATABASE_URL: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '../../krishivision.db'))}"
    
    # Firebase Setup
    FIREBASE_CREDENTIALS_PATH: Optional[str] = "./firebase-credentials.json"
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_DATABASE_URL: Optional[str] = None

    # Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # ML & Models
    MODELS_DIR: str = "../models"
    MODEL_MANIFEST_PATH: str = "../models/manifest.json"

    # Integrations
    WEATHER_PROVIDER: str = "demo"  # "demo" or "openweather"
    OPENWEATHER_API_KEY: Optional[str] = None
    
    ASSISTANT_PROVIDER: str = "demo"  # "demo" or "gemini" or "openai"
    LLM_API_KEY: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
