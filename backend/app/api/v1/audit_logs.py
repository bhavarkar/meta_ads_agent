"""Audit logs endpoint for enterprise security verification and compliance."""

from fastapi import APIRouter, Depends, Query
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.audit import AuditLogResponse
from app.core.audit import get_tenant_audit_logs

router = APIRouter(prefix="/audit-logs", tags=["Audit & Security"])


@router.get("", response_model=AuditLogResponse)
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve immutable audit logs for the authenticated tenant."""
    logs = get_tenant_audit_logs(user.tenant_id, limit=limit)
    return AuditLogResponse(items=logs, total_count=len(logs))
