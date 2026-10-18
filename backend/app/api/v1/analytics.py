"""Performance analytics endpoints with official Meta Marketing API telemetry and demo provenance."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.analytics import (
    AnalyticsResponse,
    ReportingLevelType,
    DatePresetType,
    SyncRequest
)
from app.services.demo_data_service import get_demo_analytics
from app.services.meta_service import meta_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
async def get_performance_analytics(
    client_id: str = Query("cli_lumina_glow", description="Client workspace ID"),
    level: ReportingLevelType = Query("account", description="Reporting level: account, campaign, adset, ad"),
    date_preset: Optional[str] = Query(None, description="Date preset: yesterday, last_7d, last_30d, custom"),
    date_range: Optional[str] = Query(None, description="Legacy alias for date_preset"),
    since: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    until: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Force synchronization bypass of local cache"),
    user: AuthenticatedUser = Depends(get_current_user)
) -> AnalyticsResponse:
    """
    Retrieve performance metrics, ROAS, CPA, conversion funnel, entity comparisons,
    and creative intelligence across account, campaign, ad set, and ad levels.
    """
    # Normalize date preset (handling legacy date_range parameter if provided)
    selected_preset: DatePresetType = "last_7d"
    if date_preset in ("yesterday", "last_7d", "last_30d", "custom"):
        selected_preset = date_preset  # type: ignore[assignment]
    elif date_range in ("yesterday", "last_7d", "last_30d", "custom"):
        selected_preset = date_range  # type: ignore[assignment]
    elif since and until:
        selected_preset = "custom"

    # User demo mode or client evaluation
    if user.is_demo:
        return get_demo_analytics(
            client_id=client_id,
            level=level,
            date_preset=selected_preset,
            since=since,
            until=until
        )

    # Connected mode: query Meta Marketing API Insights
    try:
        report = await meta_service.get_analytics_report(
            ad_account_id=client_id,
            client_id=client_id,
            level=level,
            date_preset=selected_preset,
            since=since,
            until=until,
            force_refresh=force_refresh
        )
        return report
    except Exception as e:
        # Structured error handling with recovery advice
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "META_INSIGHTS_API_ERROR",
                "message": f"Failed to retrieve insights from Meta Marketing API: {str(e)}",
                "resolution": "Verify that your Meta Ad Account has active campaigns and valid permissions ('ads_read'). You can toggle to Demo mode to preview metrics."
            }
        )


@router.post("/sync", response_model=AnalyticsResponse)
async def sync_performance_analytics(
    payload: SyncRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> AnalyticsResponse:
    """
    Trigger incremental synchronization with Meta Marketing API and refresh local snapshot.
    """
    if user.is_demo:
        return get_demo_analytics(
            client_id=payload.client_id,
            level="account",
            date_preset="last_7d"
        )

    try:
        report = await meta_service.get_analytics_report(
            ad_account_id=payload.client_id,
            client_id=payload.client_id,
            level="account",
            date_preset="last_7d",
            force_refresh=True
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "META_SYNC_FAILED",
                "message": f"Incremental synchronization failed: {str(e)}",
                "resolution": "Check Meta rate limits or retry synchronization in 60 seconds."
            }
        )
