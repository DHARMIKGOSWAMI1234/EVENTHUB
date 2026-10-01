"""EVENTHUB Review Service

Enforces rating limits [1, 5] and user-event uniqueness rules.
"""

from typing import Tuple, List
from sqlalchemy.orm import Session, joinedload
from app.core.exceptions import (
    NotFoundException,
    ForbiddenException,
    ConflictException,
    BadRequestException,
)
from app.models import Review, Event
from app.schemas.reviews import ReviewCreateRequest, ReviewUpdateRequest


def list_event_reviews(
    db: Session, event_id: int, page: int = 1, page_size: int = 20
) -> Tuple[List[Review], int]:
    """Retrieve paginated reviews for an event."""
    query = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.event_id == event_id)
    )
    total = query.count()
    items = (
        query.order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def create_customer_review(
    db: Session, user_id: int, event_id: int, request: ReviewCreateRequest
) -> Review:
    """Submit a customer review for an event, enforcing UNIQUE(user_id, event_id)."""
    event = db.query(Event).filter(Event.id == event_id).one_or_none()
    if not event:
        raise NotFoundException("Event", event_id)

    # Check for existing review
    existing = (
        db.query(Review)
        .filter(Review.user_id == user_id, Review.event_id == event_id)
        .one_or_none()
    )
    if existing:
        raise ConflictException("You have already reviewed this event. You can update your existing review.")

    review = Review(
        user_id=user_id,
        event_id=event_id,
        rating=request.rating,
        comment=request.comment.strip() if request.comment else None,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update_customer_review(
    db: Session, review_id: int, user_id: int, request: ReviewUpdateRequest
) -> Review:
    """Update an existing review ensuring ownership."""
    review = db.query(Review).filter(Review.id == review_id).one_or_none()
    if not review:
        raise NotFoundException("Review", review_id)
    if review.user_id != user_id:
        raise ForbiddenException("You do not have permission to modify this review")

    if request.rating is not None:
        review.rating = request.rating
    if request.comment is not None:
        review.comment = request.comment.strip() if request.comment else None

    db.commit()
    db.refresh(review)
    return review


def delete_customer_review(
    db: Session, review_id: int, user_id: int, is_admin: bool = False
) -> None:
    """Delete a review ensuring caller ownership or admin privileges."""
    review = db.query(Review).filter(Review.id == review_id).one_or_none()
    if not review:
        raise NotFoundException("Review", review_id)
    if not is_admin and review.user_id != user_id:
        raise ForbiddenException("You do not have permission to delete this review")

    db.delete(review)
    db.commit()
