"""Performance analytics schemas with explicit Meta Marketing API data provenance."""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


DatePresetType = Literal["yesterday", "last_7d", "last_30d", "custom"]
ReportingLevelType = Literal["account", "campaign", "adset", "ad"]


class MetricSummary(BaseModel):
    total_spend: float = Field(..., description="Total amount spent in account currency")
    impressions: int = Field(..., description="Total ad impressions delivered")
    reach: int = Field(..., description="Unique individuals who saw the ad")
    frequency: float = Field(..., description="Average impressions per reached person (impressions / reach)")
    clicks: int = Field(..., description="Total clicks across ad elements (post, reactions, see more, link)")
    link_clicks: int = Field(..., description="Clicks specifically directed to external destination URLs")
    ctr_percent: float = Field(..., description="All clicks Click-Through Rate: (clicks / impressions) * 100")
    link_ctr_percent: float = Field(..., description="Outbound Link CTR: (link_clicks / impressions) * 100")
    cpc: float = Field(..., description="Cost Per Click: spend / clicks")
    cost_per_link_click: float = Field(..., description="Cost Per Link Click: spend / link_clicks")
    cpm: float = Field(..., description="Cost Per 1,000 Impressions: (spend / impressions) * 1000")
    results: int = Field(..., description="Primary conversion results (purchases or leads)")
    result_metric_name: str = Field(default="Purchases", description="Name of the primary result event")
    cost_per_result: float = Field(..., description="Cost Per Result: spend / results")
    attributed_revenue: Optional[float] = Field(default=None, description="Real attributed revenue from purchase events")
    roas: Optional[float] = Field(default=None, description="Return on Ad Spend: attributed_revenue / spend (None if untracked)")
    has_attributed_revenue: bool = Field(default=False, description="Whether ad account tracks attributed conversion value")
    currency: str = Field(default="USD", description="Account currency code")
    # Legacy compatibility fields
    conversions: int = Field(..., description="Alias for results")
    cpa: float = Field(..., description="Alias for cost_per_result")
    change_vs_previous_period_pct: Dict[str, float] = Field(
        default_factory=dict,
        description="Percentage changes vs prior period for spend, roas, cpa, conversions"
    )


class TimeSeriesPoint(BaseModel):
    date: str
    spend: float
    impressions: int = 0
    reach: int = 0
    clicks: int = 0
    link_clicks: int = 0
    ctr_percent: float = 0.0
    cpc: float = 0.0
    cpm: float = 0.0
    results: int = 0
    cost_per_result: float = 0.0
    roas: Optional[float] = None
    # Legacy fields
    conversions: int = 0
    cpa: float = 0.0


class PlacementBreakdown(BaseModel):
    placement: str  # "Instagram Reels", "Instagram Feed", "Facebook Feed", "Instagram Stories"
    spend_share_pct: float
    roas: Optional[float] = None
    cpa: float
    impressions: int = 0
    clicks: int = 0


class ActionBreakdownItem(BaseModel):
    action_type: str = Field(..., description="Raw Meta action type, e.g. omni_purchase, lead, add_to_cart")
    action_label: str = Field(..., description="Human-friendly label")
    count: int = Field(..., description="Total actions recorded")
    value: Optional[float] = Field(default=None, description="Attributed value if tracked")
    cost_per_action: float = Field(default=0.0, description="Spend divided by action count")


class ConversionFunnelStage(BaseModel):
    stage_id: str
    stage_name: str
    count: int
    dropoff_pct: float = Field(..., description="Dropoff percentage from previous funnel step")
    conversion_rate_pct: float = Field(..., description="Conversion rate relative to top-of-funnel impressions")
    is_tracked: bool = Field(default=True, description="Whether this event is actively configured and tracked")
    untracked_reason: Optional[str] = Field(default=None, description="Explanation if event is not tracked")


class ReportingEntityRow(BaseModel):
    id: str
    name: str
    level: ReportingLevelType
    status: str  # "ACTIVE", "PAUSED", "ARCHIVED"
    spend: float
    impressions: int
    reach: int
    frequency: float
    clicks: int
    link_clicks: int
    ctr_percent: float
    link_ctr_percent: float
    cpc: float
    cpm: float
    results: int
    result_type: str
    cost_per_result: float
    roas: Optional[float] = None
    currency: str = "USD"


class CreativePerformanceItem(BaseModel):
    ad_id: str
    ad_name: str
    headline: str
    thumbnail_url: str
    media_type: str  # "VIDEO", "IMAGE"
    spend: float
    impressions: int
    frequency: float
    link_clicks: int
    ctr_percent: float
    cpc: float
    results: int
    cost_per_result: float
    roas: Optional[float] = None
    performance_tier: Literal["TOP_PERFORMER", "AVERAGE", "WEAK_FATIGUED"]
    diagnosis: str

    @property
    def id(self) -> str:
        return self.ad_id

    @property
    def name(self) -> str:
        return self.ad_name

    @property
    def cpa(self) -> float:
        return self.cost_per_result


class AccountMetadata(BaseModel):
    ad_account_id: str
    ad_account_name: str
    currency: str = "USD"
    account_timezone: str = "America/Los_Angeles"
    timezone_offset_hours: int = -7
    attribution_setting: str = "7-day click or 1-day view"
    last_synced_at: str
    sync_status: Literal["SUCCESS", "SYNCING", "FAILED"] = "SUCCESS"
    data_source: Literal["META_MARKETING_API_INSIGHTS", "SYNTHETIC_DEMO"] = "SYNTHETIC_DEMO"
    rate_limit_percent: float = Field(default=12.5, description="Estimated Meta API call usage percentage")


class AnalyticsResponse(BaseModel):
    client_id: str
    level: ReportingLevelType = "account"
    date_preset: DatePresetType = "last_14d"  # type: ignore[assignment]
    since: str
    until: str
    account_metadata: AccountMetadata
    summary: MetricSummary
    trend_history: List[TimeSeriesPoint]
    placements: List[PlacementBreakdown]
    conversion_funnel: List[ConversionFunnelStage]
    entities: List[ReportingEntityRow]
    top_creatives: List[CreativePerformanceItem]
    weak_creatives: List[CreativePerformanceItem]
    action_breakdown: List[ActionBreakdownItem]
    is_demo: bool = True
    disclaimer: str = "DEMO DATA: Figures shown are realistic synthetic data for staging and preview purposes."


class SyncRequest(BaseModel):
    client_id: str
    force_refresh: bool = True
