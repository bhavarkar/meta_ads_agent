"""Instagram Reels asset validation, AI captions, approval binding, and Instagram Graph API publishing pipeline."""

import asyncio
import datetime
import hashlib
import hmac
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.config import settings
from app.schemas.reel import (
    ReelUploadRequest,
    ReelPreviewVerification,
    ReelValidationRequest,
    ReelValidationResponse,
    CaptionGenerationRequest,
    CaptionGenerationResponse,
    CaptionOption,
    CreativeSelectionRequest,
    CaptionUpdateRequest,
    ReelScheduleRequest,
    ReelResponse,
    ReelPublishRequest,
    ReelComparisonItem
)
from app.core.exceptions import ReelSafetyException
from app.core.security import generate_approval_signature, verify_approval_signature
from app.core.audit import record_audit_event
from app.services.demo_data_service import DEMO_REELS
from app.services.meta_service import meta_service


# In-memory store for reels drafts (hydrated with high-fidelity DEMO_REELS)
_REELS_DB: Dict[str, ReelResponse] = {r.id: r for r in DEMO_REELS}

# Idempotency cache to prevent duplicate publish requests
_PUBLISHED_IDEMPOTENCY_KEYS: Dict[str, str] = {}
_IN_FLIGHT_PUBLISH_LOCKS: set = set()


def compute_reel_binding_hash(media_url: str, caption: str, account_id: str, action: str = "PUBLISH_REEL_ORGANIC") -> str:
    """Generates SHA-256 fingerprint binding exact media, caption, account, and publication action."""
    raw = f"{media_url.strip()}|{caption.strip()}|{account_id.strip()}|{action.strip()}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


