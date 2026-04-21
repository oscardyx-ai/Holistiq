from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.db import get_db
from backend.app.deps import ensure_user_state, get_current_user
from backend.app.models import ConnectedAppSnapshot
from backend.app.schemas import AuthenticatedUser, ConnectedAppSnapshotRead, ConnectedAppSnapshotWrite

router = APIRouter(prefix="/connected-apps", tags=["connected-apps"])


@router.get("", response_model=list[ConnectedAppSnapshotRead])
def list_connected_app_snapshots(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> list[ConnectedAppSnapshotRead]:
    ensure_user_state(db, user)
    snapshots = db.scalars(
        select(ConnectedAppSnapshot)
        .where(ConnectedAppSnapshot.user_id == user.user_id)
        .order_by(ConnectedAppSnapshot.snapshot_date, ConnectedAppSnapshot.source)
    ).all()
    return [ConnectedAppSnapshotRead.model_validate(snapshot) for snapshot in snapshots]


@router.post("", response_model=ConnectedAppSnapshotRead)
def upsert_connected_app_snapshot(
    payload: ConnectedAppSnapshotWrite,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
) -> ConnectedAppSnapshotRead:
    ensure_user_state(db, user)
    snapshot = db.scalar(
        select(ConnectedAppSnapshot).where(
            ConnectedAppSnapshot.user_id == user.user_id,
            ConnectedAppSnapshot.snapshot_date == payload.snapshot_date,
            ConnectedAppSnapshot.source == payload.source,
        )
    )
    if snapshot:
        snapshot.payload = payload.payload
    else:
        snapshot = ConnectedAppSnapshot(
            user_id=user.user_id,
            snapshot_date=payload.snapshot_date,
            source=payload.source,
            payload=payload.payload,
        )
        db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return ConnectedAppSnapshotRead.model_validate(snapshot)
