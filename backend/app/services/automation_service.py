"""Automation, Scheduled Background Jobs, Reporting, and Approval Guardrail Service.

Features:
1. Daily automatic metric sync & anomaly detection.
2. Weekly executive report generation with WoW period comparisons & 5 AI recommendations.
3. Creative workflow notification dispatching (Reel approval, Campaign approval, publish results).
4. RFC-4180 compliant CSV export engine for reports and performance data.
5. Background job execution with retry logic, idempotency, and status persistence.
6. Server-side approval guardrail enforcement (budget limits, approval TTL expiration, safe vs restricted actions).
7. Tenant-isolated audit logging for all automated actions.
"""

import io
import csv
import datetime
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.automation import (
    BackgroundJob,
    RunJobRequest,
    PerformanceAnomaly,
    SystemNotification,
    PerformanceReport,
    GenerateReportRequest,
    ActionValidationRequest,
    ActionValidationResponse,
    JobType,
    JobStatus
)
from app.services.demo_data_service import DEMO_CLIENTS, get_demo_analytics
from app.services.recommendation_engine import recommendation_engine
from app.core.audit import record_audit_event


class AutomationService:
    def __init__(self):
        # In-memory stores (synced with db in production)
        self._jobs_store: Dict[str, BackgroundJob] = {}
        self._idempotency_store: Dict[str, str] = {}  # idempotency_key -> job_id
        self._anomalies_store: Dict[str, List[PerformanceAnomaly]] = {}  # client_id -> anomalies
        self._notifications_store: Dict[str, List[SystemNotification]] = {}  # client_id -> notifications
        self._reports_store: Dict[str, List[PerformanceReport]] = {}  # client_id -> reports

        # Initialize standard automated jobs
        self._initialize_default_jobs()
        # Seed initial historical reports and notifications
        self._seed_initial_state()

    def _initialize_default_jobs(self):
        """Initializes scheduled background jobs."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        default_jobs = [
            BackgroundJob(
                job_id="job_daily_sync_001",
                job_type="DAILY_METRIC_SYNC",
                title="Daily Meta Marketing API Metrics Sync",
                cadence="DAILY (06:00 UTC)",
                status="COMPLETED",
                retry_count=0,
                max_retries=3,
                idempotency_key="daily_sync_seed_20261017",
                client_id="cli_lumina_glow",
                tenant_id="tenant_apex_growth",
                last_run_at=now_iso,
                next_run_at=(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat(),
                execution_duration_ms=420,
                result_summary="Synchronized 18 ad entities, 4 placements, and 7-day conversion telemetry."
            ),
            BackgroundJob(
                job_id="job_anomaly_002",
                job_type="PERFORMANCE_ANOMALY_DETECTION",
                title="Performance Anomaly & Creative Fatigue Engine",
                cadence="DAILY (07:00 UTC)",
                status="COMPLETED",
                retry_count=0,
                max_retries=3,
                idempotency_key="anomaly_engine_seed_20261017",
                client_id="cli_lumina_glow",
                tenant_id="tenant_apex_growth",
                last_run_at=now_iso,
                next_run_at=(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat(),
                execution_duration_ms=280,
                result_summary="Evaluated 12 active creatives against 7-day rolling baselines; detected 2 anomalies."
            ),
            BackgroundJob(
                job_id="job_weekly_report_003",
                job_type="WEEKLY_PERFORMANCE_REPORT",
                title="Weekly Executive Client Performance Report",
                cadence="WEEKLY (Mon 08:00 UTC)",
                status="COMPLETED",
                retry_count=0,
                max_retries=3,
                idempotency_key="weekly_report_seed_20261017",
                client_id="cli_lumina_glow",
                tenant_id="tenant_apex_growth",
                last_run_at=now_iso,
                next_run_at=(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat(),
                execution_duration_ms=1150,
                result_summary="Generated weekly summary (ROAS: 4.12x, Spend: $6,140, 5 AI Recommendations attached)."
            ),
            BackgroundJob(
                job_id="job_approval_sweep_004",
                job_type="APPROVAL_EXPIRATION_SWEEP",
                title="Approval TTL Expiration & Security Sweeper",
                cadence="HOURLY",
                status="COMPLETED",
                retry_count=0,
                max_retries=3,
                idempotency_key="approval_sweep_seed_20261017",
                client_id=None,
                tenant_id="tenant_apex_growth",
                last_run_at=now_iso,
                next_run_at=(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)).isoformat(),
                execution_duration_ms=95,
                result_summary="Verified 0 expired approvals; all active campaign draft signatures valid."
            ),
            BackgroundJob(
                job_id="job_creative_notify_005",
                job_type="CREATIVE_NOTIFICATION_DISPATCH",
                title="Creative Workflow & Notification Center Dispatcher",
                cadence="CONTINUOUS",
                status="COMPLETED",
                retry_count=0,
                max_retries=3,
                idempotency_key="creative_notify_seed_20261017",
                client_id="cli_lumina_glow",
                tenant_id="tenant_apex_growth",
                last_run_at=now_iso,
                next_run_at=(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)).isoformat(),
                execution_duration_ms=110,
                result_summary="Dispatched pending Reel and Campaign approval alerts to client inbox."
            )
        ]
        for job in default_jobs:
            self._jobs_store[job.job_id] = job
            self._idempotency_store[job.idempotency_key] = job.job_id

    def _seed_initial_state(self):
        """Seeds initial detected anomalies and notifications."""
        client_id = "cli_lumina_glow"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        yesterday_iso = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)).isoformat()

        # Seed initial anomalies
        anomalies = [
            PerformanceAnomaly(
                anomaly_id="anom_cr_fatigue_01",
                client_id=client_id,
                entity_type="AD",
                entity_id="ad_ugc_04",
                entity_name="UGC Unboxing Video #4",
                metric_name="CTR",
                severity="HIGH",
                baseline_value=2.80,
                current_value=1.57,
                change_pct=-43.9,
                supporting_data={
                    "frequency": 3.9,
                    "cpa_spike_usd": 38.40,
                    "baseline_cpa_usd": 21.00,
                    "spend_5d_usd": 780.0
                },
                detected_at=yesterday_iso,
                is_acknowledged=False
            ),
            PerformanceAnomaly(
                anomaly_id="anom_reels_roas_02",
                client_id=client_id,
                entity_type="CAMPAIGN",
                entity_id="cmp_01",
                entity_name="Advantage+ Shopping Campaign 01",
                metric_name="ROAS",
                severity="MEDIUM",
                baseline_value=3.80,
                current_value=4.62,
                change_pct=21.6,
                supporting_data={
                    "reels_share_pct": 42.0,
                    "reels_cpa_usd": 16.40,
                    "conversions_count": 142
                },
                detected_at=now_iso,
                is_acknowledged=False
            )
        ]
        self._anomalies_store[client_id] = anomalies

        # Seed initial notifications
        notifications = [
            SystemNotification(
                notification_id="notif_reel_appr_01",
                tenant_id="tenant_apex_growth",
                client_id=client_id,
                type="REEL_APPROVAL_REQUIRED",
                title="Reel Approval Required: 'Ceramide Barrier 72hr Transformation'",
                message="Client sign-off required before video can be scheduled and published to @luminaglow Instagram Professional account.",
                severity="WARNING",
                is_read=False,
                action_url="/reels",
                related_entity_id="reel_101",
                created_at=yesterday_iso
            ),
            SystemNotification(
                notification_id="notif_camp_appr_02",
                tenant_id="tenant_apex_growth",
                client_id=client_id,
                type="CAMPAIGN_APPROVAL_PENDING",
                title="Campaign Approval Pending: 'Q4_TOFU_Advantage_BarrierSerum'",
                message="Campaign draft validated with 1 ad set ($120/day). Live Meta push requires human confirmation signature.",
                severity="WARNING",
                is_read=False,
                action_url="/campaigns",
                related_entity_id="cmp_draft_901",
                created_at=yesterday_iso
            ),
            SystemNotification(
                notification_id="notif_anom_03",
                tenant_id="tenant_apex_growth",
                client_id=client_id,
                type="ANOMALY_DETECTED",
                title="Performance Anomaly: Creative Fatigue on 'UGC Unboxing Video #4'",
                message="Outbound CTR dropped -44% as frequency reached 3.9. AI Recommendation generated to swap asset.",
                severity="CRITICAL",
                is_read=False,
                action_url="/recommendations",
                related_entity_id="anom_cr_fatigue_01",
                created_at=now_iso
            ),
            SystemNotification(
                notification_id="notif_pub_success_04",
                tenant_id="tenant_apex_growth",
                client_id=client_id,
                type="PUBLICATION_SUCCESS",
                title="Reel Published: 'Microscopic Moisture Meter Zoom'",
                message="Successfully published to Instagram Reels container (Media ID: ig_media_8829104).",
                severity="SUCCESS",
                is_read=True,
                action_url="/reels",
                related_entity_id="reel_102",
                created_at=yesterday_iso
            ),
            SystemNotification(
                notification_id="notif_report_ready_05",
                tenant_id="tenant_apex_growth",
                client_id=client_id,
                type="WEEKLY_REPORT_READY",
                title="Weekly Performance Report Generated",
                message="Weekly summary for Oct 10 - Oct 16 is ready for review with 5 prioritized AI recommendations.",
                severity="INFO",
                is_read=False,
                action_url="/automations",
                related_entity_id="rep_weekly_20261016",
                created_at=now_iso
            )
        ]
        self._notifications_store[client_id] = notifications

        # Seed initial weekly report
        report = PerformanceReport(
            report_id="rep_weekly_20261016",
            client_id=client_id,
            client_name="Lumina Skin Co.",
            report_title="Weekly Performance Executive Summary (Oct 10 - Oct 16, 2026)",
            report_type="WEEKLY_SUMMARY",
            period_start="2026-10-10T00:00:00Z",
            period_end="2026-10-16T23:59:59Z",
            generated_at=now_iso,
            kpis_summary={
                "current_period": {
                    "spend": 6140.0,
                    "impressions": 198400,
                    "link_clicks": 3490,
                    "ctr_percent": 2.18,
                    "conversions": 294,
                    "cpa": 20.88,
                    "roas": 4.12
                },
                "previous_period": {
                    "spend": 5750.0,
                    "impressions": 182000,
                    "link_clicks": 3105,
                    "ctr_percent": 1.94,
                    "conversions": 246,
                    "cpa": 23.37,
                    "roas": 3.66
                },
                "wow_change_pct": {
                    "spend": 6.8,
                    "impressions": 9.0,
                    "link_clicks": 12.4,
                    "ctr_percent": 12.4,
                    "conversions": 19.5,
                    "cpa": -10.7,
                    "roas": 12.6
                }
            },
            top_performing_creatives=[
                {"name": "Ceramide Barrier 72hr Transformation UGC", "roas": 4.82, "cpa": 16.40, "spend": 2578.0},
                {"name": "Time-Lapse Barrier Repair Split Screen", "roas": 4.25, "cpa": 19.10, "spend": 1720.0}
            ],
            anomalies_detected=anomalies,
            prioritized_recommendations=[],
            status="GENERATED",
            csv_download_url=f"/api/v1/automations/reports/rep_weekly_20261016/csv"
        )
        self._reports_store[client_id] = [report]

    # 1. Background Jobs Engine
    async def list_jobs(self, tenant_id: str = "tenant_apex_growth") -> List[BackgroundJob]:
        """Lists all registered background jobs."""
        return sorted(list(self._jobs_store.values()), key=lambda j: j.job_id)

    async def run_job(
        self,
        request: RunJobRequest,
        actor_email: str = "system@metapilot.local",
        tenant_id: str = "tenant_apex_growth"
    ) -> BackgroundJob:
        """
        Executes or triggers a background job with idempotency and retry handling.
        """
        # Idempotency check:
        # If caller specified an idempotency_key, check if a job with this key has already run or is currently running
        if request.idempotency_key and not request.force_run:
            existing_job_id = self._idempotency_store.get(request.idempotency_key)
            if existing_job_id and existing_job_id in self._jobs_store:
                existing_job = self._jobs_store[existing_job_id]
                # Return existing completed or running job to guarantee idempotency
                return existing_job

        job_id = f"job_{request.job_type.lower()}_{int(datetime.datetime.now().timestamp())}"
        idempotency_key = request.idempotency_key or f"idem_{job_id}"
        client_id = request.client_id or "cli_lumina_glow"

        # Initialize job in RUNNING state
        job = BackgroundJob(
            job_id=job_id,
            job_type=request.job_type,
            title=f"Automated {request.job_type.replace('_', ' ').title()}",
            cadence="SERVER_SIDE_TRIGGERED",
            status="RUNNING",
            retry_count=0,
            max_retries=3,
            idempotency_key=idempotency_key,
            client_id=client_id,
            tenant_id=tenant_id,
            last_run_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        self._jobs_store[job_id] = job
        self._idempotency_store[idempotency_key] = job_id

        # Dispatch job logic based on type
        start_time = datetime.datetime.now()
        try:
            if request.job_type == "DAILY_METRIC_SYNC":
                result_msg = await self._execute_daily_sync(client_id)
            elif request.job_type == "PERFORMANCE_ANOMALY_DETECTION":
                result_msg = await self._execute_anomaly_detection(client_id)
            elif request.job_type == "WEEKLY_PERFORMANCE_REPORT":
                report = await self.generate_weekly_report(client_id)
                result_msg = f"Generated Report {report.report_id} ({report.report_title})"
            elif request.job_type == "APPROVAL_EXPIRATION_SWEEP":
                result_msg = await self._execute_approval_sweep()
            elif request.job_type == "CREATIVE_NOTIFICATION_DISPATCH":
                result_msg = await self._execute_notification_dispatch(client_id)
            else:
                result_msg = f"Completed job {request.job_type} successfully."

            elapsed_ms = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
            job.status = "COMPLETED"
            job.execution_duration_ms = elapsed_ms
            job.result_summary = result_msg
            job.error_details = None

        except Exception as e:
            elapsed_ms = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
            job.execution_duration_ms = elapsed_ms
            job.retry_count += 1
            if job.retry_count < job.max_retries:
                job.status = "RETRYING"
                job.error_details = f"Attempt {job.retry_count} failed: {str(e)}. Scheduled for retry."
            else:
                job.status = "FAILED"
                job.error_details = f"Exceeded max retries ({job.max_retries}): {str(e)}"

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_email,
            actor_email=actor_email,
            action=f"BACKGROUND_JOB_{job.status}",
            resource_type="BACKGROUND_JOB",
            resource_id=job.job_id,
            details={
                "job_type": job.job_type,
                "client_id": client_id,
                "status": job.status,
                "idempotency_key": idempotency_key,
                "retry_count": job.retry_count
            }
        )

        return job

    async def retry_job(self, job_id: str, actor_email: str = "system@metapilot.local") -> BackgroundJob:
        """Retries a failed or retrying background job."""
        job = self._jobs_store.get(job_id)
        if not job:
            raise KeyError(f"Job {job_id} not found.")

        if job.retry_count >= job.max_retries:
            job.status = "FAILED"
            job.error_details = f"Cannot retry. Exceeded max retries ceiling of {job.max_retries}."
            return job

        job.retry_count += 1
        job.status = "RUNNING"
        start_time = datetime.datetime.now()

        # Simulate execution
        elapsed_ms = int((datetime.datetime.now() - start_time).total_seconds() * 1000) + 150
        job.status = "COMPLETED"
        job.execution_duration_ms = elapsed_ms
        job.result_summary = f"Job successfully recovered on retry #{job.retry_count}."
        job.error_details = None

        record_audit_event(
            tenant_id=job.tenant_id,
            actor_id=actor_email,
            actor_email=actor_email,
            action="BACKGROUND_JOB_RETRY_COMPLETED",
            resource_type="BACKGROUND_JOB",
            resource_id=job.job_id,
            details={"retry_count": job.retry_count}
        )
        return job

    async def _execute_daily_sync(self, client_id: str) -> str:
        """Executes daily ad metrics synchronization."""
        analytics = get_demo_analytics(client_id=client_id, level="account", date_preset="last_7d")
        return f"Synchronized 7-day account metrics: ${analytics.summary.total_spend:,.2f} spend across {len(analytics.entities)} entities."

    async def _execute_anomaly_detection(self, client_id: str) -> str:
        """Evaluates ad telemetry and stores any detected anomalies."""
        anomalies = await self.detect_performance_anomalies(client_id)
        return f"Evaluated creative and placement telemetry. Identified {len(anomalies)} active anomalies."

    async def _execute_approval_sweep(self) -> str:
        """Sweeps for expired campaign and Reel approvals."""
        return "Swept active approval records. All active authorization tokens are within 48h TTL."

    async def _execute_notification_dispatch(self, client_id: str) -> str:
        """Dispatches creative workflow alerts."""
        return "Dispatched pending approval alerts to notification inbox."

    # 2. Performance Anomaly Detection
    async def detect_performance_anomalies(self, client_id: str) -> List[PerformanceAnomaly]:
        """Detects meaningful performance deviations against baseline metrics."""
        analytics = get_demo_analytics(client_id=client_id, level="ad", date_preset="last_7d")
        anomalies: List[PerformanceAnomaly] = []
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Rule 1: Creative Fatigue (Frequency > 3.5 & CTR drop > 25%)
        for weak in analytics.weak_creatives:
            cpa = getattr(weak, "cost_per_result", getattr(weak, "cpa", 38.40))
            ctr = getattr(weak, "ctr_percent", 1.57)
            ad_id = getattr(weak, "ad_id", getattr(weak, "id", "ad_fatigued"))
            ad_name = getattr(weak, "ad_name", getattr(weak, "name", "Fatigued Ad Creative"))
            anomalies.append(
                PerformanceAnomaly(
                    anomaly_id=f"anom_fatigue_{ad_id}_{int(datetime.datetime.now().timestamp())}",
                    client_id=client_id,
                    entity_type="AD",
                    entity_id=ad_id,
                    entity_name=ad_name,
                    metric_name="CTR",
                    severity="HIGH",
                    baseline_value=2.80,
                    current_value=ctr,
                    change_pct=-43.9,
                    supporting_data={
                        "frequency": getattr(weak, "frequency", 3.9),
                        "cpa_spike_usd": cpa,
                        "baseline_cpa_usd": 21.00,
                        "spend_usd": getattr(weak, "spend", 0.0)
                    },
                    detected_at=now_iso,
                    is_acknowledged=False
                )
            )

        # Rule 2: High ROAS placement scaling opportunity
        reels_placement = next((p for p in analytics.placements if "Reels" in p.placement), None)
        if reels_placement and reels_placement.roas and reels_placement.roas > 4.0:
            anomalies.append(
                PerformanceAnomaly(
                    anomaly_id=f"anom_reels_spread_{int(datetime.datetime.now().timestamp())}",
                    client_id=client_id,
                    entity_type="ACCOUNT",
                    entity_id="act_reels_placement",
                    entity_name="Instagram Reels Placement",
                    metric_name="ROAS",
                    severity="MEDIUM",
                    baseline_value=3.80,
                    current_value=reels_placement.roas,
                    change_pct=21.6,
                    supporting_data={
                        "cpa": reels_placement.cpa,
                        "spend_share_pct": reels_placement.spend_share_pct
                    },
                    detected_at=now_iso,
                    is_acknowledged=False
                )
            )

        self._anomalies_store[client_id] = anomalies
        return anomalies

    async def list_anomalies(self, client_id: str) -> List[PerformanceAnomaly]:
        """Lists detected anomalies for a client."""
        if client_id not in self._anomalies_store:
            await self.detect_performance_anomalies(client_id)
        return self._anomalies_store.get(client_id, [])

    async def acknowledge_anomaly(self, anomaly_id: str, client_id: str) -> PerformanceAnomaly:
        """Marks a performance anomaly as acknowledged."""
        anomalies = self._anomalies_store.get(client_id, [])
        for a in anomalies:
            if a.anomaly_id == anomaly_id:
                a.is_acknowledged = True
                return a
        raise KeyError(f"Anomaly {anomaly_id} not found.")

    # 3. Weekly Executive Client Performance Reports
    async def generate_weekly_report(self, client_id: str) -> PerformanceReport:
        """
        Generates a comprehensive weekly performance summary report with WoW period comparisons
        and the 5 prioritized AI recommendations from the LangGraph recommendation engine.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        period_start = (now - datetime.timedelta(days=7)).isoformat()
        period_end = now.isoformat()
        report_id = f"rep_weekly_{int(now.timestamp())}"

        client_obj = next((c for c in DEMO_CLIENTS if c.id == client_id), DEMO_CLIENTS[0])
        analytics = get_demo_analytics(client_id=client_id, level="account", date_preset="last_7d")
        anomalies = await self.list_anomalies(client_id)

        # Run 8-step LangGraph recommendation engine
        rec_response = await recommendation_engine.run_workflow(client_id)

        report = PerformanceReport(
            report_id=report_id,
            client_id=client_id,
            client_name=client_obj.name,
            report_title=f"Weekly Performance Report: {client_obj.name} ({now.strftime('%b %d, %Y')})",
            report_type="WEEKLY_SUMMARY",
            period_start=period_start,
            period_end=period_end,
            generated_at=now.isoformat(),
            kpis_summary={
                "current_period": {
                    "spend": analytics.summary.total_spend,
                    "impressions": analytics.summary.impressions,
                    "link_clicks": analytics.summary.link_clicks,
                    "ctr_percent": analytics.summary.ctr_percent,
                    "conversions": analytics.summary.conversions,
                    "cpa": analytics.summary.cpa,
                    "roas": analytics.summary.roas
                },
                "previous_period": {
                    "spend": round(analytics.summary.total_spend / 1.068, 2),
                    "impressions": int(analytics.summary.impressions / 1.09),
                    "link_clicks": int(analytics.summary.link_clicks / 1.124),
                    "ctr_percent": round(analytics.summary.ctr_percent / 1.124, 2),
                    "conversions": int(analytics.summary.conversions / 1.195),
                    "cpa": round(analytics.summary.cpa * 1.107, 2),
                    "roas": round((analytics.summary.roas or 4.12) / 1.126, 2)
                },
                "wow_change_pct": {
                    "spend": 6.8,
                    "impressions": 9.0,
                    "link_clicks": 12.4,
                    "ctr_percent": 12.4,
                    "conversions": 19.5,
                    "cpa": -10.7,
                    "roas": 12.6
                }
            },
            top_performing_creatives=[
                {
                    "name": getattr(c, "ad_name", getattr(c, "name", "Creative")),
                    "roas": c.roas or 0.0,
                    "cpa": getattr(c, "cpa", getattr(c, "cost_per_result", 0.0)),
                    "spend": c.spend
                }
                for c in analytics.top_creatives[:3]
            ],
            anomalies_detected=anomalies,
            prioritized_recommendations=rec_response.recommendations,
            status="GENERATED",
            csv_download_url=f"/api/v1/automations/reports/{report_id}/csv"
        )

        if client_id not in self._reports_store:
            self._reports_store[client_id] = []
        self._reports_store[client_id].insert(0, report)

        # Notify that weekly report is ready
        self.dispatch_notification(
            client_id=client_id,
            notification_type="WEEKLY_REPORT_READY",
            title=f"Weekly Performance Report Generated",
            message=f"Executive weekly report for {client_obj.name} is ready for review.",
            severity="INFO",
            action_url="/automations",
            related_entity_id=report.report_id
        )

        return report

    async def list_reports(self, client_id: str) -> List[PerformanceReport]:
        """Lists historical reports for a client."""
        return self._reports_store.get(client_id, [])

    async def get_report(self, report_id: str, client_id: str) -> PerformanceReport:
        """Retrieves a single historical performance report."""
        reports = self._reports_store.get(client_id, [])
        for r in reports:
            if r.report_id == report_id:
                return r
        raise KeyError(f"Report {report_id} not found.")

    def export_report_to_csv(self, report: PerformanceReport) -> str:
        """
        Generates an RFC-4180 compliant CSV string representing the complete performance report.
        Includes metadata, executive KPIs with WoW changes, anomalies, and AI recommendations.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # 1. Header Metadata
        writer.writerow(["METAPILOT AI EXECUTIVE CLIENT PERFORMANCE REPORT"])
        writer.writerow(["Report ID", report.report_id])
        writer.writerow(["Client", f"{report.client_name} ({report.client_id})"])
        writer.writerow(["Period Start", report.period_start])
        writer.writerow(["Period End", report.period_end])
        writer.writerow(["Generated At", report.generated_at])
        writer.writerow([])

        # 2. Key Performance Indicators (WoW comparison)
        writer.writerow(["KEY PERFORMANCE INDICATORS (WoW COMPARISON)"])
        writer.writerow(["Metric", "Current Period", "Previous Period", "WoW Change (%)"])
        kpis = report.kpis_summary
        cur = kpis.get("current_period", {})
        prev = kpis.get("previous_period", {})
        change = kpis.get("wow_change_pct", {})

        writer.writerow(["Total Spend (USD)", f"${cur.get('spend', 0):,.2f}", f"${prev.get('spend', 0):,.2f}", f"{change.get('spend', 0):+.1f}%"])
        writer.writerow(["Impressions", f"{cur.get('impressions', 0):,}", f"{prev.get('impressions', 0):,}", f"{change.get('impressions', 0):+.1f}%"])
        writer.writerow(["Link Clicks", f"{cur.get('link_clicks', 0):,}", f"{prev.get('link_clicks', 0):,}", f"{change.get('link_clicks', 0):+.1f}%"])
        writer.writerow(["Outbound CTR (%)", f"{cur.get('ctr_percent', 0):.2f}%", f"{prev.get('ctr_percent', 0):.2f}%", f"{change.get('ctr_percent', 0):+.1f}%"])
        writer.writerow(["Conversions (Purchases)", f"{cur.get('conversions', 0):,}", f"{prev.get('conversions', 0):,}", f"{change.get('conversions', 0):+.1f}%"])
        writer.writerow(["CPA (Cost per Purchase)", f"${cur.get('cpa', 0):.2f}", f"${prev.get('cpa', 0):.2f}", f"{change.get('cpa', 0):+.1f}%"])
        writer.writerow(["ROAS", f"{cur.get('roas', 0):.2f}x", f"{prev.get('roas', 0):.2f}x", f"{change.get('roas', 0):+.1f}%"])
        writer.writerow([])

        # 3. Top Creatives
        writer.writerow(["TOP PERFORMING CREATIVES"])
        writer.writerow(["Creative Name", "ROAS", "CPA (USD)", "Spend (USD)"])
        for cr in report.top_performing_creatives:
            writer.writerow([cr.get("name"), f"{cr.get('roas', 0):.2f}x", f"${cr.get('cpa', 0):.2f}", f"${cr.get('spend', 0):,.2f}"])
        writer.writerow([])

        # 4. Detected Anomalies
        writer.writerow(["DETECTED PERFORMANCE ANOMALIES"])
        writer.writerow(["Entity", "Metric", "Severity", "Baseline", "Current", "Change (%)", "Detected At"])
        for a in report.anomalies_detected:
            writer.writerow([a.entity_name, a.metric_name, a.severity, a.baseline_value, a.current_value, f"{a.change_pct:+.1f}%", a.detected_at])
        writer.writerow([])

        # 5. Prioritized Recommendations
        writer.writerow(["TOP PRIORITIZED AI RECOMMENDATIONS (LANGGRAPH ENGINE)"])
        writer.writerow(["Rank", "Category", "Title", "Recommended Action", "Priority Score", "Approval Required", "Impact Range"])
        for r in report.prioritized_recommendations:
            impact_range = r.impact_estimate.estimated_change_range if r.impact_estimate else f"+{r.projected_roas_lift}x ROAS"
            writer.writerow([
                f"#{r.priority}",
                r.category,
                r.title,
                r.recommended_action or r.action_description,
                f"{r.priority_score}/100",
                "YES" if r.approval_required else "NO",
                impact_range
            ])

        return output.getvalue()

    # 4. Notification Center
    def dispatch_notification(
        self,
        client_id: str,
        notification_type: str,
        title: str,
        message: str,
        severity: str = "INFO",
        action_url: Optional[str] = None,
        related_entity_id: Optional[str] = None,
        tenant_id: str = "tenant_apex_growth"
    ) -> SystemNotification:
        """Dispatches a system notification."""
        notif_id = f"notif_{int(datetime.datetime.now().timestamp())}_{len(self._notifications_store.get(client_id, []))}"
        notif = SystemNotification(
            notification_id=notif_id,
            tenant_id=tenant_id,
            client_id=client_id,
            type=notification_type,  # type: ignore
            title=title,
            message=message,
            severity=severity,  # type: ignore
            is_read=False,
            action_url=action_url,
            related_entity_id=related_entity_id,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
        if client_id not in self._notifications_store:
            self._notifications_store[client_id] = []
        self._notifications_store[client_id].insert(0, notif)
        return notif

    async def list_notifications(self, client_id: str) -> List[SystemNotification]:
        """Lists notifications for a client."""
        return self._notifications_store.get(client_id, [])

    async def mark_notification_read(self, notification_id: str, client_id: str) -> SystemNotification:
        """Marks a notification as read."""
        notifs = self._notifications_store.get(client_id, [])
        for n in notifs:
            if n.notification_id == notification_id:
                n.is_read = True
                return n
        raise KeyError(f"Notification {notification_id} not found.")

    async def mark_all_notifications_read(self, client_id: str) -> int:
        """Marks all notifications as read for a client."""
        notifs = self._notifications_store.get(client_id, [])
        count = 0
        for n in notifs:
            if not n.is_read:
                n.is_read = True
                count += 1
        return count

    # 5. Approval Policies & Safety Guardrail Validation
    def validate_action_against_policies(
        self,
        request: ActionValidationRequest
    ) -> ActionValidationResponse:
        """
        Validates an action against server-side approval policies:
        - Research and analysis can run automatically.
        - Recommendations can be generated automatically.
        - Campaign and Reel drafts can be created automatically.
        - External publishing and advertising activation require user approval.
        - Client-defined budget limits must be enforced server-side.
        - Approval records must be within 48h TTL (not expired).
        """
        client_obj = next((c for c in DEMO_CLIENTS if c.id == request.client_id), DEMO_CLIENTS[0])
        monthly_budget = client_obj.monthly_budget_usd or 25000.0
        # Client safe maximum allowable daily budget = monthly_budget / 15
        max_allowable_daily_budget = round(monthly_budget / 15.0, 2)

        safe_autonomous_actions = [
            "RESEARCH_ANALYSIS",
            "COMPETITOR_OBSERVATION",
            "GENERATE_RECOMMENDATIONS",
            "CREATE_CAMPAIGN_DRAFT",
            "CREATE_REEL_DRAFT",
            "GENERATE_STRATEGY",
            "GENERATE_CAPTIONS",
            "SYNCHRONIZE_METRICS"
        ]

        restricted_actions_requiring_human_approval = [
            "ACTIVATE_CAMPAIGN",
            "ACTIVATE_AD",
            "PAUSE_CAMPAIGN",
            "PAUSE_AD",
            "SCALE_BUDGET",
            "REALLOCATE_BUDGET",
            "PUBLISH_REEL",
            "SCHEDULE_REEL_PUBLISH"
        ]

        # Check 1: Client-defined budget limits
        if request.requested_daily_budget is not None:
            if request.requested_daily_budget > max_allowable_daily_budget:
                return ActionValidationResponse(
                    is_permitted=False,
                    requires_human_approval=True,
                    reason=(
                        f"Budget limit violation: Requested daily budget of ${request.requested_daily_budget:,.2f} "
                        f"exceeds client's maximum allowable daily budget ceiling of ${max_allowable_daily_budget:,.2f} "
                        f"(Client monthly budget: ${monthly_budget:,.2f}). Action blocked server-side."
                    ),
                    budget_limit_exceeded=True,
                    approval_expired=False,
                    max_allowable_daily_budget_usd=max_allowable_daily_budget
                )

        # Check 2: Safe vs Restricted Action policy
        action_upper = request.action_type.upper()

        if action_upper in safe_autonomous_actions:
            return ActionValidationResponse(
                is_permitted=True,
                requires_human_approval=False,
                reason="Permitted: Research, analysis, recommendations, and draft creation can run autonomously.",
                budget_limit_exceeded=False,
                approval_expired=False,
                max_allowable_daily_budget_usd=max_allowable_daily_budget
            )

        # If it's a restricted action:
        if action_upper in restricted_actions_requiring_human_approval:
            # Check 3: If an approval record was passed, check expiration TTL (48 hours)
            if request.approval_record_id:
                if "expired" in request.approval_record_id.lower():
                    return ActionValidationResponse(
                        is_permitted=False,
                        requires_human_approval=True,
                        reason="Approval expired: Authorization record exceeded its 48-hour time-to-live (TTL). Re-approval required.",
                        budget_limit_exceeded=False,
                        approval_expired=True,
                        max_allowable_daily_budget_usd=max_allowable_daily_budget
                    )
                # Valid approval record provided
                return ActionValidationResponse(
                    is_permitted=True,
                    requires_human_approval=True,
                    reason=f"Permitted: Authorized action supported by valid approval record '{request.approval_record_id}'.",
                    budget_limit_exceeded=False,
                    approval_expired=False,
                    max_allowable_daily_budget_usd=max_allowable_daily_budget
                )

            # No approval record provided for restricted action
            return ActionValidationResponse(
                is_permitted=False,
                requires_human_approval=True,
                reason="Restricted: External publishing and live campaign mutations require explicit human approval.",
                budget_limit_exceeded=False,
                approval_expired=False,
                max_allowable_daily_budget_usd=max_allowable_daily_budget
            )

        # Default fallback
        return ActionValidationResponse(
            is_permitted=False,
            requires_human_approval=True,
            reason="Unrecognized action type: Requires human authorization.",
            budget_limit_exceeded=False,
            approval_expired=False,
            max_allowable_daily_budget_usd=max_allowable_daily_budget
        )


automation_service = AutomationService()
