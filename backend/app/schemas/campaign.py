"""Campaign drafts, hierarchy (Campaign -> Ad Set -> Creative -> Ad), and Meta Ads lifecycle schemas."""

import hashlib
import json
from typing import List, Optional, Literal, Dict, Any, Union
from pydantic import BaseModel, Field


CampaignObjective = Literal[
    "OUTCOME_SALES",
    "OUTCOME_LEADS",
    "OUTCOME_TRAFFIC",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_AWARENESS",
    "OUTCOME_APP_PROMOTION"
]

CampaignWorkflowStatus = Literal[
    "DRAFT",
    "VALIDATED",
    "APPROVAL_PENDING",
    "APPROVED",
    "PAUSED_IN_META",
    "ACTIVATION_PENDING",
    "ACTIVE"
]

CampaignStatus = Literal["PAUSED", "ACTIVE", "ARCHIVED"]
BudgetOwnershipLevel = Literal["CAMPAIGN", "AD_SET"]
BudgetType = Literal["DAILY", "LIFETIME"]
AudienceGender = Literal["ALL", "MEN", "WOMEN"]


class AudienceTargetingConfig(BaseModel):
    age_min: int = Field(18, ge=18, le=65)
    age_max: int = Field(65, ge=18, le=65)
    genders: AudienceGender = "ALL"
    locations: List[str] = Field(default_factory=lambda: ["US"])
    interests: List[Dict[str, Any]] = Field(default_factory=list)  # [{"id": "6003140510344", "name": "Skin care"}]
    advantage_plus_audience: bool = True
    custom_audiences: List[str] = Field(default_factory=list)


class PlacementsConfig(BaseModel):
    advantage_plus_placements: bool = True
    platforms: List[str] = Field(default_factory=lambda: ["facebook", "instagram"])
    facebook_positions: List[str] = Field(default_factory=lambda: ["feed", "story", "reels"])
    instagram_positions: List[str] = Field(default_factory=lambda: ["stream", "story", "reels", "explore"])


class AdSetDraft(BaseModel):
    id: Optional[str] = None
    meta_adset_id: Optional[str] = None
    name: str = "Broad - Core Audience Ad Set"
    optimization_goal: str = "OFFSITE_CONVERSIONS"
    billing_event: str = "IMPRESSIONS"
    destination_type: str = "WEBSITE"
    daily_budget_usd: Optional[float] = Field(None, ge=5.0)
    lifetime_budget_usd: Optional[float] = Field(None, ge=20.0)
    bid_strategy: str = "LOWEST_COST_WITHOUT_CAP"
    targeting: AudienceTargetingConfig = Field(default_factory=AudienceTargetingConfig)
    placements: PlacementsConfig = Field(default_factory=PlacementsConfig)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str = "PAUSED"  # Strict initial status
    targeting_summary: Optional[str] = None


class AdCreativeDraft(BaseModel):
    id: Optional[str] = None
    meta_creative_id: Optional[str] = None
    name: str = "Hero Dynamic Creative"
    page_id: str = "page_default_101"
    page_name: str = "Lumina Skin Official"
    instagram_actor_id: Optional[str] = "17841400000000001"
    instagram_handle: Optional[str] = "@luminaskin"
    headline: str = Field(..., max_length=255)
    primary_text: str = Field(..., max_length=2000)
    description: Optional[str] = None
    call_to_action: str = "SHOP_NOW"
    media_type: Literal["IMAGE", "VIDEO"] = "IMAGE"
    media_url: str
    destination_url: str


class AdDraft(BaseModel):
    id: Optional[str] = None
    meta_ad_id: Optional[str] = None
    name: str = "Ad 01 - Main Creative"
    adset_id: Optional[str] = None
    creative_id: Optional[str] = None
    status: str = "PAUSED"  # Strict initial status


class CampaignDraftCreate(BaseModel):
    client_id: str
    name: str
    objective: CampaignObjective = "OUTCOME_SALES"
    budget_level: BudgetOwnershipLevel = "CAMPAIGN"
    budget_type: BudgetType = "DAILY"
    daily_budget_usd: float = Field(default=10.0, ge=1.0)
    lifetime_budget_usd: Optional[float] = None
    special_ad_category: str = "NONE"
    ad_sets: List[AdSetDraft] = Field(default_factory=list)
    creatives: List[AdCreativeDraft] = Field(default_factory=list)
    ads: List[AdDraft] = Field(default_factory=list)
    client_request_token: Optional[str] = None


class CampaignApprovalRecord(BaseModel):
    approver_id: str
    approver_email: Optional[str] = None
    approved_payload_hash: str
    ad_account_id: str
    budget_amount: float
    budget_type: str = "DAILY"
    currency: str = "USD"
    approved_at: str
    expires_at: str
    action_type: Literal["CAMPAIGN_CREATION_APPROVAL", "CAMPAIGN_ACTIVATION_APPROVAL"] = "CAMPAIGN_CREATION_APPROVAL"
    signature: str


