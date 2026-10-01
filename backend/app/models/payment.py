from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    BigInteger,
    Numeric,
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


class Payment(Base):
    __tablename__ = "payments"

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
    transaction_reference: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_payments_amount"),
        CheckConstraint(
            "payment_method IN ('UPI', 'CARD', 'NET_BANKING', 'CASH')",
            name="ck_payments_payment_method",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')",
            name="ck_payments_status",
        ),
        Index("ix_payments_booking_id", "booking_id"),
    )

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")
