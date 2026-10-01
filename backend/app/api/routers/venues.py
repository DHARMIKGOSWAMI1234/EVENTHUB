"""EVENTHUB Venues API Router

Provides public retrieval of venue information and physical seat maps.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models import Venue, VenueSeat
from app.schemas.venues import VenueResponse, VenueSeatResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/venues", tags=["Venues"])


@router.get(
    "",
    response_model=List[VenueResponse],
    summary="List all venues",
)
def list_venues(db: Session = Depends(get_db)) -> List[Venue]:
    """Retrieve all physical event venues."""
    return db.query(Venue).order_by(Venue.name.asc()).all()


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    summary="Get venue by ID",
)
def get_venue(venue_id: int, db: Session = Depends(get_db)) -> Venue:
    """Retrieve specific venue details."""
    venue = db.query(Venue).filter(Venue.id == venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", venue_id)
    return venue


@router.get(
    "/{venue_id}/seats",
    response_model=List[VenueSeatResponse],
    summary="List venue seats blueprint",
)
def get_venue_seats(venue_id: int, db: Session = Depends(get_db)) -> List[VenueSeat]:
    """Retrieve physical seat blueprint for a venue."""
    venue = db.query(Venue).filter(Venue.id == venue_id).one_or_none()
    if not venue:
        raise NotFoundException("Venue", venue_id)

    seats = (
        db.query(VenueSeat)
        .filter(VenueSeat.venue_id == venue_id, VenueSeat.is_active == True)
        .order_by(VenueSeat.section_name, VenueSeat.row_label, VenueSeat.seat_number)
        .all()
    )
    return seats
