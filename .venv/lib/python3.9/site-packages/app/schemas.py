from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.app.models import CheckInPeriod, ConnectedAppSource, FamilyMemberStatus


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    raw_claims: dict[str, Any] = Field(default_factory=dict)


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str | None
    full_name: str | None
    avatar_url: str | None


class CheckInSessionWrite(BaseModel):
    entry_date: date
    period: CheckInPeriod
    answers: dict[str, Any]
    completed_at: datetime | None = None


class CheckInSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    entry_date: date
    week_key: date
    period: CheckInPeriod
    answers: dict[str, Any]
    completed_at: datetime


class CheckInHistoryResponse(BaseModel):
    sessions: list[CheckInSessionRead]


class ReminderSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    night_reminder_enabled: bool
    night_reminder_hour: int
    family_nudges_enabled: bool
    night_reminder_last_sent_date: date | None
    family_nudge_last_sent_at: datetime | None


class ReminderSettingsUpdate(BaseModel):
    night_reminder_enabled: bool | None = None
    night_reminder_hour: int | None = Field(default=None, ge=0, le=23)
    family_nudges_enabled: bool | None = None
    night_reminder_last_sent_date: date | None = None
    family_nudge_last_sent_at: datetime | None = None


class PrivacySettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    share_graphs_with_family: bool


class PrivacySettingsUpdate(BaseModel):
    share_graphs_with_family: bool


class FamilyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    relation: str | None = Field(default="Family member", max_length=255)
    invite_email: EmailStr | None = None
    invited_user_id: str | None = None
    can_view_graphs: bool = False


class FamilyMemberUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    relation: str | None = Field(default=None, max_length=255)
    invite_email: EmailStr | None = None
    invited_user_id: str | None = None
    can_view_graphs: bool | None = None
    status: FamilyMemberStatus | None = None


class FamilyMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_user_id: str
    invited_user_id: str | None
    invite_email: str | None
    name: str
    relation: str
    status: FamilyMemberStatus
    can_view_graphs: bool
    streak: int = 0
    checked_in_today: bool = False
    last_check_in_at: datetime | None = None


class ConnectedAppSnapshotWrite(BaseModel):
    snapshot_date: date
    source: ConnectedAppSource
    payload: dict[str, Any]


class ConnectedAppSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    snapshot_date: date
    source: ConnectedAppSource
    payload: dict[str, Any]


class FactorObservationRead(BaseModel):
    factor: str
    score: int
    weight: float
    source: str


class DailyInsightSummary(BaseModel):
    date: date
    factor_scores: dict[str, int]
    total_score: int
    observations: list[FactorObservationRead]


class TrendPointRead(BaseModel):
    label: str
    period_key: str
    factor_scores: dict[str, int]
    total_score: int


class TrendsResponse(BaseModel):
    range: str
    points: list[TrendPointRead]


class WellnessStateResponse(BaseModel):
    profile: UserProfileRead
    sessions: list[CheckInSessionRead]
    reminders: ReminderSettingsRead
    privacy: PrivacySettingsRead
    family_members: list[FamilyMemberRead]
    connected_apps: list[ConnectedAppSnapshotRead]
