"""EVENTHUB Public Analytics API Router

Exposes curated, read-only analytics derived from PostgreSQL views.
"""

from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.analytics import SalesSummaryResponse, RatingSummaryResponse
from app.services.analytics_service import get_sales_summary, get_rating_summary

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/top-events",
    response_model=List[SalesSummaryResponse],
    summary="Get top events by sales volume",
)
def get_top_events_sales(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[SalesSummaryResponse]:
    """Retrieve top-performing published events by gross ticket sales."""
    return get_sales_summary(db, limit=limit)


@router.get(
    "/top-rated",
    response_model=List[RatingSummaryResponse],
    summary="Get top-rated events",
)
def get_top_rated_events(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> List[RatingSummaryResponse]:
    """Retrieve top-rated events based on verified customer reviews."""
    return get_rating_summary(db, limit=limit)
