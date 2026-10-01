"""EVENTHUB Organizer API Router

Provides event creation, lifecycle management (draft, publish, cancel, delete),
ticket tier management, and organizer-specific analytics.
Enforces strict server-side ownership.
"""

import math
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_organizer
from app.models import User, Organizer, Event, TicketType
from app.schemas.organizers import OrganizerResponse, OrganizerUpdateRequest
from app.schemas.events import (
    EventResponse,
    EventDetailResponse,
    EventCreateRequest,
    EventUpdateRequest,
)
from app.schemas.ticket_types import (
    TicketTypeResponse,
    TicketTypeCreateRequest,
    TicketTypeUpdateRequest,
)
from app.schemas.analytics import SalesSummaryResponse, OccupancyResponse, OrganizerRevenueResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
)
from app.services.event_service import (
    get_organizer_for_user,
    create_organizer_event,
    update_organizer_event,
    publish_organizer_event,
    cancel_organizer_event,
    delete_organizer_event,
    create_event_ticket_type,
    update_event_ticket_type,
    get_event_by_id,
    list_events,
)
from app.services.analytics_service import (
    get_sales_summary,
    get_occupancy_summary,
    get_organizer_revenue,
)

router = APIRouter(prefix="/organizer", tags=["Organizer"])


def _resolve_or_create_organizer(db: Session, user: User) -> Organizer:
    """Ensure an organizer record exists for an authorized organizer user."""
    org = db.query(Organizer).filter(Organizer.user_id == user.id).one_or_none()
    if not org:
        org = Organizer(
            user_id=user.id,
            organization_name=f"{user.full_name}'s Productions",
            contact_email=user.email,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    return org


@router.get(
    "/profile",
    response_model=OrganizerResponse,
    summary="Get organizer profile",
)
def get_profile(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> OrganizerResponse:
    """Retrieve organization profile for the authenticated organizer."""
    org = _resolve_or_create_organizer(db, current_user)
    return OrganizerResponse.model_validate(org)


@router.patch(
    "/profile",
    response_model=OrganizerResponse,
    summary="Update organizer profile",
)
def update_profile(
    request: OrganizerUpdateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> OrganizerResponse:
    """Update organization profile information."""
    org = _resolve_or_create_organizer(db, current_user)
    if request.organization_name is not None:
        org.organization_name = request.organization_name.strip()
    if request.description is not None:
        org.description = request.description.strip() if request.description else None
    if request.contact_email is not None:
        org.contact_email = str(request.contact_email).strip()
    if request.contact_phone is not None:
        org.contact_phone = request.contact_phone.strip() if request.contact_phone else None

    db.commit()
    db.refresh(org)
    return OrganizerResponse.model_validate(org)


# ----------------------------------------------------------------------------
# Event Management
# ----------------------------------------------------------------------------

@router.post(
    "/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create event in DRAFT state",
)
def create_event(
    request: EventCreateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventResponse:
    """Create a new event in DRAFT status belonging to caller's organization."""
    _resolve_or_create_organizer(db, current_user)
    event = create_organizer_event(db, user_id=current_user.id, request=request)
    return EventResponse.model_validate(event)


@router.get(
    "/events",
    response_model=PaginatedResponse[EventResponse],
    summary="List organizer's events",
)
def list_organizer_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: DRAFT, PUBLISHED, CANCELLED, COMPLETED"),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> PaginatedResponse[EventResponse]:
    """Retrieve all events belonging to the caller's organization with pagination."""
    org = _resolve_or_create_organizer(db, current_user)
    items, total = list_events(
        db=db,
        page=page,
        page_size=page_size,
        organizer_id=org.id,
        status=status,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[EventResponse.model_validate(e) for e in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.get(
    "/events/{event_id}",
    response_model=EventDetailResponse,
    summary="Get organizer's event details",
)
def get_organizer_event(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventDetailResponse:
    """Retrieve event details, verifying caller owns the event."""
    org = _resolve_or_create_organizer(db, current_user)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id and current_user.role != "ADMIN":
        raise ForbiddenException("You do not have permission to view this event")
    return EventDetailResponse.model_validate(event)


@router.patch(
    "/events/{event_id}",
    response_model=EventResponse,
    summary="Update organizer's event",
)
def update_event(
    event_id: int,
    request: EventUpdateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventResponse:
    """Modify event properties. Enforces server-side ownership."""
    _resolve_or_create_organizer(db, current_user)
    event = update_organizer_event(db, user_id=current_user.id, event_id=event_id, request=request)
    return EventResponse.model_validate(event)


@router.post(
    "/events/{event_id}/publish",
    response_model=EventResponse,
    summary="Publish event",
)
def publish_event(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventResponse:
    """Transition event from DRAFT to PUBLISHED. Requires active ticket tiers."""
    _resolve_or_create_organizer(db, current_user)
    event = publish_organizer_event(db, user_id=current_user.id, event_id=event_id)
    return EventResponse.model_validate(event)


@router.post(
    "/events/{event_id}/cancel",
    response_model=EventResponse,
    summary="Cancel event",
)
def cancel_event(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventResponse:
    """Transition event to CANCELLED status."""
    _resolve_or_create_organizer(db, current_user)
    event = cancel_organizer_event(db, user_id=current_user.id, event_id=event_id)
    return EventResponse.model_validate(event)


@router.delete(
    "/events/{event_id}",
    response_model=MessageResponse,
    summary="Delete DRAFT event",
)
def delete_event(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Delete a DRAFT event. Published events with sales history cannot be deleted."""
    _resolve_or_create_organizer(db, current_user)
    delete_organizer_event(db, user_id=current_user.id, event_id=event_id)
    return MessageResponse(message="Event deleted successfully")


# ----------------------------------------------------------------------------
# Ticket Tier Management
# ----------------------------------------------------------------------------

@router.post(
    "/events/{event_id}/ticket-types",
    response_model=TicketTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create ticket tier for an event",
)
def create_ticket_tier(
    event_id: int,
    request: TicketTypeCreateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> TicketTypeResponse:
    """Add a new ticket tier to an organizer event."""
    _resolve_or_create_organizer(db, current_user)
    tt = create_event_ticket_type(db, user_id=current_user.id, event_id=event_id, request=request)
    return TicketTypeResponse.model_validate(tt)


@router.patch(
    "/ticket-types/{ticket_type_id}",
    response_model=TicketTypeResponse,
    summary="Update ticket tier",
)
def update_ticket_tier(
    ticket_type_id: int,
    request: TicketTypeUpdateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> TicketTypeResponse:
    """Update ticket tier pricing or capacity. Capacity cannot be reduced below sold count."""
    _resolve_or_create_organizer(db, current_user)
    tt = update_event_ticket_type(db, user_id=current_user.id, ticket_type_id=ticket_type_id, request=request)
    return TicketTypeResponse.model_validate(tt)


@router.delete(
    "/ticket-types/{ticket_type_id}",
    response_model=MessageResponse,
    summary="Delete or deactivate ticket tier",
)
def delete_ticket_tier(
    ticket_type_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Deactivate or delete ticket tier."""
    org = _resolve_or_create_organizer(db, current_user)
    tt = db.query(TicketType).filter(TicketType.id == ticket_type_id).one_or_none()
    if not tt:
        raise NotFoundException("TicketType", ticket_type_id)

    event = get_event_by_id(db, tt.event_id)
    if event.organizer_id != org.id and current_user.role != "ADMIN":
        raise ForbiddenException("You do not have permission to modify this ticket tier")

    if tt.sold_count > 0:
        # Cannot hard delete sold ticket types; deactivate instead
        tt.is_active = False
        db.commit()
        return MessageResponse(message="Ticket tier has sold tickets; tier deactivated")
    else:
        db.delete(tt)
        db.commit()
        return MessageResponse(message="Ticket tier deleted successfully")


# ----------------------------------------------------------------------------
# Organizer Analytics
# ----------------------------------------------------------------------------

@router.get(
    "/analytics/overview",
    response_model=List[OrganizerRevenueResponse],
    summary="Get organizer revenue overview",
)
def get_organizer_overview(
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> List[OrganizerRevenueResponse]:
    """Retrieve revenue summary for caller's organization from v_organizer_revenue."""
    org = _resolve_or_create_organizer(db, current_user)
    return get_organizer_revenue(db, organizer_id=org.id)


@router.get(
    "/analytics/events/{event_id}",
    response_model=List[SalesSummaryResponse],
    summary="Get event sales analytics",
)
def get_event_sales_analytics(
    event_id: int,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> List[SalesSummaryResponse]:
    """Retrieve detailed sales breakdown for an organizer's event from v_event_sales_summary."""
    org = _resolve_or_create_organizer(db, current_user)
    event = get_event_by_id(db, event_id)
    if event.organizer_id != org.id and current_user.role != "ADMIN":
        raise ForbiddenException("You do not have permission to view analytics for this event")
    return get_sales_summary(db, event_id=event_id)
