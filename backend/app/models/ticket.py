from datetime import datetime
from typing import Optional
from sqlalchemy import (
    BigInteger,
    String,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    Identity,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

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
    event_seat_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("event_seats.id", ondelete="RESTRICT"),
        nullable=True,
    )
    ticket_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )
    qr_token: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('ACTIVE', 'USED', 'CANCELLED', 'REFUNDED')",
            name="ck_tickets_status",
        ),
        Index("ix_tickets_booking_id", "booking_id"),
        Index("ix_tickets_ticket_type_id", "ticket_type_id"),
        Index("ix_tickets_event_seat_id", "event_seat_id"),
    )

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="tickets")
    ticket_type: Mapped["TicketType"] = relationship(
        "TicketType", back_populates="tickets"
    )
    event_seat: Mapped[Optional["EventSeat"]] = relationship(
        "EventSeat", back_populates="tickets"
    )
