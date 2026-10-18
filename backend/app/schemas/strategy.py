"""Strategy generation and keyword intelligence schemas."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Legacy / Shared Schemas for Backward Compatibility ---
class AudienceTarget(BaseModel):
    name: str
    type: str  # "Broad / Advantage+", "Interest Stacking", "Lookalike", "Retargeting"
    details: str
    suggested_budget_share_pct: int


class AdCreativeAngle(BaseModel):
    concept: str
    hook: str
    primary_text: str
    headline: str
    visual_direction: str
    cta: str


class CampaignStrategyRequest(BaseModel):
    client_id: str
    business_objective: str  # "Sales / Purchases", "Leads", "Traffic"
    monthly_budget: float = Field(..., ge=100)
    primary_product: str
    target_demographics: str
    core_value_prop: str
    competitor_insights: Optional[List[str]] = None


class CampaignStrategyResponse(BaseModel):
    id: str
    client_id: str
    strategy_name: str
    executive_summary: str
    recommended_funnel_structure: List[str]
    suggested_daily_budget: float
    audience_segments: List[AudienceTarget]
    creative_angles: List[AdCreativeAngle]
    testing_roadmap_days: int = 14
    expected_roas_range: str
    created_at: str


# --- Enhanced Keyword Intelligence & 3-Strategy Schemas ---

class MetaTargetingItem(BaseModel):
    name: str
    type: str  # "interest", "behavior", "advantage_plus", "custom_audience", "ad_copy_keyword_only"
    meta_interest_id: Optional[str] = None
    is_targetable: bool
    validation_source: str
    description: str


class KeywordIntelligence(BaseModel):
    research_keywords: List[str]
    ad_copy_keywords: List[str]
    meta_targeting_suggestions: List[MetaTargetingItem]
    marketing_message_themes: List[str]
    customer_pain_points: List[str]
    advertising_hooks: List[str]
    creative_ideas: List[str]
    suggested_cta_options: List[str]
    offer_suggestions: List[str]
    audience_hypotheses: List[str]


class StrategyBudgetAllocation(BaseModel):
    daily_budget_usd: float
    monthly_budget_usd: float
    tofu_pct: int
    mofu_pct: int
    bofu_pct: int
    breakdown_notes: str


class StrategyKPIs(BaseModel):
    primary_metric: str
    target_roas_range: str
    target_cpa_usd: float
    expected_ctr_range: str
    target_conversion_rate: str
    benchmarking_disclaimer: str = (
        "Projections represent target optimization benchmarks based on historical industry models and budget pacing, "
        "not guaranteed performance. Meta advertising results depend on creative quality and auction dynamics."
    )


class CompatibleAdSetSettings(BaseModel):
    campaign_objective: str
    optimization_goal: str
    destination_type: str
    bid_strategy: str
    is_valid_configuration: bool


class SingleStrategyPlan(BaseModel):
    id: str
    tier: str  # "conservative" | "balanced" | "experimental"
    name: str
    tagline: str
    objective: str
    target_audience: List[AudienceTarget]
    location: str
    budget_allocation: StrategyBudgetAllocation
    placements: List[str]
    messaging_hooks: List[str]
    creative_formats: List[str]
    cta: str
    conversion_destination: str
    kpis: StrategyKPIs
    assumptions: List[str]
    risks: List[str]
    compatible_ad_set_settings: CompatibleAdSetSettings
    creative_angles: List[AdCreativeAngle]


class PolicyComplianceReport(BaseModel):
    industry: str
    special_ad_category: str  # "NONE" | "CREDIT" | "EMPLOYMENT" | "HOUSING"
    is_restricted_industry: bool
    prohibited_attributes_detected: List[str]
    policy_warnings: List[str]
    recommended_disclosures: List[str]
    compliance_score: int = 100


class ComprehensiveStrategyRequest(BaseModel):
    client_id: str
    industry: str
    location: str = "United States"
    budget_type: str = "monthly"  # "monthly" or "daily"
    budget_amount: float = Field(..., ge=10)
    product_service: str
    customer_profile: str
    campaign_objective: str = "OUTCOME_SALES"
    destination_type: str = "WEBSITE"  # "WEBSITE" or "WHATSAPP"
    destination_url: Optional[str] = None
    available_media_assets: Optional[List[str]] = None
    competitor_research_results: Optional[List[str]] = None
    historical_performance: Optional[str] = None


class ComprehensiveStrategyResponse(BaseModel):
    id: str
    client_id: str
    created_at: str
    industry: str
    location: str
    keyword_intelligence: KeywordIntelligence
    policy_compliance: PolicyComplianceReport
    strategies: Dict[str, SingleStrategyPlan]  # "conservative", "balanced", "experimental"
    zero_guarantee_compliance_notice: str = (
        "COMPLIANCE NOTICE: MetaPilot AI strictly adheres to Meta Advertising Standards and truth-in-advertising guidelines. "
        "No performance results or revenue amounts are guaranteed. All KPIs represent directional modeling based on budget."
    )


class SaveStrategyRequest(BaseModel):
    client_id: str
    comprehensive_strategy_id: str
    selected_tier: str  # "conservative" | "balanced" | "experimental"
    notes: Optional[str] = None


class SavedStrategyRecord(BaseModel):
    id: str
    client_id: str
    strategy_plan: SingleStrategyPlan
    selected_tier: str
    saved_at: str
    created_by: Optional[str] = None
    notes: Optional[str] = None
