from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine base paths
CORE_DIR = Path(__file__).resolve().parent
APP_DIR = CORE_DIR.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    """Application configuration settings loaded from environment or .env file."""
    
    PROJECT_NAME: str = "EVENTHUB"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_STR: str = "/api/v1"
    
    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/eventhub"

    model_config = SettingsConfigDict(
        env_file=(
            ROOT_DIR / ".env",
            BACKEND_DIR / ".env",
            Path(".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
