from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sessions.models import DailySession
from app.modules.sessions.records import DailyDriverRecord
from app.modules.drivers.models import Driver
from app.modules.settings.models import GarageSettings
from app.modules.sessions import repository
from app.modules.sessions.schemas import (
    SessionCreateRequest,
    DailyRecordUpdateRequest,
)


def create_daily_session(db: Session, data: SessionCreateRequest, user_id: int):
    existing = repository.get_current_session(db)

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An open daily session already exists."
        )

    garage_settings = db.get(GarageSettings, 1)
    duration = (
        garage_settings.session_duration_minutes
        if garage_settings else 1440
    )

    start_at = data.start_at or datetime.now(ZoneInfo("Asia/Kolkata"))
    end_at = start_at + timedelta(minutes=duration)

    session = DailySession(
        start_at=start_at,
        end_at=end_at,
        status="OPEN",
        created_by_id=user_id,
        notes=data.notes,
    )

    try:
        return repository.create_session(db, session)
    except Exception:
        db.rollback()
        raise


def get_current_daily_session(db: Session):
    session = repository.get_current_session(db)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No open daily session found."
        )

    return session


def get_daily_session_records(db: Session, session_id: int):
    session = repository.get_session_by_id(db, session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    return repository.get_session_records(db, session_id)


def update_daily_record(
    db: Session,
    record_id: int,
    data: DailyRecordUpdateRequest,
):
    record = repository.get_record_by_id(db, record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Driver record not found.")

    update_data = data.model_dump(exclude_unset=True)

    if (
        update_data.get("attendance_status") == "NOT_ARRIVED"
        and update_data.get("charging_fee", record.charging_fee) > 0
    ):
        raise HTTPException(
            status_code=400,
            detail="A driver marked Not Arrived cannot have a charging fee."
        )

    if update_data.get("attendance_status") == "NOT_ARRIVED":
        update_data["charging_fee"] = 0

    if update_data.get("attendance_status") == "PRESENT":
        update_data.setdefault(
            "arrival_at",
            datetime.now(ZoneInfo("Asia/Kolkata"))
        )

    try:
        return repository.update_record(db, record, update_data)
    except Exception:
        db.rollback()
        raise