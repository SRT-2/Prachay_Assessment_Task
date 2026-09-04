from app.schemas.voucher import VoucherOut
from pydantic import BaseModel


class EmployeeDashboard(BaseModel):
    total_vouchers: int
    drafts: int
    pending: int
    approved: int
    rejected: int
    total_amount_claimed: float


class DirectorDashboard(BaseModel):
    pending_count: int
    approved_today: int
    rejected_today: int
    total_pending_amount: float
    recent_activity: list[VoucherOut]


class AccountsDashboard(BaseModel):
    total_vouchers: int
    pending: int
    approved: int
    rejected: int
    total_approved_amount: float
    recent_approved: list[VoucherOut]
