from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreateRequest(BaseModel):
    daily_record_id: int
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    payment_method: Literal["CASH", "ONLINE"]
    payment_date: datetime
    transaction_reference: str | None = Field(default=None, max_length=150)


class PaymentRejectRequest(BaseModel):
    rejection_reason: str = Field(min_length=3, max_length=500)


class PaymentResponse(BaseModel):
    id: int
    daily_record_id: int
    amount: Decimal
    payment_method: str
    transaction_reference: str | None
    payment_date: datetime
    status: str
    recorded_by_id: int
    verified_by_id: int | None
    verified_at: datetime | None
    rejection_reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)