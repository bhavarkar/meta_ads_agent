"""High-fidelity synthetic data provider for Demo Mode.
All data is clearly labeled as synthetic demo data and never disguised as real ad performance.
"""

import datetime
from typing import List, Dict, Any, Optional
from app.schemas.client import ClientResponse
from app.schemas.competitor import (
    CompetitorAdCreative,
    HookExtractionResponse,
    CompetitorProfile,
    CompetitorCandidate
)
from app.schemas.campaign import (
    CampaignDraftResponse,
    AdSetDraft,
    AdCreativeDraft,
    AdDraft,
    CampaignApprovalRecord,
    compute_campaign_payload_hash,
    AudienceTargetingConfig,
    PlacementsConfig
)
from app.schemas.reel import ReelResponse
from app.schemas.analytics import (
    AnalyticsResponse,
    MetricSummary,
    TimeSeriesPoint,
    PlacementBreakdown,
    ActionBreakdownItem,
    ConversionFunnelStage,
    ReportingEntityRow,
    CreativePerformanceItem,
    AccountMetadata,
    ReportingLevelType,
    DatePresetType
)
from app.services.analytics_normalization import resolve_date_boundaries
from app.schemas.recommendation import AIRecommendation, RecommendationListResponse


DEMO_CLIENTS: List[ClientResponse] = [
    ClientResponse(
        id="cli_lumina_glow",
        tenant_id="tenant_apex_growth",
        organization_id="org_apex_growth",
        name="Lumina Skin Co.",
        industry="DTC Skincare & Beauty",
        meta_ad_account_id="act_4829104820",
        instagram_handle="@luminaglow",
        monthly_budget_usd=25000.0,
        target_roas_goal=3.8,
        is_active=True,
        created_at="2026-01-10T10:00:00Z",
        active_campaigns_count=6,
        total_spend_30d=24150.0,
        average_roas_30d=4.12
    ),
    ClientResponse(
        id="cli_apex_athletic",
        tenant_id="tenant_apex_growth",
        organization_id="org_apex_growth",
        name="Apex Performance Wear",
        industry="Athleisure & Fitness",
        meta_ad_account_id="act_9918231204",
        instagram_handle="@apexperformance",
        monthly_budget_usd=40000.0,
        target_roas_goal=3.2,
        is_active=True,
        created_at="2026-02-01T14:30:00Z",
        active_campaigns_count=8,
        total_spend_30d=38900.0,
        average_roas_30d=3.45
    ),
    ClientResponse(
        id="cli_zenith_saas",
        tenant_id="tenant_apex_growth",
        organization_id="org_apex_growth",
        name="ZenithFlow B2B",
        industry="B2B Productivity SaaS",
        meta_ad_account_id="act_1192837465",
        instagram_handle="@zenithflow_app",
        monthly_budget_usd=15000.0,
        target_roas_goal=2.5,
        is_active=True,
        created_at="2026-03-15T09:15:00Z",
        active_campaigns_count=4,
        total_spend_30d=14800.0,
        average_roas_30d=2.88
    )
]


DEMO_FICTIONAL_COMPETITORS: List[CompetitorProfile] = [

    CompetitorProfile(
        id="comp_01_glowaura",
        client_id="cli_lumina_glow",
        organization_id="org_apex_growth",
        name="GlowAura Labs",
        website="https://www.glowauralabs.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States & Canada",
        facebook_page_id="page_10928374",
        facebook_page_url="https://www.facebook.com/GlowAuraLabsOfficial",
        instagram_handle="@glowauralabs",
        ad_library_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=GlowAura+Labs&search_type=keyword_unordered",
        verification_status="verified",
        verified_sources=[
            "Meta Ad Library Page ID: 10928374",
            "Public Brand Domain: glowauralabs.com",
            "Verified Instagram: @glowauralabs"
        ],
        active_ads_count=18,
        primary_hook_style="Pattern Interrupt / Routine Simplification",
        primary_offer="Buy 1 Get 1 40% Off + Free Mini Dew Drops",
        notes="Strong emphasis on barrier repair peptides and 3-in-1 morning routines.",
        created_at="2026-08-15T10:00:00Z",
        updated_at="2026-10-15T12:00:00Z"
    ),
    CompetitorProfile(
        id="comp_02_purebotanica",
        client_id="cli_lumina_glow",
        organization_id="org_apex_growth",
        name="PureBotanica Organics",
        website="https://www.purebotanica.co",
        industry="DTC Skincare & Beauty",
        geographic_market="United States",
        facebook_page_id="page_88192039",
        facebook_page_url="https://www.facebook.com/PureBotanicaOrganics",
        instagram_handle="@purebotanica",
        ad_library_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=PureBotanica+Organics&search_type=keyword_unordered",
        verification_status="verified",
        verified_sources=[
            "Meta Ad Library Page ID: 88192039",
            "Public Brand Domain: purebotanica.co",
            "USDA Organic Certification Public Registry"
        ],
        active_ads_count=12,
        primary_hook_style="Pain Point & Negative Emotion",
        primary_offer="Free Botanical Travel Cleanser on orders >$65",
        notes="Targeting eco-conscious luxury consumers with cold-pressed rosehip and bakuchiol oils.",
        created_at="2026-08-20T11:00:00Z",
        updated_at="2026-10-14T09:30:00Z"
    ),
    CompetitorProfile(
        id="comp_03_dermashield",
        client_id="cli_lumina_glow",
        organization_id="org_apex_growth",
        name="DermaShield Pro",
        website="https://www.dermashieldpro.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States & United Kingdom",
        facebook_page_id="page_77123984",
        facebook_page_url="https://www.facebook.com/DermaShieldPro",
        instagram_handle="@dermashieldpro",
        ad_library_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=DermaShield+Pro&search_type=keyword_unordered",
        verification_status="verified",
        verified_sources=[
            "Meta Ad Library Page ID: 77123984",
            "Public Clinical Whitepaper: dermashieldpro.com/clinical",
            "Verified Meta Business Manager"
        ],
        active_ads_count=24,
        primary_hook_style="Authority & Clinical Proof",
        primary_offer="Starter Kit with 60-Day Empty Bottle Guarantee",
        notes="High-velocity UGC testing featuring licensed aesthetician teardowns.",
        created_at="2026-09-01T14:20:00Z",
        updated_at="2026-10-16T16:45:00Z"
    ),
    CompetitorProfile(
        id="comp_04_velvetskin",
        client_id="cli_lumina_glow",
        organization_id="org_apex_growth",
        name="VelvetSkin Rituals",
        website="https://www.velvetskinrituals.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States",
        facebook_page_id="page_66192837",
        facebook_page_url="https://www.facebook.com/VelvetSkinRituals",
        instagram_handle="@velvetskinrituals",
        ad_library_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=VelvetSkin+Rituals&search_type=keyword_unordered",
        verification_status="verified",
        verified_sources=[
            "Meta Ad Library Page ID: 66192837",
            "Brand Trademark Registration USPTO",
            "Public Instagram: @velvetskinrituals"
        ],
        active_ads_count=9,
        primary_hook_style="FOMO & Cult Favorite Restocks",
        primary_offer="Complimentary Silk Sleep Mask with Overnight Balm",
        notes="Focusing on luxury sensory bedtime rituals and pre-makeup skin plumping.",
        created_at="2026-09-10T12:00:00Z",
        updated_at="2026-10-12T10:15:00Z"
    ),
    CompetitorProfile(
        id="comp_05_biohydrate",
        client_id="cli_lumina_glow",
        organization_id="org_apex_growth",
        name="BioHydrate Essentials",
        website="https://www.biohydrate.io",
        industry="DTC Skincare & Beauty",
        geographic_market="United States & Australia",
        facebook_page_id="page_55481920",
        facebook_page_url="https://www.facebook.com/BioHydrateEssentials",
        instagram_handle="@biohydrate",
        ad_library_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=BioHydrate+Essentials&search_type=keyword_unordered",
        verification_status="verified",
        verified_sources=[
            "Meta Ad Library Page ID: 55481920",
            "Public Web Domain: biohydrate.io",
            "TikTok Verified Shop & Meta Verified Account"
        ],
        active_ads_count=15,
        primary_hook_style="Bold Sensory Claim & Demo",
        primary_offer="30% Off Subscription + Free Hydration Wand",
        notes="Viral Gen-Z hydration focus with multi-molecular hyaluronic acid and sea electrolyte mist.",
        created_at="2026-09-18T16:00:00Z",
        updated_at="2026-10-17T08:00:00Z"
    )
]


