from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.sessions.models import DailySession
from app.modules.sessions.records import DailyDriverRecord
from app.modules.drivers.models import Driver


def create_session(db: Session, session: DailySession) -> DailySession:
    db.add(session)
    db.flush()

    drivers = db.execute(
        select(Driver).where(Driver.is_active.is_(True))
    ).scalars().all()

    for driver in drivers:
        db.add(
            DailyDriverRecord(
                session_id=session.id,
                driver_id=driver.id,
                attendance_status="NOT_ARRIVED",
                charging_fee=0,
                payment_status="UNPAID",
            )
        )

    db.commit()
    db.refresh(session)
    return session


def get_session_by_id(db: Session, session_id: int):
    return db.execute(
        select(DailySession).where(DailySession.id == session_id)
    ).scalar_one_or_none()


def get_current_session(db: Session):
    return db.execute(
        select(DailySession)
        .where(DailySession.status == "OPEN")
        .order_by(DailySession.start_at.desc())
    ).scalars().first()


def get_session_records(db: Session, session_id: int):
    return db.execute(
        select(DailyDriverRecord)
        .where(DailyDriverRecord.session_id == session_id)
        .order_by(DailyDriverRecord.id)
    ).scalars().all()


def get_record_by_id(db: Session, record_id: int):
    return db.execute(
        select(DailyDriverRecord)
        .where(DailyDriverRecord.id == record_id)
    ).scalar_one_or_none()


def update_record(db: Session, record: DailyDriverRecord, data: dict):
    for field, value in data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record