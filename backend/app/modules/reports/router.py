from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.reports import service
from app.modules.reports.schemas import (
    DashboardSummaryResponse,
    DailyReportResponse,
)

router = APIRouter(tags=["Dashboard & Reports"])


@router.get(
    "/dashboard/summary",
    response_model=DashboardSummaryResponse,
)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_dashboard_summary(db)


@router.get(
    "/reports/daily",
    response_model=DailyReportResponse,
)
def daily_report(
    report_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_daily_report(db, report_date)