from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ENV_FILE = REPO_ROOT / "backend" / ".env"
DEFAULT_DATABASE_FILE = REPO_ROOT / "backend" / "dev.db"
BROKEN_SUPABASE_URL = "https://wsachiytaiqzzwkpgzko.supabase.co"
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
    resend_api_key: str | None = None
    app_url: str = "https://app.holistiq.com"

    model_config = SettingsConfigDict(
        env_file=(BACKEND_ENV_FILE, LOCAL_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_supabase_settings(self) -> "Settings":
        if self.supabase_url == BROKEN_SUPABASE_URL:
            raise ValueError(
                "SUPABASE_URL still points at the retired Supabase project "
                "wsachiytaiqzzwkpgzko. Replace it with your active project URL."
            )

        if (
            not self.allow_insecure_dev_auth
            and not self.supabase_jwt_secret
            and not self.supabase_url
        ):
            raise ValueError(
                "Set SUPABASE_URL or SUPABASE_JWT_SECRET before starting the backend, "
                "or enable ALLOW_INSECURE_DEV_AUTH for local-only development."
            )

        return self

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
