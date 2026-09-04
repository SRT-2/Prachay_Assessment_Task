from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env (config.py is in backend/app/core, so go 3 levels up)
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Reads values from the backend/.env file
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()
