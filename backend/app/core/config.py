from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ENV_FILE = REPO_ROOT / "backend" / ".env"
DEFAULT_DATABASE_FILE = REPO_ROOT / "backend" / "dev.db"
LOCAL_ENV_FILE = REPO_ROOT / ".env.local"


class Settings(BaseSettings):
    app_name: str = "Holistiq API"
    api_prefix: str = "/api/v1"
    database_url: str = f"sqlite:///{DEFAULT_DATABASE_FILE}"
    supabase_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    )
    supabase_jwt_secret: str | None = None
    supabase_jwks_url: str | None = None
    supabase_jwt_audience: str = "authenticated"
    allow_insecure_dev_auth: bool = False

    model_config = SettingsConfigDict(
        env_file=(BACKEND_ENV_FILE, LOCAL_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def resolved_jwks_url(self) -> str | None:
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return None


@lru_cache
def get_settings() -> Settings:
    return Settings()
