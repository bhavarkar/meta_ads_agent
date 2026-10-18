"""Instagram Reels publishing, validation, AI captions, and verification schemas."""

import hashlib
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field


ReelStatus = Literal[
    "DRAFT",
    "READY",
    "APPROVAL_PENDING",
    "APPROVED",
    "PROCESSING",
    "PUBLISHED",
    "FAILED",
    "PREVIEW_VERIFIED",          # Legacy alias for READY
    "APPROVED_FOR_PUBLISHING"    # Legacy alias for APPROVED
]

RightsOwnership = Literal["OWNED", "LICENSED", "THIRD_PARTY_RESTRICTED"]
AssetOrigin = Literal["ORIGINAL_UPLOAD", "COMPETITOR_BENCHMARK"]
PublishingChannel = Literal["ORGANIC_REEL", "PAID_AD_CAMPAIGN"]


class MediaAssetSpecs(BaseModel):
    file_name: str = "reel_video.mp4"
    mime_type: Literal["video/mp4", "video/quicktime", "video/x-m4v"] = "video/mp4"
    file_size_bytes: int = Field(default=24500000, description="Video size in bytes. Max 100MB for Reels")
    aspect_ratio: str = Field(default="9:16", description="Must be 9:16 vertical ratio")
    width: int = Field(default=1080, ge=540)
    height: int = Field(default=1920, ge=960)
    duration_seconds: float = Field(default=22.0, ge=3.0, le=90.0)
    video_codec: str = Field(default="H.264", description="Allowed: H.264, AVC, HEVC/H.265")
    audio_codec: str = Field(default="AAC", description="Required: AAC")
    fps: float = Field(default=30.0, ge=23.0, le=60.0)


class AssetRightsInfo(BaseModel):
    rights_ownership: RightsOwnership = "OWNED"
    is_commercial_cleared: bool = True
    competitor_creative_blocked: bool = False
    origin: AssetOrigin = "ORIGINAL_UPLOAD"
    usage_license_details: Optional[str] = "Full internal commercial broadcast license"


class CaptionOption(BaseModel):
    id: str
    angle_name: str = Field(..., description="E.g. Hook-driven pattern interrupt, Problem-Agitate-Solve, Social proof")
    hook: str
    body: str
    cta: str
    hashtags: List[str]
    full_caption: str
    tone: str = "High-Converting DTC"


class CaptionGenerationRequest(BaseModel):
    client_id: str
    industry: Optional[str] = "DTC Skincare & Beauty"
    target_audience: Optional[str] = "Women 22-45 seeking radiant skin barrier health"
    key_benefit_or_topic: Optional[str] = "72-hour barrier repair and redness relief"
    tone_preference: Optional[str] = "Educational & High-Trust"


class CaptionGenerationResponse(BaseModel):
    client_id: str
    options: List[CaptionOption]
    suggested_hooks: List[str]
    recommended_hashtags: Dict[str, List[str]]
    cta_variations: List[str]


class ReelUploadRequest(BaseModel):
    client_id: str
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    caption: str = Field(default="", max_length=2200)
    audio_name: Optional[str] = "Original Audio"
    hashtags: List[str] = Field(default_factory=list)
    # Asset Specs & Validation
    file_name: Optional[str] = "reel_video.mp4"
    mime_type: Optional[str] = "video/mp4"
    file_size_bytes: Optional[int] = 24500000
    duration_seconds: Optional[float] = 22.0
    width: Optional[int] = 1080
    height: Optional[int] = 1920
    video_codec: Optional[str] = "H.264"
    audio_codec: Optional[str] = "AAC"
    # Ownership & Permissions
    rights_ownership: Optional[RightsOwnership] = "OWNED"
    is_commercial_cleared: Optional[bool] = True
    competitor_creative_blocked: Optional[bool] = False
    origin: Optional[AssetOrigin] = "ORIGINAL_UPLOAD"
    is_ad_creative: bool = False


class ReelPreviewVerification(BaseModel):
    reel_id: str
    aspect_ratio_valid: bool = Field(..., description="Must be 9:16 vertical ratio")
    duration_seconds: float = Field(..., ge=3.0, le=90.0)
    audio_synchronized: bool = True
    preview_reviewed_by_user: bool = Field(..., description="User confirmed visual review")


class ReelValidationRequest(BaseModel):
    mime_type: str
    file_size_bytes: int
    duration_seconds: float
    width: int
    height: int
    video_codec: str
    audio_codec: Optional[str] = "AAC"
    rights_ownership: Optional[RightsOwnership] = "OWNED"


class ReelValidationResponse(BaseModel):
    is_valid: bool
    aspect_ratio_detected: str
    aspect_ratio_valid: bool
    duration_valid: bool
    mime_valid: bool
    size_valid: bool
    codec_valid: bool
    rights_valid: bool
    errors: List[str]
    warnings: List[str]


class CreativeSelectionRequest(BaseModel):
    reel_id: str
    caption: str
    hook: Optional[str] = None
    cta: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)


class CaptionUpdateRequest(BaseModel):
    caption: str = Field(..., max_length=2200)
    hashtags: Optional[List[str]] = None


class ReelScheduleRequest(BaseModel):
    scheduled_at: str = Field(..., description="ISO datetime for scheduled content calendar publication")


class ReelPublishRequest(BaseModel):
    reel_id: str
    scheduled_at: Optional[str] = None
    confirm_publish_live: bool = Field(..., description="Explicit acknowledgement to post live to Instagram")
    idempotency_key: Optional[str] = Field(default=None, description="Client idempotency key to prevent double publishing")
    target_instagram_account_id: Optional[str] = None


class ReelResponse(BaseModel):
    id: str
    client_id: str
    instagram_ig_id: Optional[str] = None
    title: str
    video_url: str
    thumbnail_url: str
    caption: str
    hashtags: List[str]
    status: ReelStatus
    duration_seconds: float
    aspect_ratio: str = "9:16"
    preview_verified: bool
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    # Cryptographic Approval Security Binding
    approval_binding_hash: Optional[str] = None
    approval_signature: Optional[str] = None
    approval_invalidated: bool = False
    # Media & Codec Specifications
    file_name: str = "reel_video.mp4"
    mime_type: str = "video/mp4"
    file_size_bytes: int = 24500000
    video_codec: str = "H.264"
    audio_codec: str = "AAC"
    width: int = 1080
    height: int = 1920
    # Ownership & Commercial Rights
    rights_ownership: RightsOwnership = "OWNED"
    is_commercial_cleared: bool = True
    competitor_creative_blocked: bool = False
    origin: AssetOrigin = "ORIGINAL_UPLOAD"
    # Container & Publishing Pipeline
    ig_container_id: Optional[str] = None
    container_status: Optional[str] = None
    published_media_id: Optional[str] = None
    permalink: Optional[str] = None
    published_at: Optional[str] = None
    scheduled_at: Optional[str] = None
    retry_count: int = 0
    last_error: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: str
    is_demo: bool = True
    # Organic vs Paid Ad Separation
    is_ad_creative: bool = False
    publishing_channel: PublishingChannel = "ORGANIC_REEL"


class ReelComparisonItem(BaseModel):
    reel: ReelResponse
    opening_hook: str
    pacing_score: int
    visual_clarity_score: int
    engagement_potential: str
