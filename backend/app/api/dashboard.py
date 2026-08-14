"""ScamShield AI — Dashboard API Route"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.crud import get_dashboard_data
from app.schemas.response_schemas import DashboardResponse
from datetime import datetime

router = APIRouter()

@router.get(
    "/",
    response_model=DashboardResponse,
    summary="Get scam trend dashboard data"
)
async def get_dashboard(db: Session = Depends(get_db)):
    """GET /dashboard — Returns aggregated scam trend statistics."""
    data = get_dashboard_data(db)
    return DashboardResponse(
        **data,
        last_updated=datetime.utcnow()
    )