"""Test suite verifying Instagram Reels safety, preview approval, publishing guardrails, and compliance."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_reel_aspect_ratio_and_duration_enforcement():
    """Verify non-9:16 or out-of-range reels are blocked."""
    # 1. Upload draft with invalid aspect ratio (16:9 landscape 1920x1080)
    upload_res = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Invalid Aspect Ratio Test",
        "video_url": "https://example.com/test.mp4",
        "caption": "Testing aspect ratio guardrail",
        "hashtags": ["#test"],
        "width": 1920,
        "height": 1080
    })
    assert upload_res.status_code == 422
    assert "aspect ratio" in upload_res.json()["detail"].lower()

    # 2. Upload with duration > 90s
    upload_res2 = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Invalid Duration Test",
        "video_url": "https://example.com/test.mp4",
        "caption": "Testing duration guardrail",
        "hashtags": ["#test"],
        "duration_seconds": 120.0
    })
    assert upload_res2.status_code == 422
    assert "duration" in upload_res2.json()["detail"].lower()


def test_reel_invalid_mime_and_codec_validation():
    """Verify invalid MIME types (e.g. AVI or JPEG) and unsupported codecs are rejected."""
    # Invalid MIME type
    spec_val = client.post("/api/v1/reels/validate-specs", json={
        "mime_type": "video/x-msvideo",
        "file_size_bytes": 15000000,
        "duration_seconds": 25.0,
        "width": 1080,
        "height": 1920,
        "video_codec": "H.264"
    })
    assert spec_val.status_code == 200
    data = spec_val.json()
    assert data["is_valid"] is False
    assert any("mime type" in err.lower() for err in data["errors"])

    # File size exceeding 100MB
    spec_val2 = client.post("/api/v1/reels/validate-specs", json={
        "mime_type": "video/mp4",
        "file_size_bytes": 150000000,  # 150MB > 100MB
        "duration_seconds": 25.0,
        "width": 1080,
        "height": 1920,
        "video_codec": "H.264"
    })
    assert spec_val2.json()["is_valid"] is False
    assert any("exceeds" in err.lower() for err in spec_val2.json()["errors"])

    # Unsupported video codec
    spec_val3 = client.post("/api/v1/reels/validate-specs", json={
        "mime_type": "video/mp4",
        "file_size_bytes": 15000000,
        "duration_seconds": 25.0,
        "width": 1080,
        "height": 1920,
        "video_codec": "WMV3"
    })
    assert spec_val3.json()["is_valid"] is False
    assert any("codec" in err.lower() for err in spec_val3.json()["errors"])


def test_competitor_creative_blocking_without_rights():
    """Ensure competitor creatives and third-party restricted assets are blocked from publishing."""
    # Upload marked as competitor creative
    upload_res = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Competitor Ad Rip Test",
        "video_url": "https://example.com/competitor.mp4",
        "caption": "Copied competitor ad",
        "rights_ownership": "THIRD_PARTY_RESTRICTED",
        "competitor_creative_blocked": True
    })
    assert upload_res.status_code == 422
    assert "competitor" in upload_res.json()["detail"].lower() or "third-party" in upload_res.json()["detail"].lower()


def test_ai_caption_assistant():
    """Verify AI Caption Assistant generates 3 distinct options with hooks, hashtags, and CTA variations."""
    res = client.post("/api/v1/reels/generate-captions", json={
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare & Beauty",
        "target_audience": "Women 25-40 with sensitive skin",
        "key_benefit_or_topic": "Ceramide barrier repair in 72 hours"
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["options"]) == 3
    assert len(data["suggested_hooks"]) >= 3
    assert "niche" in data["recommended_hashtags"]
    assert len(data["cta_variations"]) >= 3
    # Check that each option contains hook, body, CTA, and hashtags
    for opt in data["options"]:
        assert len(opt["hook"]) > 0
        assert len(opt["body"]) > 0
        assert len(opt["cta"]) > 0
        assert len(opt["hashtags"]) > 0


def test_approval_tampering_revokes_approval():
    """Ensure modifying caption or creative post-approval immediately invalidates the approval signature."""
    # 1. Upload valid reel
    upload_res = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Tamper Test Reel",
        "video_url": "https://example.com/tamper.mp4",
        "caption": "Original safe caption",
        "hashtags": ["#safe"]
    })
    reel_id = upload_res.json()["id"]

    # 2. Verify preview -> READY
    verify_res = client.post("/api/v1/reels/verify-preview", json={
        "reel_id": reel_id,
        "aspect_ratio_valid": True,
        "duration_seconds": 20.0,
        "preview_reviewed_by_user": True
    })
    assert verify_res.status_code == 200

    # 3. Approve -> APPROVED with binding hash & signature
    appr_res = client.post(f"/api/v1/reels/{reel_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "APPROVED"
    assert appr_res.json()["is_approved"] is True
    assert appr_res.json()["approval_binding_hash"] is not None

    # 4. Modify caption
    mod_res = client.patch(f"/api/v1/reels/{reel_id}/caption", json={
        "caption": "TAMPERED: Scam offer with fraudulent claims!"
    })
    assert mod_res.status_code == 200
    assert mod_res.json()["is_approved"] is False
    assert mod_res.json()["approval_invalidated"] is True
    assert mod_res.json()["status"] == "READY"

    # 5. Publishing attempt should fail because approval was revoked
    pub_res = client.post("/api/v1/reels/publish", json={
        "reel_id": reel_id,
        "confirm_publish_live": True
    })
    assert pub_res.status_code == 422
    assert "approval is required" in pub_res.json()["detail"].lower()


def test_duplicate_publish_prevention():
    """Verify duplicate publish attempts under same idempotency key or already published status are blocked."""
    # 1. Upload & advance to APPROVED
    upload_res = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Idempotency Test Reel",
        "video_url": "https://example.com/idempotency.mp4",
        "caption": "Idempotency test caption",
        "hashtags": ["#idempotent"]
    })
    reel_id = upload_res.json()["id"]

    client.post("/api/v1/reels/verify-preview", json={
        "reel_id": reel_id,
        "aspect_ratio_valid": True,
        "duration_seconds": 18.0,
        "preview_reviewed_by_user": True
    })
    client.post(f"/api/v1/reels/{reel_id}/approve")

    # 2. First publish
    pub1 = client.post("/api/v1/reels/publish", json={
        "reel_id": reel_id,
        "confirm_publish_live": True,
        "idempotency_key": f"key_test_{reel_id}"
    })
    assert pub1.status_code == 200
    assert pub1.json()["status"] == "PUBLISHED"

    # 3. Duplicate publish attempt with same idempotency key must be blocked (HTTP 409)
    pub2 = client.post("/api/v1/reels/publish", json={
        "reel_id": reel_id,
        "confirm_publish_live": True,
        "idempotency_key": f"key_test_{reel_id}"
    })
    assert pub2.status_code == 409
    assert "duplicate" in pub2.json()["detail"].lower() or "already published" in pub2.json()["detail"].lower()


def test_full_reel_publish_lifecycle():
    """Verify full compliant publishing states: DRAFT -> READY -> APPROVAL_PENDING -> APPROVED -> PROCESSING -> PUBLISHED."""
    # 1. Upload draft -> DRAFT
    upload_res = client.post("/api/v1/reels/upload", json={
        "client_id": "cli_lumina_glow",
        "title": "Full Lifecycle Studio Reel",
        "video_url": "https://example.com/lifecycle.mp4",
        "caption": "Full lifecycle caption",
        "hashtags": ["#metapilot", "#reels"]
    })
    assert upload_res.status_code == 201
    reel_id = upload_res.json()["id"]
    assert upload_res.json()["status"] == "DRAFT"

    # 2. Premature approval blocked
    premature_appr = client.post(f"/api/v1/reels/{reel_id}/approve")
    assert premature_appr.status_code == 422

    # 3. Preview verification -> READY
    verify_res = client.post("/api/v1/reels/verify-preview", json={
        "reel_id": reel_id,
        "aspect_ratio_valid": True,
        "duration_seconds": 22.5,
        "preview_reviewed_by_user": True
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] in ("READY", "PREVIEW_VERIFIED")

    # 4. Request approval -> APPROVAL_PENDING
    req_appr = client.post(f"/api/v1/reels/{reel_id}/request-approval")
    assert req_appr.status_code == 200
    assert req_appr.json()["status"] == "APPROVAL_PENDING"

    # 5. Explicit approval -> APPROVED
    appr_res = client.post(f"/api/v1/reels/{reel_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] in ("APPROVED", "APPROVED_FOR_PUBLISHING")
    assert appr_res.json()["is_approved"] is True
    assert appr_res.json()["approval_binding_hash"] is not None

    # 6. Content Calendar scheduling
    sched_res = client.post(f"/api/v1/reels/{reel_id}/schedule", json={
        "scheduled_at": "2026-10-25T15:00:00Z"
    })
    assert sched_res.status_code == 200
    assert sched_res.json()["scheduled_at"] == "2026-10-25T15:00:00Z"

    # 7. Publish -> PUBLISHED (with permalink)
    pub_res = client.post("/api/v1/reels/publish", json={
        "reel_id": reel_id,
        "confirm_publish_live": True
    })
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"
    assert pub_res.json()["permalink"] is not None
    assert "instagram.com" in pub_res.json()["permalink"]
    assert pub_res.json()["is_demo"] is True
    assert pub_res.json()["is_ad_creative"] is False
