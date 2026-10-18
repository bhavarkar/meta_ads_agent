"""Competitor intelligence schemas supporting discovery, Ad Library research, and AI analysis."""

import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, model_validator


VerificationStatus = Literal["verified", "unverified_suggestion", "rejected"]
EvidenceType = Literal["direct_observation", "ad_library_link", "ai_inferred_hypothesis"]
ClaimType = Literal["observation", "hypothesis"]


class CompetitorBase(BaseModel):
    name: Optional[str] = None
    brand_name: Optional[str] = None
    website: Optional[str] = None
    industry: str = Field(..., min_length=2, max_length=100)
    geographic_market: str = "United States"
    facebook_page_id: Optional[str] = None
    facebook_page_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    ad_library_url: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    def unify_name(cls, values):
        if isinstance(values, dict):
            n = values.get("name") or values.get("brand_name")
            if n:
                values["name"] = n
                values["brand_name"] = n
            elif not values.get("name"):
                values["name"] = "Competitor Brand"
                values["brand_name"] = "Competitor Brand"
        return values


class CompetitorCreate(CompetitorBase):
    client_id: Optional[str] = "cli_lumina_glow"


class CompetitorUpdate(BaseModel):
    name: Optional[str] = None
    brand_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    geographic_market: Optional[str] = None
    facebook_page_id: Optional[str] = None
    facebook_page_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    ad_library_url: Optional[str] = None
    verification_status: Optional[VerificationStatus] = None
    notes: Optional[str] = None


class CompetitorProfile(CompetitorBase):
    id: str
    client_id: str
    organization_id: str
    verification_status: VerificationStatus = "verified"
    verified_sources: List[str] = Field(default_factory=list)
    active_ads_count: int = 0
    primary_hook_style: Optional[str] = None
    primary_offer: Optional[str] = None
    created_at: str
    updated_at: str


class CompetitorDiscoveryRequest(BaseModel):
    client_id: Optional[str] = "cli_lumina_glow"
    industry: str
    location: str = "United States"
    product_category: Optional[str] = None
    category: Optional[str] = None
    business_location: Optional[str] = None
    marketing_goal: str = "Direct-to-Consumer Customer Acquisition"
    target_customer_profile: Optional[str] = "Professionals and active consumers"
    known_competitors: List[str] = Field(default_factory=list)
    public_ad_library_urls: Optional[List[str]] = None

    @model_validator(mode="before")
    def unify_discovery_fields(cls, values):
        if isinstance(values, dict):
            cat = values.get("product_category") or values.get("category") or values.get("industry")
            values["product_category"] = cat
            values["category"] = cat
            loc = values.get("location") or values.get("business_location") or "United States"
            values["location"] = loc
            values["business_location"] = loc
            if not values.get("target_customer_profile"):
                values["target_customer_profile"] = "Target audience in " + loc
        return values


class CompetitorCandidate(BaseModel):
    id: str
    name: str
    brand_name: Optional[str] = None
    website: Optional[str] = None
    industry: str
    geographic_market: str
    rationale: str
    reason: Optional[str] = None
    suggested_search_query: str
    verification_status: VerificationStatus = "unverified_suggestion"
    status: Optional[str] = None
    confidence_score: int = Field(..., ge=1, le=100)
    permitted_source: str
    source_reference: Optional[str] = None
    ad_library_search_url: str

    @model_validator(mode="before")
    def unify_candidate(cls, values):
        if isinstance(values, dict):
            n = values.get("name") or values.get("brand_name")
            values["name"] = n
            values["brand_name"] = n
            r = values.get("rationale") or values.get("reason") or "Identified competitor"
            values["rationale"] = r
            values["reason"] = r
            st = values.get("verification_status") or values.get("status") or "unverified_suggestion"
            values["verification_status"] = st
            values["status"] = st
            src = values.get("permitted_source") or values.get("source_reference") or "Public Ad Library"
            values["permitted_source"] = src
            values["source_reference"] = src
        return values


class AdObservationCreate(BaseModel):
    client_id: Optional[str] = "cli_lumina_glow"
    competitor_id: Optional[str] = None
    advertiser_name: Optional[str] = None
    competitor_name: Optional[str] = None
    ad_archive_id: Optional[str] = None
    source_url: Optional[str] = None
    headline: Optional[str] = None
    primary_text: Optional[str] = None
    ad_copy: Optional[str] = None
    call_to_action: Optional[str] = "Learn More"
    cta: Optional[str] = None
    format: Optional[str] = "video_9_16"
    creative_format: Optional[str] = None
    hook_type: str = "Pattern Interrupt"
    extracted_hook_text: Optional[str] = None
    hook: Optional[str] = None
    extracted_offer: Optional[str] = None
    offer: Optional[str] = None
    observation_date: Optional[str] = None
    start_date: Optional[str] = None
    evidence_type: EvidenceType = "ad_library_link"
    screenshot_url: Optional[str] = None
    is_hypothesis: bool = False
    hypothesis_rationale: Optional[str] = None

    @model_validator(mode="before")
    def unify_observation_fields(cls, values):
        if isinstance(values, dict):
            adv = values.get("advertiser_name") or values.get("competitor_name") or "Competitor Brand"
            values["advertiser_name"] = adv
            values["competitor_name"] = adv
            copy = values.get("primary_text") or values.get("ad_copy") or values.get("headline") or "Competitor Ad Copy"
            values["primary_text"] = copy
            values["ad_copy"] = copy
            if not values.get("headline"):
                values["headline"] = copy[:60]
            c = values.get("call_to_action") or values.get("cta") or "Learn More"
            values["call_to_action"] = c
            values["cta"] = c
            fmt = values.get("format") or values.get("creative_format") or "video_9_16"
            values["format"] = fmt
            values["creative_format"] = fmt
            h = values.get("extracted_hook_text") or values.get("hook") or "Attention-grabbing hook"
            values["extracted_hook_text"] = h
            values["hook"] = h
            o = values.get("extracted_offer") or values.get("offer") or "Promotional Offer"
            values["extracted_offer"] = o
            values["offer"] = o
            if not values.get("observation_date"):
                values["observation_date"] = datetime.date.today().isoformat()
        return values


