"""Dashboard statistics.

Every number here is calculated by the database (COUNT / SUM queries) -
never hardcoded or guessed in the frontend.
"""

from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.voucher import Voucher, VoucherStatus

# NOTE on "total_amount_claimed": drafts are NOT included, because a draft
# has not actually been claimed (submitted) yet.
CLAIMED_STATUSES = [VoucherStatus.submitted, VoucherStatus.approved, VoucherStatus.rejected]


def _count(db: Session, *filters) -> int:
    query = db.query(func.count(Voucher.id))
    for f in filters:
        query = query.filter(f)
    return query.scalar() or 0


def _sum_amount(db: Session, *filters) -> float:
    query = db.query(func.coalesce(func.sum(Voucher.amount), 0))
    for f in filters:
        query = query.filter(f)
    return float(query.scalar())


def employee_dashboard(db: Session, employee: User) -> dict:
    """Stats for one employee (only their own vouchers)."""
    own = Voucher.employee_id == employee.id
    return {
        "total_vouchers": _count(db, own),
        "drafts": _count(db, own, Voucher.status == VoucherStatus.draft),
        "pending": _count(db, own, Voucher.status == VoucherStatus.submitted),
        "approved": _count(db, own, Voucher.status == VoucherStatus.approved),
        "rejected": _count(db, own, Voucher.status == VoucherStatus.rejected),
        "total_amount_claimed": _sum_amount(db, own, Voucher.status.in_(CLAIMED_STATUSES)),
    }


def director_dashboard(db: Session) -> dict:
    """Stats for the whole voucher queue.

    NOTE: rejections have no dedicated timestamp column, so "rejected
    today" uses updated_at (the last change of a rejected voucher is the
    rejection itself).
    """
    today = date.today()
    return {
        "pending_count": _count(db, Voucher.status == VoucherStatus.submitted),
        "approved_today": _count(
            db,
            Voucher.status == VoucherStatus.approved,
            func.date(Voucher.approval_date) == today,
        ),
        "rejected_today": _count(
            db,
            Voucher.status == VoucherStatus.rejected,
            func.date(Voucher.updated_at) == today,
        ),
        "total_pending_amount": _sum_amount(db, Voucher.status == VoucherStatus.submitted),
        "recent_activity": (
            db.query(Voucher)
            .options(joinedload(Voucher.employee))
            .order_by(Voucher.updated_at.desc())
            .limit(5)
            .all()
        ),
    }


def accounts_dashboard(db: Session) -> dict:
    """Stats the accounts team cares about (whole organisation)."""
    return {
        "total_vouchers": _count(db),
        "pending": _count(db, Voucher.status == VoucherStatus.submitted),
        "approved": _count(db, Voucher.status == VoucherStatus.approved),
        "rejected": _count(db, Voucher.status == VoucherStatus.rejected),
        "total_approved_amount": _sum_amount(db, Voucher.status == VoucherStatus.approved),
        "recent_approved": (
            db.query(Voucher)
            .options(joinedload(Voucher.employee))
            .filter(Voucher.status == VoucherStatus.approved)
            .order_by(Voucher.approval_date.desc())
            .limit(5)
            .all()
        ),
    }
