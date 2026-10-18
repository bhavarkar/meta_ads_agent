"""Central API router aggregating all version 1 endpoints."""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.clients import router as clients_router
from app.api.v1.competitors import router as competitors_router
from app.api.v1.strategies import router as strategies_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.reels import router as reels_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.automations import router as automations_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(organizations_router)
api_router.include_router(clients_router)
api_router.include_router(competitors_router)
api_router.include_router(strategies_router)
api_router.include_router(campaigns_router)
api_router.include_router(reels_router)
api_router.include_router(analytics_router)
api_router.include_router(recommendations_router)
api_router.include_router(audit_logs_router)
api_router.include_router(automations_router)
