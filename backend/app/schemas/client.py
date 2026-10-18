"""Client and Tenant Schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field


class ClientBase(BaseModel):
    name: str
    industry: str
    meta_ad_account_id: str = Field(..., description="Meta Ad Account ID (e.g. act_123456789)")
    instagram_handle: Optional[str] = None
    monthly_budget_usd: float = Field(..., ge=100)
    target_roas_goal: float = Field(default=3.5, ge=1.0)
    is_active: bool = True
    organization_id: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: str
    tenant_id: str
    organization_id: str
    created_at: str
    active_campaigns_count: int = 0
    total_spend_30d: float = 0.0
    average_roas_30d: float = 0.0
