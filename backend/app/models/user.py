import enum

from sqlalchemy import Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship

from app.database.database import Base


class UserRole(str, enum.Enum):
    # str, enum.Enum so values are plain strings in JSON responses
    employee = "employee"
    director = "director"
    accounts = "accounts"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    # Office employee code (e.g. EMP001). Optional because director/accounts
    # users may not have one.
    employee_code = Column(String(30), unique=True, nullable=True)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.employee)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # One user (employee) can have many vouchers
    vouchers = relationship("Voucher", back_populates="employee")