DEMO_COMPETITOR_ADS: List[CompetitorAdCreative] = [
    CompetitorAdCreative(
        id="comp_ad_01",
        advertiser_name="GlowAura Labs",
        page_id="page_10928374",
        ad_archive_id="arc_1092837401",
        headline="Say Goodbye to Dull Skin in 7 Days",
        primary_text="Stop layering 10 different serums. Our 3-in-1 peptide barrier serum was clinically observed to boost hydration by 142%. Over 85,000 bottles sold.",
        call_to_action="Shop Now",
        media_type="video",
        format="video_9_16",
        media_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        thumbnail_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=48,
        first_seen="2026-08-30T00:00:00Z",
        observation_date="2026-10-15",
        hook_type="Pattern Interrupt",
        extracted_hook_text="Throw away your 10-step routine right now.",
        extracted_offer="Buy 1 Get 1 40% Off + Free Mini Dew Drops",
        target_angles=["Simplicity & Routine Fatigue", "Clinical Validation", "Barrier Repair"],
        creative_score=94,
        source_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=GlowAura+Labs&search_type=keyword_unordered",
        is_verified=True,
        is_hypothesis=False,
        evidence_type="ad_library_link",
        citation="Meta Ad Library Archive #arc_1092837401"
    ),
    CompetitorAdCreative(
        id="comp_ad_02",
        advertiser_name="PureBotanica Organics",
        page_id="page_88192039",
        ad_archive_id="arc_8819203902",
        headline="Dermatologists Are Warning Against Over-Exfoliation",
        primary_text="If your skin stings when applying moisturizer, your moisture barrier is damaged. Here's how to heal it within 96 hours without harsh prescription ointments.",
        call_to_action="Learn More",
        media_type="video",
        format="video_9_16",
        media_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
        thumbnail_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=35,
        first_seen="2026-09-12T00:00:00Z",
        observation_date="2026-10-14",
        hook_type="Pain Point / Negative Emotion",
        extracted_hook_text="If your face burns when you wash it, listen carefully.",
        extracted_offer="Starter Kit with Free Calming Cleanser",
        target_angles=["Skin Barrier Crisis", "Expert Authority", "Gentle Care"],
        creative_score=89,
        source_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=PureBotanica+Organics&search_type=keyword_unordered",
        is_verified=True,
        is_hypothesis=False,
        evidence_type="ad_library_link",
        citation="Meta Ad Library Archive #arc_8819203902"
    ),
    CompetitorAdCreative(
        id="comp_ad_03",
        advertiser_name="DermaShield Pro",
        page_id="page_77123984",
        ad_archive_id="arc_7712398403",
        headline="Clinical Serums Formulated by Board-Certified Dermatologists",
        primary_text="Triple-stabilized active niacinamide & zinc complex. In user observations, 92% noted significant texture improvement in 14 days.",
        call_to_action="Shop Now",
        media_type="video",
        format="video_9_16",
        media_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
        thumbnail_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=42,
        first_seen="2026-09-05T00:00:00Z",
        observation_date="2026-10-16",
        hook_type="Authority & Clinical Proof",
        extracted_hook_text="Why leading skin clinics are replacing generic retinol with this active peptide.",
        extracted_offer="Starter Kit with 60-Day Empty Bottle Guarantee",
        target_angles=["Clinical Authority", "Fast Turnaround", "Active Formulation"],
        creative_score=93,
        source_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=DermaShield+Pro&search_type=keyword_unordered",
        is_verified=True,
        is_hypothesis=False,
        evidence_type="ad_library_link",
        citation="Meta Ad Library Archive #arc_7712398403"
    ),
    CompetitorAdCreative(
        id="comp_ad_04",
        advertiser_name="VelvetSkin Rituals",
        page_id="page_66192837",
        ad_archive_id="arc_6619283704",
        headline="The Viral Velvet Overnight Mask is Back in Stock",
        primary_text="Sold out four times this year. Wake up with bouncy, deeply nourished glass skin without greasy pillow transfer. Clean formula certified.",
        call_to_action="Get Offer",
        media_type="image",
        format="image_static",
        media_url="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
        thumbnail_url="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=27,
        first_seen="2026-09-20T00:00:00Z",
        observation_date="2026-10-12",
        hook_type="Social Proof & FOMO",
        extracted_hook_text="We sold out 4 times in 2025. Don't miss this drop.",
        extracted_offer="Free Silk Sleep Mask with orders over $65",
        target_angles=["Travel & Night Routine", "Pre-Makeup Prep", "Cult Favorite"],
        creative_score=91,
        source_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=VelvetSkin+Rituals&search_type=keyword_unordered",
        is_verified=True,
        is_hypothesis=False,
        evidence_type="ad_library_link",
        citation="Meta Ad Library Archive #arc_6619283704"
    ),
    CompetitorAdCreative(
        id="comp_ad_05",
        advertiser_name="BioHydrate Essentials",
        page_id="page_55481920",
        ad_archive_id="arc_5548192005",
        headline="Instant Quench: Micro-Electrolyte Moisture Mist",
        primary_text="Watch the fine line vanish in 15 seconds. Pure oceanic mineral electrolytes and 5-weight hyaluronic acid for instant bounce.",
        call_to_action="Shop Now",
        media_type="video",
        format="video_9_16",
        media_url="https://images.unsplash.com/photo-1512290900672-1f49e4d58849?w=800&auto=format&fit=crop&q=80",
        thumbnail_url="https://images.unsplash.com/photo-1512290900672-1f49e4d58849?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=19,
        first_seen="2026-09-28T00:00:00Z",
        observation_date="2026-10-17",
        hook_type="Sensory & Bold Claim",
        extracted_hook_text="Your skin drinks this in 3 seconds flat — test it yourself.",
        extracted_offer="30% Off Subscription + Free Hydration Wand",
        target_angles=["Instant Tactile Proof", "TikTok Viral Demo", "Clean Electrolytes"],
        creative_score=95,
        source_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=BioHydrate+Essentials&search_type=keyword_unordered",
        is_verified=True,
        is_hypothesis=False,
        evidence_type="ad_library_link",
        citation="Meta Ad Library Archive #arc_5548192005"
    )
]


