"""Authentication and User Profile Schemas."""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2)
    organization_name: Optional[str] = Field(None, description="Optional organization name to auto-create during signup")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordUpdateWithTokenRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class OrganizationBrief(BaseModel):
    id: str
    name: str
    slug: str
    role: str  # 'owner', 'admin', 'member', 'viewer'
    billing_tier: str = "agency_pro"


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    current_organization_id: str
    current_organization_role: str
    organizations: List[OrganizationBrief] = Field(default_factory=list)
    is_demo: bool = False


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 hours
    user: UserProfileResponse
