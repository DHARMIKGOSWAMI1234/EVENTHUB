"""EVENTHUB Favorites API Router

Provides customer bookmarking and favorite event tracking.
Handles idempotency gracefully and respects UNIQUE(user_id, event_id).
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, require_customer
from app.models import User, Favorite, Event
from app.schemas.favorites import FavoriteResponse
from app.schemas.common import MessageResponse
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get(
    "",
    response_model=List[FavoriteResponse],
    summary="List caller's favorite events",
)
def list_favorites(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> List[FavoriteResponse]:
    """Retrieve bookmarked events for the authenticated customer."""
    favs = (
        db.query(Favorite)
        .options(joinedload(Favorite.event))
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return [FavoriteResponse.model_validate(f) for f in favs]


@router.post(
    "/{event_id}",
    response_model=FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add event to favorites",
)
def add_favorite(
    event_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> FavoriteResponse:
    """Bookmark an event. Idempotent: returns existing favorite if already bookmarked."""
    event = db.query(Event).filter(Event.id == event_id).one_or_none()
    if not event:
        raise NotFoundException("Event", event_id)

    fav = (
        db.query(Favorite)
        .options(joinedload(Favorite.event))
        .filter(Favorite.user_id == current_user.id, Favorite.event_id == event_id)
        .one_or_none()
    )
    if not fav:
        fav = Favorite(user_id=current_user.id, event_id=event_id)
        db.add(fav)
        db.commit()
        db.refresh(fav)
        # Load relation
        fav = (
            db.query(Favorite)
            .options(joinedload(Favorite.event))
            .filter(Favorite.id == fav.id)
            .one()
        )

    return FavoriteResponse.model_validate(fav)


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Remove event from favorites",
)
def remove_favorite(
    event_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Remove bookmark for an event."""
    fav = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.event_id == event_id)
        .one_or_none()
    )
    if fav:
        db.delete(fav)
        db.commit()

    return MessageResponse(message="Favorite removed successfully")
