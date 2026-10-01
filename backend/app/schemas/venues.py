"""EVENTHUB Venue and Venue Seat Schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VenueResponse(BaseModel):
    """Venue entity representation."""
    id: int
    name: str
    city: str
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    address_line: Optional[str] = None
    capacity: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "address_line") and not hasattr(obj, "address"):
            setattr(obj, "address", getattr(obj, "address_line"))
        return super().model_validate(obj, *args, **kwargs)



class VenueCreateRequest(BaseModel):
    """Admin venue creation payload."""
    name: str = Field(min_length=2, max_length=150)
    city: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=255)
    capacity: int = Field(gt=0)


class VenueUpdateRequest(BaseModel):
    """Admin venue update payload."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    address: Optional[str] = Field(default=None, min_length=5, max_length=255)
    capacity: Optional[int] = Field(default=None, gt=0)


class VenueSeatResponse(BaseModel):
    """Venue physical seat blueprint representation."""
    id: int
    venue_id: int
    section_name: str
    row_label: str
    seat_number: int
    seat_label: str
    seat_type: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class VenueSeatCreateRequest(BaseModel):
    """Admin seat creation payload."""
    section_name: str = Field(min_length=1, max_length=100)
    row_label: str = Field(min_length=1, max_length=20)
    seat_number: int = Field(gt=0)
    seat_label: str = Field(min_length=1, max_length=50)
    seat_type: str = Field(default="STANDARD", max_length=50)
