from datetime import datetime, time, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class GarageSettings(Base):
    __tablename__ = "garage_settings"

    __table_args__ = (
        CheckConstraint(
            "id = 1",
            name="ck_garage_settings_single_row",
        ),
        CheckConstraint(
            "session_duration_minutes >= 1 "
            "AND session_duration_minutes <= 1440",
            name="ck_session_duration_valid",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    garage_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="My EV Garage",
    )

    session_start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(14, 0),
    )

    session_duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1440,
    )

    timezone: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Asia/Kolkata",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )