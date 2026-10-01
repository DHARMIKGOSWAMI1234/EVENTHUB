from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    BigInteger,
    Integer,
    Numeric,
    String,
    Text,
    Boolean,
    Date,
    Time,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    Index,
    Identity,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    organizer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("organizers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    venue_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("venues.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(220),
        nullable=False,
        unique=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    seating_mode: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    banner_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
            "seating_mode IN ('GENERAL_ADMISSION', 'RESERVED_SEATING')",
            name="ck_events_seating_mode",
        ),
        CheckConstraint(
            "status IN ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')",
            name="ck_events_status",
        ),
        CheckConstraint(
            "end_time IS NULL OR end_time > start_time",
            name="ck_events_end_time_after_start",
        ),
        Index("ix_events_event_date", "event_date"),
        Index("ix_events_category_id", "category_id"),
        Index("ix_events_organizer_id", "organizer_id"),
        Index("ix_events_venue_id", "venue_id"),
    )

    # Relationships
    organizer: Mapped["Organizer"] = relationship("Organizer", back_populates="events")
    category: Mapped["Category"] = relationship("Category", back_populates="events")
    venue: Mapped["Venue"] = relationship("Venue", back_populates="events")
    ticket_types: Mapped[List["TicketType"]] = relationship(
        "TicketType", back_populates="event"
    )
    event_seats: Mapped[List["EventSeat"]] = relationship(
        "EventSeat", back_populates="event"
    )
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking", back_populates="event"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="event"
    )
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite", back_populates="event"
    )


class TicketType(Base):
    __tablename__ = "ticket_types"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    event_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    sold_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("0"),
    )
    sale_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    sale_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("TRUE"),
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
        CheckConstraint("price >= 0", name="ck_ticket_types_price"),
        CheckConstraint("capacity > 0", name="ck_ticket_types_capacity"),
        CheckConstraint("sold_count >= 0", name="ck_ticket_types_sold_count_min"),
        CheckConstraint("sold_count <= capacity", name="ck_ticket_types_sold_count_max"),
        Index("ix_ticket_types_event_id", "event_id"),
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="ticket_types")
    booking_items: Mapped[List["BookingItem"]] = relationship(
        "BookingItem", back_populates="ticket_type"
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="ticket_type"
    )


class EventSeat(Base):
    __tablename__ = "event_seats"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    event_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    venue_seat_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("venue_seats.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    hold_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    held_by_booking_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("bookings.id", ondelete="SET NULL"),
        nullable=True,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED')",
            name="ck_event_seats_status",
        ),
        UniqueConstraint("event_id", "venue_seat_id", name="uq_event_seats_event_seat"),
        Index("ix_event_seats_event_status", "event_id", "status"),
        Index("ix_event_seats_venue_seat_id", "venue_seat_id"),
        Index("ix_event_seats_held_by_booking_id", "held_by_booking_id"),
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="event_seats")
    venue_seat: Mapped["VenueSeat"] = relationship("VenueSeat", back_populates="event_seats")
    held_by_booking: Mapped[Optional["Booking"]] = relationship(
        "Booking", foreign_keys=[held_by_booking_id], back_populates="held_event_seats"
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="event_seat"
    )
