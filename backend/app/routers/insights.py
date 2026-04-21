from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.models import CheckInSession, ConnectedAppSnapshot
from backend.app.schemas import AuthenticatedUser, DailyInsightSummary, TrendsResponse
from backend.app.scoring import SessionInput, SnapshotInput, calculate_factor_scores_for_date, calculate_trend_points

router = APIRouter(prefix="/insights", tags=["insights"])


def load_inputs(db: Session, user_id: str) -> tuple[list[SessionInput], list[SnapshotInput]]:
    sessions = db.scalars(select(CheckInSession).where(CheckInSession.user_id == user_id)).all()
    snapshots = db.scalars(select(ConnectedAppSnapshot).where(ConnectedAppSnapshot.user_id == user_id)).all()
    return (
        [
            SessionInput(
                entry_date=session.entry_date,
                period=session.period,
                answers=session.answers,
                completed_at=session.completed_at,
            )
            for session in sessions
        ],
        [
            SnapshotInput(
                snapshot_date=snapshot.snapshot_date,
                source=snapshot.source,
                payload=snapshot.payload,
            )
            for snapshot in snapshots
        ],
    )


@router.get("/summary", response_model=DailyInsightSummary)
def get_daily_summary(
    target_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> DailyInsightSummary:
    ensure_user_state(db, user)
    sessions, snapshots = load_inputs(db, user.user_id)
    summary = calculate_factor_scores_for_date(target_date or date.today(), sessions, snapshots)
    return DailyInsightSummary.model_validate(summary)


@router.get("/trends", response_model=TrendsResponse)
def get_trends(
    range: str = Query(default="weekly", pattern="^(weekly|monthly|yearly)$"),
    reference_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> TrendsResponse:
    ensure_user_state(db, user)
    sessions, snapshots = load_inputs(db, user.user_id)
    points = calculate_trend_points(sessions, snapshots, range, reference_date or date.today())
    return TrendsResponse(range=range, points=points)
