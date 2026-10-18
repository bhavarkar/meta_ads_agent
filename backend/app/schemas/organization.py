"""Organization, Team Members, and Workspace Schemas."""

from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field


MemberRole = Literal["owner", "admin", "member", "viewer"]


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    billing_tier: str = "agency_pro"


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    billing_tier: Optional[str] = None


class OrganizationMemberResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: MemberRole
    avatar_url: Optional[str] = None
    joined_at: str


class OrganizationResponse(OrganizationBase):
    id: str
    slug: str
    owner_id: str
    members_count: int = 1
    clients_count: int = 0
    created_at: str
    updated_at: str


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: MemberRole = "member"


class UpdateMemberRoleRequest(BaseModel):
    role: MemberRole


class MetaConnectionCreate(BaseModel):
    ad_account_id: str = Field(..., description="Meta Ad Account ID, e.g. act_1234567890")
    instagram_account_id: Optional[str] = None
    meta_app_id: Optional[str] = None
    access_token: str = Field(..., description="Meta System User or User Access Token")


class MetaConnectionResponse(BaseModel):
    client_id: str
    organization_id: str
    ad_account_id: str
    instagram_account_id: Optional[str] = None
    meta_app_id: Optional[str] = None
    is_connected: bool = True
    token_masked: str
    token_expires_at: Optional[str] = None
    scopes: List[str] = Field(default_factory=lambda: ["ads_management", "ads_read", "instagram_basic", "instagram_content_publish"])
    last_verified_at: Optional[str] = None


class ClientSettingsUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    monthly_budget_usd: Optional[float] = Field(None, ge=100)
    target_roas_goal: Optional[float] = Field(None, ge=1.0)
    instagram_handle: Optional[str] = None
    is_active: Optional[bool] = None
