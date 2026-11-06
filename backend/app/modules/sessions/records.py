
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DailyDriverRecord(Base):
    __tablename__ = "daily_driver_records"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "driver_id",
            name="uq_session_driver"
        ),
        CheckConstraint(
            "charging_fee >= 0",
            name="ck_charging_fee_non_negative"
        ),
        CheckConstraint(
            "attendance_status IN ('PRESENT', 'NOT_ARRIVED')",
            name="ck_attendance_status"
        ),
        CheckConstraint(
            "payment_status IN ('UNPAID', 'PENDING', 'PAID', 'REJECTED')",
            name="ck_payment_status"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("daily_sessions.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    driver_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    vehicle_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=True,
        index=True
    )

    attendance_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    arrival_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    departure_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    charging_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=Decimal("0.00")
    )

    payment_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="UNPAID"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
