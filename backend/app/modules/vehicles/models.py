
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    driver_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    registration_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    brand: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    driver: Mapped["Driver"] = relationship(
        "Driver",
        back_populates="vehicles"
    )
