from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    BigInteger,
    Integer,
    String,
    Text,
    Boolean,
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


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address_line: Mapped[str] = mapped_column(String(250), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
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
        CheckConstraint("capacity > 0", name="ck_venues_capacity"),
        Index("ix_venues_city", "city"),
    )

    # Relationships
    seats: Mapped[List["VenueSeat"]] = relationship(
        "VenueSeat", back_populates="venue", cascade="all, delete-orphan"
    )
    events: Mapped[List["Event"]] = relationship(
        "Event", back_populates="venue"
    )


class VenueSeat(Base):
    __tablename__ = "venue_seats"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    venue_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_name: Mapped[str] = mapped_column(String(100), nullable=False)
    row_label: Mapped[str] = mapped_column(String(20), nullable=False)
    seat_number: Mapped[int] = mapped_column(Integer, nullable=False)
    seat_label: Mapped[str] = mapped_column(String(50), nullable=False)
    seat_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("TRUE"),
    )

    __table_args__ = (
        CheckConstraint("seat_number > 0", name="ck_venue_seats_seat_number"),
        UniqueConstraint("venue_id", "seat_label", name="uq_venue_seats_venue_label"),
        Index("ix_venue_seats_venue_id", "venue_id"),
    )

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="seats")
    event_seats: Mapped[List["EventSeat"]] = relationship(
        "EventSeat", back_populates="venue_seat"
    )
