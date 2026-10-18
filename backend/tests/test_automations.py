"""Test suite verifying the MetaPilot AI Automation and Reporting Module.

Covers:
1. Scheduled background jobs listing and execution.
2. Duplicate job prevention via idempotency keys.
3. Job retry handling and max-retries ceiling.
4. Daily metric sync and performance anomaly detection.
5. Weekly executive performance report generation with WoW period comparisons and 5 AI recommendations.
6. RFC-4180 CSV export download.
7. Creative workflow and system notifications (mark read / mark all read).
8. Server-side approval guardrail enforcement:
   - Permitting safe tasks (research, analysis, recommendations, draft creation).
   - Requiring human approval for restricted tasks (live activation, publishing, budget scale).
   - Enforcing client-defined budget limits server-side.
   - Enforcing approval record expiration TTL.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.automation_service import automation_service

client = TestClient(app)


def test_list_scheduled_background_jobs():
    """Verify default server-side scheduled background jobs are registered with cadences."""
    response = client.get("/api/v1/automations/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) >= 5

    job_types = [j["job_type"] for j in jobs]
    assert "DAILY_METRIC_SYNC" in job_types
    assert "PERFORMANCE_ANOMALY_DETECTION" in job_types
    assert "WEEKLY_PERFORMANCE_REPORT" in job_types
    assert "APPROVAL_EXPIRATION_SWEEP" in job_types
    assert "CREATIVE_NOTIFICATION_DISPATCH" in job_types

    for j in jobs:
        assert j["max_retries"] >= 3
        assert j["cadence"] is not None
        assert j["idempotency_key"] is not None


def test_duplicate_job_prevention_via_idempotency_key():
    """Verify that submitting a job with an identical idempotency key returns the existing job without re-executing."""
    idempotency_key = "test_idem_unique_key_9999"

    # First run
    res1 = client.post("/api/v1/automations/jobs/run", json={
        "job_type": "DAILY_METRIC_SYNC",
        "client_id": "cli_lumina_glow",
        "idempotency_key": idempotency_key,
        "force_run": False
    })
    assert res1.status_code == 200
    job1 = res1.json()
    assert job1["status"] == "COMPLETED"
    first_job_id = job1["job_id"]

    # Second run with exact same idempotency_key
    res2 = client.post("/api/v1/automations/jobs/run", json={
        "job_type": "DAILY_METRIC_SYNC",
        "client_id": "cli_lumina_glow",
        "idempotency_key": idempotency_key,
        "force_run": False
    })
    assert res2.status_code == 200
    job2 = res2.json()

    # Must return the existing job (same job_id, no duplicate execution)
    assert job2["job_id"] == first_job_id
    assert job2["idempotency_key"] == idempotency_key


def test_background_job_retry_handling():
    """Verify background job retry incrementation and retry behavior."""
    # Create or simulate a job requiring retry
    test_job_id = "job_test_retry_sim"
    from app.schemas.automation import BackgroundJob
    automation_service._jobs_store[test_job_id] = BackgroundJob(
        job_id=test_job_id,
        job_type="DAILY_METRIC_SYNC",
        title="Simulated Flaky Job",
        cadence="ONCE",
        status="RETRYING",
        retry_count=1,
        max_retries=3,
        idempotency_key="idem_sim_flaky_retry",
        client_id="cli_lumina_glow"
    )

    # Retry the job
    res = client.post(f"/api/v1/automations/jobs/{test_job_id}/retry")
    assert res.status_code == 200
    data = res.json()
    assert data["job_id"] == test_job_id
    assert data["retry_count"] == 2
    assert data["status"] == "COMPLETED"


def test_performance_anomaly_detection_and_acknowledgement():
    """Verify daily anomaly detection identifies creative fatigue and allows analyst acknowledgement."""
    res = client.get("/api/v1/automations/anomalies?client_id=cli_lumina_glow")
    assert res.status_code == 200
    anomalies = res.json()
    assert len(anomalies) >= 1

    fatigue_anom = next((a for a in anomalies if a["metric_name"] == "CTR"), None)
    assert fatigue_anom is not None
    assert fatigue_anom["severity"] == "HIGH"
    assert fatigue_anom["change_pct"] < -25.0
    assert fatigue_anom["supporting_data"]["frequency"] >= 3.5

    # Acknowledge anomaly
    ack_res = client.post(f"/api/v1/automations/anomalies/{fatigue_anom['anomaly_id']}/acknowledge?client_id=cli_lumina_glow")
    assert ack_res.status_code == 200
    assert ack_res.json()["is_acknowledged"] is True


def test_weekly_report_generation_with_wow_comparison_and_five_recommendations():
    """Verify generating weekly executive report calculates WoW metrics and attaches 5 AI recommendations."""
    res = client.post("/api/v1/automations/reports/generate", json={
        "client_id": "cli_lumina_glow",
        "report_type": "WEEKLY_SUMMARY"
    })
    assert res.status_code == 200
    report = res.json()

    assert report["client_id"] == "cli_lumina_glow"
    assert "Weekly" in report["report_title"]
    assert report["status"] == "GENERATED"

    # Verify WoW metrics present
    kpis = report["kpis_summary"]
    assert "current_period" in kpis
    assert "previous_period" in kpis
    assert "wow_change_pct" in kpis
    assert kpis["current_period"]["spend"] > 0
    assert kpis["current_period"]["roas"] > 0
    assert "cpa" in kpis["wow_change_pct"]

    # Verify five prioritized recommendations attached
    recs = report["prioritized_recommendations"]
    assert len(recs) == 5
    priorities = [r["priority"] for r in recs]
    assert priorities == [1, 2, 3, 4, 5]


def test_report_csv_download_export():
    """Verify downloading report as RFC-4180 CSV export containing KPIs and recommendations."""
    # First get reports list
    reports_res = client.get("/api/v1/automations/reports?client_id=cli_lumina_glow")
    assert reports_res.status_code == 200
    reports = reports_res.json()
    assert len(reports) > 0
    target_report_id = reports[0]["report_id"]

    # Download CSV
    csv_res = client.get(f"/api/v1/automations/reports/{target_report_id}/csv?client_id=cli_lumina_glow")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert f'attachment; filename="cli_lumina_glow_{target_report_id}.csv"' in csv_res.headers["content-disposition"]

    csv_content = csv_res.text
    assert "METAPILOT AI EXECUTIVE CLIENT PERFORMANCE REPORT" in csv_content
    assert "KEY PERFORMANCE INDICATORS (WoW COMPARISON)" in csv_content
    assert "Total Spend (USD)" in csv_content
    assert "TOP PRIORITIZED AI RECOMMENDATIONS (LANGGRAPH ENGINE)" in csv_content


def test_notification_center_lifecycle():
    """Verify notifications listing, read marking, and mark all read."""
    res = client.get("/api/v1/automations/notifications?client_id=cli_lumina_glow")
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 3

    types = [n["type"] for n in notifs]
    assert "REEL_APPROVAL_REQUIRED" in types or "CAMPAIGN_APPROVAL_PENDING" in types

    unread_notif = next((n for n in notifs if not n["is_read"]), notifs[0])

    # Mark single read
    mark_res = client.post(f"/api/v1/automations/notifications/{unread_notif['notification_id']}/read?client_id=cli_lumina_glow")
    assert mark_res.status_code == 200
    assert mark_res.json()["is_read"] is True

    # Mark all read
    mark_all_res = client.post("/api/v1/automations/notifications/mark-all-read?client_id=cli_lumina_glow")
    assert mark_all_res.status_code == 200
    assert mark_all_res.json()["status"] == "success"


def test_approval_policy_safe_actions_permitted_autonomously():
    """Verify research, analysis, and draft creation can run autonomously without approval."""
    safe_actions = ["RESEARCH_ANALYSIS", "GENERATE_RECOMMENDATIONS", "CREATE_CAMPAIGN_DRAFT", "CREATE_REEL_DRAFT"]

    for action in safe_actions:
        res = client.post("/api/v1/automations/validate-action", json={
            "action_type": action,
            "client_id": "cli_lumina_glow"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["is_permitted"] is True
        assert data["requires_human_approval"] is False


def test_approval_policy_restricted_actions_require_human_approval():
    """Verify live campaign mutations and external publishing strictly require human approval."""
    restricted_actions = ["ACTIVATE_CAMPAIGN", "PUBLISH_REEL", "SCALE_BUDGET"]

    for action in restricted_actions:
        # Without approval record: must be blocked
        res = client.post("/api/v1/automations/validate-action", json={
            "action_type": action,
            "client_id": "cli_lumina_glow",
            "approval_record_id": None
        })
        assert res.status_code == 200
        data = res.json()
        assert data["is_permitted"] is False
        assert data["requires_human_approval"] is True

        # With valid approval record: permitted
        res_approved = client.post("/api/v1/automations/validate-action", json={
            "action_type": action,
            "client_id": "cli_lumina_glow",
            "approval_record_id": "appr_rec_valid_test_sig"
        })
        assert res_approved.status_code == 200
        assert res_approved.json()["is_permitted"] is True


def test_approval_policy_blocks_client_budget_limit_violations():
    """Verify that requested daily budgets exceeding client-defined limits are strictly blocked server-side."""
    # Lumina Skin Co. monthly budget is $25,000 -> max allowable daily budget is ~$1,666.67
    excessive_budget = 5000.0  # Excessive requested daily budget

    res = client.post("/api/v1/automations/validate-action", json={
        "action_type": "SCALE_BUDGET",
        "client_id": "cli_lumina_glow",
        "requested_daily_budget": excessive_budget,
        "approval_record_id": "appr_rec_valid_sig"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_permitted"] is False
    assert data["budget_limit_exceeded"] is True
    assert "Budget limit violation" in data["reason"]

    # Audit log check: verify violation was logged
    audit_res = client.get("/api/v1/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()["items"]
    actions = [l["action"] for l in logs]
    assert "BUDGET_LIMIT_VIOLATION_BLOCKED" in actions


def test_approval_policy_rejects_expired_approvals():
    """Verify that expired approval records (exceeding 48h TTL) are blocked from execution."""
    res = client.post("/api/v1/automations/validate-action", json={
        "action_type": "ACTIVATE_CAMPAIGN",
        "client_id": "cli_lumina_glow",
        "approval_record_id": "appr_rec_expired_20261010"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_permitted"] is False
    assert data["approval_expired"] is True
    assert "Approval expired" in data["reason"]
