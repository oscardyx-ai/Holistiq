from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.schemas import (
    AuthenticatedUser,
    PrivacySettingsRead,
    PrivacySettingsUpdate,
    ReminderSettingsRead,
    ReminderSettingsUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/reminders", response_model=ReminderSettingsRead)
def get_reminders(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> ReminderSettingsRead:
    _, reminders, _ = ensure_user_state(db, user)
    return ReminderSettingsRead.model_validate(reminders)


@router.put("/reminders", response_model=ReminderSettingsRead)
def update_reminders(
    payload: ReminderSettingsUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> ReminderSettingsRead:
    _, reminders, _ = ensure_user_state(db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reminders, field, value)
    db.commit()
    db.refresh(reminders)
    return ReminderSettingsRead.model_validate(reminders)


@router.get("/privacy", response_model=PrivacySettingsRead)
def get_privacy(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> PrivacySettingsRead:
    _, _, privacy = ensure_user_state(db, user)
    return PrivacySettingsRead.model_validate(privacy)


@router.put("/privacy", response_model=PrivacySettingsRead)
def update_privacy(
    payload: PrivacySettingsUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> PrivacySettingsRead:
    _, _, privacy = ensure_user_state(db, user)
    privacy.share_graphs_with_family = payload.share_graphs_with_family
    db.commit()
    db.refresh(privacy)
    return PrivacySettingsRead.model_validate(privacy)
