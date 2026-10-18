"""Audit log recorder for enterprise compliance and safety tracking."""

import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AuditEntry(BaseModel):
    id: str
    tenant_id: str
    actor_id: str
    actor_email: str
    action: str  # e.g., "CAMPAIGN_DRAFT_CREATED", "EXPLICIT_APPROVAL_GRANTED", "REEL_PUBLISH_INITIATED"
    resource_type: str
    resource_id: str
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = "127.0.0.1"
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())


# In-memory storage for local demo & fast lookup
_AUDIT_LOG_STORE: List[AuditEntry] = []


def record_audit_event(
    tenant_id: str,
    actor_id: str,
    actor_email: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: Dict[str, Any] = None,
    ip_address: str = "127.0.0.1"
) -> AuditEntry:
    entry = AuditEntry(
        id=f"aud_{int(datetime.datetime.now().timestamp()*1000)}",
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address
    )
    _AUDIT_LOG_STORE.insert(0, entry)
    return entry


def get_tenant_audit_logs(tenant_id: str, limit: int = 50) -> List[AuditEntry]:
    return [entry for entry in _AUDIT_LOG_STORE if entry.tenant_id == tenant_id][:limit]
