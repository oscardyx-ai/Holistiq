from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.models import CheckInSession, ConnectedAppSnapshot, FamilyMember
from backend.app.routers.family import enrich_member
from backend.app.schemas import (
    AuthenticatedUser,
    CheckInSessionRead,
    ConnectedAppSnapshotRead,
    WellnessStateResponse,
)

router = APIRouter(prefix="/wellness", tags=["wellness"])


@router.get("/state", response_model=WellnessStateResponse)
def get_wellness_state(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> WellnessStateResponse:
    profile, reminders, privacy = ensure_user_state(db, user)
    sessions = db.scalars(
        select(CheckInSession).where(CheckInSession.user_id == user.user_id).order_by(CheckInSession.entry_date)
    ).all()
    members = db.scalars(
        select(FamilyMember).where(FamilyMember.owner_user_id == user.user_id).order_by(FamilyMember.created_at)
    ).all()
    snapshots = db.scalars(
        select(ConnectedAppSnapshot)
        .where(ConnectedAppSnapshot.user_id == user.user_id)
        .order_by(ConnectedAppSnapshot.snapshot_date, ConnectedAppSnapshot.source)
    ).all()

    return WellnessStateResponse(
        profile=profile,
        sessions=[CheckInSessionRead.model_validate(session) for session in sessions],
        reminders=reminders,
        privacy=privacy,
        family_members=[enrich_member(db, member) for member in members],
        connected_apps=[ConnectedAppSnapshotRead.model_validate(snapshot) for snapshot in snapshots],
    )
