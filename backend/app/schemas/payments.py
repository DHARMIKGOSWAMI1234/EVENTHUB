"""EVENTHUB Payment Schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


class PaymentResponse(BaseModel):
    """Simulated payment transaction record."""
    id: int
    booking_id: int
    transaction_reference: str
    amount: Decimal
    payment_method: str
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentSimulateRequest(BaseModel):
    """Request to simulate payment confirmation or failure."""
    payment_method: Literal["UPI", "CARD", "NET_BANKING", "CASH"] = "UPI"
    simulate_status: Literal["SUCCESS", "FAILED"] = "SUCCESS"
