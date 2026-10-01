"""EVENTHUB Notifications API Router

Provides customer notification listing and read status management.
Ensures users may access only their own notifications.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_authenticated_user
from app.models import User, Notification
from app.schemas.notifications import NotificationResponse
from app.schemas.common import MessageResponse
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=List[NotificationResponse],
    summary="List caller's notifications",
)
def list_notifications(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> List[NotificationResponse]:
    """Retrieve notifications belonging to the authenticated caller."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [NotificationResponse.model_validate(n) for n in notifs]


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """Mark a single notification as read. Enforces caller ownership."""
    notif = db.query(Notification).filter(Notification.id == notification_id).one_or_none()
    if not notif:
        raise NotFoundException("Notification", notification_id)
    if notif.user_id != current_user.id:
        raise ForbiddenException("Access not permitted to this notification")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)


@router.patch(
    "/read-all",
    response_model=MessageResponse,
    summary="Mark all caller's notifications as read",
)
def mark_all_notifications_read(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Mark all unread notifications for the caller as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return MessageResponse(message="All notifications marked as read")
