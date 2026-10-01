"""EVENTHUB Favorites Schemas"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FavoriteResponse(BaseModel):
    """User favorite bookmark representation."""
    id: int
    user_id: int
    event_id: int
    event_title: Optional[str] = None
    event_date: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "event") and getattr(obj, "event", None):
            setattr(obj, "event_title", obj.event.title)
            setattr(obj, "event_date", obj.event.event_date)
        return super().model_validate(obj, *args, **kwargs)