DEMO_COMPETITOR_CANDIDATES: List[CompetitorCandidate] = [
    CompetitorCandidate(
        id="cand_01",
        name="AuraGlow Naturals",
        website="https://www.auraglownaturals.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States",
        rationale="Emerging direct competitor bidding on peptide and skin barrier keywords.",
        suggested_search_query="AuraGlow Naturals skincare",
        verification_status="unverified_suggestion",
        confidence_score=87,
        permitted_source="Meta Public Ad Library Query Suggestion",
        ad_library_search_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=AuraGlow+Naturals"
    ),
    CompetitorCandidate(
        id="cand_02",
        name="BarrierCure Cosmetics",
        website="https://www.barriercure.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States & Canada",
        rationale="High ad volume observed in clean clinical sensitive skin category.",
        suggested_search_query="BarrierCure ceramide cream",
        verification_status="unverified_suggestion",
        confidence_score=92,
        permitted_source="Meta Public Ad Library Query Suggestion",
        ad_library_search_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=BarrierCure"
    ),
    CompetitorCandidate(
        id="cand_03",
        name="HydraSilk Skincare",
        website="https://www.hydrasilkskin.com",
        industry="DTC Skincare & Beauty",
        geographic_market="United States",
        rationale="Active video carousel ad format matching target demographic (females 25-45).",
        suggested_search_query="HydraSilk hyaluronic acid serum",
        verification_status="unverified_suggestion",
        confidence_score=84,
        permitted_source="Public Search Cluster Discovery",
        ad_library_search_url="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=HydraSilk"
    )
]



DEMO_CAMPAIGN_DRAFTS: List[CampaignDraftResponse] = [
    CampaignDraftResponse(
        id="cmp_draft_901",
        client_id="cli_lumina_glow",
        meta_campaign_id="meta_cmp_901_preview",
        name="Q4_TOFU_Advantage_BarrierSerum_Hooks_V2",
        objective="OUTCOME_SALES",
        budget_level="CAMPAIGN",
        budget_type="DAILY",
        daily_budget_usd=120.0,
        status="PAUSED",  # Enforced safety status
        workflow_status="VALIDATED",
        approval_required=True,
        is_approved=False,
        approved_by=None,
        approved_at=None,
        approval_signature=None,
        current_payload_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        approved_payload_hash=None,
        needs_reapproval=False,
        ad_sets_count=1,
        creatives_count=2,
        ad_sets=[
            AdSetDraft(
                id="adset_901_1",
                meta_adset_id="meta_adset_901_1",
                name="Broad Advantage+ Audience (Ages 22-55)",
                optimization_goal="OFFSITE_CONVERSIONS",
                billing_event="IMPRESSIONS",
                destination_type="WEBSITE",
                bid_strategy="LOWEST_COST_WITHOUT_CAP",
                status="PAUSED",
                targeting=AudienceTargetingConfig(
                    age_min=22,
                    age_max=55,
                    genders="WOMEN",
                    locations=["US"],
                    interests=[{"id": "6003140510344", "name": "Skin care"}, {"id": "6003139268393", "name": "Natural skincare"}],
                    advantage_plus_audience=True
                ),
                placements=PlacementsConfig(advantage_plus_placements=True)
            )
        ],
        creatives=[
            AdCreativeDraft(
                id="creative_901_1",
                meta_creative_id="meta_cr_901_1",
                name="Ceramide Barrier 72hr Transformation UGC",
                page_id="page_lumina_official",
                page_name="Lumina Skin Co.",
                headline="Repair Your Skin Barrier in 72 Hours",
                primary_text="Stop masking redness with heavy foundation. Our clinical lipid-matrix serum restores your moisture barrier at the cellular level. Dermatologist-tested.",
                call_to_action="SHOP_NOW",
                media_type="VIDEO",
                media_url="https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4",
                destination_url="https://luminaskin.com/products/barrier-serum"
            ),
            AdCreativeDraft(
                id="creative_901_2",
                meta_creative_id="meta_cr_901_2",
                name="Dermatologist Breakdown Before/After Angle",
                page_id="page_lumina_official",
                page_name="Lumina Skin Co.",
                headline="The Clean Alternative to Harsh Retinoids",
                primary_text="Gentle botanical bakuchiol delivers rapid smoothing without peeling or redness. Claim your free mini travel cleanser today.",
                call_to_action="SHOP_NOW",
                media_type="IMAGE",
                media_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
                destination_url="https://luminaskin.com/products/starter-kit"
            )
        ],
        ads=[
            AdDraft(id="ad_901_1", meta_ad_id="meta_ad_901_1", name="Ad 01 - Barrier 72hr UGC", adset_id="adset_901_1", creative_id="creative_901_1", status="PAUSED"),
            AdDraft(id="ad_901_2", meta_ad_id="meta_ad_901_2", name="Ad 02 - Derm Clean Alternative", adset_id="adset_901_1", creative_id="creative_901_2", status="PAUSED")
        ],
        created_at="2026-10-16T18:00:00Z",
        updated_at="2026-10-17T08:30:00Z",
        is_demo=True
    ),
    CampaignDraftResponse(
        id="cmp_draft_902",
        client_id="cli_lumina_glow",
        meta_campaign_id="meta_cmp_902_live",
        name="MOFU_Retargeting_EngagedViewers_OfferBundle",
        objective="OUTCOME_SALES",
        budget_level="CAMPAIGN",
        budget_type="DAILY",
        daily_budget_usd=80.0,
        status="PAUSED",
        workflow_status="APPROVED",
        approval_required=True,
        is_approved=True,
        approved_by="usr_demo_agency_lead",
        approved_at="2026-10-15T11:20:00Z",
        approval_signature="sig_verified_mock_902_sha256",
        current_payload_hash="8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
        approved_payload_hash="8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
        needs_reapproval=False,
        latest_approval=CampaignApprovalRecord(
            approver_id="usr_demo_agency_lead",
            approver_email="agency.lead@apexstrategy.com",
            approved_payload_hash="8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
            ad_account_id="act_4829104820",
            budget_amount=80.0,
            budget_type="DAILY",
            currency="USD",
            approved_at="2026-10-15T11:20:00Z",
            expires_at="2026-10-22T11:20:00Z",
            action_type="CAMPAIGN_CREATION_APPROVAL",
            signature="sig_verified_mock_902_sha256"
        ),
        ad_sets_count=1,
        creatives_count=1,
        ad_sets=[
            AdSetDraft(
                id="adset_902_1",
                meta_adset_id="meta_adset_902_1",
                name="Engaged Video Viewers 30D (Custom Audience)",
                optimization_goal="OFFSITE_CONVERSIONS",
                destination_type="WEBSITE",
                status="PAUSED",
                targeting=AudienceTargetingConfig(
                    age_min=20,
                    age_max=60,
                    genders="ALL",
                    locations=["US"],
                    custom_audiences=["ca_video_viewers_30d"]
                )
            )
        ],
        creatives=[
            AdCreativeDraft(
                id="creative_902_1",
                meta_creative_id="meta_cr_902_1",
                name="20% Off First Bottle Starter Offer",
                page_id="page_lumina_official",
                page_name="Lumina Skin Co.",
                headline="Limited Time: 20% Off + Free Travel Cleanser",
                primary_text="Still thinking about restoring your glow? Take 20% off your starter ritual with code RESTORE20. 60-day empty bottle guarantee.",
                call_to_action="SHOP_NOW",
                media_type="IMAGE",
                media_url="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
                destination_url="https://luminaskin.com/collections/bundle"
            )
        ],
        ads=[
            AdDraft(id="ad_902_1", meta_ad_id="meta_ad_902_1", name="Ad 01 - Retargeting 20% Bundle", adset_id="adset_902_1", creative_id="creative_902_1", status="PAUSED")
        ],
        created_at="2026-10-14T09:00:00Z",
        updated_at="2026-10-15T11:20:00Z",
        is_demo=True
    ),
    CampaignDraftResponse(
        id="cmp_draft_903",
        client_id="cli_apex_athletic",
        meta_campaign_id="meta_cmp_903_apex",
        name="ReelsFirst_AscentJoggers_BroadLookalike",
        objective="OUTCOME_SALES",
        budget_level="CAMPAIGN",
        budget_type="DAILY",
        daily_budget_usd=175.0,
        status="PAUSED",
        workflow_status="DRAFT",
        approval_required=True,
        is_approved=False,
        approved_by=None,
        approved_at=None,
        approval_signature=None,
        current_payload_hash="d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000",
        approved_payload_hash=None,
        needs_reapproval=False,
        ad_sets_count=1,
        creatives_count=1,
        ad_sets=[
            AdSetDraft(
                id="adset_903_1",
                name="US Men & Women Fitness Enthusiasts",
                optimization_goal="OFFSITE_CONVERSIONS",
                destination_type="WEBSITE",
                status="PAUSED",
                targeting=AudienceTargetingConfig(
                    age_min=20,
                    age_max=45,
                    genders="ALL",
                    locations=["US"],
                    interests=[{"id": "6003087265814", "name": "Physical fitness"}]
                )
            )
        ],
        creatives=[
            AdCreativeDraft(
                id="creative_903_1",
                name="Performance Fabric Jogger Motion Hook",
                headline="Engineered For Heavy Lifts and 10-Mile Runs",
                primary_text="Four-way stretch breathability that never loses its taper. Try the Ascent Jogger risk-free for 30 days.",
                call_to_action="SHOP_NOW",
                media_type="VIDEO",
                media_url="https://assets.mixkit.co/videos/preview/mixkit-young-man-training-running-in-the-park-41386-large.mp4",
                destination_url="https://apexathletic.com/joggers"
            )
        ],
        ads=[
            AdDraft(id="ad_903_1", name="Ad 01 - Ascent Jogger Motion", adset_id="adset_903_1", creative_id="creative_903_1", status="PAUSED")
        ],
        created_at="2026-10-16T14:15:00Z",
        updated_at="2026-10-16T14:15:00Z",
        is_demo=True
    )
]


