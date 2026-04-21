from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db import Base


def generate_uuid() -> str:
    return str(uuid4())


class CheckInPeriod(str, Enum):
    MORNING = "morning"
    NIGHT = "night"
    WEEKLY = "weekly"


class FamilyMemberStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ConnectedAppSource(str, Enum):
    MYFITNESSPAL = "myfitnesspal"
    WEARABLE = "wearable"
    MEDICATION_TRACKER = "medication_tracker"
    ENVIRONMENT_JOURNAL = "environment_journal"


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class CheckInSession(Base):
    __tablename__ = "check_in_sessions"
    __table_args__ = (UniqueConstraint("user_id", "entry_date", "period", name="uq_user_check_in"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("user_profiles.user_id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True)
    week_key: Mapped[date] = mapped_column(Date, index=True)
    period: Mapped[CheckInPeriod] = mapped_column(SqlEnum(CheckInPeriod), index=True)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ReminderSettings(Base):
    __tablename__ = "reminder_settings"

    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("user_profiles.user_id"), primary_key=True)
    night_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    night_reminder_hour: Mapped[int] = mapped_column(Integer, default=20)
    family_nudges_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    night_reminder_last_sent_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    family_nudge_last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PrivacySettings(Base):
    __tablename__ = "privacy_settings"

    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("user_profiles.user_id"), primary_key=True)
    share_graphs_with_family: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id: Mapped[str] = mapped_column(String(128), ForeignKey("user_profiles.user_id"), index=True)
    invited_user_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    invite_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    relation: Mapped[str] = mapped_column(String(255), default="Family member")
    status: Mapped[FamilyMemberStatus] = mapped_column(SqlEnum(FamilyMemberStatus), default=FamilyMemberStatus.PENDING)
    can_view_graphs: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ConnectedAppSnapshot(Base):
    __tablename__ = "connected_app_snapshots"
    __table_args__ = (
        UniqueConstraint("user_id", "snapshot_date", "source", name="uq_user_snapshot_source"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(128), ForeignKey("user_profiles.user_id"), index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, index=True)
    source: Mapped[ConnectedAppSource] = mapped_column(SqlEnum(ConnectedAppSource), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