class ReelsService:
    @staticmethod
    def validate_asset_specs(specs: Dict[str, Any]) -> ReelValidationResponse:
        """Validate MIME type, file size, aspect ratio, duration, codecs, and rights."""
        errors: List[str] = []
        warnings: List[str] = []

        # 1. MIME Type check
        mime = specs.get("mime_type", "").lower()
        allowed_mimes = ["video/mp4", "video/quicktime", "video/x-m4v"]
        mime_valid = mime in allowed_mimes
        if not mime_valid:
            errors.append(f"Invalid MIME type '{mime}'. Only MP4 (video/mp4) or MOV (video/quicktime) are supported.")

        # 2. File size check (Max 100MB = 104,857,600 bytes)
        file_size = specs.get("file_size_bytes", 0)
        size_valid = 1000 <= file_size <= 104857600
        if file_size > 104857600:
            errors.append(f"File size ({file_size / (1024*1024):.1f}MB) exceeds Instagram Reels limit of 100MB.")
        elif file_size < 1000:
            errors.append("File size too small or video stream empty.")

        # 3. Aspect ratio check (Must be 9:16 vertical)
        width = specs.get("width", 1080)
        height = specs.get("height", 1920)
        ratio_decimal = width / height if height > 0 else 0
        expected_ratio = 9.0 / 16.0  # 0.5625
        aspect_ratio_detected = f"{width}:{height}"
        aspect_valid = abs(ratio_decimal - expected_ratio) <= 0.05
        if not aspect_valid:
            errors.append(f"Aspect ratio {aspect_ratio_detected} ({ratio_decimal:.3f}) is not 9:16 vertical. Instagram Reels requires 9:16 vertical framing.")

        # 4. Duration check (Between 3.0s and 90.0s)
        duration = specs.get("duration_seconds", 0.0)
        duration_valid = 3.0 <= duration <= 90.0
        if duration < 3.0:
            errors.append(f"Duration of {duration}s is too short. Minimum duration is 3.0s.")
        elif duration > 90.0:
            errors.append(f"Duration of {duration}s exceeds Instagram Reels limit of 90.0s.")

        # 5. Codec check
        v_codec = str(specs.get("video_codec", "")).upper()
        a_codec = str(specs.get("audio_codec", "AAC")).upper()
        allowed_v_codecs = ["H.264", "H264", "AVC", "HEVC", "H.265", "H265"]
        codec_valid = any(c in v_codec for c in allowed_v_codecs)
        if not codec_valid:
            errors.append(f"Video codec '{v_codec}' is unsupported. Video must be encoded in H.264/AVC or HEVC/H.265.")
        if "AAC" not in a_codec:
            warnings.append(f"Audio codec is '{a_codec}'. AAC audio is strongly recommended for seamless playback.")

        # 6. Rights check
        rights = specs.get("rights_ownership", "OWNED")
        is_competitor = specs.get("competitor_creative_blocked", False)
        rights_valid = rights in ("OWNED", "LICENSED") and not is_competitor
        if rights == "THIRD_PARTY_RESTRICTED":
            errors.append("Asset has third-party usage restrictions and cannot be cleared for commercial broadcast.")
        if is_competitor:
            errors.append("Competitor creative detected: Cannot publish third-party competitor creatives without verified commercial rights.")

        is_valid = len(errors) == 0

        return ReelValidationResponse(
            is_valid=is_valid,
            aspect_ratio_detected=aspect_ratio_detected,
            aspect_ratio_valid=aspect_valid,
            duration_valid=duration_valid,
            mime_valid=mime_valid,
            size_valid=size_valid,
            codec_valid=codec_valid,
            rights_valid=rights_valid,
            errors=errors,
            warnings=warnings
        )

    @classmethod
    def upload_reel_draft(
        cls,
        request: ReelUploadRequest,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        # Validate specifications
        specs_to_check = {
            "mime_type": request.mime_type or "video/mp4",
            "file_size_bytes": request.file_size_bytes or 24500000,
            "width": request.width or 1080,
            "height": request.height or 1920,
            "duration_seconds": request.duration_seconds or 22.0,
            "video_codec": request.video_codec or "H.264",
            "audio_codec": request.audio_codec or "AAC",
            "rights_ownership": request.rights_ownership or "OWNED",
            "competitor_creative_blocked": request.competitor_creative_blocked or False
        }
        val_res = cls.validate_asset_specs(specs_to_check)
        if not val_res.is_valid:
            raise ReelSafetyException(f"Video asset validation failed: {'; '.join(val_res.errors)}")

        new_id = f"reel_{int(datetime.datetime.now().timestamp())}"
        new_reel = ReelResponse(
            id=new_id,
            client_id=request.client_id,
            instagram_ig_id=None,
            title=request.title,
            video_url=request.video_url,
            thumbnail_url=request.thumbnail_url or "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
            caption=request.caption,
            hashtags=request.hashtags,
            status="DRAFT",
            duration_seconds=request.duration_seconds or 22.0,
            aspect_ratio="9:16",
            preview_verified=False,
            is_approved=False,
            approved_by=None,
            approved_at=None,
            approval_binding_hash=None,
            approval_signature=None,
            approval_invalidated=False,
            file_name=request.file_name or "reel_video.mp4",
            mime_type=request.mime_type or "video/mp4",
            file_size_bytes=request.file_size_bytes or 24500000,
            video_codec=request.video_codec or "H.264",
            audio_codec=request.audio_codec or "AAC",
            width=request.width or 1080,
            height=request.height or 1920,
            rights_ownership=request.rights_ownership or "OWNED",
            is_commercial_cleared=request.is_commercial_cleared if request.is_commercial_cleared is not None else True,
            competitor_creative_blocked=request.competitor_creative_blocked or False,
            origin=request.origin or "ORIGINAL_UPLOAD",
            ig_container_id=None,
            container_status=None,
            published_media_id=None,
            permalink=None,
            published_at=None,
            scheduled_at=None,
            retry_count=0,
            last_error=None,
            idempotency_key=None,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            is_demo=True,
            is_ad_creative=False,
            publishing_channel="ORGANIC_REEL"
        )
        _REELS_DB[new_id] = new_reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_DRAFT_CREATED",
            resource_type="INSTAGRAM_REEL",
            resource_id=new_id,
            details={"title": request.title, "client_id": request.client_id, "status": new_reel.status}
        )
        return new_reel

    @staticmethod
    def generate_captions(request: CaptionGenerationRequest) -> CaptionGenerationResponse:
        """Generate 3 tailored caption options with hooks, hashtags, and CTA variations."""
        industry = request.industry or "DTC Skincare & Beauty"
        audience = request.target_audience or "Customers seeking rapid results"
        topic = request.key_benefit_or_topic or "Transformative results in 72 hours"

        # Option 1: Hook & Curiosity Pattern Interrupt
        hook_1 = f"Stop doing what everyone told you about {topic.lower()}. Watch what happens in 72 hours."
        body_1 = (
            f"If you've been struggling to see results, it's not your fault. Most traditional products overload your routine "
            f"with filler ingredients that compromise long-term performance. Our clean bio-active formula strips away the fluff "
            f"so your skin gets exactly what it needs to rebuild."
        )
        cta_1 = "Save this Reel so you don't forget, and tap the link in bio to test it with our 30-day empty bottle guarantee."
        tags_1 = ["#skincareroutine", "#cleanbeauty", "#barrierrepair", "#skintok", "#beautyhacks"]
        full_1 = f"{hook_1}\n\n{body_1}\n\n👉 {cta_1}\n\n{' '.join(tags_1)}"

        # Option 2: Problem-Agitate-Solve / Clinical Value
        hook_2 = f"If your skin feels irritated or dry after cleansing, your barrier is crying for help."
        body_2 = (
            f"We put our formulation through clinical dermatological testing against standard moisturizers. "
            f"The result? 3.4x deeper cellular moisture retention and 94% reported noticeable redness reduction in under 3 days. "
            f"Zero synthetic fragrances. Zero harsh sulfates."
        )
        cta_2 = "Comment 'BARRIER' below and we'll DM you the clinical trial breakdown plus an exclusive 20% discount code."
        tags_2 = ["#dermatologytips", "#skinscience", "#barrierhealth", "#clinicalskincare", "#glowingskin"]
        full_2 = f"{hook_2}\n\n{body_2}\n\n👉 {cta_2}\n\n{' '.join(tags_2)}"

        # Option 3: Punchy Social Proof & Minimalist Routine
        hook_3 = "The exact reason 12,000+ people tossed out their 10-step routine for this 1 bottle."
        body_3 = (
            f"Consistency > Complexity. When you replace 10 mediocre products with 1 high-potency clinical formulation, "
            f"magic happens. Real results, real customer proof, zero wasted vanity space."
        )
        cta_3 = "Tap the link in bio to grab yours before our batch sells out. Free shipping on all orders today."
        tags_3 = ["#minimalistskincare", "#holygrail", "#skincaretips", "#beautyroutine", "#transformation"]
        full_3 = f"{hook_3}\n\n{body_3}\n\n👉 {cta_3}\n\n{' '.join(tags_3)}"

        options = [
            CaptionOption(
                id="cap_opt_1",
                angle_name="Curiosity Hook & Story Pattern Interrupt",
                hook=hook_1,
                body=body_1,
                cta=cta_1,
                hashtags=tags_1,
                full_caption=full_1,
                tone="Curiosity-Driven / Pattern Interrupt"
            ),
            CaptionOption(
                id="cap_opt_2",
                angle_name="Problem-Agitate-Solve & Clinical Data",
                hook=hook_2,
                body=body_2,
                cta=cta_2,
                hashtags=tags_2,
                full_caption=full_2,
                tone="Authoritative / Clinical Proof"
            ),
            CaptionOption(
                id="cap_opt_3",
                angle_name="High-Energy Social Proof & Direct Offer",
                hook=hook_3,
                body=body_3,
                cta=cta_3,
                hashtags=tags_3,
                full_caption=full_3,
                tone="High-Converting DTC / Urgent"
            )
        ]

        suggested_hooks = [
            hook_1,
            hook_2,
            hook_3,
            f"Why 90% of people are using {topic.lower()} completely wrong.",
            "Watch this before you buy another skincare product this year."
        ]

        recommended_hashtags = {
            "niche": ["#skinbarrierrepair", "#ceramideserums", "#cellularhydration"],
            "industry": ["#skincareroutine", "#beautytips", "#cleanbeauty"],
            "trending": ["#skintok", "#glowup", "#skincaretips"],
            "community": ["#estheticiantips", "#dermatologistapproved", "#beautycommunity"]
        }

        cta_variations = [
            "Tap link in bio to shop now with 20% off",
            "Save this Reel for your next routine update",
            "Comment 'GLOW' below for the direct shopping link",
            "Share this with a friend whose barrier needs saving"
        ]

        return CaptionGenerationResponse(
            client_id=request.client_id,
            options=options,
            suggested_hooks=suggested_hooks,
            recommended_hashtags=recommended_hashtags,
            cta_variations=cta_variations
        )

    @classmethod
    def select_creative(
        cls,
        reel_id: str,
        request: CreativeSelectionRequest,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """Select chosen Reel and chosen caption, transitioning state to READY."""
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        # Invalidate prior approval if creative was already approved
        was_approved = reel.is_approved
        reel.caption = request.caption
        if request.hashtags:
            reel.hashtags = request.hashtags

        reel.status = "READY"
        reel.preview_verified = True
        reel.is_approved = False
        reel.approval_invalidated = was_approved
        reel.approval_signature = None
        reel.approval_binding_hash = None
        _REELS_DB[reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_CREATIVE_SELECTED",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"caption_preview": reel.caption[:60], "status": "READY", "was_previously_approved": was_approved}
        )
        return reel

    @classmethod
    def update_caption(
        cls,
        reel_id: str,
        request: CaptionUpdateRequest,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """Update caption manually. If already approved, invalidate approval signature!"""
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        was_approved = reel.is_approved
        reel.caption = request.caption
        if request.hashtags is not None:
            reel.hashtags = request.hashtags

        # Security rule: Never reuse approval after changes
        if was_approved:
            reel.is_approved = False
            reel.status = "READY"
            reel.approval_invalidated = True
            reel.approval_signature = None
            reel.approval_binding_hash = None
            record_audit_event(
                tenant_id=tenant_id,
                actor_id=actor_id,
                actor_email=actor_email,
                action="REEL_APPROVAL_REVOKED_DUE_TO_MUTATION",
                resource_type="INSTAGRAM_REEL",
                resource_id=reel.id,
                details={"reason": "Caption modified post-approval"}
            )
        else:
            if reel.status == "DRAFT":
                reel.status = "READY"

        _REELS_DB[reel_id] = reel
        return reel

    @classmethod
    def request_approval(
        cls,
        reel_id: str,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """Submit Reel for final explicit review and sign-off."""
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        if reel.status not in ("READY", "PREVIEW_VERIFIED"):
            raise ReelSafetyException(f"Reel must be in READY state before requesting approval (current: {reel.status})")

        reel.status = "APPROVAL_PENDING"
        _REELS_DB[reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_APPROVAL_REQUESTED",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"title": reel.title}
        )
        return reel

    @classmethod
    def approve_for_publishing(
        cls,
        reel_id: str,
        actor_id: str,
        actor_email: str,
        tenant_id: str,
        target_instagram_account_id: Optional[str] = None
    ) -> ReelResponse:
        """
        Grant explicit approval. Cryptographically binds exact media, caption, target account, and action.
        """
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        # Enforce valid prior state and preview verification
        valid_prior_states = ("READY", "APPROVAL_PENDING", "PREVIEW_VERIFIED")
        if not reel.preview_verified or reel.status not in valid_prior_states:
            raise ReelSafetyException(f"Cannot approve Reel before preview verification is complete (current: {reel.status})")

        # Security check: Do not publish third-party competitor creatives without usage rights
        if reel.competitor_creative_blocked or reel.rights_ownership == "THIRD_PARTY_RESTRICTED":
            raise ReelSafetyException("Cannot approve competitor or third-party restricted creative without cleared commercial license.")

        account_id = target_instagram_account_id or reel.instagram_ig_id or "1788203918239012"

        # Compute cryptographic binding hash
        binding_hash = compute_reel_binding_hash(
            media_url=reel.video_url,
            caption=reel.caption,
            account_id=account_id,
            action="PUBLISH_REEL_ORGANIC"
        )
        signature = generate_approval_signature(
            resource_type="INSTAGRAM_REEL",
            resource_id=f"{reel_id}:{binding_hash[:16]}",
            actor_id=actor_id
        )

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        reel.is_approved = True
        reel.approved_by = actor_id
        reel.approved_at = now_iso
        reel.approval_binding_hash = binding_hash
        reel.approval_signature = signature
        reel.approval_invalidated = False
        reel.status = "APPROVED"
        _REELS_DB[reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_EXPLICIT_APPROVAL_GRANTED",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"approved_by": actor_id, "binding_hash": binding_hash, "account_id": account_id}
        )
        return reel

    @classmethod
    async def publish_reel(
        cls,
        request: ReelPublishRequest,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """
        Safely gated Instagram Reel publishing via Graph API media container pipeline.
        Enforces approval binding, duplicate prevention, retries, and audit trails.
        """
        reel = _REELS_DB.get(request.reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {request.reel_id} not found")

        # 1. Duplicate publish prevention check (via idempotency key or existing published status)
        idempotency_key = request.idempotency_key or f"idem_{reel.id}_{reel.approval_binding_hash[:12] if reel.approval_binding_hash else 'std'}"
        if idempotency_key in _PUBLISHED_IDEMPOTENCY_KEYS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Duplicate publish attempt blocked. Reel {reel.id} was already published under idempotency key {idempotency_key}."
            )

        if reel.status == "PUBLISHED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Reel {reel.id} is already published at permalink: {reel.permalink}"
            )

        if reel.id in _IN_FLIGHT_PUBLISH_LOCKS or reel.status == "PROCESSING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Reel {reel.id} is currently processing publication. Duplicate publish request blocked."
            )

        # 2. State and approval check
        if not reel.is_approved or reel.status not in ("APPROVED", "APPROVED_FOR_PUBLISHING"):
            raise ReelSafetyException("Server-validated explicit approval is required prior to publishing")

        if not request.confirm_publish_live:
            raise ReelSafetyException("Explicit live publish confirmation must be granted")

        # 3. Re-verify approval binding hash to prevent tampering
        account_id = request.target_instagram_account_id or reel.instagram_ig_id or "1788203918239012"
        expected_binding_hash = compute_reel_binding_hash(
            media_url=reel.video_url,
            caption=reel.caption,
            account_id=account_id,
            action="PUBLISH_REEL_ORGANIC"
        )
        if reel.approval_binding_hash and reel.approval_binding_hash != expected_binding_hash:
            reel.is_approved = False
            reel.status = "READY"
            reel.approval_invalidated = True
            _REELS_DB[request.reel_id] = reel
            raise ReelSafetyException("Approval signature mismatch: Media or caption was modified after approval. Re-approval required.")

        # 4. Security: Check usage rights
        if reel.competitor_creative_blocked or reel.rights_ownership == "THIRD_PARTY_RESTRICTED":
            raise ReelSafetyException("Cannot publish third-party competitor creatives without appropriate usage rights.")

        # 5. Lock in-flight processing
        _IN_FLIGHT_PUBLISH_LOCKS.add(reel.id)
        reel.status = "PROCESSING"
        reel.container_status = "IN_PROGRESS"
        _REELS_DB[request.reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_PUBLISHING_STARTED",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"account_id": account_id, "idempotency_key": idempotency_key}
        )

        try:
            # 6. Check Instagram permissions
            perm_check = await meta_service.check_instagram_publishing_permissions(account_id)
            if not perm_check.get("eligible", False):
                missing = perm_check.get("missing_permissions", [])
                raise ReelSafetyException(f"Missing required Instagram publishing permissions: {', '.join(missing)}")

            # 7. Step 1: Create media container
            full_caption = f"{reel.caption}\n\n{' '.join(reel.hashtags)}".strip()
            container = await meta_service.create_reel_container(
                video_url=reel.video_url,
                caption=full_caption,
                ig_account_id=account_id
            )
            container_id = container.get("id") or container.get("container_id")
            reel.ig_container_id = container_id

            # 8. Step 2: Poll container status
            poll_result = await meta_service.poll_reel_container_status(container_id)
            status_code = poll_result.get("status_code", "FINISHED")

            if status_code in ("ERROR", "EXPIRED"):
                error_msg = f"Instagram container processing failed: {poll_result.get('status', 'Unknown error')}"
                reel.status = "FAILED"
                reel.container_status = status_code
                reel.last_error = error_msg
                reel.retry_count += 1
                _REELS_DB[request.reel_id] = reel
                record_audit_event(
                    tenant_id=tenant_id,
                    actor_id=actor_id,
                    actor_email=actor_email,
                    action="REEL_PUBLISH_FAILED",
                    resource_type="INSTAGRAM_REEL",
                    resource_id=reel.id,
                    details={"error": error_msg, "container_id": container_id}
                )
                raise ReelSafetyException(error_msg)

            # 9. Step 3: Publish container to live Instagram Reels feed
            pub_result = await meta_service.publish_reel_container(container_id, account_id)
            media_id = pub_result.get("id")
            permalink = pub_result.get("permalink", f"https://www.instagram.com/reel/DEMO_{media_id}/")

            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            reel.status = "PUBLISHED"
            reel.container_status = "FINISHED"
            reel.published_media_id = media_id
            reel.permalink = permalink
            reel.published_at = now_iso
            reel.idempotency_key = idempotency_key
            _PUBLISHED_IDEMPOTENCY_KEYS[idempotency_key] = reel.id
            _REELS_DB[request.reel_id] = reel

            record_audit_event(
                tenant_id=tenant_id,
                actor_id=actor_id,
                actor_email=actor_email,
                action="REEL_PUBLISHED_TO_INSTAGRAM",
                resource_type="INSTAGRAM_REEL",
                resource_id=reel.id,
                details={"permalink": permalink, "media_id": media_id, "account_id": account_id}
            )
            return reel

        except ReelSafetyException:
            raise
        except Exception as exc:
            reel.status = "FAILED"
            reel.last_error = str(exc)
            reel.retry_count += 1
            _REELS_DB[request.reel_id] = reel
            record_audit_event(
                tenant_id=tenant_id,
                actor_id=actor_id,
                actor_email=actor_email,
                action="REEL_PUBLISH_FAILED",
                resource_type="INSTAGRAM_REEL",
                resource_id=reel.id,
                details={"error": str(exc), "retry_count": reel.retry_count}
            )
            raise ReelSafetyException(f"Instagram publishing failed: {str(exc)}")
        finally:
            _IN_FLIGHT_PUBLISH_LOCKS.discard(reel.id)

    @classmethod
    async def retry_publish(
        cls,
        reel_id: str,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """Retry a failed Reel publication if approval is valid and max retries not exceeded."""
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        if reel.status != "FAILED":
            raise ReelSafetyException(f"Cannot retry publication for reel with status '{reel.status}'. Only FAILED reels can be retried.")

        if reel.retry_count >= 3:
            raise ReelSafetyException("Maximum publishing retry attempts (3) exceeded. Please review video asset and permissions.")

        # Re-arm as APPROVED to re-attempt pipeline
        reel.status = "APPROVED"
        _REELS_DB[reel_id] = reel

        request = ReelPublishRequest(reel_id=reel_id, confirm_publish_live=True)
        return await cls.publish_reel(request, actor_id, actor_email, tenant_id)

    @classmethod
    def schedule_reel(
        cls,
        reel_id: str,
        scheduled_at: str,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        """Add Reel to Content Calendar for scheduled publication."""
        reel = _REELS_DB.get(reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {reel_id} not found")

        reel.scheduled_at = scheduled_at
        _REELS_DB[reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_SCHEDULED_ON_CALENDAR",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"scheduled_at": scheduled_at}
        )
        return reel

    @classmethod
    def compare_reels(cls, reel_ids: List[str]) -> List[ReelComparisonItem]:
        """Generate side-by-side comparison analytics for multiple candidate Reels."""
        results: List[ReelComparisonItem] = []
        for rid in reel_ids:
            reel = _REELS_DB.get(rid)
            if not reel:
                continue

            # Extract opening hook
            hook = reel.caption.split(".")[0] if "." in reel.caption else reel.caption[:50]
            # Calculate pacing & clarity heuristics
            duration = reel.duration_seconds
            pacing_score = 95 if (15.0 <= duration <= 30.0) else (85 if duration < 15.0 else 78)
            clarity_score = 92 if reel.width >= 1080 else 80
            potential = "HIGH (Viral pattern interrupt)" if pacing_score >= 90 else "SOLID (Steady discovery)"

            results.append(ReelComparisonItem(
                reel=reel,
                opening_hook=hook,
                pacing_score=pacing_score,
                visual_clarity_score=clarity_score,
                engagement_potential=potential
            ))
        return results

    # Compatibility method for existing preview verification
    @classmethod
    def verify_preview(
        cls,
        verification: ReelPreviewVerification,
        actor_id: str,
        actor_email: str,
        tenant_id: str
    ) -> ReelResponse:
        reel = _REELS_DB.get(verification.reel_id)
        if not reel:
            raise ReelSafetyException(f"Reel {verification.reel_id} not found")

        if not verification.aspect_ratio_valid:
            raise ReelSafetyException("Reel must have a 9:16 vertical aspect ratio")

        if not (3.0 <= verification.duration_seconds <= 90.0):
            raise ReelSafetyException("Reel duration must be between 3 and 90 seconds")

        if not verification.preview_reviewed_by_user:
            raise ReelSafetyException("Visual preview review confirmation is mandatory")

        reel.preview_verified = True
        reel.duration_seconds = verification.duration_seconds
        reel.status = "READY"
        _REELS_DB[verification.reel_id] = reel

        record_audit_event(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action="REEL_PREVIEW_VERIFIED",
            resource_type="INSTAGRAM_REEL",
            resource_id=reel.id,
            details={"duration": verification.duration_seconds}
        )
        return reel

    @staticmethod
    def list_reels(client_id: Optional[str] = None, status_filter: Optional[str] = None) -> List[ReelResponse]:
        items = list(_REELS_DB.values())
        if client_id:
            items = [r for r in items if r.client_id == client_id]
        if status_filter:
            items = [r for r in items if r.status == status_filter]
        return sorted(items, key=lambda r: r.created_at, reverse=True)


reels_service = ReelsService()
