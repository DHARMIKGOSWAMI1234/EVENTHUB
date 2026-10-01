"""EVENTHUB Production FastAPI Application Entrypoint

Exposes EVENTHUB's database, business logic, and transaction services
through a clean, secure, documented REST API.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.exceptions import EventHubException

tags_metadata = [
    {"name": "Authentication", "description": "User registration, login, token refresh, and session termination."},
    {"name": "Users", "description": "User profile retrieval and updates."},
    {"name": "Categories", "description": "Public catalog categories."},
    {"name": "Venues", "description": "Venue specifications and physical seat blueprints."},
    {"name": "Events", "description": "Published event catalog, detailed inspection, and real-time inventory."},
    {"name": "Ticket Types", "description": "Ticket tier definitions and pricing."},
    {"name": "Seats", "description": "Public seat map availability."},
    {"name": "Bookings", "description": "Customer reservations powered by Phase 4 row-locking transaction service."},
    {"name": "Payments", "description": "Simulated payment transaction verification and callbacks."},
    {"name": "Tickets", "description": "Issued digital tickets and admission gate scanning."},
    {"name": "Reviews", "description": "Customer ratings and event reviews."},
    {"name": "Favorites", "description": "Customer bookmarked events."},
    {"name": "Notifications", "description": "In-app notifications and alerts."},
    {"name": "Organizer", "description": "Organizer event management, ticket tiers, and sales metrics."},
    {"name": "Admin", "description": "Platform management, user roles, catalog curation, and system audit logs."},
    {"name": "Analytics", "description": "Public and view-backed platform analytics."},
    {"name": "Health", "description": "System liveness and operational health checks."},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    openapi_tags=tags_metadata,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware setup with configurable origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(EventHubException)
async def eventhub_exception_handler(request: Request, exc: EventHubException):
    """Ensure consistent JSON error payloads across domain exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# Mount versioned API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"], summary="System health check")
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"], summary="API v1 health check")
def health_check() -> dict[str, str]:
    """Health check endpoint to verify API server availability and liveness."""
    return {"status": "ok"}

