from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.schemas import AuthenticatedUser, UserProfileRead

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserProfileRead)
def get_me(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> UserProfileRead:
    profile, _, _ = ensure_user_state(db, user)
    return UserProfileRead.model_validate(profile)
