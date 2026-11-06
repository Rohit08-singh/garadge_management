from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.models import User

from app.modules.drivers.schemas import (
    DriverCreateRequest,
    DriverUpdateRequest,
    DriverResponse,
)

from app.modules.drivers import service


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"],
)


@router.post("/", response_model=DriverResponse, status_code=201)
def create_driver(
    driver_data: DriverCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_new_driver(db, driver_data)


@router.get("/", response_model=list[DriverResponse])
def get_drivers(
    search: str | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_drivers(
        db,
        include_inactive=include_inactive,
        search=search,
    )


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_driver(db, driver_id)


@router.patch("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    update_data: DriverUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_existing_driver(
        db,
        driver_id,
        update_data,
    )


@router.patch("/{driver_id}/deactivate", response_model=DriverResponse)
def deactivate_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.deactivate_existing_driver(db, driver_id)