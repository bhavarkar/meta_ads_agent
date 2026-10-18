"""Five prioritized AI recommendations schemas with LangGraph execution metadata."""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, model_validator


RecommendationCategory = Literal[
    "Creative optimization",
    "Audience testing",
    "Budget allocation",
    "Conversion tracking",
    "Landing page optimization",
    "Lead quality",
    "Retargeting",
    "Campaign structure",
    "Instagram content strategy",
    # Legacy codes for backward-compatibility
    "CREATIVE_FATIGUE",
    "BUDGET_SCALING",
    "AUDIENCE_EXPANSION",
    "BIDDING_TUNING",
    "OFFER_OPTIMIZATION"
]

PriorityRank = Literal[1, 2, 3, 4, 5]
ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]
EffortLevel = Literal["LOW", "MEDIUM", "HIGH"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]
FeedbackStatus = Literal["PENDING", "ACCEPTED", "REJECTED", "SNOOZED", "IMPLEMENTED", "APPLIED", "DISMISSED"]


class ImpactEstimate(BaseModel):
    metric_name: str = Field(..., description="Target metric, e.g. 'CPA Reduction', 'CTR Lift', 'Conversion Rate'")
    estimated_change_range: str = Field(..., description="Directional range with uncertainty bounds, e.g. '+15% to +25%'")
    uncertainty_rating: Literal["LOW", "MEDIUM", "HIGH"] = Field("MEDIUM", description="Uncertainty rating")
    rationale: str = Field(..., description="Mechanism explanation; explicitly notes that ROI is not guaranteed")


class EvidenceLink(BaseModel):
    title: str
    url: str
    evidence_type: str = "METRIC_SOURCE"  # e.g. "INSIGHTS", "AD_LIBRARY", "PIXEL_LOG", "EVENT_MANAGER"


class AIRecommendation(BaseModel):
    id: str
    client_id: str
    priority: PriorityRank
    title: str
    category: str
    problem_identified: str = ""
    supporting_evidence: List[str] = Field(default_factory=list)
    recommended_action: str = ""
    expected_mechanism: str = ""
    impact_estimate: Optional[ImpactEstimate] = None
    confidence_level: ConfidenceLevel = "HIGH"
    effort_required: EffortLevel = "MEDIUM"
    risk: RiskLevel = "LOW"
    priority_score: int = Field(default=85, ge=1, le=100)
    approval_required: bool = True
    action_type: str = "CUSTOM"  # e.g. "SWAP_CREATIVE", "SCALE_BUDGET", "EXPAND_RETARGETING", etc.
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    status: FeedbackStatus = "PENDING"
    is_insufficient_data: bool = False
    data_warning: Optional[str] = None
    evidence_links: List[EvidenceLink] = Field(default_factory=list)
    approval_request_id: Optional[str] = None
    created_at: str

    # Backward compatibility fields
    diagnosis: Optional[str] = None
    action_description: Optional[str] = None
    projected_roas_lift: float = 0.0
    projected_weekly_savings_usd: float = 0.0
    confidence_score_pct: int = 85

    @model_validator(mode="before")
    @classmethod
    def pre_validate_legacy_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Problem / diagnosis mapping
            if not data.get("problem_identified") and data.get("diagnosis"):
                data["problem_identified"] = data["diagnosis"]
            elif not data.get("diagnosis") and data.get("problem_identified"):
                data["diagnosis"] = data["problem_identified"]

            # Action / action_description mapping
            if not data.get("recommended_action") and data.get("action_description"):
                data["recommended_action"] = data["action_description"]
            elif not data.get("action_description") and data.get("recommended_action"):
                data["action_description"] = data["recommended_action"]

            # Expected mechanism fallback
            if not data.get("expected_mechanism"):
                data["expected_mechanism"] = (
                    "Algorithmic auction pricing penalizes declining engagement; refreshing creative or budget balance restores auction liquidity and relevance scores."
                )

            # Impact estimate fallback
            if not data.get("impact_estimate"):
                roas_lift = data.get("projected_roas_lift", 0.35)
                savings = data.get("projected_weekly_savings_usd", 0.0)
                data["impact_estimate"] = {
                    "metric_name": "ROAS Lift & CPA Efficiency",
                    "estimated_change_range": f"+{roas_lift:.2f}x ROAS" if roas_lift > 0 else f"${savings:,.0f} weekly savings",
                    "uncertainty_rating": "MEDIUM",
                    "rationale": "Directional estimate based on empirical historical pacing; returns are not guaranteed."
                }

            # Priority score fallback
            if "priority_score" not in data or data.get("priority_score") is None:
                data["priority_score"] = data.get("confidence_score_pct", 88)

            # Supporting evidence fallback
            if not data.get("supporting_evidence") and data.get("problem_identified"):
                data["supporting_evidence"] = [data["problem_identified"]]
        return data

    @model_validator(mode="after")
    def populate_backwards_compatible_fields(self):
        if not self.diagnosis:
            self.diagnosis = self.problem_identified
        if not self.action_description:
            self.action_description = self.recommended_action
        if self.projected_roas_lift == 0.0:
            self.projected_roas_lift = round(0.15 + (self.priority_score / 250.0), 2)
        if self.confidence_score_pct == 85:
            if self.confidence_level == "HIGH":
                self.confidence_score_pct = max(88, min(96, self.priority_score))
            elif self.confidence_level == "MEDIUM":
                self.confidence_score_pct = 76
            else:
                self.confidence_score_pct = 58
        return self


class RecommendationWorkflowStepLog(BaseModel):
    step_number: int
    step_name: str
    summary: str
    items_count: int
    timestamp: str


class RecommendationListResponse(BaseModel):
    client_id: str
    recommendations: List[AIRecommendation]
    workflow_execution_logs: List[RecommendationWorkflowStepLog] = Field(default_factory=list)
    total_potential_roas_gain: float
    total_potential_savings: float
    is_demo: bool = True
    disclaimer: str = "Generated by MetaPilot AI Decision Engine via LangGraph Workflow"


class ApplyRecommendationRequest(BaseModel):
    recommendation_id: str
    client_id: str
    confirm_action: bool = True


class RecommendationFeedbackRequest(BaseModel):
    recommendation_id: str
    client_id: str
    status: Literal["ACCEPTED", "REJECTED", "SNOOZED", "IMPLEMENTED"]
    notes: Optional[str] = None


class ConvertToApprovalRequest(BaseModel):
    recommendation_id: str
    client_id: str
    target_campaign_id: Optional[str] = None
    notes: Optional[str] = None