class CompetitorAdCreative(BaseModel):
    id: str
    advertiser_name: str
    competitor_name: Optional[str] = None
    page_id: Optional[str] = None
    ad_archive_id: Optional[str] = None
    headline: str
    primary_text: str
    ad_copy: Optional[str] = None
    call_to_action: str
    cta: Optional[str] = None
    media_type: str
    format: Optional[str] = "video_9_16"
    creative_format: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    estimated_active_days: int = 1
    first_seen: str
    observation_date: Optional[str] = None
    hook_type: str
    extracted_hook_text: str
    hook: Optional[str] = None
    extracted_offer: str
    offer: Optional[str] = None
    target_angles: List[str] = Field(default_factory=list)
    creative_score: int = Field(default=85, ge=1, le=100)
    source_url: Optional[str] = None
    is_verified: bool = True
    is_hypothesis: bool = False
    evidence_type: EvidenceType = "ad_library_link"
    citation: Optional[str] = None

    @model_validator(mode="before")
    def unify_creative_fields(cls, values):
        if isinstance(values, dict):
            if not values.get("competitor_name"):
                values["competitor_name"] = values.get("advertiser_name")
            if not values.get("ad_copy"):
                values["ad_copy"] = values.get("primary_text")
            if not values.get("hook"):
                values["hook"] = values.get("extracted_hook_text")
            if not values.get("offer"):
                values["offer"] = values.get("extracted_offer")
            if not values.get("cta"):
                values["cta"] = values.get("call_to_action")
            if not values.get("creative_format"):
                values["creative_format"] = values.get("format")
        return values


class HookAnalysisItem(BaseModel):
    hook_text: str
    hook_type: str
    advertiser_name: str
    claim_type: ClaimType
    prevalence: str  # "High", "Medium", "Emerging"
    confidence_score: int = Field(..., ge=1, le=100)
    source_citation: str
    source_url: Optional[str] = None


class PositioningItem(BaseModel):
    competitor_name: str
    value_proposition: str
    market_positioning: str
    target_audience: str
    claim_type: ClaimType
    evidence_source: str


class PromotionThemeItem(BaseModel):
    theme_name: str
    offer_structure: str
    typical_hook: str
    prevalence_score: int
    claim_type: ClaimType
    evidence_citation: str


class CTAPatternItem(BaseModel):
    cta_text: str
    usage_share_pct: int
    intent_level: str  # "Direct Conversion", "Soft Discovery", "Lead Capture"
    claim_type: ClaimType


class DifferentiationOpportunity(BaseModel):
    id: str
    opportunity_name: str
    unexploited_angle: str
    competitor_gap_rationale: str
    projected_impact_score: int = Field(..., ge=1, le=100)
    claim_type: ClaimType = "hypothesis"
    recommended_test_action: str
    evidence_grounding: str


class KeywordClusterItem(BaseModel):
    cluster_name: str
    keywords: List[str]
    intent_type: str  # "Transactional", "Commercial Investigation", "Problem-Aware"
    suggested_ad_library_queries: List[str]


class CompetitorIntelligenceReport(BaseModel):
    id: str
    client_id: str
    industry: str
    analyzed_competitors: List[str]
    total_ads_analyzed: int
    executive_summary: str
    hooks_analysis: List[HookAnalysisItem]
    positioning_matrix: List[PositioningItem]
    promotion_themes: List[PromotionThemeItem]
    format_distribution: Dict[str, int]
    call_to_action_patterns: List[CTAPatternItem]
    differentiation_opportunities: List[DifferentiationOpportunity]
    recommended_research_keywords: List[KeywordClusterItem]
    source_citations: List[Dict[str, str]]
    compliance_disclaimer: str = (
        "Zero Fabrication Guarantee: Competitor spending, conversions, CPC, and private internal metrics "
        "are strictly not estimated or fabricated. All claims cite public Meta Ad Library observations or are explicitly labeled as hypotheses."
    )
    generated_at: str


class HookExtractionResponse(BaseModel):
    top_hooks: List[dict]
    primary_offers: List[str]
    trending_keywords: List[str]
    recommended_angles: List[dict]
    report: Optional[CompetitorIntelligenceReport] = None
