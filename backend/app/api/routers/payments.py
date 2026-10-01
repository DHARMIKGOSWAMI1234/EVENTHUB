"""EVENTHUB Simulated Payment API Router

Provides simulated payment gateway confirmation and failure handling.
No real financial credentials or payment processors are integrated.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_customer
from app.models import User, Payment
from app.schemas.payments import PaymentResponse, PaymentSimulateRequest
from app.services.payment_service import (
    get_booking_payment,
    simulate_booking_payment,
)

router = APIRouter(tags=["Payments"])


@router.get(
    "/bookings/{booking_id}/payment",
    response_model=PaymentResponse,
    summary="Get simulated payment status for a booking",
)
def get_payment(
    booking_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    """Retrieve simulated payment transaction details for a booking."""
    is_admin = current_user.role == "ADMIN"
    payment = get_booking_payment(db, booking_id=booking_id, user_id=current_user.id, is_admin=is_admin)
    return PaymentResponse.model_validate(payment)


@router.post(
    "/bookings/{booking_id}/payment/simulate",
    response_model=PaymentResponse,
    summary="Simulate payment gateway callback",
)
def simulate_payment(
    booking_id: int,
    request: PaymentSimulateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> PaymentResponse:
    """Simulate a payment gateway callback (SUCCESS or FAILED) without real payment APIs."""
    payment = simulate_booking_payment(
        db=db,
        booking_id=booking_id,
        user_id=current_user.id,
        request=request,
    )
    return PaymentResponse.model_validate(payment)