DEMO_REELS: List[ReelResponse] = [
    ReelResponse(
        id="reel_101",
        client_id="cli_lumina_glow",
        instagram_ig_id="1799201928301928",
        title="Barrier Repair 72hr Time-Lapse Demo",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        caption="POV: You stopped destroying your skin barrier with aggressive scrubs and switched to Ceramide-Rich botanical nectar ✨ Watch how the redness clears up in under 72 hours. Available at link in bio with 20% off code: GLOWBARRIER.",
        hashtags=["#skincareroutine", "#skinbarrierrepair", "#ceramideserums", "#glowingskin", "#beautytips"],
        status="APPROVED",
        duration_seconds=24.5,
        aspect_ratio="9:16",
        preview_verified=True,
        is_approved=True,
        approved_by="usr_demo_agency_lead",
        approved_at="2026-10-17T11:00:00Z",
        approval_binding_hash="7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        approval_signature="demo_sig_reel_101_verified",
        published_at=None,
        permalink=None,
        scheduled_at="2026-10-18T18:00:00Z",
        created_at="2026-10-16T12:00:00Z",
        is_demo=True,
        is_ad_creative=False,
        publishing_channel="ORGANIC_REEL"
    ),
    ReelResponse(
        id="reel_102",
        client_id="cli_lumina_glow",
        instagram_ig_id="1788203918239012",
        title="Top 3 Ingredients Dermatologists Swear By",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-close-up-of-woman-applying-facial-oil-41214-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
        caption="Did you know Hyaluronic Acid can actually dry out your skin in low humidity if you don't seal it? Here are 3 science-backed ingredients you need instead 🧴 Save this for your next skincare haul!",
        hashtags=["#dermatologytips", "#skincareingredients", "#skinhacks", "#estheticiantips"],
        status="READY",
        duration_seconds=18.2,
        aspect_ratio="9:16",
        preview_verified=True,
        is_approved=False,
        approved_by=None,
        published_at=None,
        permalink=None,
        scheduled_at="2026-10-19T14:30:00Z",
        created_at="2026-10-17T09:40:00Z",
        is_demo=True,
        is_ad_creative=False,
        publishing_channel="ORGANIC_REEL"
    ),
    ReelResponse(
        id="reel_103",
        client_id="cli_lumina_glow",
        instagram_ig_id="1788203918239012",
        title="10-Step Vanity vs 1 Clinical Bottle (Split Screen)",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-young-woman-touching-her-face-with-cream-41589-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
        caption="Stop wasting 25 minutes every morning on 10 products that cancel each other out. 1 clinical lipid formulation, 60 seconds, glowing barrier. Tap link in bio to shop.",
        hashtags=["#minimalistskincare", "#glowup", "#skincaretips", "#beautyhacks"],
        status="PUBLISHED",
        duration_seconds=21.0,
        aspect_ratio="9:16",
        preview_verified=True,
        is_approved=True,
        approved_by="usr_demo_agency_lead",
        approved_at="2026-10-15T09:00:00Z",
        published_at="2026-10-15T10:15:00Z",
        published_media_id="1804291829104812",
        permalink="https://www.instagram.com/reel/DEMO_1804291829104812/",
        scheduled_at="2026-10-15T10:15:00Z",
        created_at="2026-10-14T08:00:00Z",
        is_demo=True,
        is_ad_creative=False,
        publishing_channel="ORGANIC_REEL"
    ),
    ReelResponse(
        id="reel_104",
        client_id="cli_lumina_glow",
        instagram_ig_id="1788203918239012",
        title="Microscopic Moisture Meter 60s Zoom Test",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-woman-applying-moisturizer-on-her-face-41215-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
        caption="We put our ceramide serum to the ultimate test with a clinical moisture sensor. Watch the hydration level jump from 28% to 89% in under 60 seconds.",
        hashtags=["#skinscience", "#clinicaltrials", "#hydratedskin", "#barrierrestore"],
        status="DRAFT",
        duration_seconds=29.4,
        aspect_ratio="9:16",
        preview_verified=False,
        is_approved=False,
        approved_by=None,
        published_at=None,
        permalink=None,
        created_at="2026-10-17T12:15:00Z",
        is_demo=True,
        is_ad_creative=False,
        publishing_channel="ORGANIC_REEL"
    )
]


