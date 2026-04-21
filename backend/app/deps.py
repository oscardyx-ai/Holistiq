from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from backend.app.models import PrivacySettings, ReminderSettings, UserProfile
from backend.app.schemas import AuthenticatedUser
from backend.app.security import authenticate_request


def get_current_user(user: AuthenticatedUser = Depends(authenticate_request)) -> AuthenticatedUser:
    return user


def ensure_user_state(
    db: Session,
    user: AuthenticatedUser,
) -> tuple[UserProfile, ReminderSettings, PrivacySettings]:
    profile = db.get(UserProfile, user.user_id)
    if not profile:
        profile = UserProfile(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
        )
        db.add(profile)
    else:
        profile.email = user.email
        profile.full_name = user.full_name
        profile.avatar_url = user.avatar_url

    reminders = db.get(ReminderSettings, user.user_id)
    if not reminders:
        reminders = ReminderSettings(user_id=user.user_id)
        db.add(reminders)

    privacy = db.get(PrivacySettings, user.user_id)
    if not privacy:
        privacy = PrivacySettings(user_id=user.user_id)
        db.add(privacy)

    db.commit()
    db.refresh(profile)
    db.refresh(reminders)
    db.refresh(privacy)
    return profile, reminders, privacy
