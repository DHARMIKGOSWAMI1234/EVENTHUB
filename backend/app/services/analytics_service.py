"""EVENTHUB Analytics Service

Integrates Phase 4 PostgreSQL views, stored functions, and administrative metrics:
- v_event_sales_summary
- v_event_occupancy
- v_organizer_revenue
- v_monthly_booking_summary
- v_event_rating_summary
- release_expired_holds() maintenance routine
"""

from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import AuditLog, User, Event, Booking, Ticket
from app.schemas.analytics import (
    SalesSummaryResponse,
    OccupancyResponse,
    OrganizerRevenueResponse,
    MonthlyBookingResponse,
    RatingSummaryResponse,
    AdminOverviewResponse,
    AuditLogResponse,
)


def get_sales_summary(
    db: Session, event_id: Optional[int] = None, limit: int = 50
) -> List[SalesSummaryResponse]:
    """Query v_event_sales_summary view."""
    sql = "SELECT * FROM v_event_sales_summary"
    params: Dict[str, Any] = {"lim": limit}
    if event_id:
        sql += " WHERE event_id = :event_id"
        params["event_id"] = event_id
    sql += " ORDER BY gross_revenue DESC LIMIT :lim;"

    rows = db.execute(text(sql), params).mappings().all()
    return [SalesSummaryResponse(**dict(r)) for r in rows]


def get_occupancy_summary(
    db: Session, event_id: Optional[int] = None, limit: int = 50
) -> List[OccupancyResponse]:
    """Query v_event_occupancy view."""
    sql = "SELECT * FROM v_event_occupancy"
    params: Dict[str, Any] = {"lim": limit}
    if event_id:
        sql += " WHERE event_id = :event_id"
        params["event_id"] = event_id
    sql += " ORDER BY occupancy_percentage DESC LIMIT :lim;"

    rows = db.execute(text(sql), params).mappings().all()
    return [OccupancyResponse(**dict(r)) for r in rows]


def get_organizer_revenue(
    db: Session, organizer_id: Optional[int] = None, limit: int = 50
) -> List[OrganizerRevenueResponse]:
    """Query v_organizer_revenue view."""
    sql = "SELECT * FROM v_organizer_revenue"
    params: Dict[str, Any] = {"lim": limit}
    if organizer_id:
        sql += " WHERE organizer_id = :organizer_id"
        params["organizer_id"] = organizer_id
    sql += " ORDER BY gross_revenue DESC LIMIT :lim;"

    rows = db.execute(text(sql), params).mappings().all()
    return [OrganizerRevenueResponse(**dict(r)) for r in rows]


def get_monthly_bookings(db: Session) -> List[MonthlyBookingResponse]:
    """Query v_monthly_booking_summary view."""
    sql = "SELECT * FROM v_monthly_booking_summary ORDER BY booking_year ASC, booking_month ASC;"
    rows = db.execute(text(sql)).mappings().all()
    return [MonthlyBookingResponse(**dict(r)) for r in rows]


def get_rating_summary(
    db: Session, event_id: Optional[int] = None, limit: int = 50
) -> List[RatingSummaryResponse]:
    """Query v_event_rating_summary view."""
    sql = "SELECT * FROM v_event_rating_summary"
    params: Dict[str, Any] = {"lim": limit}
    if event_id:
        sql += " WHERE event_id = :event_id"
        params["event_id"] = event_id
    sql += " ORDER BY average_rating DESC, review_count DESC LIMIT :lim;"

    rows = db.execute(text(sql), params).mappings().all()
    return [RatingSummaryResponse(**dict(r)) for r in rows]


def get_admin_overview_metrics(db: Session) -> AdminOverviewResponse:
    """Calculate platform-wide high-level operational statistics."""
    total_users = db.query(User).count()
    total_events = db.query(Event).count()
    total_bookings = db.query(Booking).count()

    rev_stats = db.execute(text("""
        SELECT 
            count(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_count,
            coalesce(sum(total_amount) FILTER (WHERE status = 'CONFIRMED'), 0.00)::NUMERIC(12, 2) AS gross_rev
        FROM bookings;
    """)).one()
    confirmed_bookings = rev_stats.confirmed_count
    gross_revenue = rev_stats.gross_rev

    total_tickets = db.query(Ticket).filter(Ticket.status.in_(("ACTIVE", "USED"))).count()

    avg_rating_row = db.execute(text("SELECT coalesce(avg(rating), 0.0) FROM reviews;")).scalar()
    avg_rating = round(float(avg_rating_row), 2)

    return AdminOverviewResponse(
        total_users=total_users,
        total_events=total_events,
        total_bookings=total_bookings,
        confirmed_bookings=confirmed_bookings,
        gross_revenue=gross_revenue,
        total_tickets_sold=total_tickets,
        average_platform_rating=avg_rating,
    )


def list_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
) -> Tuple[List[AuditLog], int]:
    """Admin: retrieve paginated audit log snapshots."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    items = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def release_expired_holds_maintenance(db: Session) -> int:
    """Admin: trigger server-side release_expired_holds() stored function."""
    released = db.execute(text("SELECT release_expired_holds();")).scalar()
    db.commit()
    return released or 0