DEMO_RECOMMENDATIONS: Dict[str, List[AIRecommendation]] = {
    "cli_lumina_glow": [
        AIRecommendation(
            id="rec_01",
            client_id="cli_lumina_glow",
            priority=1,
            title="Scale Budget on 'Advantage+ Shopping Campaign 01' by 20%",
            category="BUDGET_SCALING",
            projected_roas_lift=0.45,
            projected_weekly_savings_usd=0.0,
            confidence_score_pct=94,
            diagnosis="Campaign 01 is currently delivering an outstanding 4.62 ROAS over 7 consecutive days with only 18% frequency. Marginal CPA has remained flat ($19.20 vs $22.50 target).",
            action_description="Increase daily budget from $150 to $180 (within the safe 20% pacing ceiling to preserve algorithm learning state).",
            action_type="SCALE_BUDGET",
            action_payload={"campaign_id": "cmp_01", "current_budget": 150, "new_budget": 180},
            status="PENDING",
            created_at="2026-10-17T06:00:00Z"
        ),
        AIRecommendation(
            id="rec_02",
            client_id="cli_lumina_glow",
            priority=2,
            title="Pause Creative Fatigue: 'UGC Unboxing Video #4'",
            category="CREATIVE_FATIGUE",
            projected_roas_lift=0.32,
            projected_weekly_savings_usd=420.0,
            confidence_score_pct=91,
            diagnosis="Creative frequency has reached 3.9 over the last 5 days. CTR dropped by 44% (from 2.8% to 1.57%) and CPA spiked from $21 to $38.40.",
            action_description="Pause creative 'UGC Unboxing Video #4' and deploy tested variation 'Time-Lapse Barrier Repair' into ad set.",
            action_type="SWAP_CREATIVE",
            action_payload={"ad_id": "ad_ugc_04", "replacement_reel_id": "reel_101"},
            status="PENDING",
            created_at="2026-10-17T06:00:00Z"
        ),
        AIRecommendation(
            id="rec_03",
            client_id="cli_lumina_glow",
            priority=3,
            title="Deploy Competitor Winning Hook: 'Throw away your 10-step routine'",
            category="OFFER_OPTIMIZATION",
            projected_roas_lift=0.28,
            projected_weekly_savings_usd=0.0,
            confidence_score_pct=88,
            diagnosis="Competitor analysis reveals pattern-interrupt hooks emphasizing simplicity have run continuously for 48+ days on GlowRecipe with estimated 94 creative score.",
            action_description="Generate and attach 2 new headline variants featuring the simplicity angle into TOFU campaign draft.",
            action_type="REFRESH_HOOK",
            action_payload={"hook_text": "Stop layering 10 different serums. Here is the 1 clinical solution."},
            status="PENDING",
            created_at="2026-10-17T06:00:00Z"
        ),
        AIRecommendation(
            id="rec_04",
            client_id="cli_lumina_glow",
            priority=4,
            title="Shift 15% Budget Allocation from Facebook Feed to Instagram Reels",
            category="BIDDING_TUNING",
            projected_roas_lift=0.22,
            projected_weekly_savings_usd=280.0,
            confidence_score_pct=86,
            diagnosis="Instagram Reels placement is generating purchases at $16.40 CPA (4.8 ROAS) compared to Facebook Feed at $28.10 CPA (3.1 ROAS).",
            action_description="Enable Advantage+ Placement customization with explicit bid multipliers favoring Reels 9:16 inventory.",
            action_type="OPTIMIZE_PLACEMENTS",
            action_payload={"target_placement": "Instagram Reels", "recommended_shift_pct": 15},
            status="PENDING",
            created_at="2026-10-17T06:00:00Z"
        ),
        AIRecommendation(
            id="rec_05",
            client_id="cli_lumina_glow",
            priority=5,
            title="Create 2% Lookalike Audience from 90-Day High-LTV Customers",
            category="AUDIENCE_EXPANSION",
            projected_roas_lift=0.19,
            projected_weekly_savings_usd=0.0,
            confidence_score_pct=83,
            diagnosis="Current Retargeting audience is approaching saturation (Frequency 4.8). Expanding cold top-of-funnel reach with high-value seed list will unlock qualified traffic.",
            action_description="Build custom audience draft based on top 25% purchase value orders, seeded into 1-2% Lookalike tier.",
            action_type="EXPAND_LAL",
            action_payload={"seed_source": "High LTV 90D Purchases", "lookalike_pct": 2},
            status="PENDING",
            created_at="2026-10-17T06:00:00Z"
        )
    ]
}


