"""One-time helper script: creates demo users so we can log in and test.

Run from the backend folder:
    .\\.venv\\Scripts\\python.exe seed.py
"""

from app.core.security import hash_password
from app.database.database import SessionLocal
from app.models.user import User, UserRole

DEMO_USERS = [
    {
        "name": "Rahul Employee",
        "email": "employee@demo.com",
        "password": "employee123",
        "employee_code": "EMP001",
        "role": UserRole.employee,
    },
    {
        # second employee, used to test that one employee
        # cannot access another employee's vouchers
        "name": "Sneha Employee",
        "email": "employee2@demo.com",
        "password": "employee456",
        "employee_code": "EMP002",
        "role": UserRole.employee,
    },
    {
        "name": "Priya Director",
        "email": "director@demo.com",
        "password": "director123",
        "employee_code": None,
        "role": UserRole.director,
    },
    {
        "name": "Amit Accounts",
        "email": "accounts@demo.com",
        "password": "accounts123",
        "employee_code": None,
        "role": UserRole.accounts,
    },
]

db = SessionLocal()
try:
    for u in DEMO_USERS:
        if db.query(User).filter(User.email == u["email"]).first():
            print(f"skip (already exists): {u['email']}")
            continue
        user = User(
            name=u["name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            employee_code=u["employee_code"],
            role=u["role"],
        )
        db.add(user)
        print(f"created: {u['email']}")
    db.commit()
finally:
    db.close()
