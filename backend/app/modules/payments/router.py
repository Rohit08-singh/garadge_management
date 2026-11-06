from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user, get_current_owner
from app.modules.auth.models import User

from app.modules.payments import service
from app.modules.payments.schemas import (
    PaymentCreateRequest,
    PaymentRejectRequest,
    PaymentResponse,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_payment(db, data, current_user)


@router.get("/", response_model=list[PaymentResponse])
def list_payments(
    record_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_payments(db, record_id)


@router.patch("/{payment_id}/approve", response_model=PaymentResponse)
def approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    return service.approve_payment(db, payment_id, owner)


@router.patch("/{payment_id}/reject", response_model=PaymentResponse)
def reject_payment(
    payment_id: int,
    data: PaymentRejectRequest,
    db: Session = Depends(get_db),
    owner: User = Depends(get_current_owner),
):
    return service.reject_payment(db, payment_id, data, owner)