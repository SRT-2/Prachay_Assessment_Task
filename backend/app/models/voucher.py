import enum

from sqlalchemy import (
    Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class VoucherStatus(str, enum.Enum):
    draft = "draft"            # created by employee, still editable
    submitted = "submitted"    # sent to director (waiting for approval)
    approved = "approved"      # approved by director
    rejected = "rejected"      # rejected by director (has a reason)


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True)
    # Generated automatically by the app, e.g. EV-2025-00042
    voucher_number = Column(String(20), unique=True, nullable=False, index=True)
    voucher_date = Column(Date, nullable=False)  # date the voucher was created
    expense_date = Column(Date, nullable=False)  # date the expense happened

    department = Column(String(100), nullable=False)
    expense_title = Column(String(150), nullable=False)
    expense_category = Column(String(100), nullable=True)
    expense_description = Column(Text, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)

    # Who created the voucher (foreign key to users table)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Path of the uploaded signature image file (stored in backend/uploads)
    employee_signature = Column(String(255), nullable=True)

    status = Column(
        Enum(VoucherStatus, name="voucher_status"),
        nullable=False,
        default=VoucherStatus.draft,
    )

    director_signature = Column(String(255), nullable=True)
    approval_date = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Each voucher belongs to one employee (user)
    employee = relationship("User", back_populates="vouchers")

    # Convenience for API responses (VoucherOut.employee_name)
    @property
    def employee_name(self):
        return self.employee.name if self.employee else None
