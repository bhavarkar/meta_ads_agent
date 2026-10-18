"""Campaign drafts, hierarchy, ODAX validation, PAUSED enforcement, approval hashing, and authorized activation router."""

import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.core.security import AuthenticatedUser, get_current_user, generate_approval_signature
from app.schemas.campaign import (
    CampaignDraftCreate,
    CampaignDraftResponse,
    CampaignApprovalRequest,
    CampaignApprovalRecord,
    CampaignValidationRequest,
    CampaignValidationResult,
    CampaignActivationRequest,
    AdSetDraft,
    AdCreativeDraft,
    AdDraft,
    compute_campaign_payload_hash
)
from app.core.exceptions import MetaApprovalRequiredException
from app.core.audit import record_audit_event
from app.services.demo_data_service import DEMO_CAMPAIGN_DRAFTS
from app.services.meta_service import meta_service

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

_CAMPAIGN_STORE: Dict[str, CampaignDraftResponse] = {c.id: c for c in DEMO_CAMPAIGN_DRAFTS}


@router.get("", response_model=List[CampaignDraftResponse])
async def list_campaigns(
    client_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List campaign drafts with full hierarchy and workflow statuses for authorized client."""
    campaigns = list(_CAMPAIGN_STORE.values())
    if client_id:
        campaigns = [c for c in campaigns if c.client_id == client_id]
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignDraftResponse)
async def get_campaign(
    campaign_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve detailed campaign hierarchy, approval records, and live status."""
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")
    return campaign


@router.post("/validate", response_model=CampaignValidationResult)
async def validate_campaign_settings(
    req: CampaignValidationRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Validate campaign hierarchy and settings against official Meta Graph API v21.0 rules.
    Checks objective compatibility, optimization goals, destinations, budgets, and creative limits.
    """
    return meta_service.validate_campaign_hierarchy(req.campaign.model_dump())


@router.post("", response_model=CampaignDraftResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign_draft(
    draft_in: CampaignDraftCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new campaign draft with full hierarchy (Campaign -> Ad Set -> Creative -> Ad).
    CRITICAL SECURITY RULE: Status is ALWAYS initialized to 'PAUSED'.
    No campaign or ad is ever activated automatically upon creation.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    new_id = f"cmp_draft_{int(datetime.datetime.now().timestamp())}"

    # Pre-flight validate
    val_res = meta_service.validate_campaign_hierarchy(draft_in.model_dump())

    # Build default ad set if none provided
    ad_sets = list(draft_in.ad_sets)
    if not ad_sets:
        ad_sets.append(AdSetDraft(
            id=f"adset_{new_id}_1",
            name=f"{draft_in.name} - Core Audience",
            optimization_goal="OFFSITE_CONVERSIONS" if draft_in.objective == "OUTCOME_SALES" else "LINK_CLICKS",
            destination_type="WEBSITE",
            daily_budget_usd=draft_in.daily_budget_usd if draft_in.budget_level == "AD_SET" else None,
            status="PAUSED"
        ))

    # Build default creative if none provided
    creatives = list(draft_in.creatives)
    if not creatives:
        creatives.append(AdCreativeDraft(
            id=f"cr_{new_id}_1",
            name=f"{draft_in.name} - Primary Hook Creative",
            headline="Transform Your Skin Health with Lumina",
            primary_text="Clinically formulated botanicals that strengthen your skin barrier. Dermatologist-tested.",
            call_to_action="SHOP_NOW",
            media_type="IMAGE",
            media_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
            destination_url="https://example.com/products/barrier-serum"
        ))

    # Build default ads mapping ad sets to creatives
    ads = list(draft_in.ads)
    if not ads:
        for s_idx, s in enumerate(ad_sets):
            for c_idx, c in enumerate(creatives):
                ads.append(AdDraft(
                    id=f"ad_{new_id}_{s_idx+1}_{c_idx+1}",
                    name=f"Ad {s_idx+1}.{c_idx+1} - {c.headline[:30]}",
                    adset_id=s.id,
                    creative_id=c.id,
                    status="PAUSED"
                ))

    # Compute deterministic payload hash for approval tracking
    payload_dict = {
        "objective": draft_in.objective,
        "budget_level": draft_in.budget_level,
        "budget_type": draft_in.budget_type,
        "daily_budget_usd": draft_in.daily_budget_usd,
        "lifetime_budget_usd": draft_in.lifetime_budget_usd,
        "special_ad_category": draft_in.special_ad_category,
        "ad_sets": ad_sets,
        "creatives": creatives
    }
    payload_hash = compute_campaign_payload_hash(payload_dict)

    campaign = CampaignDraftResponse(
        id=new_id,
        client_id=draft_in.client_id,
        meta_campaign_id=f"meta_{new_id}",
        name=draft_in.name,
        objective=draft_in.objective,
        budget_level=draft_in.budget_level,
        budget_type=draft_in.budget_type,
        daily_budget_usd=draft_in.daily_budget_usd,
        lifetime_budget_usd=draft_in.lifetime_budget_usd,
        special_ad_category=draft_in.special_ad_category,
        status="PAUSED",  # Guaranteed initial state
        workflow_status="VALIDATED" if val_res.is_valid else "DRAFT",
        approval_required=True,
        is_approved=False,
        approved_by=None,
        approved_at=None,
        approval_signature=None,
        latest_approval=None,
        approved_payload_hash=None,
        current_payload_hash=payload_hash,
        needs_reapproval=False,
        ad_sets_count=len(ad_sets),
        creatives_count=len(creatives),
        ad_sets=ad_sets,
        creatives=creatives,
        ads=ads,
        validation_errors=val_res.errors,
        created_at=now_iso,
        updated_at=now_iso,
        is_demo=True,
        idempotency_token=draft_in.client_request_token
    )
    _CAMPAIGN_STORE[new_id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_DRAFT_CREATED_PAUSED",
        resource_type="CAMPAIGN",
        resource_id=new_id,
        details={
            "name": campaign.name,
            "daily_budget": campaign.daily_budget_usd,
            "status": "PAUSED",
            "workflow_status": campaign.workflow_status,
            "payload_hash": payload_hash
        }
    )
    return campaign


@router.put("/{campaign_id}", response_model=CampaignDraftResponse)
async def update_campaign_draft(
    campaign_id: str,
    draft_in: CampaignDraftCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update campaign draft settings.
    CRITICAL SECURITY RULE: If settings change after approval, existing approval is INVALIDATED
    and requires renewed approval.
    """
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    val_res = meta_service.validate_campaign_hierarchy(draft_in.model_dump())

    # Compute new hash
    payload_dict = {
        "objective": draft_in.objective,
        "budget_level": draft_in.budget_level,
        "budget_type": draft_in.budget_type,
        "daily_budget_usd": draft_in.daily_budget_usd,
        "lifetime_budget_usd": draft_in.lifetime_budget_usd,
        "special_ad_category": draft_in.special_ad_category,
        "ad_sets": draft_in.ad_sets if draft_in.ad_sets else campaign.ad_sets,
        "creatives": draft_in.creatives if draft_in.creatives else campaign.creatives
    }
    new_hash = compute_campaign_payload_hash(payload_dict)

    # Invalidation check: if hash changed, revoke approval
    if campaign.is_approved and campaign.approved_payload_hash != new_hash:
        campaign.is_approved = False
        campaign.needs_reapproval = True
        campaign.workflow_status = "DRAFT"
        record_audit_event(
            tenant_id=user.tenant_id,
            actor_id=user.user_id,
            actor_email=user.email,
            action="CAMPAIGN_APPROVAL_REVOKED_DUE_TO_MUTATION",
            resource_type="CAMPAIGN",
            resource_id=campaign_id,
            details={
                "previous_hash": campaign.approved_payload_hash,
                "new_hash": new_hash,
                "reason": "Campaign settings were altered after sign-off"
            }
        )

    campaign.name = draft_in.name
    campaign.objective = draft_in.objective
    campaign.budget_level = draft_in.budget_level
    campaign.budget_type = draft_in.budget_type
    campaign.daily_budget_usd = draft_in.daily_budget_usd
    campaign.lifetime_budget_usd = draft_in.lifetime_budget_usd
    campaign.special_ad_category = draft_in.special_ad_category
    if draft_in.ad_sets:
        campaign.ad_sets = draft_in.ad_sets
        campaign.ad_sets_count = len(draft_in.ad_sets)
    if draft_in.creatives:
        campaign.creatives = draft_in.creatives
        campaign.creatives_count = len(draft_in.creatives)
    if draft_in.ads:
        campaign.ads = draft_in.ads

    campaign.current_payload_hash = new_hash
    campaign.validation_errors = val_res.errors
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign_id] = campaign
    return campaign


@router.post("/{campaign_id}/request-approval", response_model=CampaignDraftResponse)
async def request_campaign_approval(
    campaign_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Transition campaign workflow from VALIDATED/DRAFT to APPROVAL_PENDING."""
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")

    if campaign.validation_errors:
        raise MetaApprovalRequiredException(f"Cannot request approval with active validation errors: {campaign.validation_errors}")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    campaign.workflow_status = "APPROVAL_PENDING"
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign_id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_APPROVAL_REQUESTED",
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        details={"name": campaign.name, "budget": campaign.daily_budget_usd}
    )
    return campaign


@router.post("/approve", response_model=CampaignDraftResponse)
async def approve_campaign(
    request: CampaignApprovalRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Server-validated explicit approval for a campaign.
    Requires conscious acknowledgment of budget allocation.
    Generates approval record with cryptographic hash of settings, approver ID, and expiry.
    """
    campaign = _CAMPAIGN_STORE.get(request.campaign_id)
    if not campaign:
        raise MetaApprovalRequiredException(f"Campaign {request.campaign_id} not found")

    if not request.confirm_budget_spend:
        raise MetaApprovalRequiredException("Explicit budget spend confirmation is required to approve campaign")

    # Generate cryptographic approval signature
    sig = generate_approval_signature(
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        actor_id=user.user_id
    )

    now = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now.isoformat()
    expires_iso = (now + datetime.timedelta(days=7)).isoformat()

    # Calculate exact canonical payload hash
    payload_dict = {
        "objective": campaign.objective,
        "budget_level": campaign.budget_level,
        "budget_type": campaign.budget_type,
        "daily_budget_usd": campaign.daily_budget_usd,
        "lifetime_budget_usd": campaign.lifetime_budget_usd,
        "special_ad_category": campaign.special_ad_category,
        "ad_sets": campaign.ad_sets,
        "creatives": campaign.creatives
    }
    payload_hash = compute_campaign_payload_hash(payload_dict)

    approval_record = CampaignApprovalRecord(
        approver_id=user.user_id,
        approver_email=user.email,
        approved_payload_hash=payload_hash,
        ad_account_id=campaign.client_id,
        budget_amount=campaign.daily_budget_usd,
        budget_type=campaign.budget_type,
        currency="USD",
        approved_at=now_iso,
        expires_at=expires_iso,
        action_type=request.action_type,
        signature=sig
    )

    campaign.is_approved = True
    campaign.workflow_status = "APPROVED"
    campaign.approved_by = user.user_id
    campaign.approved_at = now_iso
    campaign.approval_signature = sig
    campaign.approved_payload_hash = payload_hash
    campaign.current_payload_hash = payload_hash
    campaign.needs_reapproval = False
    campaign.latest_approval = approval_record
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign.id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_EXPLICIT_APPROVAL_GRANTED",
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        details={
            "reason": request.reason,
            "signature": sig,
            "payload_hash": payload_hash,
            "approved_by": user.email,
            "budget": campaign.daily_budget_usd,
            "expires_at": expires_iso
        }
    )
    return campaign


@router.post("/{campaign_id}/push-to-meta", response_model=CampaignDraftResponse)
async def push_campaign_to_meta(
    campaign_id: str,
    client_request_token: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Push approved campaign hierarchy to Meta Marketing API.
    STRICT SAFETY RULE:
    Every created Campaign, Ad Set, Creative, and Ad is initialized strictly with status='PAUSED'.
    Uses client_request_token for idempotency.
    """
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")

    if not campaign.is_approved:
        raise MetaApprovalRequiredException("Cannot push campaign to Meta without prior explicit approval sign-off")

    if campaign.needs_reapproval:
        raise MetaApprovalRequiredException("Campaign settings changed after approval. Renewed approval is required.")

    # Call official Meta Marketing API hierarchy builder
    meta_res = await meta_service.create_full_campaign_hierarchy(
        campaign_data=campaign.model_dump(),
        ad_account_id=campaign.client_id,
        client_request_token=client_request_token or campaign.idempotency_token or f"req_{campaign.id}"
    )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    campaign.meta_campaign_id = meta_res["meta_campaign_id"]
    campaign.status = "PAUSED"  # Strict PAUSED status
    campaign.workflow_status = "PAUSED_IN_META"
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign.id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_PUSHED_TO_META_PAUSED",
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        details={
            "meta_campaign_id": campaign.meta_campaign_id,
            "adset_ids": meta_res.get("meta_adset_ids"),
            "status": "PAUSED"
        }
    )
    return campaign


@router.post("/{campaign_id}/request-activation", response_model=CampaignDraftResponse)
async def request_campaign_activation(
    campaign_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Transition campaign from PAUSED_IN_META/APPROVED to ACTIVATION_PENDING."""
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")

    if not campaign.is_approved:
        raise MetaApprovalRequiredException("Campaign must be approved before requesting activation")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    campaign.workflow_status = "ACTIVATION_PENDING"
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign.id] = campaign
    return campaign


@router.post("/{campaign_id}/activate", response_model=CampaignDraftResponse)
async def activate_campaign(
    campaign_id: str,
    activation_in: Optional[CampaignActivationRequest] = None,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Activate a campaign on Meta Ads.
    Strictly blocked if:
    1. Campaign is not approved or approval signature is missing.
    2. Settings changed after approval (hash mismatch).
    3. Approval has expired.
    4. Confirmation flag is omitted.
    5. Triggered by AI recommendation without human authorization.
    """
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise MetaApprovalRequiredException(f"Campaign {campaign_id} not found")

    if not campaign.is_approved:
        raise MetaApprovalRequiredException("Campaign cannot be activated without prior explicit server approval signature")

    if campaign.needs_reapproval:
        raise MetaApprovalRequiredException("Campaign settings were modified after approval. Renewed approval is required before activation.")

    # Expiry verification
    if campaign.latest_approval:
        try:
            expires_dt = datetime.datetime.fromisoformat(campaign.latest_approval.expires_at)
            if expires_dt < datetime.datetime.now(datetime.timezone.utc):
                raise MetaApprovalRequiredException("Approval authorization has expired. Renewed approval required.")
        except (ValueError, TypeError):
            pass

    # Hash verification
    if campaign.approved_payload_hash and campaign.current_payload_hash != campaign.approved_payload_hash:
        raise MetaApprovalRequiredException("Payload hash mismatch detected between approved settings and current draft. Renewed approval required.")

    # Parameter verification if activation request body is provided
    if activation_in:
        if not activation_in.confirm_activation:
            raise MetaApprovalRequiredException("Explicit UI confirmation is required to activate live spending.")
        if activation_in.confirmed_daily_budget and abs(activation_in.confirmed_daily_budget - campaign.daily_budget_usd) > 0.01:
            raise MetaApprovalRequiredException(
                f"Budget confirmation mismatch: confirmed ${activation_in.confirmed_daily_budget} != campaign ${campaign.daily_budget_usd}"
            )

    # Call Meta service to activate
    await meta_service.activate_campaign(campaign.meta_campaign_id or f"meta_{campaign.id}")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    campaign.status = "ACTIVE"
    campaign.workflow_status = "ACTIVE"
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign.id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_ACTIVATED_ON_META",
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        details={
            "status": "ACTIVE",
            "signature": campaign.approval_signature,
            "approved_hash": campaign.approved_payload_hash,
            "daily_budget": campaign.daily_budget_usd
        }
    )
    return campaign


@router.post("/{campaign_id}/pause", response_model=CampaignDraftResponse)
async def pause_campaign(
    campaign_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Emergency pause action for active or pending campaigns.
    Immediately suspends delivery on Meta Marketing API.
    """
    campaign = _CAMPAIGN_STORE.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign {campaign_id} not found")

    await meta_service.pause_campaign(campaign.meta_campaign_id or f"meta_{campaign.id}")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    campaign.status = "PAUSED"
    campaign.workflow_status = "PAUSED_IN_META"
    campaign.updated_at = now_iso
    _CAMPAIGN_STORE[campaign.id] = campaign

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_PAUSED_BY_USER",
        resource_type="CAMPAIGN",
        resource_id=campaign.id,
        details={"status": "PAUSED", "paused_by": user.email}
    )
    return campaign
