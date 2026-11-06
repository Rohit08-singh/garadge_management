from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


def get_user_notifications(db: Session, user_id: int):
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )

    return db.execute(statement).scalars().all()


def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: int,
):
    notification = db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    ).scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    notification.is_read = True

    try:
        db.commit()
        db.refresh(notification)
        return notification
    except Exception:
        db.rollback()
        raise