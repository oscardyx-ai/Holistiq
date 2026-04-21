from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Header, HTTPException, status
from jwt import PyJWKClient

from backend.app.core.config import get_settings
from backend.app.schemas import AuthenticatedUser


@dataclass
class JWTVerifier:
    jwks_client: PyJWKClient | None = None

    def decode(self, token: str) -> dict:
        settings = get_settings()

        if settings.supabase_jwt_secret:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=settings.supabase_jwt_audience,
            )

        jwks_url = settings.resolved_jwks_url
        if not jwks_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT verification is not configured on the backend.",
            )

        if self.jwks_client is None:
            self.jwks_client = PyJWKClient(jwks_url)

        signing_key = self.jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience=settings.supabase_jwt_audience,
        )


verifier = JWTVerifier()


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token.")
    return token


def build_authenticated_user(claims: dict) -> AuthenticatedUser:
    user_metadata = claims.get("user_metadata") or {}
    full_name = user_metadata.get("full_name") or user_metadata.get("name") or claims.get("name")
    avatar_url = user_metadata.get("avatar_url") or user_metadata.get("picture") or claims.get("picture")

    return AuthenticatedUser(
        user_id=claims["sub"],
        email=claims.get("email"),
        full_name=full_name,
        avatar_url=avatar_url,
        raw_claims=claims,
    )


def authenticate_request(
    authorization: str | None = Header(default=None),
    x_dev_user: str | None = Header(default=None),
    x_dev_email: str | None = Header(default=None),
    x_dev_name: str | None = Header(default=None),
) -> AuthenticatedUser:
    settings = get_settings()

    if settings.allow_insecure_dev_auth and x_dev_user:
        return AuthenticatedUser(
            user_id=x_dev_user,
            email=x_dev_email,
            full_name=x_dev_name,
            raw_claims={"dev_mode": True},
        )

    token = _extract_bearer_token(authorization)
    try:
        claims = verifier.decode(token)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {exc}",
        ) from exc

    if "sub" not in claims:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject.")

    return build_authenticated_user(claims)
