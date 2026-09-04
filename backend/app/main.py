from fastapi import FastAPI

from app.routers import auth, dashboards, vouchers

app = FastAPI(
    title="Expense Voucher Management System API",
    description="Backend API for the expense voucher management system (internship assessment)",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(vouchers.router)
app.include_router(dashboards.router)


@app.get("/health")
def health_check():
    # Simple endpoint to confirm the API server is running
    return {"status": "ok"}
