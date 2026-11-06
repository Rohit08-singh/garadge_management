from datetime import date
from decimal import Decimal
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_drivers: int
    present_drivers: int
    not_arrived_drivers: int

    total_charging_fees: Decimal
    verified_collection: Decimal
    pending_payments: Decimal
    outstanding_balance: Decimal


class DailyReportResponse(BaseModel):
    report_date: date
    total_drivers: int
    present_drivers: int
    total_charging_fees: Decimal
    verified_collection: Decimal
    pending_payments: Decimal
    outstanding_balance: Decimal