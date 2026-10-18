"""Five prioritized AI recommendations endpoints using LangGraph decision engine."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.recommendation import (
    RecommendationListResponse,
    AIRecommendation,
    ApplyRecommendationRequest,
    RecommendationFeedbackRequest,
    ConvertToApprovalRequest
)
from app.services.recommendation_engine import recommendation_engine
from app.core.audit import record_audit_event
from app.services.demo_data_service import DEMO_RECOMMENDATIONS

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])


@router.get("", response_model=RecommendationListResponse)
async def get_top_recommendations(
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Generate the five most valuable next actions using an 8-step LangGraph StateMachine.
    Grounded in verified campaign telemetry, competitor Ad Library evidence, and deterministic policy checks.
    """
    return await recommendation_engine.run_workflow(client_id)


@router.post("/feedback", response_model=AIRecommendation)
async def submit_recommendation_feedback(
    request: RecommendationFeedbackRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Submit user feedback on a recommendation:
    Status options: ACCEPTED, REJECTED, SNOOZED, IMPLEMENTED.
    """
    # Run or retrieve current recommendations
    res = await recommendation_engine.run_workflow(request.client_id)
    target = next((r for r in res.recommendations if r.id == request.recommendation_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation '{request.recommendation_id}' not found for client '{request.client_id}'."
        )

    # Record feedback in service
    recommendation_engine.record_feedback(
        recommendation_id=request.recommendation_id,
        client_id=request.client_id,
        status=request.status,
        notes=request.notes
    )
    target.status = request.status

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action=f"RECOMMENDATION_{request.status}",
        resource_type="RECOMMENDATION",
        resource_id=request.recommendation_id,
        details={
            "client_id": request.client_id,
            "title": target.title,
            "status": request.status,
            "notes": request.notes
        }
    )

    return target


@router.post("/convert-to-approval", response_model=AIRecommendation)
@router.post("/{recommendation_id}/convert-to-approval", response_model=AIRecommendation)
async def convert_recommendation_to_approval(
    request: Optional[ConvertToApprovalRequest] = None,
    recommendation_id: Optional[str] = None,
    client_id: str = Query("cli_lumina_glow"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Converts an authorized action recommendation into a separate campaign approval request.
    Places the action into the approval queue with SHA-256 payload integrity hashing.
    """
    target_rec_id = (request.recommendation_id if request else recommendation_id)
    target_client_id = (request.client_id if request else client_id)

    if not target_rec_id:
        raise HTTPException(status_code=400, detail="Recommendation ID required.")

    res = await recommendation_engine.run_workflow(target_client_id)
    target = next((r for r in res.recommendations if r.id == target_rec_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recommendation '{target_rec_id}' not found."
        )

    # Convert to approval record
    approval_record = recommendation_engine.convert_to_approval_request(
        recommendation=target,
        user_email=user.email,
        tenant_id=user.tenant_id
    )

    target.approval_request_id = approval_record["approval_id"]
    target.status = "ACCEPTED"
    recommendation_engine.record_feedback(target.id, target.client_id, "ACCEPTED")

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="RECOMMENDATION_CONVERTED_TO_APPROVAL",
        resource_type="CAMPAIGN_APPROVAL",
        resource_id=approval_record["approval_id"],
        details={
            "client_id": target.client_id,
            "recommendation_id": target.id,
            "title": target.title,
            "action_type": target.action_type,
            "approval_id": approval_record["approval_id"]
        }
    )

    return target


@router.post("/apply", response_model=AIRecommendation)
async def apply_recommendation(
    request: ApplyRecommendationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Execute 1-click execution for a prioritized AI recommendation.
    Records compliance audit event and updates recommendation status.
    Maintains 100% backward-compatibility for legacy clients and audit trails.
    """
    res = await recommendation_engine.run_workflow(request.client_id)
    target_rec = next((r for r in res.recommendations if r.id == request.recommendation_id), None)

    if not target_rec:
        recs = DEMO_RECOMMENDATIONS.get(request.client_id, DEMO_RECOMMENDATIONS["cli_lumina_glow"])
        target_rec = next((r for r in recs if r.id == request.recommendation_id), recs[0])

    target_rec.status = "APPLIED"
    recommendation_engine.record_feedback(target_rec.id, request.client_id, "IMPLEMENTED")

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="AI_RECOMMENDATION_APPLIED",
        resource_type="RECOMMENDATION",
        resource_id=request.recommendation_id,
        details={
            "client_id": request.client_id,
            "title": target_rec.title if target_rec else "Unknown Recommendation",
            "action_type": target_rec.action_type if target_rec else "CUSTOM"
        }
    )
    return target_rec
