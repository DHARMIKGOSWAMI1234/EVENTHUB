"""EVENTHUB API v1 Central Router

Mounts all business domain routers under /api/v1.
"""

from fastapi import APIRouter
from app.api.routers import (
    auth,
    users,
    categories,
    venues,
    events,
    ticket_types,
    seats,
    bookings,
    payments,
    tickets,
    reviews,
    favorites,
    notifications,
    organizers,
    admin,
    analytics,
    database,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(venues.router)
api_router.include_router(events.router)
api_router.include_router(ticket_types.router)
api_router.include_router(seats.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(tickets.router)
api_router.include_router(reviews.router)
api_router.include_router(favorites.router)
api_router.include_router(notifications.router)
api_router.include_router(organizers.router)
api_router.include_router(admin.router)
api_router.include_router(analytics.router)
api_router.include_router(database.router)
