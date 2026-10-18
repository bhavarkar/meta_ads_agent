"""Automation, Scheduled Background Jobs, Reporting, and Approval Guardrail Schemas."""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.recommendation import AIRecommendation


JobType = Literal[
    "DAILY_METRIC_SYNC",
    "PERFORMANCE_ANOMALY_DETECTION",
    "WEEKLY_PERFORMANCE_REPORT",
    "APPROVAL_EXPIRATION_SWEEP",
    "CREATIVE_NOTIFICATION_DISPATCH"
]

JobStatus = Literal[
    "PENDING",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "RETRYING"
]

NotificationType = Literal[
    "REEL_APPROVAL_REQUIRED",
    "CAMPAIGN_APPROVAL_PENDING",
    "PUBLICATION_SUCCESS",
    "PUBLICATION_FAILED",
    "ANOMALY_DETECTED",
    "WEEKLY_REPORT_READY"
]

NotificationSeverity = Literal["INFO", "WARNING", "SUCCESS", "CRITICAL"]
AnomalySeverity = Literal["HIGH", "MEDIUM", "LOW", "INFO"]
ReportType = Literal["WEEKLY_SUMMARY", "MONTHLY_EXECUTIVE", "DAILY_DIGEST"]
ReportStatus = Literal["GENERATED", "ARCHIVED", "DELIVERED"]


class BackgroundJob(BaseModel):
    job_id: str
    job_type: JobType
    title: str
    cadence: str
    status: JobStatus = "PENDING"
    retry_count: int = 0
    max_retries: int = 3
    idempotency_key: str
    client_id: Optional[str] = None
    tenant_id: str = "tenant_apex_growth"
    last_run_at: Optional[str] = None
    next_run_at: Optional[str] = None
    execution_duration_ms: Optional[int] = None
    result_summary: Optional[str] = None
    error_details: Optional[str] = None


class RunJobRequest(BaseModel):
    job_type: JobType
    client_id: Optional[str] = "cli_lumina_glow"
    idempotency_key: Optional[str] = None
    force_run: bool = False


class PerformanceAnomaly(BaseModel):
    anomaly_id: str
    client_id: str
    entity_type: Literal["ACCOUNT", "CAMPAIGN", "AD_SET", "AD"]
    entity_id: str
    entity_name: str
    metric_name: str  # e.g. "CTR", "CPA", "ROAS", "FREQUENCY"
    severity: AnomalySeverity
    baseline_value: float
    current_value: float
    change_pct: float
    supporting_data: Dict[str, Any] = Field(default_factory=dict)
    detected_at: str
    is_acknowledged: bool = False


class SystemNotification(BaseModel):
    notification_id: str
    tenant_id: str = "tenant_apex_growth"
    client_id: str
    type: NotificationType
    title: str
    message: str
    severity: NotificationSeverity = "INFO"
    is_read: bool = False
    action_url: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: str


class PerformanceReport(BaseModel):
    report_id: str
    client_id: str
    client_name: str
    report_title: str
    report_type: ReportType = "WEEKLY_SUMMARY"
    period_start: str
    period_end: str
    generated_at: str
    kpis_summary: Dict[str, Any]
    top_performing_creatives: List[Dict[str, Any]] = Field(default_factory=list)
    anomalies_detected: List[PerformanceAnomaly] = Field(default_factory=list)
    prioritized_recommendations: List[AIRecommendation] = Field(default_factory=list)
    status: ReportStatus = "GENERATED"
    csv_download_url: Optional[str] = None
    pdf_export_url: Optional[str] = None


class GenerateReportRequest(BaseModel):
    client_id: str
    report_type: ReportType = "WEEKLY_SUMMARY"
    date_preset: Optional[str] = "last_7d"


class ActionValidationRequest(BaseModel):
    action_type: str  # e.g. "ACTIVATE_CAMPAIGN", "SCALE_BUDGET", "PUBLISH_REEL", "RESEARCH_ANALYSIS"
    client_id: str
    requested_daily_budget: Optional[float] = None
    approval_record_id: Optional[str] = None


class ActionValidationResponse(BaseModel):
    is_permitted: bool
    requires_human_approval: bool
    reason: str
    budget_limit_exceeded: bool = False
    approval_expired: bool = False
    max_allowable_daily_budget_usd: Optional[float] = None
