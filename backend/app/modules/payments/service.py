from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.payments.models import Payment
from app.modules.payments.schemas import (
    PaymentCreateRequest,
    PaymentRejectRequest,
)
from app.modules.sessions.records import DailyDriverRecord
from app.modules.notifications.models import Notification
from app.modules.auth.models import User


def update_record_payment_status(db: Session, record: DailyDriverRecord):
    approved_amount = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.daily_record_id == record.id,
            Payment.status == "APPROVED",
        )
    ).scalar_one()

    pending_exists = db.execute(
        select(Payment.id).where(
            Payment.daily_record_id == record.id,
            Payment.status == "PENDING",
        ).limit(1)
    ).first()

    if approved_amount >= record.charging_fee:
        record.payment_status = "PAID"
    elif pending_exists:
        record.payment_status = "PENDING"
    else:
        record.payment_status = "UNPAID"


def create_payment(
    db: Session,
    data: PaymentCreateRequest,
    current_user: User,
):
    record = db.get(DailyDriverRecord, data.daily_record_id)

    if not record:
        raise HTTPException(status_code=404, detail="Daily record not found.")

    if record.attendance_status != "PRESENT":
        raise HTTPException(
            status_code=400,
            detail="Payment cannot be recorded for an absent driver.",
        )

    if record.charging_fee <= 0:
        raise HTTPException(
            status_code=400,
            detail="Please enter the driver's charging fee first.",
        )

    already_recorded = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.daily_record_id == record.id,
            Payment.status.in_(["APPROVED", "PENDING"]),
        )
    ).scalar_one()

    if already_recorded + data.amount > record.charging_fee:
        raise HTTPException(
            status_code=400,
            detail="Payment amount exceeds the remaining balance.",
        )

    payment = Payment(
        daily_record_id=record.id,
        amount=data.amount,
        payment_method=data.payment_method,
        payment_date=data.payment_date,
        transaction_reference=data.transaction_reference,
        status="PENDING",
        recorded_by_id=current_user.id,
    )

    try:
        db.add(payment)
        db.flush()

        owners = db.execute(
            select(User).where(
                User.role == "OWNER",
                User.is_active.is_(True),
            )
        ).scalars().all()

        for owner in owners:
            db.add(
                Notification(
                    user_id=owner.id,
                    payment_id=payment.id,
                    title="Payment awaiting confirmation",
                    message=f"A payment of ₹{data.amount} is awaiting your confirmation.",
                    notification_type="PAYMENT_SUBMITTED",
                )
            )

        update_record_payment_status(db, record)

        db.commit()
        db.refresh(payment)
        return payment

    except Exception:
        db.rollback()
        raise


def approve_payment(db: Session, payment_id: int, owner: User):
    payment = db.get(Payment, payment_id)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only pending payments can be approved.",
        )

    payment.status = "APPROVED"
    payment.verified_by_id = owner.id
    payment.verified_at = datetime.now(timezone.utc)

    try:
        record = db.get(DailyDriverRecord, payment.daily_record_id)
        update_record_payment_status(db, record)
        db.commit()
        db.refresh(payment)
        return payment
    except Exception:
        db.rollback()
        raise


def reject_payment(
    db: Session,
    payment_id: int,
    data: PaymentRejectRequest,
    owner: User,
):
    payment = db.get(Payment, payment_id)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only pending payments can be rejected.",
        )

    payment.status = "REJECTED"
    payment.verified_by_id = owner.id
    payment.verified_at = datetime.now(timezone.utc)
    payment.rejection_reason = data.rejection_reason

    try:
        record = db.get(DailyDriverRecord, payment.daily_record_id)
        update_record_payment_status(db, record)
        db.commit()
        db.refresh(payment)
        return payment
    except Exception:
        db.rollback()
        raise


def get_payments(db: Session, record_id: int | None = None):
    statement = select(Payment).order_by(Payment.created_at.desc())

    if record_id is not None:
        statement = statement.where(
            Payment.daily_record_id == record_id
        )

    return db.execute(statement).scalars().all()