"""Business logic for vouchers.

The router handles HTTP; this module holds the rules:
- voucher numbers are generated here (unique, per-year sequence)
- drafts can be edited/deleted; anything else is read-only for employees
- a voucher needs an employee signature before it can be submitted
- a voucher needs a director signature before it can be approved
- rejection requires a written reason
- signature images are validated and saved into backend/uploads/
"""

import uuid
from datetime import date, datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, UserRole
from app.models.voucher import Voucher, VoucherStatus
from app.schemas.voucher import VoucherCreate, VoucherUpdate

# backend/uploads (this file is in backend/app/services, so go 3 levels up)
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg"}
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2 MB


def _read_image_upload(upload_file: UploadFile) -> bytes:
    """Shared validation for signature images (type, non-empty, size)."""
    if upload_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature must be a PNG or JPG image",
        )
    content = upload_file.file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature image must be smaller than 2 MB",
        )
    return content


def _save_image(voucher: Voucher, content: bytes, content_type: str | None) -> str:
    """Writes the image into uploads/ and returns the generated filename."""
    UPLOAD_DIR.mkdir(exist_ok=True)
    extension = ".png" if content_type == "image/png" else ".jpg"
    filename = f"signature_v{voucher.id}_{uuid.uuid4().hex[:8]}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return filename


def generate_voucher_number(db: Session) -> str:
    """Unique number like EV-2026-0001: per-year sequence, zero padded."""
    year = date.today().year
    prefix = f"EV-{year}-"
    last = (
        db.query(Voucher)
        .filter(Voucher.voucher_number.like(prefix + "%"))
        .order_by(Voucher.voucher_number.desc())
        .first()
    )
    next_seq = int(last.voucher_number[len(prefix):]) + 1 if last else 1
    return f"{prefix}{next_seq:04d}"


def create_voucher(db: Session, data: VoucherCreate, employee: User) -> Voucher:
    voucher = Voucher(
        voucher_number=generate_voucher_number(db),
        voucher_date=date.today(),
        expense_date=data.expense_date,
        department=data.department,
        expense_title=data.expense_title,
        expense_category=data.expense_category,
        expense_description=data.expense_description,
        amount=data.amount,
        employee_id=employee.id,
        status=VoucherStatus.draft,
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher


def get_voucher_or_404(db: Session, voucher_id: int) -> Voucher:
    voucher = (
        db.query(Voucher)
        .options(joinedload(Voucher.employee))
        .filter(Voucher.id == voucher_id)
        .first()
    )
    if voucher is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voucher not found")
    return voucher


def check_owns_voucher(voucher: Voucher, user: User) -> None:
    """Employees may only access their own vouchers (security rule)."""
    if user.role == UserRole.employee and voucher.employee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own vouchers",
        )


def list_pending_approvals(db: Session) -> list[Voucher]:
    """All vouchers waiting for the director (status = submitted)."""
    return (
        db.query(Voucher)
        .options(joinedload(Voucher.employee))
        .filter(Voucher.status == VoucherStatus.submitted)
        .order_by(Voucher.updated_at.asc())
        .all()
    )


def list_vouchers(
    db: Session,
    current_user: User,
    search: str | None,
    status_filter: VoucherStatus | None,
    department: str | None,
    category: str | None,
    date_from: date | None,
    date_to: date | None,
    min_amount: float | None,
    max_amount: float | None,
    sort_by: str,
    order: str,
) -> list[Voucher]:
    """Voucher list with server-side search / filter / sort.

    Role rule first: employees can only ever see their own vouchers, so the
    ownership filter is applied BEFORE any other filter.

    NOTE: the parameter is called status_filter (not status) because
    "status" is already the FastAPI module with HTTP status codes.
    """
    query = db.query(Voucher).options(joinedload(Voucher.employee))

    if current_user.role == UserRole.employee:
        query = query.filter(Voucher.employee_id == current_user.id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            Voucher.voucher_number.ilike(like)
            | Voucher.expense_title.ilike(like)
            | Voucher.employee.has(User.name.ilike(like))
        )
    if status_filter is not None:
        query = query.filter(Voucher.status == status_filter)
    if department:
        query = query.filter(Voucher.department.ilike(department))
    if category:
        query = query.filter(Voucher.expense_category.ilike(category))
    if date_from is not None:
        query = query.filter(Voucher.expense_date >= date_from)
    if date_to is not None:
        query = query.filter(Voucher.expense_date <= date_to)
    if min_amount is not None:
        query = query.filter(Voucher.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Voucher.amount <= max_amount)

    # Whitelist: the sort column must be one of these, otherwise a client
    # could try to sort by any column name (bad practice / info leak)
    sortable = {
        "voucher_number": Voucher.voucher_number,
        "voucher_date": Voucher.voucher_date,
        "expense_date": Voucher.expense_date,
        "amount": Voucher.amount,
        "status": Voucher.status,
        "created_at": Voucher.created_at,
    }
    if sort_by not in sortable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"sort_by must be one of: {', '.join(sortable)}",
        )
    column = sortable[sort_by]
    query = query.order_by(column.desc() if order == "desc" else column.asc())

    return query.all()


def update_voucher(db: Session, voucher: Voucher, data: VoucherUpdate) -> Voucher:
    if voucher.status != VoucherStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft vouchers can be edited",
        )
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    for field, value in updates.items():
        setattr(voucher, field, value)
    db.commit()
    db.refresh(voucher)
    return voucher


def delete_voucher(db: Session, voucher: Voucher) -> None:
    if voucher.status != VoucherStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft vouchers can be deleted",
        )
    db.delete(voucher)
    db.commit()


def submit_voucher(db: Session, voucher: Voucher) -> Voucher:
    if voucher.status != VoucherStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft vouchers can be submitted",
        )
    if not voucher.employee_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload your signature before submitting",
        )
    voucher.status = VoucherStatus.submitted
    db.commit()
    db.refresh(voucher)
    return voucher


def save_employee_signature(db: Session, voucher: Voucher, upload_file: UploadFile) -> Voucher:
    if voucher.status != VoucherStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Signature can only be uploaded while the voucher is a draft",
        )
    content = _read_image_upload(upload_file)
    voucher.employee_signature = _save_image(voucher, content, upload_file.content_type)
    db.commit()
    db.refresh(voucher)
    return voucher


def save_director_signature(db: Session, voucher: Voucher, upload_file: UploadFile) -> Voucher:
    if voucher.status != VoucherStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Director signature can only be uploaded while the voucher is waiting for approval",
        )
    content = _read_image_upload(upload_file)
    voucher.director_signature = _save_image(voucher, content, upload_file.content_type)
    db.commit()
    db.refresh(voucher)
    return voucher


def approve_voucher(db: Session, voucher: Voucher) -> Voucher:
    if voucher.status != VoucherStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only submitted vouchers can be approved",
        )
    if not voucher.director_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload the director signature before approving",
        )
    voucher.status = VoucherStatus.approved
    voucher.approval_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(voucher)
    return voucher


def reject_voucher(db: Session, voucher: Voucher, reason: str) -> Voucher:
    if voucher.status != VoucherStatus.submitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only submitted vouchers can be rejected",
        )
    reason = (reason or "").strip()
    if not reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required",
        )
    voucher.status = VoucherStatus.rejected
    voucher.rejection_reason = reason
    db.commit()
    db.refresh(voucher)
    return voucher
