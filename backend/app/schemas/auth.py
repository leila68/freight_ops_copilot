"""
Pydantic schemas for authentication.

These define the exact shape of data the API accepts and returns for
signup/login/me. Keeping these separate from the SQLAlchemy models (in
app/db/models.py) is intentional: the DB model can have fields (like
password_hash) that should NEVER be sent back in an API response, and
schemas let us control that precisely.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Input shape for POST /auth/signup."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: str = Field(pattern="^(staff|customer)$")
    company_name: str | None = None


class UserLogin(BaseModel):
    """Input shape for POST /auth/login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """
    Output shape whenever we return a user (signup response, /auth/me).
    Deliberately excludes password_hash.
    """
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    company_name: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # allows creating this directly from a SQLAlchemy User object


class Token(BaseModel):
    """Output shape for POST /auth/login."""
    access_token: str
    token_type: str = "bearer"