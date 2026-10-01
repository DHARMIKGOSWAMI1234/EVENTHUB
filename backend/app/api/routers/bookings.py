"""EVENTHUB Bookings API Router

Handles customer ticket reservations, general admission bookings, booking cancellation,
and hold expiration. Integrates directly with Phase 4 booking transaction service
to preserve row-level locking, SELECT FOR UPDATE atomicity, and concurrency safety.
"""

import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_customer, get_current_user
from app.models import User, Booking
from app.schemas.bookings import (
    BookingCreateRequest,
    BookingResponse,
    BookingDetailResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.booking_service import (
    create_customer_booking,
    list_user_bookings,
    get_booking_by_id,
    cancel_booking,
    expire_booking,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create ticket booking",
)
def create_booking(
    request: BookingCreateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingResponse:
    """Create a ticket booking using the authoritative Phase 4 transaction service.

    Preserves SELECT ... FOR UPDATE row-level locking and prevents double-booking.
    Returns 409 Conflict if a reserved seat is unavailable.
    """
    booking = create_customer_booking(db, user_id=current_user.id, request=request)
    return BookingResponse.model_validate(booking)


@router.get(
    "",
    response_model=PaginatedResponse[BookingResponse],
    summary="List caller's bookings",
)
def list_my_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: CONFIRMED, CANCELLED, PENDING_PAYMENT, EXPIRED"),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> PaginatedResponse[BookingResponse]:
    """Retrieve customer's own booking history. Caller cannot view other customers' bookings."""
    items, total = list_user_bookings(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status,
    )
    pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse(
        items=[BookingResponse.model_validate(b) for b in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


@router.get(
    "/{booking_id}",
    response_model=BookingDetailResponse,
    summary="Get booking details by ID",
)
def get_booking(
    booking_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingDetailResponse:
    """Retrieve booking details. Customers may only inspect their own bookings."""
    is_admin = current_user.role == "ADMIN"
    booking = get_booking_by_id(db, booking_id=booking_id, user_id=current_user.id, is_admin=is_admin)
    return BookingDetailResponse.model_validate(booking)


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel booking and release seats",
)
def cancel_my_booking(
    booking_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingResponse:
    """Cancel a booking, releasing reserved seats back to AVAILABLE status and cancelling tickets."""
    is_admin = current_user.role == "ADMIN"
    booking = cancel_booking(db, booking_id=booking_id, user_id=current_user.id, is_admin=is_admin)
    return BookingResponse.model_validate(booking)


@router.post(
    "/{booking_id}/expire",
    response_model=BookingResponse,
    summary="Expire pending booking and release holds",
)
def expire_my_booking(
    booking_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> BookingResponse:
    """Transition a PENDING_PAYMENT booking to EXPIRED and release any held seats."""
    booking = expire_booking(db, booking_id=booking_id, user_id=current_user.id)
    return BookingResponse.model_validate(booking)
