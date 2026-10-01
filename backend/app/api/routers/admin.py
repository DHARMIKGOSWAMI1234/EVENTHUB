"""EVENTHUB Administrator API Router

Restricted strictly to users with role=ADMIN.
Provides system-level user management, catalog curation (categories & venues),
platform-wide view-based analytics, audit trail monitoring, and maintenance tasks.
"""

import math
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin
from app.models import User, Category, Venue, VenueSeat, Event
from app.schemas.users import (
    UserResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.schemas.categories import (
    CategoryResponse,
    CategoryCreateRequest,
    CategoryUpdateRequest,
)
from app.schemas.venues import (
    VenueResponse,
    VenueCreateRequest,
    VenueUpdateRequest,
    VenueSeatResponse,
    VenueSeatCreateRequest,
)
from app.schemas.analytics import (
    SalesSummaryResponse,
    OccupancyResponse,
    OrganizerRevenueResponse,
    MonthlyBookingResponse,
    RatingSummaryResponse,
    AdminOverviewResponse,
    AuditLogResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    BadRequestException,
)
from app.services.user_service import (
    list_users,
    update_user_role,
    update_user_status,
)
from app.services.analytics_service import (
    get_sales_summary,
    get_occupancy_summary,
    get_organizer_revenue,
    get_monthly_bookings,
    get_rating_summary,
    get_admin_overview_metrics,
    list_audit_logs,
    release_expired_holds_maintenance,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ----------------------------------------------------------------------------
# User Management
# ----------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=PaginatedResponse[UserResponse],
    summary="List all users with filters",
)
def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None, description="CUSTOMER, ORGANIZER, ADMIN"),
    is_active: Optional[bool] = Query(None, description="Filter active status"),
    search: Optional[str] = Query(None, description="Search name or email"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[UserResponse]:
    """Admin: retrieve paginated user accounts."""
    items, total = list_users(
        db=db,
        page=page,
        page_size=page_size,
        role=role,
        is_active=is_active,
        search=search,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="Update user active status",
)
def change_user_status(
    user_id: int,
    request: UserStatusUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Admin: activate or deactivate a user account."""
    user = update_user_status(db, user_id=user_id, request=request)
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Update user role",
)
def change_user_role(
    user_id: int,
    request: UserRoleUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Admin: promote or change user role. Non-admins cannot alter roles."""
    user = update_user_role(db, user_id=user_id, request=request)
    return UserResponse.model_validate(user)


# ----------------------------------------------------------------------------
# Category Management
# ----------------------------------------------------------------------------

@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
)
def create_category(
    request: CategoryCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    """Admin: create a new event category."""
    existing = db.query(Category).filter(Category.name.ilike(request.name.strip())).one_or_none()
    if existing:
        raise ConflictException(f"Category '{request.name}' already exists")

    category = Category(
        name=request.name.strip(),
        description=request.description.strip() if request.description else None,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.patch(
    "/categories/{category_id}",
    response_model=CategoryResponse,
    summary="Update category",
)
def update_category(
    category_id: int,
    request: CategoryUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryResponse:
    """Admin: update category name or description."""
    cat = db.query(Category).filter(Category.id == category_id).one_or_none()
    if not cat:
        raise NotFoundException("Category", category_id)

    if request.name is not None:
        cat.name = request.name.strip()
    if request.description is not None:
        cat.description = request.description.strip() if request.description else None

    db.commit()
    db.refresh(cat)
    return CategoryResponse.model_validate(cat)


@router.delete(
    "/categories/{category_id}",
    response_model=MessageResponse,
    summary="Delete category",
)
def delete_category(
    category_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Admin: delete category. Rejects deletion if events depend on it."""
    cat = db.query(Category).filter(Category.id == category_id).one_or_none()
    if not cat:
        raise NotFoundException("Category", category_id)

    events_count = db.query(Event).filter(Event.category_id == category_id).count()
    if events_count > 0:
        raise ConflictException(f"Cannot delete category: {events_count} event(s) depend on it")

    db.delete(cat)
    db.commit()
    return MessageResponse(message="Category deleted successfully")


# ----------------------------------------------------------------------------
# Venue Management
# ----------------------------------------------------------------------------

@router.post(
    "/venues",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create venue",
)
def create_venue(
    request: VenueCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> VenueResponse:
    """Admin: create a new venue."""
    venue = Venue(
        name=request.name.strip(),
        city=request.city.strip(),
        address_line=request.address.strip(),
        state="Default State",
        country="India",
        capacity=request.capacity,
    )
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return VenueResponse.model_validate(venue)


@router.patch(
    "/venues/{venue_id}",
    response_model=VenueResponse,
    summary="Update venue",
)
def update_venue(
    venue_id: int,
    request: VenueUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> VenueResponse:
    """Admin: update venue properties."""
    venue = db.query(Venue).filter(Venue.id == venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", venue_id)

    if request.name is not None:
        venue.name = request.name.strip()
    if request.city is not None:
        venue.city = request.city.strip()
    if request.address is not None:
        venue.address_line = request.address.strip()
    if request.capacity is not None:
        venue.capacity = request.capacity

    db.commit()
    db.refresh(venue)
    return VenueResponse.model_validate(venue)


@router.delete(
    "/venues/{venue_id}",
    response_model=MessageResponse,
    summary="Delete venue",
)
def delete_venue(
    venue_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Admin: delete venue. Rejects deletion if events depend on it."""
    venue = db.query(Venue).filter(Venue.id == venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", venue_id)

    events_count = db.query(Event).filter(Event.venue_id == venue_id).count()
    if events_count > 0:
        raise ConflictException(f"Cannot delete venue: {events_count} event(s) depend on it")

    db.delete(venue)
    db.commit()
    return MessageResponse(message="Venue deleted successfully")


@router.post(
    "/venues/{venue_id}/seats",
    response_model=VenueSeatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add physical seat to venue",
)
def add_venue_seat(
    venue_id: int,
    request: VenueSeatCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> VenueSeatResponse:
    """Admin: add seat to venue. Enforces UNIQUE(venue_id, seat_label)."""
    venue = db.query(Venue).filter(Venue.id == venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", venue_id)

    existing = (
        db.query(VenueSeat)
        .filter(VenueSeat.venue_id == venue_id, VenueSeat.seat_label == request.seat_label.strip())
        .one_or_none()
    )
    if existing:
        raise ConflictException(f"Seat label '{request.seat_label}' already exists for this venue")

    seat = VenueSeat(
        venue_id=venue_id,
        section_name=request.section_name.strip(),
        row_label=request.row_label.strip(),
        seat_number=request.seat_number,
        seat_label=request.seat_label.strip(),
        seat_type=request.seat_type.strip(),
        is_active=True,
    )
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return VenueSeatResponse.model_validate(seat)


# ----------------------------------------------------------------------------
# System Analytics (Phase 4 Views)
# ----------------------------------------------------------------------------

@router.get(
    "/analytics/overview",
    response_model=AdminOverviewResponse,
    summary="Platform operational KPI overview",
)
def get_platform_overview(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminOverviewResponse:
    """Admin: retrieve platform-wide totals (users, events, bookings, gross revenue)."""
    return get_admin_overview_metrics(db)


@router.get(
    "/analytics/events",
    response_model=List[SalesSummaryResponse],
    summary="Event sales analytics (v_event_sales_summary)",
)
def get_event_sales(
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[SalesSummaryResponse]:
    """Admin: query v_event_sales_summary view."""
    return get_sales_summary(db, limit=limit)


@router.get(
    "/analytics/revenue",
    response_model=List[OrganizerRevenueResponse],
    summary="Organizer revenue breakdown (v_organizer_revenue)",
)
def get_revenue_breakdown(
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[OrganizerRevenueResponse]:
    """Admin: query v_organizer_revenue view."""
    return get_organizer_revenue(db, limit=limit)


@router.get(
    "/analytics/bookings",
    response_model=List[MonthlyBookingResponse],
    summary="Monthly booking trends (v_monthly_booking_summary)",
)
def get_monthly_trends(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[MonthlyBookingResponse]:
    """Admin: query v_monthly_booking_summary view."""
    return get_monthly_bookings(db)


@router.get(
    "/analytics/ratings",
    response_model=List[RatingSummaryResponse],
    summary="Event rating leaderboard (v_event_rating_summary)",
)
def get_ratings_breakdown(
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> List[RatingSummaryResponse]:
    """Admin: query v_event_rating_summary view."""
    return get_rating_summary(db, limit=limit)


# ----------------------------------------------------------------------------
# Audit Trail & Maintenance
# ----------------------------------------------------------------------------

@router.get(
    "/audit-logs",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="List system audit logs",
)
def get_audit_trail(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_type: Optional[str] = Query(None, description="e.g. users, bookings, events"),
    entity_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None, description="INSERT, UPDATE, DELETE"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    """Admin: inspect immutable system audit trail. password_hash is strictly masked."""
    items, total = list_audit_logs(
        db=db,
        page=page,
        page_size=page_size,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[AuditLogResponse.model_validate(a) for a in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.post(
    "/maintenance/release-expired-holds",
    response_model=MessageResponse,
    summary="Trigger maintenance: release expired holds",
)
def run_release_expired_holds(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Admin: trigger server-side release_expired_holds() PostgreSQL stored function."""
    count = release_expired_holds_maintenance(db)
    return MessageResponse(
        message="Expired holds released successfully",
        detail=f"Released {count} expired seat hold(s)",
    )
