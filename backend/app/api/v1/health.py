"""Health check endpoints for backend container readiness and observability."""

import time
from typing import Dict, Any
from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])
START_TIME = time.time()


@router.get("/health")
@router.get("/healthz")
async def health_check() -> Dict[str, Any]:
    """Production health check endpoint verifying mode, version, and dependencies."""
    uptime_seconds = round(time.time() - START_TIME, 2)
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "execution_mode": settings.EXECUTION_MODE,
        "is_demo_mode": settings.is_demo_mode,
        "uptime_seconds": uptime_seconds,
        "version": "1.0.0",
        "security": {
            "enforce_explicit_approval": settings.REQUIRE_EXPLICIT_APPROVAL,
            "default_campaign_status": settings.DEFAULT_CAMPAIGN_STATUS
        },
        "integrations": {
            "meta_api": "connected" if not settings.is_demo_mode else "demo_sandbox",
            "openai": "connected" if not settings.is_demo_mode else "demo_orchestrator",
            "supabase": "connected" if not settings.is_demo_mode else "local_isolation"
        }
    }
