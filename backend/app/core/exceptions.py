"""EVENTHUB Core Exceptions Module

Defines domain-specific HTTP and application exceptions with clean status codes.
"""

from typing import Any
from fastapi import HTTPException, status


class EventHubException(HTTPException):
    """Base exception for all EVENTHUB API errors."""
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(EventHubException):
    """404 Not Found."""
    def __init__(self, resource: str, identifier: Any = None):
        detail = f"{resource} not found" if identifier is None else f"{resource} '{identifier}' not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ConflictException(EventHubException):
    """409 Conflict."""
    def __init__(self, detail: str = "A conflicting resource or state already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class SeatUnavailableException(ConflictException):
    """409 Conflict when a seat is held or booked."""
    def __init__(self, detail: str = "The selected seat is no longer available."):
        super().__init__(detail=detail)


class UnauthorizedException(EventHubException):
    """401 Unauthorized."""
    def __init__(self, detail: str = "Could not validate authentication credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(EventHubException):
    """403 Forbidden."""
    def __init__(self, detail: str = "Operation not permitted for your role or account"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(EventHubException):
    """400 Bad Request."""
    def __init__(self, detail: str = "Invalid request payload or parameters"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
