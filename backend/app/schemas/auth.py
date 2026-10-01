"""EVENTHUB Auth Schemas"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """User registration payload."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="Minimum 8 characters")
    full_name: str = Field(min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)


class LoginRequest(BaseModel):
    """User login credential payload."""
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class RefreshTokenRequest(BaseModel):
    """Token refresh payload."""
    refresh_token: str
