from datetime import date

from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_role
from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.voucher import Voucher, VoucherStatus
from app.schemas.voucher import RejectInput, VoucherCreate, VoucherOut, VoucherUpdate
from app.services import voucher_service

router = APIRouter(prefix="/api/vouchers", tags=["vouchers"])


@router.get("", response_model=list[VoucherOut])
def list_vouchers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, max_length=100, description="Matches voucher number, expense title or employee name"),
    status: VoucherStatus | None = None,
    department: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=100),
    date_from: date | None = Query(default=None, description="Expense date >= this date"),
    date_to: date | None = Query(default=None, description="Expense date <= this date"),
    min_amount: float | None = Query(default=None, ge=0),
    max_amount: float | None = Query(default=None, ge=0),
    sort_by: str = Query(default="created_at", description="voucher_number | voucher_date | expense_date | amount | status | created_at"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
):
    """List vouchers with server-side search / filter / sort.

    Employees only see their own vouchers; director and accounts see all.
    """
    return voucher_service.list_vouchers(
        db,
        current_user,
        search=search,
        status_filter=status,
        department=department,
        category=category,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by=sort_by,
        order=order,
    )


# NOTE: /pending-approvals must be declared BEFORE /{voucher_id},
# otherwise "pending-approvals" would be read as a voucher id
@router.get("/pending-approvals", response_model=list[VoucherOut])
def pending_approvals(
    current_user: User = Depends(require_role(UserRole.director)),
    db: Session = Depends(get_db),
):
    """Vouchers waiting for the director's decision (status = submitted)."""
    return voucher_service.list_pending_approvals(db)


@router.post("", response_model=VoucherOut, status_code=201)
def create_voucher(
    data: VoucherCreate,
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """Create a new voucher. Always starts as a Draft owned by the employee."""
    return voucher_service.create_voucher(db, data, current_user)


@router.get("/{voucher_id}", response_model=VoucherOut)
def get_voucher(
    voucher_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Voucher details. Employees can only open their own vouchers."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)
    return voucher


@router.put("/{voucher_id}", response_model=VoucherOut)
def update_voucher(
    voucher_id: int,
    data: VoucherUpdate,
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """Edit a voucher. Allowed only for the owner AND only while it is a Draft."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)
    return voucher_service.update_voucher(db, voucher, data)


@router.delete("/{voucher_id}", status_code=204)
def delete_voucher(
    voucher_id: int,
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """Delete a voucher. Allowed only for the owner AND only while it is a Draft."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)
    voucher_service.delete_voucher(db, voucher)
    return Response(status_code=204)


@router.post("/{voucher_id}/submit", response_model=VoucherOut)
def submit_voucher(
    voucher_id: int,
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """Submit a draft to the director. Requires an uploaded employee signature."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)
    return voucher_service.submit_voucher(db, voucher)


@router.post("/{voucher_id}/employee-signature", response_model=VoucherOut)
def upload_employee_signature(
    voucher_id: int,
    signature: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """Upload the employee's signature image (PNG/JPG, max 2 MB) for a draft."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)
    return voucher_service.save_employee_signature(db, voucher, signature)


@router.post("/{voucher_id}/director-signature", response_model=VoucherOut)
def upload_director_signature(
    voucher_id: int,
    signature: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.director)),
    db: Session = Depends(get_db),
):
    """Upload the director's signature image (required before approving)."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    return voucher_service.save_director_signature(db, voucher, signature)


@router.post("/{voucher_id}/approve", response_model=VoucherOut)
def approve_voucher(
    voucher_id: int,
    current_user: User = Depends(require_role(UserRole.director)),
    db: Session = Depends(get_db),
):
    """Approve a submitted voucher. Requires the director signature first."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    return voucher_service.approve_voucher(db, voucher)


@router.post("/{voucher_id}/reject", response_model=VoucherOut)
def reject_voucher(
    voucher_id: int,
    data: RejectInput,
    current_user: User = Depends(require_role(UserRole.director)),
    db: Session = Depends(get_db),
):
    """Reject a submitted voucher. A rejection reason is mandatory."""
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    return voucher_service.reject_voucher(db, voucher, data.rejection_reason)


@router.get("/{voucher_id}/signature/{which}")
def get_signature(
    voucher_id: int,
    which: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Serve a signature image file (which = 'employee' or 'director').

    The frontend fetches this as an authenticated image (an <img> tag
    cannot send the Authorization header by itself).
    """
    voucher = voucher_service.get_voucher_or_404(db, voucher_id)
    voucher_service.check_owns_voucher(voucher, current_user)

    if which == "employee":
        filename = voucher.employee_signature
    elif which == "director":
        filename = voucher.director_signature
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown signature type")

    if not filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No signature uploaded")

    file_path = voucher_service.UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signature file not found")

    media_type = "image/png" if filename.endswith(".png") else "image/jpeg"
    return FileResponse(file_path, media_type=media_type)
