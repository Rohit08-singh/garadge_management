from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.models import User

from app.modules.sessions import service
from app.modules.sessions.schemas import (
    SessionCreateRequest,
    SessionResponse,
    DailyRecordResponse,
    DailyRecordUpdateRequest,
)

router = APIRouter(prefix="/sessions", tags=["Daily Register"])


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    data: SessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_daily_session(db, data, current_user.id)


@router.get("/current", response_model=SessionResponse)
def get_current_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_current_daily_session(db)


@router.get("/{session_id}/records", response_model=list[DailyRecordResponse])
def get_session_records(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_daily_session_records(db, session_id)


@router.patch("/records/{record_id}", response_model=DailyRecordResponse)
def update_driver_record(
    record_id: int,
    data: DailyRecordUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_daily_record(db, record_id, data)