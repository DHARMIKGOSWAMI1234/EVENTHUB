"""EVENTHUB Tickets API Router

Provides customer ticket management and gate admission validation.
Prevents ticket reuse once scanned and verified.
"""

import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_authenticated_user, require_customer
from app.models import User, Ticket
from app.schemas.tickets import TicketResponse, TicketValidateResponse
from app.schemas.common import PaginatedResponse
from app.services.ticket_service import (
    list_user_tickets,
    get_ticket_by_id,
    validate_ticket_admission,
)

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get(
    "",
    response_model=PaginatedResponse[TicketResponse],
    summary="List caller's tickets",
)
def list_my_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, USED, CANCELLED, REFUNDED"),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> PaginatedResponse[TicketResponse]:
    """Retrieve all tickets belonging to the caller with pagination."""
    items, total = list_user_tickets(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[TicketResponse.model_validate(t) for t in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Get ticket details by ID",
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """Retrieve ticket details by ID. Customers may only inspect their own tickets."""
    is_admin = current_user.role in ("ADMIN", "ORGANIZER")
    ticket = get_ticket_by_id(db, ticket_id=ticket_id, user_id=current_user.id, is_admin=is_admin)
    return TicketResponse.model_validate(ticket)


@router.post(
    "/{ticket_id}/validate",
    response_model=TicketValidateResponse,
    summary="Validate ticket admission at venue gate",
)
def validate_ticket(
    ticket_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> TicketValidateResponse:
    """Validate ticket status and grant entry.

    Transitions ACTIVE tickets to USED.
    Rejects already-used, cancelled, or refunded tickets.
    """
    is_authorized_staff = current_user.role in ("ORGANIZER", "ADMIN")
    return validate_ticket_admission(
        db=db,
        ticket_id=ticket_id,
        user_id=current_user.id,
        is_authorized_staff=is_authorized_staff,
    )
