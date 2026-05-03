import logging
from datetime import date

import resend
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.models import CheckInPeriod, CheckInSession, FamilyMember, FamilyMemberStatus
from backend.app.schemas import AuthenticatedUser, FamilyMemberCreate, FamilyMemberRead, FamilyMemberUpdate
from backend.app.scoring import SessionInput, calculate_streak

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/family-members", tags=["family"])


def enrich_member(db: Session, member: FamilyMember) -> FamilyMemberRead:
    streak = 0
    checked_in_today = False
    last_check_in_at = None

    if member.invited_user_id:
        sessions = db.scalars(select(CheckInSession).where(CheckInSession.user_id == member.invited_user_id)).all()
        session_inputs = [
            SessionInput(
                entry_date=session.entry_date,
                period=session.period,
                answers=session.answers,
                completed_at=session.completed_at,
            )
            for session in sessions
        ]
        streak = calculate_streak(session_inputs, date.today())
        today_sessions = [
            session
            for session in sessions
            if session.entry_date == date.today() and session.period in {CheckInPeriod.MORNING, CheckInPeriod.NIGHT}
        ]
        checked_in_today = bool(today_sessions)
        if sessions:
            last_check_in_at = max(session.completed_at for session in sessions)

    return FamilyMemberRead(
        id=member.id,
        owner_user_id=member.owner_user_id,
        invited_user_id=member.invited_user_id,
        invite_email=member.invite_email,
        name=member.name,
        relation=member.relation,
        status=member.status,
        can_view_graphs=member.can_view_graphs,
        streak=streak,
        checked_in_today=checked_in_today,
        last_check_in_at=last_check_in_at,
    )


@router.get("", response_model=list[FamilyMemberRead])
def list_family_members(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> list[FamilyMemberRead]:
    ensure_user_state(db, user)
    members = db.scalars(
        select(FamilyMember).where(FamilyMember.owner_user_id == user.user_id).order_by(FamilyMember.created_at)
    ).all()
    return [enrich_member(db, member) for member in members]


def _send_invite_email(invite_email: str, inviter_name: str, member_name: str) -> None:
    logger.info("_send_invite_email called: to=%s inviter=%r member=%r", invite_email, inviter_name, member_name)

    settings = get_settings()
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping invite email to %s", invite_email)
        return

    logger.info("RESEND_API_KEY present (length=%d), sending email", len(settings.resend_api_key))
    resend.api_key = settings.resend_api_key
    signup_url = f"{settings.app_url.rstrip('/')}/sign-up"

    try:
        response = resend.Emails.send({
            "from": "Holistiq <onboarding@resend.dev>",
            "to": [invite_email],
            "subject": "You've been invited to join Holistiq",
            "html": (
                f"<p>Hi {member_name},</p>"
                f"<p>{inviter_name} has invited you to join them on Holistiq — "
                f"a simple wellness check-in app that lets family members support each other's health without sharing private details.</p>"
                f'<p><a href="{signup_url}" style="display:inline-block;background:#4c956c;color:#fff;'
                f'padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Create your account</a></p>'
                f"<p>See you there,<br>The Holistiq team</p>"
            ),
        })
        logger.info("Resend API response: %s", response)
    except Exception:
        logger.exception("Failed to send invite email to %s", invite_email)


@router.post("", response_model=FamilyMemberRead, status_code=status.HTTP_201_CREATED)
def create_family_member(
    payload: FamilyMemberCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> FamilyMemberRead:
    ensure_user_state(db, user)
    member = FamilyMember(
        owner_user_id=user.user_id,
        name=payload.name,
        relation=payload.relation or "Family member",
        invite_email=payload.invite_email,
        invited_user_id=payload.invited_user_id,
        can_view_graphs=payload.can_view_graphs,
        status=FamilyMemberStatus.ACTIVE if payload.invited_user_id else FamilyMemberStatus.PENDING,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    if payload.invite_email:
        _send_invite_email(
            invite_email=str(payload.invite_email),
            inviter_name=user.full_name or user.email or "Someone",
            member_name=payload.name,
        )

    return enrich_member(db, member)


@router.patch("/{member_id}", response_model=FamilyMemberRead)
def update_family_member(
    member_id: str,
    payload: FamilyMemberUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> FamilyMemberRead:
    ensure_user_state(db, user)
    member = db.scalar(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.owner_user_id == user.user_id)
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return enrich_member(db, member)
