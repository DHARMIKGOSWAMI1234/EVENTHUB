from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    BigInteger,
    String,
    Text,
    Boolean,
    DateTime,
    CheckConstraint,
    Identity,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        Identity(start=1, always=False),
        primary_key=True,
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
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
        CheckConstraint(
            "role IN ('CUSTOMER', 'ORGANIZER', 'ADMIN')",
            name="ck_users_role",
        ),
    )

    # Relationships
    organizer: Mapped[Optional["Organizer"]] = relationship(
        "Organizer", back_populates="user", uselist=False
    )
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking", back_populates="user"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="user"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite", back_populates="user"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="user"
    )
