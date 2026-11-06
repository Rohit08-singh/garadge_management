from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SessionCreateRequest(BaseModel):
    start_at: datetime | None = None
    notes: str | None = None


class SessionResponse(BaseModel):
    id: int
    start_at: datetime
    end_at: datetime
    status: str
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DailyRecordCreateRequest(BaseModel):
    driver_id: int
    attendance_status: str = Field(
        default="PRESENT",
        pattern="^(PRESENT|NOT_ARRIVED)$"
    )
    charging_fee: Decimal = Field(default=Decimal("0.00"), ge=0)
    arrival_at: datetime | None = None
    departure_at: datetime | None = None


class DailyRecordResponse(BaseModel):
    id: int
    session_id: int
    driver_id: int
    attendance_status: str
    arrival_at: datetime | None
    departure_at: datetime | None
    charging_fee: Decimal
    payment_status: str

    model_config = ConfigDict(from_attributes=True)


class DailyRecordUpdateRequest(BaseModel):
    attendance_status: str | None = Field(
        default=None,
        pattern="^(PRESENT|NOT_ARRIVED)$"
    )
    charging_fee: Decimal | None = Field(default=None, ge=0)
    arrival_at: datetime | None = None
    departure_at: datetime | None = None