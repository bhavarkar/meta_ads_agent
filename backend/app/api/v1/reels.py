"""Instagram Reels workflow, asset management, AI caption generation, and publishing endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.reel import (
    ReelUploadRequest,
    ReelPreviewVerification,
    ReelValidationRequest,
    ReelValidationResponse,
    CaptionGenerationRequest,
    CaptionGenerationResponse,
    CreativeSelectionRequest,
    CaptionUpdateRequest,
    ReelScheduleRequest,
    ReelResponse,
    ReelPublishRequest,
    ReelComparisonItem
)
from app.services.reels_service import reels_service
from app.services.meta_service import meta_service

router = APIRouter(prefix="/reels", tags=["Instagram Reels"])


@router.get("", response_model=List[ReelResponse])
async def list_reels(
    client_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List Reels drafts, verification states, and publishing logs."""
    return reels_service.list_reels(client_id, status)


@router.post("/upload", response_model=ReelResponse, status_code=status.HTTP_201_CREATED)
async def upload_reel(
    request: ReelUploadRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Upload a new Reel draft with video specs, caption, audio metadata, and rights clearance."""
    return reels_service.upload_reel_draft(
        request=request,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/validate-specs", response_model=ReelValidationResponse)
async def validate_reel_specs(
    request: ReelValidationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Validate video specifications: MIME type, file size (max 100MB),
    9:16 vertical aspect ratio, duration (3-90s), codecs (H.264/AAC), and rights clearance.
    """
    return reels_service.validate_asset_specs(request.model_dump())


@router.post("/generate-captions", response_model=CaptionGenerationResponse)
async def generate_captions(
    request: CaptionGenerationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    AI Caption Assistant: generates 3 tailored caption angles (Hook-driven, Problem-Agitate-Solve, Social Proof),
    suggests hooks, hashtags by category, and CTA variations.
    """
    return reels_service.generate_captions(request)


@router.post("/{reel_id}/select-creative", response_model=ReelResponse)
async def select_creative(
    reel_id: str,
    request: CreativeSelectionRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Select chosen creative and caption, transitioning state from DRAFT to READY.
    """
    return reels_service.select_creative(
        reel_id=reel_id,
        request=request,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.patch("/{reel_id}/caption", response_model=ReelResponse)
async def update_caption(
    reel_id: str,
    request: CaptionUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Manually edit caption.
    Security rule: If Reel was already APPROVED, this immediately revokes approval to prevent payload tampering.
    """
    return reels_service.update_caption(
        reel_id=reel_id,
        request=request,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/verify-preview", response_model=ReelResponse)
async def verify_reel_preview(
    verification: ReelPreviewVerification,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Verify 9:16 vertical video specifications, duration, and user visual confirmation.
    Transitions Reel to READY state.
    """
    return reels_service.verify_preview(
        verification=verification,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/{reel_id}/request-approval", response_model=ReelResponse)
async def request_approval(
    reel_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Request sign-off on a READY Reel, moving status to APPROVAL_PENDING.
    """
    return reels_service.request_approval(
        reel_id=reel_id,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/{reel_id}/approve", response_model=ReelResponse)
async def approve_reel(
    reel_id: str,
    target_account_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Grant explicit cryptographic approval to publish Reel live.
    Binds exact media, caption, target account, and action.
    """
    return reels_service.approve_for_publishing(
        reel_id=reel_id,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id,
        target_instagram_account_id=target_account_id
    )


@router.post("/publish", response_model=ReelResponse)
async def publish_reel(
    request: ReelPublishRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Publish an approved Reel to Instagram using the official Graph API container pipeline:
    1. Verify cryptographic approval & rights
    2. Check idempotency & in-flight locks
    3. Create media container (POST /{ig_user_id}/media)
    4. Poll container processing status (GET /{container_id})
    5. Publish live (POST /{ig_user_id}/media_publish)
    6. Save permalink and media ID
    """
    return await reels_service.publish_reel(
        request=request,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/{reel_id}/retry", response_model=ReelResponse)
async def retry_publish(
    reel_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retry a failed Reel publication (up to 3 retries).
    """
    return await reels_service.retry_publish(
        reel_id=reel_id,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.post("/{reel_id}/schedule", response_model=ReelResponse)
async def schedule_reel(
    reel_id: str,
    request: ReelScheduleRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Schedule Reel publication on Content Calendar.
    """
    return reels_service.schedule_reel(
        reel_id=reel_id,
        scheduled_at=request.scheduled_at,
        actor_id=user.user_id,
        actor_email=user.email,
        tenant_id=user.tenant_id
    )


@router.get("/compare", response_model=List[ReelComparisonItem])
async def compare_reels(
    reel_ids: List[str] = Query(...),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Side-by-side Reel comparison of visual hooks, pacing scores, and engagement potential.
    """
    return reels_service.compare_reels(reel_ids)


@router.get("/permissions")
async def get_instagram_permissions(
    account_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Check authorized Instagram professional account eligibility and content publish permissions.
    """
    return await meta_service.check_instagram_publishing_permissions(account_id)
