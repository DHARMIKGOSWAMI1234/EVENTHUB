"""EVENTHUB Booking Schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field


class BookingItemResponse(BaseModel):
    """Line item within a booking."""
    id: int
    ticket_type_id: int
    ticket_type_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class BookingCreateRequest(BaseModel):
    """Booking creation request supporting both seating modes."""
    event_id: int
    ticket_type_id: int
    # For RESERVED_SEATING: specify single event_seat_id
    event_seat_id: Optional[int] = None
    # For GENERAL_ADMISSION: specify quantity (default 1)
    quantity: int = Field(default=1, ge=1, le=10)
    payment_method: Literal["UPI", "CARD", "NET_BANKING", "CASH"] = "UPI"
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))


class BookingResponse(BaseModel):
    """Safe public representation of a customer booking."""
    id: int
    user_id: int
    event_id: int
    event_title: Optional[str] = None
    booking_reference: str
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "event") and getattr(obj, "event", None):
            setattr(obj, "event_title", obj.event.title)
        return super().model_validate(obj, *args, **kwargs)


class BookingDetailResponse(BookingResponse):
    """Detailed booking representation with line items and tickets."""
    items: List[BookingItemResponse] = []
    ticket_count: int = 0

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "__table__"):
            event_title = obj.event.title if (hasattr(obj, "event") and obj.event) else None
            booking_items_list = getattr(obj, "items", None) or getattr(obj, "booking_items", None) or []
            parsed_items = []
            for itm in booking_items_list:
                tt_name = itm.ticket_type.name if hasattr(itm, "ticket_type") and itm.ticket_type else None
                parsed_items.append(
                    BookingItemResponse(
                        id=itm.id,
                        ticket_type_id=itm.ticket_type_id,
                        ticket_type_name=tt_name,
                        quantity=itm.quantity,
                        unit_price=itm.unit_price,
                        subtotal=itm.subtotal,
                    )
                )
            tickets = getattr(obj, "tickets", None) or []
            return cls(
                id=obj.id,
                user_id=obj.user_id,
                event_id=obj.event_id,
                event_title=event_title,
                booking_reference=obj.booking_reference,
                status=obj.status,
                subtotal=obj.subtotal,
                discount_amount=obj.discount_amount,
                tax_amount=obj.tax_amount,
                total_amount=obj.total_amount,
                created_at=obj.created_at,
                expires_at=obj.expires_at,
                items=parsed_items,
                ticket_count=len(tickets),
            )
        return super().model_validate(obj, *args, **kwargs)


