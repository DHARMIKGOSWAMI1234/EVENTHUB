from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    BigInteger,
    Integer,
    Numeric,
    String,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    Identity,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    event_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    booking_reference: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default=text("0"),
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default=text("0"),
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED')",
            name="ck_bookings_status",
        ),
        CheckConstraint("subtotal >= 0", name="ck_bookings_subtotal"),
        CheckConstraint("discount_amount >= 0", name="ck_bookings_discount_amount"),
        CheckConstraint("tax_amount >= 0", name="ck_bookings_tax_amount"),
        CheckConstraint("total_amount >= 0", name="ck_bookings_total_amount"),
        Index("ix_bookings_user_id", "user_id"),
        Index("ix_bookings_event_id", "event_id"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookings")
    event: Mapped["Event"] = relationship("Event", back_populates="bookings")
    items: Mapped[List["BookingItem"]] = relationship(
        "BookingItem", back_populates="booking"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="booking"
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="booking"
    )
    held_event_seats: Mapped[List["EventSeat"]] = relationship(
        "EventSeat", back_populates="held_by_booking"
    )


class BookingItem(Base):
    __tablename__ = "booking_items"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    booking_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("bookings.id", ondelete="RESTRICT"),
        nullable=False,
    )
    ticket_type_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("ticket_types.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_booking_items_quantity"),
        CheckConstraint("unit_price >= 0", name="ck_booking_items_unit_price"),
        CheckConstraint("subtotal >= 0", name="ck_booking_items_subtotal"),
        Index("ix_booking_items_booking_id", "booking_id"),
        Index("ix_booking_items_ticket_type_id", "ticket_type_id"),
    )

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="items")
    ticket_type: Mapped["TicketType"] = relationship(
        "TicketType", back_populates="booking_items"
    )