class CampaignDraftResponse(BaseModel):
    id: str
    client_id: str
    meta_campaign_id: Optional[str] = None
    name: str
    objective: str
    budget_level: BudgetOwnershipLevel = "CAMPAIGN"
    budget_type: BudgetType = "DAILY"
    daily_budget_usd: float
    lifetime_budget_usd: Optional[float] = None
    special_ad_category: str = "NONE"
    status: CampaignStatus = "PAUSED"
    workflow_status: CampaignWorkflowStatus = "DRAFT"
    approval_required: bool = True
    is_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    approval_signature: Optional[str] = None
    latest_approval: Optional[CampaignApprovalRecord] = None
    approved_payload_hash: Optional[str] = None
    current_payload_hash: Optional[str] = None
    needs_reapproval: bool = False
    ad_sets_count: int = 1
    creatives_count: int = 1
    ad_sets: List[AdSetDraft] = Field(default_factory=list)
    creatives: List[AdCreativeDraft] = Field(default_factory=list)
    ads: List[AdDraft] = Field(default_factory=list)
    validation_errors: List[str] = Field(default_factory=list)
    created_at: str
    updated_at: str
    is_demo: bool = True
    idempotency_token: Optional[str] = None


class CampaignApprovalRequest(BaseModel):
    campaign_id: str
    reason: str
    confirm_budget_spend: bool = Field(..., description="Must be true to acknowledge actual budget allocation")
    action_type: Literal["CAMPAIGN_CREATION_APPROVAL", "CAMPAIGN_ACTIVATION_APPROVAL"] = "CAMPAIGN_CREATION_APPROVAL"


class CampaignValidationRequest(BaseModel):
    campaign: Union[CampaignDraftCreate, Dict[str, Any]]


class CampaignValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    graph_api_version: str = "v21.0"
    compatible_settings: Optional[Dict[str, Any]] = None


class CampaignActivationRequest(BaseModel):
    campaign_id: str
    client_id: Optional[str] = None
    ad_account_id: Optional[str] = None
    confirm_activation: bool = Field(..., description="Explicit UI confirmation for activating spending")
    confirmed_daily_budget: Optional[float] = None
    approver_declaration: Optional[str] = None


class MetaConnectionHealth(BaseModel):
    client_id: str
    ad_account_id: str
    is_connected: bool
    health_status: Literal["HEALTHY", "TOKEN_EXPIRING", "MISSING_PERMISSIONS", "DISCONNECTED"]
    token_masked: str
    token_expires_at: Optional[str] = None
    days_until_token_expiry: Optional[int] = None
    account_currency: str = "USD"
    account_timezone: str = "America/Los_Angeles"
    account_status: str = "ACTIVE (1)"
    granted_scopes: List[str] = Field(default_factory=lambda: ["ads_management", "ads_read", "pages_read_engagement", "instagram_basic"])
    missing_scopes: List[str] = Field(default_factory=list)
    api_version: str = "v21.0"
    last_checked_at: str


def compute_campaign_payload_hash(data: Dict[str, Any]) -> str:
    """
    Computes a deterministic SHA-256 hash of the critical campaign settings.
    Any changes to budget, objective, targeting, or creatives will produce a different hash,
    which invalidates existing approvals.
    """
    def serialize_set(s: Any) -> Dict[str, Any]:
        if isinstance(s, dict):
            return {
                "name": s.get("name"),
                "optimization_goal": s.get("optimization_goal"),
                "destination_type": s.get("destination_type", "WEBSITE"),
                "targeting": s.get("targeting", {}),
                "placements": s.get("placements", {})
            }
        return {
            "name": getattr(s, "name", ""),
            "optimization_goal": getattr(s, "optimization_goal", ""),
            "destination_type": getattr(s, "destination_type", "WEBSITE"),
            "targeting": s.targeting.model_dump() if hasattr(s, "targeting") else {},
            "placements": s.placements.model_dump() if hasattr(s, "placements") else {}
        }

    def serialize_creative(c: Any) -> Dict[str, Any]:
        if isinstance(c, dict):
            return {
                "headline": c.get("headline"),
                "primary_text": c.get("primary_text"),
                "media_url": c.get("media_url"),
                "destination_url": c.get("destination_url"),
                "call_to_action": c.get("call_to_action")
            }
        return {
            "headline": getattr(c, "headline", ""),
            "primary_text": getattr(c, "primary_text", ""),
            "media_url": getattr(c, "media_url", ""),
            "destination_url": getattr(c, "destination_url", ""),
            "call_to_action": getattr(c, "call_to_action", "")
        }

    keys_to_hash = {
        "objective": data.get("objective"),
        "budget_level": data.get("budget_level", "CAMPAIGN"),
        "budget_type": data.get("budget_type", "DAILY"),
        "daily_budget_usd": float(data.get("daily_budget_usd") or 0.0),
        "lifetime_budget_usd": float(data.get("lifetime_budget_usd") or 0.0) if data.get("lifetime_budget_usd") else None,
        "special_ad_category": data.get("special_ad_category", "NONE"),
        "ad_sets": [serialize_set(s) for s in data.get("ad_sets", [])],
        "creatives": [serialize_creative(c) for c in data.get("creatives", [])]
    }
    canonical_json = json.dumps(keys_to_hash, sort_keys=True)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
