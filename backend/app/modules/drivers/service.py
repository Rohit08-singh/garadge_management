from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.drivers import repository
from app.modules.drivers.schemas import (
    DriverCreateRequest,
    DriverUpdateRequest,
    DriverResponse,
)


def create_new_driver(
    db: Session,
    driver_data: DriverCreateRequest,
) -> DriverResponse:

    driver = repository.create_driver(
        db,
        driver_data.model_dump(),
    )

    return DriverResponse.model_validate(driver)


def list_drivers(
    db: Session,
    include_inactive: bool = False,
    search: str | None = None,
) -> list[DriverResponse]:

    drivers = repository.get_all_drivers(
        db,
        include_inactive=include_inactive,
        search=search,
    )

    return [
        DriverResponse.model_validate(driver)
        for driver in drivers
    ]


def get_driver(
    db: Session,
    driver_id: int,
) -> DriverResponse:

    driver = repository.get_driver_by_id(db, driver_id)

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    return DriverResponse.model_validate(driver)


def update_existing_driver(
    db: Session,
    driver_id: int,
    update_data: DriverUpdateRequest,
) -> DriverResponse:

    driver = repository.get_driver_by_id(db, driver_id)

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    if not driver.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot update an inactive driver",
        )

    changes = update_data.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update",
        )

    updated_driver = repository.update_driver(
        db,
        driver,
        changes,
    )

    return DriverResponse.model_validate(updated_driver)


def deactivate_existing_driver(
    db: Session,
    driver_id: int,
) -> DriverResponse:

    driver = repository.get_driver_by_id(db, driver_id)

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    if not driver.is_active:
        raise HTTPException(
            status_code=400,
            detail="Driver is already inactive",
        )

    inactive_driver = repository.deactivate_driver(db, driver)

    return DriverResponse.model_validate(inactive_driver)