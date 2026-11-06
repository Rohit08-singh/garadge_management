from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.modules.drivers.models import Driver


def create_driver(db: Session, driver_data: dict) -> Driver:
    driver = Driver(**driver_data)

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return driver


def get_driver_by_id(db: Session, driver_id: int) -> Driver | None:
    statement = select(Driver).where(Driver.id == driver_id)

    return db.execute(statement).scalar_one_or_none()


def get_all_drivers(
    db: Session,
    include_inactive: bool = False,
    search: str | None = None,
) -> list[Driver]:

    statement = select(Driver)

    if not include_inactive:
        statement = statement.where(Driver.is_active.is_(True))

    if search:
        search_term = f"%{search}%"

        statement = statement.where(
            or_(
                Driver.full_name.ilike(search_term),
                Driver.phone.ilike(search_term),
            )
        )

    statement = statement.order_by(Driver.full_name)

    return list(db.execute(statement).scalars().all())


def update_driver(
    db: Session,
    driver: Driver,
    update_data: dict,
) -> Driver:

    for field, value in update_data.items():
        setattr(driver, field, value)

    try:
        db.commit()
        db.refresh(driver)
        return driver

    except Exception:
        db.rollback()
        raise


def deactivate_driver(db: Session, driver: Driver) -> Driver:
    driver.is_active = False

    try:
        db.commit()
        db.refresh(driver)
        return driver

    except Exception:
        db.rollback()
        raise