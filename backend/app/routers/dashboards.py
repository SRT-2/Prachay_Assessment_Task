from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.dashboard import AccountsDashboard, DirectorDashboard, EmployeeDashboard
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/employee", response_model=EmployeeDashboard)
def employee_dashboard(
    current_user: User = Depends(require_role(UserRole.employee)),
    db: Session = Depends(get_db),
):
    """The logged-in employee's own voucher statistics."""
    return dashboard_service.employee_dashboard(db, current_user)


@router.get("/director", response_model=DirectorDashboard)
def director_dashboard(
    current_user: User = Depends(require_role(UserRole.director)),
    db: Session = Depends(get_db),
):
    """Queue statistics for the director's dashboard."""
    return dashboard_service.director_dashboard(db)


@router.get("/accounts", response_model=AccountsDashboard)
def accounts_dashboard(
    current_user: User = Depends(require_role(UserRole.accounts)),
    db: Session = Depends(get_db),
):
    """Organisation-wide statistics for the accounts dashboard."""
    return dashboard_service.accounts_dashboard(db)
