"""Automations, Scheduled Background Jobs, Reporting, and Approval Guardrails Router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status, Response
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.automation import (
    BackgroundJob,
    RunJobRequest,
    PerformanceAnomaly,
    SystemNotification,
    PerformanceReport,
    GenerateReportRequest,
    ActionValidationRequest,
    ActionValidationResponse
)
from app.services.automation_service import automation_service
from app.core.audit import record_audit_event

router = APIRouter(prefix="/automations", tags=["Automations & Reporting"])


# --- Background Jobs Engine ---

@router.get("/jobs", response_model=List[BackgroundJob])
async def list_background_jobs(
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List all server-side scheduled background jobs, cadences, statuses, and retry counts.
    """
    return await automation_service.list_jobs(tenant_id=user.tenant_id)


@router.post("/jobs/run", response_model=BackgroundJob)
async def trigger_background_job(
    request: RunJobRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Triggers or retries a background job with idempotency and error handling.
    Deduplicates executions if an identical idempotency key is already running or completed.
    """
    return await automation_service.run_job(
        request=request,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/jobs/{job_id}/retry", response_model=BackgroundJob)
async def retry_background_job(
    job_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Manually retry a failed or stalled background job up to max retries ceiling.
    """
    try:
        return await automation_service.retry_job(job_id=job_id, actor_email=user.email)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- Performance Anomalies ---

@router.get("/anomalies", response_model=List[PerformanceAnomaly])
async def list_performance_anomalies(
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List detected metric anomalies and creative fatigue alerts with supporting data.
    """
    return await automation_service.list_anomalies(client_id=client_id)


@router.post("/anomalies/{anomaly_id}/acknowledge", response_model=PerformanceAnomaly)
async def acknowledge_anomaly(
    anomaly_id: str,
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Mark a performance anomaly as acknowledged by a marketing analyst.
    """
    try:
        anomaly = await automation_service.acknowledge_anomaly(anomaly_id=anomaly_id, client_id=client_id)
        record_audit_event(
            tenant_id=user.tenant_id,
            actor_id=user.user_id,
            actor_email=user.email,
            action="ANOMALY_ACKNOWLEDGED",
            resource_type="PERFORMANCE_ANOMALY",
            resource_id=anomaly_id,
            details={"client_id": client_id, "metric": anomaly.metric_name}
        )
        return anomaly
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# --- Executive Reports & CSV Export ---

@router.get("/reports", response_model=List[PerformanceReport])
async def list_performance_reports(
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List historical weekly and daily client performance reports.
    """
    return await automation_service.list_reports(client_id=client_id)


@router.get("/reports/{report_id}", response_model=PerformanceReport)
async def get_performance_report(
    report_id: str,
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve full details for a single client performance report.
    """
    try:
        return await automation_service.get_report(report_id=report_id, client_id=client_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/reports/{report_id}/csv")
async def download_report_csv(
    report_id: str,
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Download a formatted, RFC-4180 compliant CSV export of the performance report.
    """
    try:
        report = await automation_service.get_report(report_id=report_id, client_id=client_id)
        csv_data = automation_service.export_report_to_csv(report)
        filename = f"{report.client_id}_{report.report_id}.csv"

        record_audit_event(
            tenant_id=user.tenant_id,
            actor_id=user.user_id,
            actor_email=user.email,
            action="REPORT_CSV_DOWNLOADED",
            resource_type="PERFORMANCE_REPORT",
            resource_id=report_id,
            details={"client_id": client_id, "filename": filename}
        )

        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/reports/generate", response_model=PerformanceReport)
async def generate_report(
    request: GenerateReportRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Generates a fresh weekly performance summary comparing previous periods,
    incorporating anomalies, top creatives, and the five prioritized recommendations.
    """
    report = await automation_service.generate_weekly_report(client_id=request.client_id)
    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="PERFORMANCE_REPORT_GENERATED",
        resource_type="PERFORMANCE_REPORT",
        resource_id=report.report_id,
        details={"client_id": request.client_id, "report_title": report.report_title}
    )
    return report


# --- Notification Center ---

@router.get("/notifications", response_model=List[SystemNotification])
async def list_notifications(
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List creative workflow and system notifications (pending approvals, publish results, anomalies).
    """
    return await automation_service.list_notifications(client_id=client_id)


@router.post("/notifications/{notification_id}/read", response_model=SystemNotification)
@router.patch("/notifications/{notification_id}/read", response_model=SystemNotification)
async def mark_notification_read(
    notification_id: str,
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    try:
        return await automation_service.mark_notification_read(notification_id=notification_id, client_id=client_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Mark all unread notifications as read.
    """
    updated_count = await automation_service.mark_all_notifications_read(client_id=client_id)
    return {"status": "success", "updated_count": updated_count}


# --- Approval Policies & Guardrails ---

@router.post("/validate-action", response_model=ActionValidationResponse)
async def validate_action_against_approval_policies(
    request: ActionValidationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Validates whether an action is permitted autonomously or strictly requires human approval.
    Enforces server-side client budget limits and approval record expiration TTL.
    """
    response = automation_service.validate_action_against_policies(request)
    if not response.is_permitted and response.budget_limit_exceeded:
        record_audit_event(
            tenant_id=user.tenant_id,
            actor_id=user.user_id,
            actor_email=user.email,
            action="BUDGET_LIMIT_VIOLATION_BLOCKED",
            resource_type="APPROVAL_GUARDRAIL",
            resource_id=request.client_id,
            details={
                "action_type": request.action_type,
                "requested_budget": request.requested_daily_budget,
                "max_allowable": response.max_allowable_daily_budget_usd
            }
        )
    return response
