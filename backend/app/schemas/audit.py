"""Audit log schemas."""

from typing import List, Optional
from pydantic import BaseModel
from app.core.audit import AuditEntry


class AuditLogResponse(BaseModel):
    items: List[AuditEntry]
    total_count: int
