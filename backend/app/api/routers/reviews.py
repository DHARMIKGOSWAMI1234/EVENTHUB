"""EVENTHUB Reviews API Router

Handles event review submission, modification, and deletion.
Enforces ratings in [1, 5] and database uniqueness UNIQUE(user_id, event_id).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_customer
from app.models import User, Review
from app.schemas.reviews import ReviewResponse, ReviewCreateRequest, ReviewUpdateRequest
from app.schemas.common import MessageResponse
from app.services.review_service import (
    create_customer_review,
    update_customer_review,
    delete_customer_review,
)

router = APIRouter(tags=["Reviews"])


@router.post(
    "/events/{event_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit review for an event",
)
def submit_review(
    event_id: int,
    request: ReviewCreateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Submit a rating and comment for an event. Enforces UNIQUE(user_id, event_id)."""
    review = create_customer_review(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        request=request,
    )
    return ReviewResponse.model_validate(review)


@router.patch(
    "/reviews/{review_id}",
    response_model=ReviewResponse,
    summary="Update customer review",
)
def update_review(
    review_id: int,
    request: ReviewUpdateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """Modify existing review. Enforces ownership."""
    review = update_customer_review(
        db=db,
        review_id=review_id,
        user_id=current_user.id,
        request=request,
    )
    return ReviewResponse.model_validate(review)


@router.delete(
    "/reviews/{review_id}",
    response_model=MessageResponse,
    summary="Delete review",
)
def delete_review(
    review_id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Remove a customer review."""
    is_admin = current_user.role == "ADMIN"
    delete_customer_review(db=db, review_id=review_id, user_id=current_user.id, is_admin=is_admin)
    return MessageResponse(message="Review successfully deleted")
