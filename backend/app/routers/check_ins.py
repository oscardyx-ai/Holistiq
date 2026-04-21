from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.models import CheckInPeriod, CheckInSession
from backend.app.schemas import AuthenticatedUser, CheckInHistoryResponse, CheckInSessionRead, CheckInSessionWrite

router = APIRouter(prefix="/check-ins", tags=["check-ins"])


def week_key_for_date(value: date) -> date:
    return value - timedelta(days=value.weekday())


def normalize_completed_at(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        return value

    return value.astimezone(timezone.utc).replace(tzinfo=None)


@router.get("", response_model=CheckInHistoryResponse)
def list_check_ins(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    period: CheckInPeriod | None = Query(default=None),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> CheckInHistoryResponse:
    ensure_user_state(db, user)
    query = select(CheckInSession).where(CheckInSession.user_id == user.user_id)
    if start_date:
        query = query.where(CheckInSession.entry_date >= start_date)
    if end_date:
        query = query.where(CheckInSession.entry_date <= end_date)
    if period:
        query = query.where(CheckInSession.period == period)
    sessions = db.scalars(query.order_by(CheckInSession.entry_date, CheckInSession.period)).all()
    return CheckInHistoryResponse(sessions=[CheckInSessionRead.model_validate(session) for session in sessions])


@router.post("", response_model=CheckInSessionRead)
def upsert_check_in(
    payload: CheckInSessionWrite,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> CheckInSessionRead:
    ensure_user_state(db, user)

    session = db.scalar(
        select(CheckInSession).where(
            CheckInSession.user_id == user.user_id,
            CheckInSession.entry_date == payload.entry_date,
            CheckInSession.period == payload.period,
        )
    )

    if session:
        session.answers = payload.answers
        if payload.completed_at is not None:
            session.completed_at = normalize_completed_at(payload.completed_at)
        session.week_key = week_key_for_date(payload.entry_date)
    else:
        session = CheckInSession(
            user_id=user.user_id,
            entry_date=payload.entry_date,
            week_key=week_key_for_date(payload.entry_date),
            period=payload.period,
            answers=payload.answers,
            completed_at=normalize_completed_at(payload.completed_at)
            if payload.completed_at is not None
            else datetime.utcnow(),
        )
        db.add(session)

    db.commit()
    db.refresh(session)
    return CheckInSessionRead.model_validate(session)
