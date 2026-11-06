
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.sessions.models import DailySession
from app.modules.sessions.records import DailyDriverRecord
from app.modules.payments.models import Payment


def get_dashboard_summary(db: Session):
    session = db.execute(
        select(DailySession)
        .where(DailySession.status == "OPEN")
        .order_by(DailySession.start_at.desc())
    ).scalars().first()

    if not session:
        return {
            "total_drivers": 0,
            "present_drivers": 0,
            "not_arrived_drivers": 0,
            "total_charging_fees": Decimal("0.00"),
            "verified_collection": Decimal("0.00"),
            "pending_payments": Decimal("0.00"),
            "outstanding_balance": Decimal("0.00"),
        }

    records = db.execute(
        select(DailyDriverRecord).where(
            DailyDriverRecord.session_id == session.id
        )
    ).scalars().all()

    total_drivers = len(records)
    present_drivers = sum(
        1 for r in records if r.attendance_status == "PRESENT"
    )
    not_arrived_drivers = total_drivers - present_drivers

    total_charging_fees = sum(
        (r.charging_fee for r in records if r.attendance_status == "PRESENT"),
        Decimal("0.00"),
    )

    record_ids = [r.id for r in records]

    if record_ids:
        verified_collection = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.daily_record_id.in_(record_ids),
                Payment.status == "APPROVED",
            )
        ).scalar_one()

        pending_payments = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.daily_record_id.in_(record_ids),
                Payment.status == "PENDING",
            )
        ).scalar_one()
    else:
        verified_collection = Decimal("0.00")
        pending_payments = Decimal("0.00")

    outstanding_balance = max(
        total_charging_fees - verified_collection,
        Decimal("0.00"),
    )

    return {
        "total_drivers": total_drivers,
        "present_drivers": present_drivers,
        "not_arrived_drivers": not_arrived_drivers,
        "total_charging_fees": total_charging_fees,
        "verified_collection": verified_collection,
        "pending_payments": pending_payments,
        "outstanding_balance": outstanding_balance,
    }


def get_daily_report(db: Session, report_date: date):
    timezone = ZoneInfo("Asia/Kolkata")

    start_at = datetime.combine(
        report_date, time.min, tzinfo=timezone
    )
    end_at = start_at + timedelta(days=1)

    sessions = db.execute(
        select(DailySession).where(
            DailySession.start_at >= start_at,
            DailySession.start_at < end_at,
        )
    ).scalars().all()

    session_ids = [s.id for s in sessions]

    if not session_ids:
        return {
            "report_date": report_date,
            "total_drivers": 0,
            "present_drivers": 0,
            "total_charging_fees": Decimal("0.00"),
            "verified_collection": Decimal("0.00"),
            "pending_payments": Decimal("0.00"),
            "outstanding_balance": Decimal("0.00"),
        }

    records = db.execute(
        select(DailyDriverRecord).where(
            DailyDriverRecord.session_id.in_(session_ids)
        )
    ).scalars().all()

    record_ids = [r.id for r in records]

    total_charging_fees = sum(
        (
            r.charging_fee
            for r in records
            if r.attendance_status == "PRESENT"
        ),
        Decimal("0.00"),
    )

    if record_ids:
        verified_collection = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.daily_record_id.in_(record_ids),
                Payment.status == "APPROVED",
            )
        ).scalar_one()

        pending_payments = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.daily_record_id.in_(record_ids),
                Payment.status == "PENDING",
            )
        ).scalar_one()
    else:
        verified_collection = Decimal("0.00")
        pending_payments = Decimal("0.00")

    return {
        "report_date": report_date,
        "total_drivers": len(records),
        "present_drivers": sum(
            1 for r in records if r.attendance_status == "PRESENT"
        ),
        "total_charging_fees": total_charging_fees,
        "verified_collection": verified_collection,
        "pending_payments": pending_payments,
        "outstanding_balance": max(
            total_charging_fees - verified_collection,
            Decimal("0.00"),
        ),
    }