def get_demo_analytics(
    client_id: str = "cli_lumina_glow",
    level: ReportingLevelType = "account",
    date_preset: DatePresetType = "last_7d",
    since: Optional[str] = None,
    until: Optional[str] = None
) -> AnalyticsResponse:
    since_iso, until_iso = resolve_date_boundaries(date_preset, since, until)
    start_date = datetime.date.fromisoformat(since_iso)
    end_date = datetime.date.fromisoformat(until_iso)
    day_count = max(1, (end_date - start_date).days + 1)

    trend: List[TimeSeriesPoint] = []
    base_daily_spends = [820.0, 850.0, 790.0, 890.0, 920.0, 880.0, 810.0, 840.0, 870.0, 910.0, 950.0, 890.0, 930.0, 960.0]
    base_roas = [3.9, 4.1, 3.8, 4.3, 4.5, 4.2, 4.0, 4.2, 4.4, 4.6, 4.8, 4.5, 4.7, 4.9]

    for i in range(day_count):
        curr_date = start_date + datetime.timedelta(days=i)
        spend = base_daily_spends[i % len(base_daily_spends)]
        roas = base_roas[i % len(base_roas)]
        aov = 68.0
        results = int((spend * roas) / aov)
        clicks = int(spend * 1.85)
        link_clicks = int(clicks * 0.68)  # Outbound link clicks are ~68% of all clicks
        impressions = int(clicks / 0.024)
        reach = int(impressions / 1.35)
        ctr = round((clicks / impressions) * 100, 2)
        cpc = round(spend / clicks, 2)
        cpm = round((spend / impressions) * 1000, 2)
        cost_per_result = round(spend / max(results, 1), 2)

        trend.append(TimeSeriesPoint(
            date=curr_date.isoformat(),
            spend=spend,
            impressions=impressions,
            reach=reach,
            clicks=clicks,
            link_clicks=link_clicks,
            ctr_percent=ctr,
            cpc=cpc,
            cpm=cpm,
            results=results,
            cost_per_result=cost_per_result,
            roas=roas,
            conversions=results,
            cpa=cost_per_result
        ))

    total_spend = round(sum(t.spend for t in trend), 2)
    total_impressions = sum(t.impressions for t in trend)
    total_reach = int(total_impressions / 1.48)
    total_clicks = sum(t.clicks for t in trend)
    total_link_clicks = sum(t.link_clicks for t in trend)
    total_results = sum(t.results for t in trend)
    attributed_revenue = round(sum(t.spend * (t.roas or 0.0) for t in trend), 2)
    avg_roas = round(attributed_revenue / max(total_spend, 1.0), 2)
    avg_cost_per_result = round(total_spend / max(total_results, 1), 2)
    avg_ctr = round((total_clicks / max(total_impressions, 1)) * 100, 2)
    avg_link_ctr = round((total_link_clicks / max(total_impressions, 1)) * 100, 2)
    avg_cpc = round(total_spend / max(total_clicks, 1), 2)
    avg_cost_per_link_click = round(total_spend / max(total_link_clicks, 1), 2)
    avg_cpm = round((total_spend / max(total_impressions, 1)) * 1000, 2)
    frequency = round(total_impressions / max(total_reach, 1), 2)

    # Entities breakdown based on requested level
    entities: List[ReportingEntityRow] = []
    if level == "campaign":
        entities = [
            ReportingEntityRow(
                id="cmp_01",
                name="Q4_TOFU_Advantage_BarrierSerum_Hooks_V2",
                level="campaign",
                status="ACTIVE",
                spend=round(total_spend * 0.55, 2),
                impressions=int(total_impressions * 0.54),
                reach=int(total_reach * 0.58),
                frequency=1.38,
                clicks=int(total_clicks * 0.56),
                link_clicks=int(total_link_clicks * 0.56),
                ctr_percent=2.85,
                link_ctr_percent=1.94,
                cpc=0.48,
                cpm=13.68,
                results=int(total_results * 0.58),
                result_type="Purchases",
                cost_per_result=round((total_spend * 0.55) / max(int(total_results * 0.58), 1), 2),
                roas=4.62,
                currency="USD"
            ),
            ReportingEntityRow(
                id="cmp_02",
                name="MOFU_Retargeting_EngagedViewers_OfferBundle",
                level="campaign",
                status="ACTIVE",
                spend=round(total_spend * 0.30, 2),
                impressions=int(total_impressions * 0.28),
                reach=int(total_reach * 0.24),
                frequency=1.72,
                clicks=int(total_clicks * 0.32),
                link_clicks=int(total_link_clicks * 0.32),
                ctr_percent=3.22,
                link_ctr_percent=2.19,
                cpc=0.62,
                cpm=19.96,
                results=int(total_results * 0.32),
                result_type="Purchases",
                cost_per_result=round((total_spend * 0.30) / max(int(total_results * 0.32), 1), 2),
                roas=5.15,
                currency="USD"
            ),
            ReportingEntityRow(
                id="cmp_03",
                name="BOFU_CartAbandoners_DynamicCatalog",
                level="campaign",
                status="PAUSED",
                spend=round(total_spend * 0.15, 2),
                impressions=int(total_impressions * 0.18),
                reach=int(total_reach * 0.18),
                frequency=1.49,
                clicks=int(total_clicks * 0.12),
                link_clicks=int(total_link_clicks * 0.12),
                ctr_percent=2.10,
                link_ctr_percent=1.42,
                cpc=0.78,
                cpm=16.38,
                results=int(total_results * 0.10),
                result_type="Purchases",
                cost_per_result=round((total_spend * 0.15) / max(int(total_results * 0.10), 1), 2),
                roas=3.80,
                currency="USD"
            )
        ]
    elif level == "adset":
        entities = [
            ReportingEntityRow(
                id="adset_101",
                name="Advantage+ Broad Audience (Women 22-55)",
                level="adset",
                status="ACTIVE",
                spend=round(total_spend * 0.40, 2),
                impressions=int(total_impressions * 0.42),
                reach=int(total_reach * 0.44),
                frequency=1.42,
                clicks=int(total_clicks * 0.41),
                link_clicks=int(total_link_clicks * 0.41),
                ctr_percent=2.76,
                link_ctr_percent=1.88,
                cpc=0.51,
                cpm=14.10,
                results=int(total_results * 0.42),
                result_type="Purchases",
                cost_per_result=18.20,
                roas=4.75,
                currency="USD"
            ),
            ReportingEntityRow(
                id="adset_102",
                name="Clinical Skincare Interest Stack",
                level="adset",
                status="ACTIVE",
                spend=round(total_spend * 0.25, 2),
                impressions=int(total_impressions * 0.24),
                reach=int(total_reach * 0.22),
                frequency=1.62,
                clicks=int(total_clicks * 0.26),
                link_clicks=int(total_link_clicks * 0.26),
                ctr_percent=2.95,
                link_ctr_percent=2.01,
                cpc=0.55,
                cpm=15.80,
                results=int(total_results * 0.26),
                result_type="Purchases",
                cost_per_result=17.90,
                roas=4.50,
                currency="USD"
            ),
            ReportingEntityRow(
                id="adset_103",
                name="Engaged Video Viewers (Past 30D)",
                level="adset",
                status="ACTIVE",
                spend=round(total_spend * 0.20, 2),
                impressions=int(total_impressions * 0.18),
                reach=int(total_reach * 0.16),
                frequency=1.68,
                clicks=int(total_clicks * 0.21),
                link_clicks=int(total_link_clicks * 0.21),
                ctr_percent=3.10,
                link_ctr_percent=2.11,
                cpc=0.59,
                cpm=18.40,
                results=int(total_results * 0.22),
                result_type="Purchases",
                cost_per_result=15.80,
                roas=5.20,
                currency="USD"
            ),
            ReportingEntityRow(
                id="adset_104",
                name="Lookalike 1% High LTV Customers",
                level="adset",
                status="PAUSED",
                spend=round(total_spend * 0.15, 2),
                impressions=int(total_impressions * 0.16),
                reach=int(total_reach * 0.18),
                frequency=1.33,
                clicks=int(total_clicks * 0.12),
                link_clicks=int(total_link_clicks * 0.12),
                ctr_percent=2.05,
                link_ctr_percent=1.39,
                cpc=0.72,
                cpm=14.80,
                results=int(total_results * 0.10),
                result_type="Purchases",
                cost_per_result=24.50,
                roas=3.40,
                currency="USD"
            )
        ]
    elif level == "ad":
        entities = [
            ReportingEntityRow(
                id="ad_201",
                name="Ad 01 - Barrier 72hr UGC Reel",
                level="ad",
                status="ACTIVE",
                spend=round(total_spend * 0.35, 2),
                impressions=int(total_impressions * 0.38),
                reach=int(total_reach * 0.39),
                frequency=1.45,
                clicks=int(total_clicks * 0.40),
                link_clicks=int(total_link_clicks * 0.40),
                ctr_percent=3.12,
                link_ctr_percent=2.12,
                cpc=0.46,
                cpm=14.20,
                results=int(total_results * 0.41),
                result_type="Purchases",
                cost_per_result=16.40,
                roas=4.82,
                currency="USD"
            ),
            ReportingEntityRow(
                id="ad_202",
                name="Ad 02 - Dermatologist Clean Alternative",
                level="ad",
                status="ACTIVE",
                spend=round(total_spend * 0.25, 2),
                impressions=int(total_impressions * 0.24),
                reach=int(total_reach * 0.25),
                frequency=1.42,
                clicks=int(total_clicks * 0.26),
                link_clicks=int(total_link_clicks * 0.26),
                ctr_percent=2.65,
                link_ctr_percent=1.80,
                cpc=0.54,
                cpm=15.60,
                results=int(total_results * 0.26),
                result_type="Purchases",
                cost_per_result=17.80,
                roas=4.45,
                currency="USD"
            ),
            ReportingEntityRow(
                id="ad_203",
                name="Ad 03 - Retargeting 20% Bundle Offer",
                level="ad",
                status="ACTIVE",
                spend=round(total_spend * 0.20, 2),
                impressions=int(total_impressions * 0.18),
                reach=int(total_reach * 0.16),
                frequency=1.68,
                clicks=int(total_clicks * 0.21),
                link_clicks=int(total_link_clicks * 0.21),
                ctr_percent=3.20,
                link_ctr_percent=2.18,
                cpc=0.58,
                cpm=18.10,
                results=int(total_results * 0.22),
                result_type="Purchases",
                cost_per_result=15.10,
                roas=5.25,
                currency="USD"
            ),
            ReportingEntityRow(
                id="ad_204",
                name="Ad 04 - UGC Unboxing Video #4",
                level="ad",
                status="PAUSED",
                spend=round(total_spend * 0.12, 2),
                impressions=int(total_impressions * 0.12),
                reach=int(total_reach * 0.08),
                frequency=4.20,
                clicks=int(total_clicks * 0.08),
                link_clicks=int(total_link_clicks * 0.08),
                ctr_percent=1.15,
                link_ctr_percent=0.78,
                cpc=0.88,
                cpm=16.80,
                results=int(total_results * 0.07),
                result_type="Purchases",
                cost_per_result=38.40,
                roas=1.85,
                currency="USD"
            ),
            ReportingEntityRow(
                id="ad_205",
                name="Ad 05 - Generic Lifestyle Bottle Still",
                level="ad",
                status="PAUSED",
                spend=round(total_spend * 0.08, 2),
                impressions=int(total_impressions * 0.08),
                reach=int(total_reach * 0.06),
                frequency=3.80,
                clicks=int(total_clicks * 0.05),
                link_clicks=int(total_link_clicks * 0.05),
                ctr_percent=0.95,
                link_ctr_percent=0.65,
                cpc=0.94,
                cpm=15.20,
                results=int(total_results * 0.04),
                result_type="Purchases",
                cost_per_result=34.20,
                roas=2.10,
                currency="USD"
            )
        ]
    else:
        # Default Account-level reporting entity rows
        entities = [
            ReportingEntityRow(
                id="act_4829104820",
                name="Lumina Glow Official (Ad Account Aggregated)",
                level="account",
                status="ACTIVE",
                spend=total_spend,
                impressions=total_impressions,
                reach=total_reach,
                frequency=frequency,
                clicks=total_clicks,
                link_clicks=total_link_clicks,
                ctr_percent=avg_ctr,
                link_ctr_percent=avg_link_ctr,
                cpc=avg_cpc,
                cpm=avg_cpm,
                results=total_results,
                result_type="Purchases",
                cost_per_result=avg_cost_per_result,
                roas=avg_roas,
                currency="USD"
            )
        ]

    top_creatives: List[CreativePerformanceItem] = [
        CreativePerformanceItem(
            ad_id="ad_201",
            ad_name="Ad 01 - Barrier 72hr UGC Reel",
            headline="Repair Your Skin Barrier in 72 Hours",
            thumbnail_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
            media_type="VIDEO",
            spend=round(total_spend * 0.35, 2),
            impressions=int(total_impressions * 0.38),
            frequency=1.45,
            link_clicks=int(total_link_clicks * 0.40),
            ctr_percent=3.12,
            cpc=0.46,
            results=int(total_results * 0.41),
            cost_per_result=16.40,
            roas=4.82,
            performance_tier="TOP_PERFORMER",
            diagnosis="High hook retention (48% 3s hold rate) and low CPM ($14.20). Scale budget by 15-20%."
        ),
        CreativePerformanceItem(
            ad_id="ad_202",
            ad_name="Ad 02 - Dermatologist Clean Alternative",
            headline="The Clean Alternative to Harsh Retinoids",
            thumbnail_url="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
            media_type="IMAGE",
            spend=round(total_spend * 0.25, 2),
            impressions=int(total_impressions * 0.24),
            frequency=1.42,
            link_clicks=int(total_link_clicks * 0.26),
            ctr_percent=2.65,
            cpc=0.54,
            results=int(total_results * 0.26),
            cost_per_result=17.80,
            roas=4.45,
            performance_tier="TOP_PERFORMER",
            diagnosis="Clinical authority trust angle generates steady conversion volume with low CPA volatility."
        )
    ]

    weak_creatives: List[CreativePerformanceItem] = [
        CreativePerformanceItem(
            ad_id="ad_204",
            ad_name="Ad 04 - UGC Unboxing Video #4",
            headline="Unboxing My Monthly Skin Delivery",
            thumbnail_url="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
            media_type="VIDEO",
            spend=round(total_spend * 0.12, 2),
            impressions=int(total_impressions * 0.12),
            frequency=4.20,
            link_clicks=int(total_link_clicks * 0.08),
            ctr_percent=1.15,
            cpc=0.88,
            results=int(total_results * 0.07),
            cost_per_result=38.40,
            roas=1.85,
            performance_tier="WEAK_FATIGUED",
            diagnosis="Ad fatigue alert: Frequency has reached 4.20. CTR dropped 44% over last 5 days. Recommend pausing."
        ),
        CreativePerformanceItem(
            ad_id="ad_205",
            ad_name="Ad 05 - Generic Lifestyle Bottle Still",
            headline="Experience Pure Hydration Daily",
            thumbnail_url="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
            media_type="IMAGE",
            spend=round(total_spend * 0.08, 2),
            impressions=int(total_impressions * 0.08),
            frequency=3.80,
            link_clicks=int(total_link_clicks * 0.05),
            ctr_percent=0.95,
            cpc=0.94,
            results=int(total_results * 0.04),
            cost_per_result=34.20,
            roas=2.10,
            performance_tier="WEAK_FATIGUED",
            diagnosis="Low visual contrast in mobile feed. CTR is below 1.0% industry baseline. Replace with UGC video."
        )
    ]

    # Authentic conversion funnel strictly for tracked events
    conversion_funnel: List[ConversionFunnelStage] = [
        ConversionFunnelStage(
            stage_id="impressions",
            stage_name="Ad Impressions",
            count=total_impressions,
            dropoff_pct=0.0,
            conversion_rate_pct=100.0,
            is_tracked=True
        ),
        ConversionFunnelStage(
            stage_id="link_clicks",
            stage_name="Outbound Link Clicks",
            count=total_link_clicks,
            dropoff_pct=round(max(0.0, 100.0 - (total_link_clicks / max(total_impressions, 1) * 100)), 2),
            conversion_rate_pct=avg_link_ctr,
            is_tracked=True
        ),
        ConversionFunnelStage(
            stage_id="landing_page_view",
            stage_name="Landing Page Views",
            count=int(total_link_clicks * 0.76),
            dropoff_pct=24.0,
            conversion_rate_pct=round((int(total_link_clicks * 0.76) / max(total_impressions, 1)) * 100, 3),
            is_tracked=True
        ),
        ConversionFunnelStage(
            stage_id="add_to_cart",
            stage_name="Add to Cart",
            count=int(total_results * 3.8),
            dropoff_pct=68.5,
            conversion_rate_pct=round((int(total_results * 3.8) / max(total_impressions, 1)) * 100, 3),
            is_tracked=True
        ),
        ConversionFunnelStage(
            stage_id="purchase",
            stage_name="Purchases (Omni-Channel)",
            count=total_results,
            dropoff_pct=73.7,
            conversion_rate_pct=round((total_results / max(total_impressions, 1)) * 100, 3),
            is_tracked=True
        ),
        ConversionFunnelStage(
            stage_id="app_install",
            stage_name="Mobile App Installs",
            count=0,
            dropoff_pct=0.0,
            conversion_rate_pct=0.0,
            is_tracked=False,
            untracked_reason="Mobile App SDK / App Events not configured on this web DTC account"
        )
    ]

    action_breakdown: List[ActionBreakdownItem] = [
        ActionBreakdownItem(
            action_type="omni_purchase",
            action_label="Purchases (Omni-Channel)",
            count=total_results,
            value=attributed_revenue,
            cost_per_action=avg_cost_per_result
        ),
        ActionBreakdownItem(
            action_type="add_to_cart",
            action_label="Adds to Cart",
            count=int(total_results * 3.8),
            value=round(attributed_revenue * 1.85, 2),
            cost_per_action=round(total_spend / max(int(total_results * 3.8), 1), 2)
        ),
        ActionBreakdownItem(
            action_type="landing_page_view",
            action_label="Landing Page Views",
            count=int(total_link_clicks * 0.76),
            value=None,
            cost_per_action=round(total_spend / max(int(total_link_clicks * 0.76), 1), 2)
        ),
        ActionBreakdownItem(
            action_type="link_click",
            action_label="Link Clicks (Outbound)",
            count=total_link_clicks,
            value=None,
            cost_per_action=avg_cost_per_link_click
        ),
        ActionBreakdownItem(
            action_type="post_engagement",
            action_label="Post Engagement",
            count=int(total_clicks * 1.45),
            value=None,
            cost_per_action=round(total_spend / max(int(total_clicks * 1.45), 1), 2)
        ),
        ActionBreakdownItem(
            action_type="post_reaction",
            action_label="Post Reactions",
            count=int(total_clicks * 0.42),
            value=None,
            cost_per_action=round(total_spend / max(int(total_clicks * 0.42), 1), 2)
        )
    ]

    return AnalyticsResponse(
        client_id=client_id,
        level=level,
        date_preset=date_preset,
        since=since_iso,
        until=until_iso,
        account_metadata=AccountMetadata(
            ad_account_id="act_4829104820",
            ad_account_name="Lumina Glow Official (Verified Ad Account)",
            currency="USD",
            account_timezone="America/Los_Angeles",
            timezone_offset_hours=-7,
            attribution_setting="7-day click or 1-day view",
            last_synced_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            sync_status="SUCCESS",
            data_source="SYNTHETIC_DEMO",
            rate_limit_percent=12.5
        ),
        summary=MetricSummary(
            total_spend=total_spend,
            impressions=total_impressions,
            reach=total_reach,
            frequency=frequency,
            clicks=total_clicks,
            link_clicks=total_link_clicks,
            ctr_percent=avg_ctr,
            link_ctr_percent=avg_link_ctr,
            cpc=avg_cpc,
            cost_per_link_click=avg_cost_per_link_click,
            cpm=avg_cpm,
            results=total_results,
            result_metric_name="Purchases",
            cost_per_result=avg_cost_per_result,
            attributed_revenue=attributed_revenue,
            roas=avg_roas,
            has_attributed_revenue=True,
            currency="USD",
            conversions=total_results,
            cpa=avg_cost_per_result,
            change_vs_previous_period_pct={
                "roas": 12.4,
                "cpa": -8.6,
                "spend": 6.8,
                "conversions": 19.3
            }
        ),
        trend_history=trend,
        placements=[
            PlacementBreakdown(placement="Instagram Reels", spend_share_pct=42.0, roas=4.82, cpa=16.40, impressions=int(total_impressions * 0.42), clicks=int(total_clicks * 0.45)),
            PlacementBreakdown(placement="Instagram Feed", spend_share_pct=28.0, roas=4.10, cpa=21.20, impressions=int(total_impressions * 0.28), clicks=int(total_clicks * 0.27)),
            PlacementBreakdown(placement="Facebook Feed", spend_share_pct=18.0, roas=3.15, cpa=28.10, impressions=int(total_impressions * 0.18), clicks=int(total_clicks * 0.16)),
            PlacementBreakdown(placement="Instagram Stories", spend_share_pct=12.0, roas=3.85, cpa=23.50, impressions=int(total_impressions * 0.12), clicks=int(total_clicks * 0.12))
        ],
        conversion_funnel=conversion_funnel,
        entities=entities,
        top_creatives=top_creatives,
        weak_creatives=weak_creatives,
        action_breakdown=action_breakdown,
        is_demo=True,
        disclaimer="DEMO MODE: Metrics are synthetic demonstration figures. In Connected Mode, live telemetry is ingested via Meta Marketing API Insights."
    )

