"""EVENTHUB Ticket Types API Router

Provides retrieval of ticket tier definitions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import TicketType
from app.schemas.ticket_types import TicketTypeResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/ticket-types", tags=["Ticket Types"])


@router.get(
    "/{ticket_type_id}",
    response_model=TicketTypeResponse,
    summary="Get ticket type by ID",
)
def get_ticket_type(ticket_type_id: int, db: Session = Depends(get_db)) -> TicketTypeResponse:
    """Retrieve ticket tier by ID."""
    tt = db.query(TicketType).filter(TicketType.id == ticket_type_id).one_or_none()
    if not tt:
        raise NotFoundException("TicketType", ticket_type_id)
    return TicketTypeResponse.model_validate(tt)
