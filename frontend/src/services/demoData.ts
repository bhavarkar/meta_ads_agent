import { Client, CompetitorAd, CampaignDraft, Reel, AnalyticsData, AIRecommendation, AuditLog, Organization, OrganizationMember, MetaConnection, CompetitorProfile, CompetitorCandidate, AdObservation, CompetitorIntelligenceReport, ComprehensiveStrategyResponse, SavedStrategyRecord, BackgroundJob, PerformanceAnomaly, SystemNotification, PerformanceReport, ActionValidationResponse } from '../types';

export const FALLBACK_ORGANIZATIONS: Organization[] = [
  {
    id: "org_apex_growth",
    name: "Apex Growth Agency",
    slug: "apex-growth",
    owner_id: "usr_demo_agency_lead",
    billing_tier: "agency_enterprise",
    members_count: 3,
    clients_count: 3,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "org_lumina_internal",
    name: "Lumina Brand Holdings",
    slug: "lumina-holdings",
    owner_id: "usr_demo_agency_lead",
    billing_tier: "agency_pro",
    members_count: 1,
    clients_count: 1,
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z"
  }
];

export const FALLBACK_MEMBERS: OrganizationMember[] = [
  {
    id: "mem_01",
    organization_id: "org_apex_growth",
    user_id: "usr_demo_agency_lead",
    email: "lead@metapilot-demo.internal",
    full_name: "Alex Vance",
    role: "owner",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    joined_at: "2026-01-01T00:00:00Z"
  },
  {
    id: "mem_02",
    organization_id: "org_apex_growth",
    user_id: "d0000000-0000-0000-0000-000000000002",
    email: "sarah@apex-growth.com",
    full_name: "Sarah Connor",
    role: "admin",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    joined_at: "2026-01-10T10:00:00Z"
  },
  {
    id: "mem_03",
    organization_id: "org_apex_growth",
    user_id: "d0000000-0000-0000-0000-000000000003",
    email: "jordan@apex-growth.com",
    full_name: "Jordan Lee",
    role: "member",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    joined_at: "2026-02-01T14:30:00Z"
  }
];

export const FALLBACK_CLIENTS: Client[] = [
  {
    id: "cli_lumina_glow",
    tenant_id: "tenant_apex_growth",
    organization_id: "org_apex_growth",
    name: "Lumina Skin Co.",
    industry: "DTC Skincare & Beauty",
    meta_ad_account_id: "act_4829104820",
    instagram_handle: "@luminaglow",
    monthly_budget_usd: 25000.0,
    target_roas_goal: 3.8,
    is_active: true,
    created_at: "2026-01-10T10:00:00Z",
    active_campaigns_count: 6,
    total_spend_30d: 24150.0,
    average_roas_30d: 4.12
  },
  {
    id: "cli_apex_athletic",
    tenant_id: "tenant_apex_growth",
    name: "Apex Performance Wear",
    industry: "Athleisure & Fitness",
    meta_ad_account_id: "act_9918231204",
    instagram_handle: "@apexperformance",
    monthly_budget_usd: 40000.0,
    target_roas_goal: 3.2,
    is_active: true,
    created_at: "2026-02-01T14:30:00Z",
    active_campaigns_count: 8,
    total_spend_30d: 38900.0,
    average_roas_30d: 3.45
  },
  {
    id: "cli_zenith_saas",
    tenant_id: "tenant_apex_growth",
    name: "ZenithFlow B2B",
    industry: "B2B Productivity SaaS",
    meta_ad_account_id: "act_1192837465",
    instagram_handle: "@zenithflow_app",
    monthly_budget_usd: 15000.0,
    target_roas_goal: 2.5,
    is_active: true,
    created_at: "2026-03-15T09:15:00Z",
    active_campaigns_count: 4,
    total_spend_30d: 14800.0,
    average_roas_30d: 2.88
  }
];

export const FALLBACK_COMPETITOR_ADS: CompetitorAd[] = [
  {
    id: "comp_ad_01",
    advertiser_name: "GlowRecipe Official",
    page_id: "page_10928374",
    headline: "Say Goodbye to Dull Skin in 7 Days",
    primary_text: "Stop layering 10 different serums. Our 3-in-1 peptide barrier serum was clinically proven to boost hydration by 142%. Over 85,000 bottles sold.",
    call_to_action: "Shop Now",
    media_type: "video",
    media_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
    estimated_active_days: 48,
    first_seen: "2026-08-30T00:00:00Z",
    hook_type: "Pattern Interrupt",
    extracted_hook_text: "Throw away your 10-step routine right now.",
    extracted_offer: "Buy 1 Get 1 40% Off + Free Dew Drops Mini",
    target_angles: ["Simplicity & Routine Fatigue", "Clinical Validation", "Barrier Repair"],
    creative_score: 94
  },
  {
    id: "comp_ad_02",
    advertiser_name: "Krave Beauty",
    page_id: "page_88192039",
    headline: "Dermatologists Are Warning Against Over-Exfoliation",
    primary_text: "If your skin stings when applying moisturizer, your moisture barrier is damaged. Here's how to heal it within 96 hours without prescription creams.",
    call_to_action: "Learn More",
    media_type: "video",
    media_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
    estimated_active_days: 35,
    first_seen: "2026-09-12T00:00:00Z",
    hook_type: "Pain Point / Negative Emotion",
    extracted_hook_text: "If your face burns when you wash it, listen carefully.",
    extracted_offer: "Starter Kit with Free Calming Cleanser",
    target_angles: ["Skin Barrier Crisis", "Expert Authority", "Gentle Care"],
    creative_score: 89
  },
  {
    id: "comp_ad_03",
    advertiser_name: "Summer Fridays",
    page_id: "page_77123984",
    headline: "The Viral Jet Lag Mask is Finally Restocked",
    primary_text: "Awarded Best Hydrating Mask 3 years running. Apply as an overnight mask or 10-minute flash facial before makeup.",
    call_to_action: "Get Offer",
    media_type: "image",
    media_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
    estimated_active_days: 27,
    first_seen: "2026-09-20T00:00:00Z",
    hook_type: "Social Proof & FOMO",
    extracted_hook_text: "We sold out 4 times in 2025. Don't miss this drop.",
    extracted_offer: "Free Travel Pouch with orders over $65",
    target_angles: ["Travel & Jet Lag", "Pre-Makeup Prep", "Cult Favorite"],
    creative_score: 91
  },
  {
    id: "comp_ad_04",
    advertiser_name: "Vuori Clothing",
    page_id: "page_66192837",
    headline: "The Softest Shorts Ever Made. Period.",
    primary_text: "Engineered with DreamKnit™ fabric. Designed for training, built for everyday life. 30,000+ 5-star reviews can't be wrong.",
    call_to_action: "Shop Now",
    media_type: "video",
    media_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    estimated_active_days: 62,
    first_seen: "2026-08-16T00:00:00Z",
    hook_type: "Sensory & Bold Claim",
    extracted_hook_text: "You'll never wear jeans again after trying these.",
    extracted_offer: "20% Off Your First Order + Free Shipping & Returns",
    target_angles: ["Extreme Comfort", "Versatility", "Social Proof"],
    creative_score: 96
  }
];

export const FALLBACK_CAMPAIGNS: CampaignDraft[] = [
  {
    id: "cmp_draft_901",
    client_id: "cli_lumina_glow",
    meta_campaign_id: "meta_cmp_901_preview",
    name: "Q4_TOFU_Advantage_BarrierSerum_Hooks_V2",
    objective: "OUTCOME_SALES",
    budget_level: "CAMPAIGN",
    budget_type: "DAILY",
    daily_budget_usd: 120.0,
    status: "PAUSED",
    workflow_status: "VALIDATED",
    approval_required: true,
    is_approved: false,
    approved_by: null,
    approved_at: null,
    approval_signature: null,
    current_payload_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    needs_reapproval: false,
    ad_sets_count: 1,
    creatives_count: 2,
    ad_sets: [
      {
        id: "adset_901_1",
        meta_adset_id: "meta_adset_901_1",
        name: "Broad Advantage+ Audience (Ages 22-55)",
        optimization_goal: "OFFSITE_CONVERSIONS",
        billing_event: "IMPRESSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        status: "PAUSED",
        targeting: {
          age_min: 22,
          age_max: 55,
          genders: "WOMEN",
          locations: ["US"],
          interests: [{ id: "6003140510344", name: "Skin care" }, { id: "6003139268393", name: "Natural skincare" }],
          advantage_plus_audience: true
        },
        placements: {
          advantage_plus_placements: true,
          platforms: ["facebook", "instagram"],
          facebook_positions: ["feed", "story", "reels"],
          instagram_positions: ["stream", "story", "reels", "explore"]
        }
      }
    ],
    creatives: [
      {
        id: "creative_901_1",
        meta_creative_id: "meta_cr_901_1",
        name: "Ceramide Barrier 72hr Transformation UGC",
        page_id: "page_lumina_official",
        page_name: "Lumina Skin Co.",
        headline: "Repair Your Skin Barrier in 72 Hours",
        primary_text: "Stop masking redness with heavy foundation. Our clinical lipid-matrix serum restores your moisture barrier at the cellular level.",
        call_to_action: "SHOP_NOW",
        media_type: "VIDEO",
        media_url: "https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4",
        destination_url: "https://luminaskin.com/products/barrier-serum"
      },
      {
        id: "creative_901_2",
        meta_creative_id: "meta_cr_901_2",
        name: "Dermatologist Clean Alternative Angle",
        page_id: "page_lumina_official",
        page_name: "Lumina Skin Co.",
        headline: "The Clean Alternative to Harsh Retinoids",
        primary_text: "Gentle botanical bakuchiol delivers rapid smoothing without peeling or redness. Claim your free mini travel cleanser today.",
        call_to_action: "SHOP_NOW",
        media_type: "IMAGE",
        media_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
        destination_url: "https://luminaskin.com/products/starter-kit"
      }
    ],
    ads: [
      { id: "ad_901_1", meta_ad_id: "meta_ad_901_1", name: "Ad 01 - Barrier 72hr UGC", adset_id: "adset_901_1", creative_id: "creative_901_1", status: "PAUSED" },
      { id: "ad_901_2", meta_ad_id: "meta_ad_901_2", name: "Ad 02 - Derm Clean Alternative", adset_id: "adset_901_1", creative_id: "creative_901_2", status: "PAUSED" }
    ],
    created_at: "2026-10-16T18:00:00Z",
    updated_at: "2026-10-17T08:30:00Z",
    is_demo: true
  },
  {
    id: "cmp_draft_902",
    client_id: "cli_lumina_glow",
    meta_campaign_id: "meta_cmp_902_live",
    name: "MOFU_Retargeting_EngagedViewers_OfferBundle",
    objective: "OUTCOME_SALES",
    budget_level: "CAMPAIGN",
    budget_type: "DAILY",
    daily_budget_usd: 80.0,
    status: "PAUSED",
    workflow_status: "APPROVED",
    approval_required: true,
    is_approved: true,
    approved_by: "usr_demo_agency_lead",
    approved_at: "2026-10-15T11:20:00Z",
    approval_signature: "sig_verified_mock_902",
    approved_payload_hash: "8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
    current_payload_hash: "8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
    needs_reapproval: false,
    latest_approval: {
      approver_id: "usr_demo_agency_lead",
      approver_email: "agency.lead@apexstrategy.com",
      approved_payload_hash: "8f4b238a9d1234ef9801acdf543210fe1234567890abcdef1234567890abcdef",
      ad_account_id: "act_4829104820",
      budget_amount: 80.0,
      budget_type: "DAILY",
      currency: "USD",
      approved_at: "2026-10-15T11:20:00Z",
      expires_at: "2026-10-22T11:20:00Z",
      action_type: "CAMPAIGN_CREATION_APPROVAL",
      signature: "sig_verified_mock_902"
    },
    ad_sets_count: 1,
    creatives_count: 1,
    ad_sets: [
      {
        id: "adset_902_1",
        meta_adset_id: "meta_adset_902_1",
        name: "Engaged Video Viewers 30D (Custom Audience)",
        optimization_goal: "OFFSITE_CONVERSIONS",
        billing_event: "IMPRESSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        status: "PAUSED",
        targeting: {
          age_min: 20,
          age_max: 60,
          genders: "ALL",
          locations: ["US"],
          interests: [],
          advantage_plus_audience: false,
          custom_audiences: ["ca_video_viewers_30d"]
        },
        placements: {
          advantage_plus_placements: true,
          platforms: ["facebook", "instagram"],
          facebook_positions: ["feed", "reels"],
          instagram_positions: ["stream", "reels"]
        }
      }
    ],
    creatives: [
      {
        id: "creative_902_1",
        meta_creative_id: "meta_cr_902_1",
        name: "20% Off First Bottle Starter Offer",
        page_id: "page_lumina_official",
        page_name: "Lumina Skin Co.",
        headline: "Limited Time: 20% Off + Free Travel Cleanser",
        primary_text: "Still thinking about restoring your glow? Take 20% off your starter ritual with code RESTORE20. 60-day empty bottle guarantee.",
        call_to_action: "SHOP_NOW",
        media_type: "IMAGE",
        media_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
        destination_url: "https://luminaskin.com/collections/bundle"
      }
    ],
    ads: [
      { id: "ad_902_1", meta_ad_id: "meta_ad_902_1", name: "Ad 01 - Retargeting 20% Bundle", adset_id: "adset_902_1", creative_id: "creative_902_1", status: "PAUSED" }
    ],
    created_at: "2026-10-14T09:00:00Z",
    updated_at: "2026-10-15T11:20:00Z",
    is_demo: true
  },
  {
    id: "cmp_draft_903",
    client_id: "cli_apex_athletic",
    meta_campaign_id: "meta_cmp_903_apex",
    name: "ReelsFirst_AscentJoggers_BroadLookalike",
    objective: "OUTCOME_SALES",
    budget_level: "CAMPAIGN",
    budget_type: "DAILY",
    daily_budget_usd: 175.0,
    status: "PAUSED",
    workflow_status: "DRAFT",
    approval_required: true,
    is_approved: false,
    approved_by: null,
    approved_at: null,
    approval_signature: null,
    current_payload_hash: "d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000",
    needs_reapproval: false,
    ad_sets_count: 1,
    creatives_count: 1,
    ad_sets: [
      {
        id: "adset_903_1",
        name: "US Men & Women Fitness Enthusiasts",
        optimization_goal: "OFFSITE_CONVERSIONS",
        billing_event: "IMPRESSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        status: "PAUSED",
        targeting: {
          age_min: 20,
          age_max: 45,
          genders: "ALL",
          locations: ["US"],
          interests: [{ id: "6003087265814", name: "Physical fitness" }],
          advantage_plus_audience: true
        },
        placements: {
          advantage_plus_placements: true,
          platforms: ["facebook", "instagram"],
          facebook_positions: ["feed", "reels"],
          instagram_positions: ["stream", "reels"]
        }
      }
    ],
    creatives: [
      {
        id: "creative_903_1",
        name: "Performance Fabric Jogger Motion Hook",
        page_id: "page_apex_athletic",
        page_name: "Apex Performance Athletics",
        headline: "Engineered For Heavy Lifts and 10-Mile Runs",
        primary_text: "Four-way stretch breathability that never loses its taper. Try the Ascent Jogger risk-free for 30 days.",
        call_to_action: "SHOP_NOW",
        media_type: "VIDEO",
        media_url: "https://assets.mixkit.co/videos/preview/mixkit-young-man-training-running-in-the-park-41386-large.mp4",
        destination_url: "https://apexathletic.com/joggers"
      }
    ],
    ads: [
      { id: "ad_903_1", name: "Ad 01 - Ascent Jogger Motion", adset_id: "adset_903_1", creative_id: "creative_903_1", status: "PAUSED" }
    ],
    created_at: "2026-10-16T14:15:00Z",
    updated_at: "2026-10-16T14:15:00Z",
    is_demo: true
  }
];

export const FALLBACK_REELS: Reel[] = [
  {
    id: "reel_101",
    client_id: "cli_lumina_glow",
    instagram_ig_id: "1799201928301928",
    title: "Barrier Repair 72hr Time-Lapse Demo",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
    caption: "POV: You stopped destroying your skin barrier with aggressive scrubs and switched to Ceramide-Rich botanical nectar ✨ Watch how the redness clears up in under 72 hours. Available at link in bio with 20% off code: GLOWBARRIER.",
    hashtags: ["#skincareroutine", "#skinbarrierrepair", "#ceramideserums", "#glowingskin", "#beautytips"],
    status: "APPROVED",
    duration_seconds: 24.5,
    aspect_ratio: "9:16",
    preview_verified: true,
    is_approved: true,
    approved_by: "usr_demo_agency_lead",
    approved_at: "2026-10-17T11:00:00Z",
    approval_binding_hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    approval_signature: "demo_sig_reel_101_verified",
    published_at: null,
    permalink: null,
    scheduled_at: "2026-10-18T18:00:00Z",
    created_at: "2026-10-16T12:00:00Z",
    is_demo: true,
    rights_ownership: "OWNED",
    is_ad_creative: false,
    publishing_channel: "ORGANIC_REEL",
    video_codec: "H.264",
    audio_codec: "AAC",
    file_size_bytes: 24500000
  },
  {
    id: "reel_102",
    client_id: "cli_lumina_glow",
    instagram_ig_id: "1788203918239012",
    title: "Top 3 Ingredients Dermatologists Swear By",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-woman-applying-facial-oil-41214-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
    caption: "Did you know Hyaluronic Acid can actually dry out your skin in low humidity if you don't seal it? Here are 3 science-backed ingredients you need instead 🧴 Save this for your next skincare haul!",
    hashtags: ["#dermatologytips", "#skincareingredients", "#skinhacks", "#estheticiantips"],
    status: "READY",
    duration_seconds: 18.2,
    aspect_ratio: "9:16",
    preview_verified: true,
    is_approved: false,
    approved_by: null,
    published_at: null,
    permalink: null,
    scheduled_at: "2026-10-19T14:30:00Z",
    created_at: "2026-10-17T09:40:00Z",
    is_demo: true,
    rights_ownership: "OWNED",
    is_ad_creative: false,
    publishing_channel: "ORGANIC_REEL",
    video_codec: "H.264",
    audio_codec: "AAC",
    file_size_bytes: 18400000
  },
  {
    id: "reel_103",
    client_id: "cli_lumina_glow",
    instagram_ig_id: "1788203918239012",
    title: "10-Step Vanity vs 1 Clinical Bottle (Split Screen)",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-touching-her-face-with-cream-41589-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    caption: "Stop wasting 25 minutes every morning on 10 products that cancel each other out. 1 clinical lipid formulation, 60 seconds, glowing barrier. Tap link in bio to shop.",
    hashtags: ["#minimalistskincare", "#glowup", "#skincaretips", "#beautyhacks"],
    status: "PUBLISHED",
    duration_seconds: 21.0,
    aspect_ratio: "9:16",
    preview_verified: true,
    is_approved: true,
    approved_by: "usr_demo_agency_lead",
    approved_at: "2026-10-15T09:00:00Z",
    published_at: "2026-10-15T10:15:00Z",
    published_media_id: "1804291829104812",
    permalink: "https://www.instagram.com/reel/DEMO_1804291829104812/",
    scheduled_at: "2026-10-15T10:15:00Z",
    created_at: "2026-10-14T08:00:00Z",
    is_demo: true,
    rights_ownership: "OWNED",
    is_ad_creative: false,
    publishing_channel: "ORGANIC_REEL",
    video_codec: "H.264",
    audio_codec: "AAC",
    file_size_bytes: 21900000
  },
  {
    id: "reel_104",
    client_id: "cli_lumina_glow",
    instagram_ig_id: "1788203918239012",
    title: "Microscopic Moisture Meter 60s Zoom Test",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-moisturizer-on-her-face-41215-large.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
    caption: "We put our ceramide serum to the ultimate test with a clinical moisture sensor. Watch the hydration level jump from 28% to 89% in under 60 seconds.",
    hashtags: ["#skinscience", "#clinicaltrials", "#hydratedskin", "#barrierrestore"],
    status: "DRAFT",
    duration_seconds: 29.4,
    aspect_ratio: "9:16",
    preview_verified: false,
    is_approved: false,
    approved_by: null,
    published_at: null,
    permalink: null,
    created_at: "2026-10-17T12:15:00Z",
    is_demo: true,
    rights_ownership: "OWNED",
    is_ad_creative: false,
    publishing_channel: "ORGANIC_REEL",
    video_codec: "H.264",
    audio_codec: "AAC",
    file_size_bytes: 31200000
  }
];

export const FALLBACK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: "rec_cr_opt_01",
    client_id: "cli_lumina_glow",
    priority: 1,
    title: "Pause Fatigued Ad 'UGC Unboxing Video #4' & Deploy Tested Reel",
    category: "Creative optimization",
    problem_identified: "Creative 'UGC Unboxing Video #4' has reached terminal audience fatigue with frequency at 3.9, resulting in a 44% decline in outbound CTR and an 82% CPA spike from $21.00 to $38.40.",
    supporting_evidence: [
      "Ad frequency reached 3.9 over past 5 days (Meta benchmark threshold: 3.2)",
      "Outbound CTR declined from 2.80% to 1.57%",
      "CPA inflated from baseline $21.00 to $38.40",
      "Alternative tested asset 'Time-Lapse Barrier Repair Reel' is ready in Reel Asset Manager"
    ],
    recommended_action: "Pause fatigued creative 'UGC Unboxing Video #4' in Ad Set 'Broad Advantage+' and introduce validated asset 'Time-Lapse Barrier Repair' with updated hook overlay.",
    expected_mechanism: "Replacing fatigued video creative resets visual novelty in the feed algorithm. Higher thumb-stop rate in the first 3 seconds signals positive relevance to Meta's auction, suppressing CPM penalties and restoring CTR.",
    impact_estimate: {
      metric_name: "CPA Reduction & Cost Recovery",
      estimated_change_range: "-15% to -28% CPA on target ad set",
      uncertainty_rating: "LOW",
      rationale: "Empirical historical lift when rotating fatigued creative past 3.5 frequency; dependent on new creative hold rate. Returns are directional, not guaranteed."
    },
    confidence_level: "HIGH",
    effort_required: "LOW",
    risk: "LOW",
    priority_score: 95,
    approval_required: true,
    action_type: "SWAP_CREATIVE",
    action_payload: {
      target_ad_id: "ad_ugc_04",
      replacement_reel_id: "reel_101",
      adset_id: "adset_901_1"
    },
    status: "PENDING",
    is_insufficient_data: false,
    data_warning: null,
    evidence_links: [
      { title: "Meta Insights: Creative Performance Breakdown", url: "/analytics?level=ad", evidence_type: "INSIGHTS" }
    ],
    diagnosis: "Creative frequency has reached 3.9 over the last 5 days. CTR dropped by 44% (from 2.8% to 1.57%) and CPA spiked from $21 to $38.40.",
    action_description: "Pause creative 'UGC Unboxing Video #4' and deploy tested variation 'Time-Lapse Barrier Repair' into ad set.",
    projected_roas_lift: 0.52,
    projected_weekly_savings_usd: 420.0,
    confidence_score_pct: 95,
    created_at: "2026-10-17T06:00:00Z"
  },
  {
    id: "rec_bg_alloc_02",
    client_id: "cli_lumina_glow",
    priority: 2,
    title: "Reallocate 15% Daily Spend from Facebook Feed to Instagram Reels",
    category: "Budget allocation",
    problem_identified: "Instagram Reels is generating purchases at $16.40 CPA with 4.82 ROAS, whereas Facebook Feed delivers 3.15 ROAS at $28.10 CPA, yet Facebook Feed currently consumes 18% of the daily budget without achieving target efficiency.",
    supporting_evidence: [
      "Instagram Reels 7-day CPA: $16.40 vs Facebook Feed CPA: $28.10 (+71% higher cost)",
      "Instagram Reels ROAS: 4.82x vs Facebook Feed ROAS: 3.15x",
      "Reels video completion rate exceeds feed video by 2.4x for demographic age 22-45"
    ],
    recommended_action: "Adjust Advantage+ placement bid weighting to increase Instagram Reels share of impressions by ~15%, shifting approximately $280 weekly into higher-yielding inventory.",
    expected_mechanism: "Reallocating marginal budget towards the placement with lower marginal acquisition cost and superior video engagement lowers blended account CPA via placement liquidity.",
    impact_estimate: {
      metric_name: "Blended ROAS Gain & Weekly Cost Recovery",
      estimated_change_range: "+0.25x to +0.45x blended ROAS ($240-$380 weekly cost efficiency)",
      uncertainty_rating: "MEDIUM",
      rationale: "Directional estimate based on current placement ROAS spread. Scale efficiency may compress if Reels inventory reaches frequency ceiling."
    },
    confidence_level: "HIGH",
    effort_required: "LOW",
    risk: "LOW",
    priority_score: 95,
    approval_required: true,
    action_type: "REALLOCATE_BUDGET",
    action_payload: {
      source_placement: "Facebook Feed",
      target_placement: "Instagram Reels",
      shift_percent: 15
    },
    status: "PENDING",
    is_insufficient_data: false,
    data_warning: null,
    evidence_links: [
      { title: "Meta Insights: Placement Performance", url: "/analytics?breakdown=placement", evidence_type: "INSIGHTS" }
    ],
    diagnosis: "Instagram Reels placement is generating purchases at $16.40 CPA (4.8 ROAS) compared to Facebook Feed at $28.10 CPA (3.1 ROAS).",
    action_description: "Enable Advantage+ Placement customization with explicit bid multipliers favoring Reels 9:16 inventory.",
    projected_roas_lift: 0.44,
    projected_weekly_savings_usd: 280.0,
    confidence_score_pct: 95,
    created_at: "2026-10-17T06:00:00Z"
  },
  {
    id: "rec_retarget_06",
    client_id: "cli_lumina_glow",
    priority: 3,
    title: "Segment 30-Day Video Viewers (75%+) into Mid-Funnel Retargeting",
    category: "Retargeting",
    problem_identified: "Client has generated over 120,000 3-second video views on Instagram Reels in 30 days, but currently has no dedicated middle-of-funnel retargeting ad set capturing warm video engagers.",
    supporting_evidence: [
      "Over 120,000 video impressions delivered at $0.018 cost per 3-second view",
      "Current bottom-of-funnel retargeting relies solely on website visitors with high 4.8 frequency",
      "High drop-off between video awareness and consideration stage"
    ],
    recommended_action: "Build a custom audience of accounts that watched at least 75% of top Reels, serving them a clinical proof comparison static ad with a 15% first-order discount voucher.",
    expected_mechanism: "Re-engaging high-attention video viewers before they go cold bridges the gap between top-of-funnel discovery and purchase intent, yielding significantly cheaper CPAs than pure cold acquisition.",
    impact_estimate: {
      metric_name: "Middle-of-Funnel Conversion Rate",
      estimated_change_range: "+25% to +40% higher conversion rate vs cold traffic ($18-$22 target CPA)",
      uncertainty_rating: "MEDIUM",
      rationale: "Directional estimate based on video engagement warmth. Relies on coupon incentive appeal. Returns are not guaranteed."
    },
    confidence_level: "HIGH",
    effort_required: "LOW",
    risk: "LOW",
    priority_score: 85,
    approval_required: true,
    action_type: "CREATE_VIDEO_ENGAGEMENT_RETARGETING",
    action_payload: {
      video_threshold: "75_PERCENT",
      lookback_days: 30,
      daily_budget: 25.0
    },
    status: "PENDING",
    is_insufficient_data: false,
    data_warning: null,
    evidence_links: [
      { title: "Meta Custom Audiences Manager", url: "/analytics?level=adset", evidence_type: "INSIGHTS" }
    ],
    diagnosis: "Current Retargeting audience is approaching saturation (Frequency 4.8). Expanding cold top-of-funnel reach with high-value seed list will unlock qualified traffic.",
    action_description: "Build custom audience draft based on top 25% purchase value orders, seeded into 1-2% Lookalike tier.",
    projected_roas_lift: 0.36,
    projected_weekly_savings_usd: 0.0,
    confidence_score_pct: 85,
    created_at: "2026-10-17T06:00:00Z"
  },
  {
    id: "rec_ig_strat_03",
    client_id: "cli_lumina_glow",
    priority: 4,
    title: "Deploy Competitor Proven '10-Step Routine Simplification' Reel Angle",
    category: "Instagram content strategy",
    problem_identified: "Top verified competitor GlowAura Labs has successfully run pattern-interrupt simplicity hooks for 48+ consecutive days on Meta Ad Library, while client messaging currently focuses exclusively on clinical ingredient specifications.",
    supporting_evidence: [
      "Competitor 'GlowAura Labs' ad active 48+ days in Meta Ad Library",
      "Hook text: 'Throw away your 10-step routine right now' generated top creative longevity score",
      "Client's primary hook CTR averages 1.8% vs estimated 2.7% industry upper quartile"
    ],
    recommended_action: "Publish an educational comparison Reel showing a cluttered 10-bottle vanity vs client 1-bottle solution, incorporating the hook: 'Why 10-step skincare routines are actually damaging your skin barrier'.",
    expected_mechanism: "Pattern-interrupt hooks address subconscious customer friction (routine fatigue & high expense). Emotional validation drives longer watch time, signaling organic relevance that lowers paid CPM when boosted.",
    impact_estimate: {
      metric_name: "Hook Hold Rate & Outbound CTR",
      estimated_change_range: "+20% to +35% 3-second hook retention; +0.3% to +0.6% CTR lift",
      uncertainty_rating: "MEDIUM",
      rationale: "Directional benchmark from competitor longevity observation. Does not guarantee direct revenue conversion."
    },
    confidence_level: "HIGH",
    effort_required: "MEDIUM",
    risk: "LOW",
    priority_score: 83,
    approval_required: true,
    action_type: "DEPLOY_REEL_STRATEGY",
    action_payload: {
      concept: "Vanity Clutter vs Minimalist Clinical Solution",
      hook_text: "Stop layering 10 different products every single morning.",
      format: "9:16 Instagram Reel"
    },
    status: "PENDING",
    is_insufficient_data: false,
    data_warning: null,
    evidence_links: [
      { title: "Meta Public Ad Library: GlowAura Labs", url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=GlowAura+Labs&search_type=keyword_unordered", evidence_type: "AD_LIBRARY" }
    ],
    diagnosis: "Competitor analysis reveals pattern-interrupt hooks emphasizing simplicity have run continuously for 48+ days on GlowRecipe with estimated 94 creative score.",
    action_description: "Generate and attach 2 new headline variants featuring the simplicity angle into TOFU campaign draft.",
    projected_roas_lift: 0.28,
    projected_weekly_savings_usd: 0.0,
    confidence_score_pct: 83,
    created_at: "2026-10-17T06:00:00Z"
  },
  {
    id: "rec_conv_track_05",
    client_id: "cli_lumina_glow",
    priority: 5,
    title: "Deploy Meta Conversions API (CAPI) Deduplication for Lost Signal Recovery",
    category: "Conversion tracking",
    problem_identified: "A 24% discrepancy exists between outbound link clicks (3,490) and recorded Landing Page Views (2,652), indicating signal loss from iOS Safari ITP browser restrictions and ad-blockers.",
    supporting_evidence: [
      "3,490 Outbound Link Clicks vs 2,652 Landing Page Views recorded (24% signal evaporation)",
      "Meta Pixel event match quality score is currently 6.2/10 (Meta recommends > 8.0)",
      "Client store lacks server-side Conversions API (CAPI) deduplication headers"
    ],
    recommended_action: "Configure Meta Conversions API gateway with redundant server-side purchase event dispatch and sha256 user parameter hashing to achieve 9.0+ match quality.",
    expected_mechanism: "Server-side event streaming bypasses browser cookie deprecation and network latency, feeding Meta's machine learning algorithm with 15-25% more verified conversion events for attribution calibration.",
    impact_estimate: {
      metric_name: "Attributed Conversion Recovery & Algorithmic Optimization",
      estimated_change_range: "+12% to +20% more verified conversions attributed; algorithmic bidding accuracy improved",
      uncertainty_rating: "LOW",
      rationale: "Direct data engineering improvement; resolves observable client-side telemetry drops without modifying ad spend; directional estimate, returns are not guaranteed."
    },
    confidence_level: "HIGH",
    effort_required: "MEDIUM",
    risk: "LOW",
    priority_score: 83,
    approval_required: false,
    action_type: "SETUP_CAPI_DEDUPLICATION",
    action_payload: {
      target_events: ["PageView", "ViewContent", "AddToCart", "Purchase"],
      deduplication_mode: "EVENT_ID_HASH"
    },
    status: "PENDING",
    is_insufficient_data: false,
    data_warning: null,
    evidence_links: [
      { title: "Meta Events Manager Diagnostics", url: "https://business.facebook.com/events_manager2", evidence_type: "EVENT_MANAGER" }
    ],
    diagnosis: "Campaign 01 is currently delivering an outstanding 4.62 ROAS over 7 consecutive days with only 18% frequency. Marginal CPA has remained flat ($19.20 vs $22.50 target).",
    action_description: "Increase daily budget from $150 to $180 (within the safe 20% pacing ceiling to preserve algorithm learning state).",
    projected_roas_lift: 0.20,
    projected_weekly_savings_usd: 0.0,
    confidence_score_pct: 83,
    created_at: "2026-10-17T06:00:00Z"
  }
];

export const FALLBACK_ANALYTICS: AnalyticsData = {
  client_id: "cli_lumina_glow",
  level: "account",
  date_preset: "last_7d",
  since: "2026-10-10",
  until: "2026-10-16",
  account_metadata: {
    ad_account_id: "act_4829104820",
    ad_account_name: "Lumina Glow Official (Verified Ad Account)",
    currency: "USD",
    account_timezone: "America/Los_Angeles",
    timezone_offset_hours: -7,
    attribution_setting: "7-day click or 1-day view",
    last_synced_at: "2026-10-17T12:00:00Z",
    sync_status: "SUCCESS",
    data_source: "SYNTHETIC_DEMO",
    rate_limit_percent: 12.5
  },
  summary: {
    total_spend: 12180.0,
    impressions: 938200,
    reach: 634000,
    frequency: 1.48,
    clicks: 22530,
    link_clicks: 15320,
    ctr_percent: 2.40,
    link_ctr_percent: 1.63,
    cpc: 0.54,
    cost_per_link_click: 0.79,
    cpm: 12.98,
    results: 601,
    result_metric_name: "Purchases",
    cost_per_result: 20.27,
    attributed_revenue: 52983.0,
    roas: 4.35,
    has_attributed_revenue: true,
    currency: "USD",
    conversions: 601,
    cpa: 20.27,
    change_vs_previous_period_pct: {
      roas: 12.4,
      cpa: -8.6,
      spend: 6.8,
      conversions: 19.3
    }
  },
  trend_history: [
    { date: "2026-10-10", spend: 820, impressions: 63200, reach: 43500, clicks: 1517, link_clicks: 1031, ctr_percent: 2.40, cpc: 0.54, cpm: 12.97, results: 47, cost_per_result: 17.45, roas: 3.9, conversions: 47, cpa: 17.45 },
    { date: "2026-10-11", spend: 850, impressions: 65400, reach: 45100, clicks: 1572, link_clicks: 1069, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 51, cost_per_result: 16.67, roas: 4.1, conversions: 51, cpa: 16.67 },
    { date: "2026-10-12", spend: 790, impressions: 60800, reach: 41900, clicks: 1461, link_clicks: 993, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 44, cost_per_result: 17.95, roas: 3.8, conversions: 44, cpa: 17.95 },
    { date: "2026-10-13", spend: 890, impressions: 68500, reach: 47200, clicks: 1646, link_clicks: 1119, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 56, cost_per_result: 15.89, roas: 4.3, conversions: 56, cpa: 15.89 },
    { date: "2026-10-14", spend: 920, impressions: 70800, reach: 48800, clicks: 1702, link_clicks: 1157, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 60, cost_per_result: 15.33, roas: 4.5, conversions: 60, cpa: 15.33 },
    { date: "2026-10-15", spend: 880, impressions: 67700, reach: 46700, clicks: 1628, link_clicks: 1107, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 54, cost_per_result: 16.30, roas: 4.2, conversions: 54, cpa: 16.30 },
    { date: "2026-10-16", spend: 950, impressions: 73100, reach: 50400, clicks: 1757, link_clicks: 1195, ctr_percent: 2.40, cpc: 0.54, cpm: 12.99, results: 67, cost_per_result: 14.18, roas: 4.8, conversions: 67, cpa: 14.18 }
  ],
  placements: [
    { placement: "Instagram Reels", spend_share_pct: 42.0, roas: 4.82, cpa: 16.40, impressions: 394044, clicks: 10138 },
    { placement: "Instagram Feed", spend_share_pct: 28.0, roas: 4.10, cpa: 21.20, impressions: 262696, clicks: 6083 },
    { placement: "Facebook Feed", spend_share_pct: 18.0, roas: 3.15, cpa: 28.10, impressions: 168876, clicks: 3605 },
    { placement: "Instagram Stories", spend_share_pct: 12.0, roas: 3.85, cpa: 23.50, impressions: 112584, clicks: 2704 }
  ],
  conversion_funnel: [
    { stage_id: "impressions", stage_name: "Ad Impressions", count: 938200, dropoff_pct: 0.0, conversion_rate_pct: 100.0, is_tracked: true },
    { stage_id: "link_clicks", stage_name: "Outbound Link Clicks", count: 15320, dropoff_pct: 98.37, conversion_rate_pct: 1.63, is_tracked: true },
    { stage_id: "landing_page_view", stage_name: "Landing Page Views", count: 11640, dropoff_pct: 24.02, conversion_rate_pct: 1.24, is_tracked: true },
    { stage_id: "add_to_cart", stage_name: "Add to Cart", count: 2280, dropoff_pct: 80.41, conversion_rate_pct: 0.24, is_tracked: true },
    { stage_id: "purchase", stage_name: "Purchases", count: 601, dropoff_pct: 73.64, conversion_rate_pct: 0.064, is_tracked: true },
    { stage_id: "app_install", stage_name: "Mobile App Installs", count: 0, dropoff_pct: 0.0, conversion_rate_pct: 0.0, is_tracked: false, untracked_reason: "Mobile App SDK not configured on this web DTC account" }
  ],
  entities: [
    {
      id: "cmp_01",
      name: "Q4_TOFU_Advantage_BarrierSerum_Hooks_V2",
      level: "campaign",
      status: "ACTIVE",
      spend: 6699.0,
      impressions: 506628,
      reach: 367720,
      frequency: 1.38,
      clicks: 12616,
      link_clicks: 8579,
      ctr_percent: 2.85,
      link_ctr_percent: 1.69,
      cpc: 0.53,
      cpm: 13.22,
      results: 348,
      result_type: "Purchases",
      cost_per_result: 19.25,
      roas: 4.62,
      currency: "USD"
    },
    {
      id: "cmp_02",
      name: "MOFU_Retargeting_EngagedViewers_OfferBundle",
      level: "campaign",
      status: "ACTIVE",
      spend: 3654.0,
      impressions: 262696,
      reach: 152160,
      frequency: 1.73,
      clicks: 7209,
      link_clicks: 4902,
      ctr_percent: 3.22,
      link_ctr_percent: 1.87,
      cpc: 0.51,
      cpm: 13.91,
      results: 192,
      result_type: "Purchases",
      cost_per_result: 19.03,
      roas: 5.15,
      currency: "USD"
    },
    {
      id: "cmp_03",
      name: "BOFU_CartAbandoners_DynamicCatalog",
      level: "campaign",
      status: "PAUSED",
      spend: 1827.0,
      impressions: 168876,
      reach: 114120,
      frequency: 1.48,
      clicks: 2705,
      link_clicks: 1839,
      ctr_percent: 2.10,
      link_ctr_percent: 1.09,
      cpc: 0.68,
      cpm: 10.82,
      results: 61,
      result_type: "Purchases",
      cost_per_result: 29.95,
      roas: 3.80,
      currency: "USD"
    }
  ],
  top_creatives: [
    {
      ad_id: "ad_201",
      ad_name: "Ad 01 - Barrier 72hr UGC Reel",
      headline: "Repair Your Skin Barrier in 72 Hours",
      thumbnail_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
      media_type: "VIDEO",
      spend: 4263.0,
      impressions: 356516,
      frequency: 1.45,
      link_clicks: 6128,
      ctr_percent: 3.12,
      cpc: 0.46,
      results: 246,
      cost_per_result: 17.33,
      roas: 4.82,
      performance_tier: "TOP_PERFORMER",
      diagnosis: "High hook retention (48% 3s hold rate) and low CPM ($14.20). Scale budget by 15-20%."
    },
    {
      ad_id: "ad_202",
      ad_name: "Ad 02 - Dermatologist Clean Alternative",
      headline: "The Clean Alternative to Harsh Retinoids",
      thumbnail_url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      spend: 3045.0,
      impressions: 225168,
      frequency: 1.42,
      link_clicks: 3983,
      ctr_percent: 2.65,
      cpc: 0.54,
      results: 156,
      cost_per_result: 19.52,
      roas: 4.45,
      performance_tier: "TOP_PERFORMER",
      diagnosis: "Clinical authority trust angle generates steady conversion volume with low CPA volatility."
    }
  ],
  weak_creatives: [
    {
      ad_id: "ad_204",
      ad_name: "Ad 04 - UGC Unboxing Video #4",
      headline: "Unboxing My Monthly Skin Delivery",
      thumbnail_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
      media_type: "VIDEO",
      spend: 1461.6,
      impressions: 112584,
      frequency: 4.20,
      link_clicks: 1225,
      ctr_percent: 1.15,
      cpc: 0.88,
      results: 42,
      cost_per_result: 34.80,
      roas: 1.85,
      performance_tier: "WEAK_FATIGUED",
      diagnosis: "Ad fatigue alert: Frequency has reached 4.20. CTR dropped 44% over last 5 days. Recommend pausing."
    },
    {
      ad_id: "ad_205",
      ad_name: "Ad 05 - Generic Lifestyle Bottle Still",
      headline: "Experience Pure Hydration Daily",
      thumbnail_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      spend: 974.4,
      impressions: 75056,
      frequency: 3.80,
      link_clicks: 766,
      ctr_percent: 0.95,
      cpc: 0.94,
      results: 24,
      cost_per_result: 40.60,
      roas: 2.10,
      performance_tier: "WEAK_FATIGUED",
      diagnosis: "Low visual contrast in mobile feed. CTR is below 1.0% industry baseline. Replace with UGC video."
    }
  ],
  action_breakdown: [
    { action_type: "omni_purchase", action_label: "Purchases (Omni-Channel)", count: 601, value: 52983.0, cost_per_action: 20.27 },
    { action_type: "add_to_cart", action_label: "Adds to Cart", count: 2280, value: 98018.0, cost_per_action: 5.34 },
    { action_type: "landing_page_view", action_label: "Landing Page Views", count: 11640, value: null, cost_per_action: 1.05 },
    { action_type: "link_click", action_label: "Link Clicks (Outbound)", count: 15320, value: null, cost_per_action: 0.79 },
    { action_type: "post_engagement", action_label: "Post Engagement", count: 32668, value: null, cost_per_action: 0.37 },
    { action_type: "post_reaction", action_label: "Post Reactions", count: 9462, value: null, cost_per_action: 1.29 }
  ],
  is_demo: true,
  disclaimer: "DEMO MODE: Synthetic ad performance data for preview and strategy validation.",
  date_range: "Last 7 Days"
};

export const FALLBACK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud_1001",
    tenant_id: "tenant_apex_growth",
    actor_id: "usr_demo_agency_lead",
    actor_email: "lead@metapilot-demo.internal",
    action: "CAMPAIGN_DRAFT_CREATED_PAUSED",
    resource_type: "CAMPAIGN",
    resource_id: "cmp_draft_901",
    details: { name: "Q4_TOFU_Advantage_BarrierSerum_Hooks_V2", daily_budget: 120, status: "PAUSED" },
    ip_address: "127.0.0.1",
    timestamp: "2026-10-17T08:30:00Z"
  },
  {
    id: "aud_1002",
    tenant_id: "tenant_apex_growth",
    actor_id: "usr_demo_agency_lead",
    actor_email: "lead@metapilot-demo.internal",
    action: "CAMPAIGN_EXPLICIT_APPROVAL_GRANTED",
    resource_type: "CAMPAIGN",
    resource_id: "cmp_draft_902",
    details: { reason: "Budget reallocated to high ROAS retargeting", signature: "sig_verified_mock_902" },
    ip_address: "127.0.0.1",
    timestamp: "2026-10-15T11:20:00Z"
  },
  {
    id: "aud_1003",
    tenant_id: "tenant_apex_growth",
    actor_id: "usr_demo_agency_lead",
    actor_email: "lead@metapilot-demo.internal",
    action: "REEL_PREVIEW_VERIFIED",
    resource_type: "INSTAGRAM_REEL",
    resource_id: "reel_101",
    details: { duration: 24.5, aspect_ratio: "9:16" },
    ip_address: "127.0.0.1",
    timestamp: "2026-10-16T12:00:00Z"
  }
];

export const FALLBACK_META_CONNECTION: MetaConnection = {
  client_id: "cli_lumina_glow",
  organization_id: "org_apex_growth",
  ad_account_id: "act_4829104820",
  instagram_account_id: "ig_act_9918231",
  meta_app_id: "1982739182746",
  is_connected: true,
  token_masked: "EAAG••••••••••••••••39A8",
  token_expires_at: "2026-12-31T23:59:59Z",
  scopes: ["ads_management", "ads_read", "instagram_basic", "instagram_content_publish"],
  last_verified_at: "2026-10-17T08:00:00Z"
};

export const FALLBACK_FICTIONAL_COMPETITORS: CompetitorProfile[] = [
  {
    id: "comp_01",
    client_id: "cli_lumina_glow",
    brand_name: "GlowAura Labs",
    website: "https://glowauralabs.example.com",
    industry: "DTC Skincare & Barrier Repair",
    geographic_market: "United States & Canada",
    social_profile_urls: {
      meta_ad_library: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=10928374",
      instagram: "https://instagram.com/glowauralabs",
      facebook: "https://facebook.com/glowauralabs"
    },
    verified_research_sources: [
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=10928374",
      "https://glowauralabs.example.com/about"
    ],
    verification_status: "confirmed",
    notes: "Fictional competitor 1 of 5: Clinical 3-in-1 barrier serum positioning."
  },
  {
    id: "comp_02",
    client_id: "cli_lumina_glow",
    brand_name: "PureBotanica Organics",
    website: "https://purebotanica.example.com",
    industry: "Organic Botanical Skincare",
    geographic_market: "United States & UK",
    social_profile_urls: {
      meta_ad_library: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=88192039",
      instagram: "https://instagram.com/purebotanica"
    },
    verified_research_sources: [
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=88192039"
    ],
    verification_status: "confirmed",
    notes: "Fictional competitor 2 of 5: Clean organic botanicals."
  },
  {
    id: "comp_03",
    client_id: "cli_lumina_glow",
    brand_name: "DermaShield Pro",
    website: "https://dermashieldpro.example.com",
    industry: "Clinical Dermatology Skincare",
    geographic_market: "North America",
    social_profile_urls: {
      meta_ad_library: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=77123984",
      facebook: "https://facebook.com/dermashieldpro"
    },
    verified_research_sources: [
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=77123984"
    ],
    verification_status: "confirmed",
    notes: "Fictional competitor 3 of 5: Dermatologist recommended clinical barrier."
  },
  {
    id: "comp_04",
    client_id: "cli_lumina_glow",
    brand_name: "VelvetSkin Rituals",
    website: "https://velvetskinrituals.example.com",
    industry: "Luxury Anti-Aging & Night Care",
    geographic_market: "US, EU & Australia",
    social_profile_urls: {
      meta_ad_library: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=66291823",
      instagram: "https://instagram.com/velvetskinrituals"
    },
    verified_research_sources: [
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=66291823"
    ],
    verification_status: "confirmed",
    notes: "Fictional competitor 4 of 5: Evening recovery elixirs."
  },
  {
    id: "comp_05",
    client_id: "cli_lumina_glow",
    brand_name: "BioHydrate Essentials",
    website: "https://biohydrateessentials.example.com",
    industry: "Electrolyte & Hyaluronic Skincare",
    geographic_market: "United States",
    social_profile_urls: {
      meta_ad_library: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=55109283",
      instagram: "https://instagram.com/biohydrate"
    },
    verified_research_sources: [
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=55109283"
    ],
    verification_status: "confirmed",
    notes: "Fictional competitor 5 of 5: Hydration and active recovery."
  }
];

export const FALLBACK_COMPETITOR_CANDIDATES: CompetitorCandidate[] = [
  {
    id: "cand_01",
    brand_name: "CeramideCloud Care",
    website: "https://ceramidecloud.example.com",
    industry: "DTC Skincare",
    geographic_market: "US & Canada",
    source_reference: "Public Meta Ad Library Search ('barrier repair serum')",
    reason: "Frequently runs video ads targeting barrier repair with 25+ active ad variants.",
    status: "unverified_suggestion"
  },
  {
    id: "cand_02",
    brand_name: "Herbivore Botanicals",
    website: "https://herbivorebotanicals.example.com",
    industry: "Clean Beauty",
    geographic_market: "Global",
    source_reference: "Public Meta Ad Library Search ('botanical facial oil')",
    reason: "Prominent competitor in plant-based aesthetic marketing and carousel formats.",
    status: "unverified_suggestion"
  },
  {
    id: "cand_03",
    brand_name: "BarrierFix Clinicals",
    website: "https://barrierfixclinicals.example.com",
    industry: "Clinical Skincare",
    geographic_market: "United States",
    source_reference: "Google public organic index & public Ad Library",
    reason: "Direct price-point competitor running before/after split screen UGC Reels.",
    status: "unverified_suggestion"
  }
];

export const FALLBACK_AD_OBSERVATIONS: AdObservation[] = [
  {
    id: "obs_01",
    competitor_id: "comp_01",
    competitor_name: "GlowAura Labs",
    ad_copy: "Stop layering 10 different serums. Our 3-in-1 peptide barrier serum boosts hydration by 142%.",
    creative_format: "video",
    cta: "Shop Now",
    hook: "Throw away your 10-step routine right now.",
    offer: "BOGO 40% Off + Free Dew Drops Mini",
    start_date: "2026-08-30",
    observation_date: "2026-10-15",
    source_url: "https://www.facebook.com/ads/library/?id=10928374",
    claim_type: "observation",
    confidence: "high",
    notes: "Observed in active status across US placements."
  },
  {
    id: "obs_02",
    competitor_id: "comp_02",
    competitor_name: "PureBotanica Organics",
    ad_copy: "Dermatologists are warning against over-exfoliation. Heals barrier within 96 hours without harsh actives.",
    creative_format: "video",
    cta: "Learn More",
    hook: "If your face burns when you wash it, listen carefully.",
    offer: "Starter Kit with Free Calming Cleanser",
    start_date: "2026-09-12",
    observation_date: "2026-10-16",
    source_url: "https://www.facebook.com/ads/library/?id=88192039",
    claim_type: "observation",
    confidence: "high"
  },
  {
    id: "obs_03",
    competitor_id: "comp_03",
    competitor_name: "DermaShield Pro",
    ad_copy: "Developed with university hospital dermatologists. SPF 50 mineral shield with invisible zero-white-cast finish.",
    creative_format: "image",
    cta: "Get Offer",
    hook: "Why 80% of sunscreens break your barrier down.",
    offer: "Free Travel Size Duo with orders over $65",
    start_date: "2026-09-01",
    observation_date: "2026-10-17",
    source_url: "https://www.facebook.com/ads/library/?id=77123984",
    claim_type: "observation",
    confidence: "high"
  }
];

export const FALLBACK_INTELLIGENCE_REPORT: CompetitorIntelligenceReport = {
  id: "rep_report_lumina_01",
  client_id: "cli_lumina_glow",
  generated_at: "2026-10-17T08:30:00Z",
  competitors_analyzed: [
    "GlowAura Labs",
    "PureBotanica Organics",
    "DermaShield Pro",
    "VelvetSkin Rituals",
    "BioHydrate Essentials"
  ],
  observations_count: 5,
  workflow_stages_completed: [
    "intake",
    "source_validation",
    "data_normalization",
    "ai_analysis",
    "opportunity_scoring",
    "report"
  ],
  hook_analysis: [
    {
      hook_text: "Throw away your 10-step routine right now.",
      hook_category: "Pattern Interrupt",
      brand_name: "GlowAura Labs",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 10928374",
      frequency_estimate: "High prevalence across video creatives"
    },
    {
      hook_text: "If your face burns when you wash it, listen carefully.",
      hook_category: "Pain Point & Negative Emotion",
      brand_name: "PureBotanica Organics",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 88192039",
      frequency_estimate: "High prevalence in top of funnel hooks"
    },
    {
      hook_text: "Why 80% of sunscreens break your skin barrier down.",
      hook_category: "Contrarian Industry Myth-Buster",
      brand_name: "DermaShield Pro",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 77123984",
      frequency_estimate: "Medium prevalence"
    },
    {
      hook_text: "What French women put on their face before midnight.",
      hook_category: "Curiosity & Cultural Secret",
      brand_name: "VelvetSkin Rituals",
      claim_type: "hypothesis",
      confidence: "medium",
      source_citation: "Public brand positioning analysis",
      frequency_estimate: "Moderate prevalence"
    }
  ],
  positioning_map: [
    {
      brand_name: "GlowAura Labs",
      value_proposition: "Multi-functional minimalist skincare replaces bloated 10-step routines.",
      target_audience_segment: "Overwhelmed skincare enthusiasts seeking fast clinical results.",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 10928374 ad creative copy"
    },
    {
      brand_name: "PureBotanica Organics",
      value_proposition: "Gentle plant botanicals repair fragile skin barriers without steroid creams.",
      target_audience_segment: "Holistic shoppers with eczema/rosacea sensitivity.",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 88192039"
    },
    {
      brand_name: "DermaShield Pro",
      value_proposition: "Hospital dermatologist formulated daily UV and barrier defense.",
      target_audience_segment: "Ingredient conscious skincare purists aged 30-55.",
      claim_type: "observation",
      confidence: "high",
      source_citation: "Meta Ad Library ID: 77123984"
    }
  ],
  promotion_themes: [
    {
      theme: "Routine Simplification (Fewer Bottles, Better Results)",
      frequency_pct: 45.0,
      brands_using: ["GlowAura Labs", "PureBotanica Organics"],
      example_copy: "Stop layering 10 products every morning.",
      claim_type: "observation"
    },
    {
      theme: "Clinical Proof & Ingredient Transparency",
      frequency_pct: 35.0,
      brands_using: ["DermaShield Pro", "GlowAura Labs"],
      example_copy: "Clinically proven to boost hydration by 142%.",
      claim_type: "observation"
    },
    {
      theme: "Scarcity & Restock Urgency Drops",
      frequency_pct: 20.0,
      brands_using: ["VelvetSkin Rituals"],
      example_copy: "Sold out 4 times in 2025. Restocked today only.",
      claim_type: "observation"
    }
  ],
  creative_format_breakdown: {
    "Short-form Video (Reels/9:16)": 60.0,
    "Static Carousel / Product Showcase": 25.0,
    "Single Image Editorial": 15.0
  },
  cta_patterns: [
    { cta_text: "Shop Now", frequency_pct: 55.0, primary_funnel_stage: "Bottom of Funnel (Direct Conversion)" },
    { cta_text: "Learn More", frequency_pct: 30.0, primary_funnel_stage: "Top of Funnel (Education / Problem Awareness)" },
    { cta_text: "Get Offer", frequency_pct: 15.0, primary_funnel_stage: "Middle of Funnel (Promotion / Bundle Push)" }
  ],
  differentiation_opportunities: [
    {
      id: "opp_01",
      category: "Creative Format & Hook Angle",
      unmet_need_or_gap: "Competitors rely heavily on clinical talking heads; zero competitors show real-time 60-second micro-zoom moisture meter tests.",
      recommended_counter_position: "Show instant proof with high-contrast microscopic zoom videos rather than doctor testimonials.",
      suggested_hook: "Stop trusting doctors on TikTok. Watch what this sensor reads in 60 seconds.",
      suggested_offer: "Instant Moisture Guarantee: See 80%+ boost or full refund keep the bottle.",
      impact_score: 92.5,
      effort_level: "LOW",
      evidence_grounding: "Grounded in Ad Library observation where 100% of video creatives use standard talking heads.",
      confidence: "high",
      claim_type: "hypothesis"
    },
    {
      id: "opp_02",
      category: "Pricing & Guarantee Differentiation",
      unmet_need_or_gap: "Most competitors offer BOGO 40% off or small free sample gifts, which delays perceived value.",
      recommended_counter_position: "Offer a '30-Day Empty Bottle' unconditional refund guarantee to completely eliminate purchase friction.",
      suggested_hook: "Use the entire bottle. If your skin isn't transformed, send the empty jar back.",
      suggested_offer: "30-Day Zero Risk Barrier Kit + Free Shipping",
      impact_score: 88.0,
      effort_level: "LOW",
      evidence_grounding: "Derived from Ad Library offer text analysis showing high coupon discounting without risk reversal guarantees.",
      confidence: "high",
      claim_type: "hypothesis"
    },
    {
      id: "opp_03",
      category: "Targeting Angle Differentiation",
      unmet_need_or_gap: "Competitors ignore the post-workout sweat/barrier breakdown demographic, focusing almost exclusively on morning skincare routines.",
      recommended_counter_position: "Position your barrier mist as the essential gym bag recovery product.",
      suggested_hook: "Sweat destroys your barrier if left on your skin for more than 15 minutes.",
      suggested_offer: "Gym & Travel Barrier Duo (20% Off)",
      impact_score: 85.0,
      effort_level: "MEDIUM",
      evidence_grounding: "Public Meta Ad Library tags show 0 competitors bidding on fitness or workout recovery angles.",
      confidence: "medium",
      claim_type: "hypothesis"
    }
  ],
  keyword_clusters: [
    {
      cluster_theme: "Barrier Repair & Sensitive Skin",
      public_search_queries: ["skin barrier repair serum reviews", "how to heal damaged skin barrier fast", "burning skin barrier relief"],
      meta_ad_library_keywords: ["barrier serum", "damaged barrier", "skin barrier repair", "ceramide soothing"]
    },
    {
      cluster_theme: "Minimalist / Multi-Step Alternative",
      public_search_queries: ["3 in 1 peptide serum", "minimalist skincare routine for acne", "replace 10 step skincare"],
      meta_ad_library_keywords: ["all-in-one serum", "stop layering serums", "minimalist skincare"]
    },
    {
      cluster_theme: "Clinical & Dermatologist Validation",
      public_search_queries: ["dermatologist approved barrier repair", "non-comedogenic hydration clinical study"],
      meta_ad_library_keywords: ["clinical study", "dermatologist tested", "boost hydration 142%"]
    }
  ],
  source_attribution_citations: [
    {
      claim: "GlowAura Labs promotes 'Throw away your 10-step routine right now' video creative.",
      source: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=10928374",
      verified: true,
      type: "observation"
    },
    {
      claim: "PureBotanica Organics targets skin burning/stinging discomfort with gentle botanicals.",
      source: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=88192039",
      verified: true,
      type: "observation"
    },
    {
      claim: "Competitors lack real-time moisture sensor demo hooks in current active creative mix.",
      source: "MetaPilot Public Ad Library Scan (5 fictional competitors)",
      verified: true,
      type: "hypothesis"
    }
  ],
  zero_fabrication_guarantee: "COMPLIANCE VERIFIED: Zero synthetic competitor spend, CPC, conversions, or ROAS were generated. All metrics reflect factual public ad observations or AI hypotheses."
};

export const FALLBACK_COMPREHENSIVE_STRATEGY: ComprehensiveStrategyResponse = {
  id: "comp_strat_demo_01",
  client_id: "cli_lumina_glow",
  created_at: "2026-10-17T09:00:00Z",
  industry: "DTC Skincare & Beauty",
  location: "United States & Canada",
  keyword_intelligence: {
    research_keywords: [
      "skin barrier repair serum reviews",
      "how to heal damaged skin barrier fast",
      "best alternative to 10 step skincare routine",
      "ceramide barrier serum for sensitive skin",
      "burning skin sensation after washing face"
    ],
    ad_copy_keywords: [
      "Clinically Proven",
      "72-Hour Barrier Reset",
      "3-in-1 Peptide Formula",
      "Dermatologist Tested",
      "Zero Stinging",
      "Simplify Your Morning",
      "30-Day Empty Bottle Guarantee"
    ],
    meta_targeting_suggestions: [
      {
        name: "Advantage+ Audience (Broad AI Optimization)",
        type: "advantage_plus",
        meta_interest_id: null,
        is_targetable: true,
        validation_source: "Meta Advantage+ Audience Machine Learning Engine",
        description: "Open demographic and geographic targeting with algorithmic pixel optimization."
      },
      {
        name: "Skin care",
        type: "interest",
        meta_interest_id: "6003140510344",
        is_targetable: true,
        validation_source: "Meta Graph API TargetSearch (act_{id}/targetingsearch)",
        description: "Verified Meta Interest. Path: Interests > Beauty > Skin care. Est. size: 120M - 150M."
      },
      {
        name: "Cosmetics",
        type: "interest",
        meta_interest_id: "6003362140411",
        is_targetable: true,
        validation_source: "Meta Graph API TargetSearch (act_{id}/targetingsearch)",
        description: "Verified Meta Interest. Path: Interests > Beauty > Cosmetics. Est. size: 180M - 220M."
      },
      {
        name: "Engaged Shoppers",
        type: "behavior",
        meta_interest_id: "6003102938472",
        is_targetable: true,
        validation_source: "Meta Graph API TargetSearch (act_{id}/targetingsearch)",
        description: "Verified Purchase Behavior. Active shoppers who clicked 'Shop Now' in past 7 days."
      },
      {
        name: "3-in-1 clinical barrier peptide repair serum",
        type: "ad_copy_keyword_only",
        meta_interest_id: null,
        is_targetable: false,
        validation_source: "Untargetable on Meta - Reserve for Ad Copy & Search",
        description: "High-intent consumer query, but does NOT exist as a Meta Interest ID. Use in copy/headlines."
      }
    ],
    marketing_message_themes: [
      "Routine Simplification: Replace 10 products with 1 clinical solution",
      "Microscopic Hydration Sensor Validation (60-second real-time proof)",
      "Unconditional 30-Day Empty Bottle Risk-Free Guarantee"
    ],
    customer_pain_points: [
      "Over-exfoliation and stinging barrier discomfort from harsh actives",
      "Spending $300+ on complex multi-step regimens with minimal results",
      "Wasting 25 minutes every morning applying 10 redundant bottles"
    ],
    advertising_hooks: [
      "Throw away your 10-step routine right now.",
      "Why everything you were told about barrier repair is completely backwards.",
      "Stop trusting doctors on TikTok. Watch what this sensor reads in 60 seconds.",
      "If your face stings after washing it, listen carefully."
    ],
    creative_ideas: [
      "Microscopic 60-Second Moisture Meter Zoom Reel (UGC style)",
      "Split-Screen: Cluttered 10-Bottle Vanity vs Minimalist 1-Bottle Counter",
      "Founder's Lab Authenticity: Explaining why bio-peptides penetrate 3x deeper"
    ],
    suggested_cta_options: [
      "Shop Now",
      "Send WhatsApp Message",
      "Claim Starter Offer",
      "Learn More",
      "Order Today"
    ],
    offer_suggestions: [
      "BOGO 40% Off + Free Dew Drops Mini",
      "30-Day Empty Bottle Guarantee: Full refund if not transformed",
      "Starter Duo Bundle: Free Shipping + Free Cleanser"
    ],
    audience_hypotheses: [
      "Broad Advantage+ Shopping will outperform interest-stacking by 28% after 50 pixel conversions",
      "Women 25-42 experiencing barrier damage have 2.3x higher AOV on bundle offers",
      "WhatsApp click-to-chat conversion works exceptionally well for high-consideration consultations"
    ]
  },
  policy_compliance: {
    industry: "DTC Skincare & Beauty",
    special_ad_category: "NONE",
    is_restricted_industry: true,
    prohibited_attributes_detected: [],
    policy_warnings: [
      "Healthcare Policy Reminder: Meta prohibits side-by-side zoomed before/after images that imply negative self-perception.",
      "Avoid asserting negative personal traits directly in hooks (e.g. 'Are you insecure about acne?'). Focus on product benefits."
    ],
    recommended_disclosures: [
      "Include standard cosmetic disclaimer on topical barrier restoration claims.",
      "Ensure landing page has accessible Terms of Service and Privacy Policy."
    ],
    compliance_score: 95
  },
  strategies: {
    conservative: {
      id: "comp_strat_demo_01_conservative",
      tier: "conservative",
      name: "StableCore: Hydra-Barrier Proven Funnel",
      tagline: "High-confidence proven angles, warm audience prioritization, and steady ROAS preservation.",
      objective: "OUTCOME_SALES",
      target_audience: [
        {
          name: "Core Warm Engagers & 75% Video Watchers",
          type: "Retargeting",
          details: "Past 30-day Instagram profile visitors, Reel engagers, and video viewers (30% budget share).",
          suggested_budget_share_pct: 30
        },
        {
          name: "High-Affinity Category Stack",
          type: "Interest Stacking",
          details: "Verified Meta Interests: 'Skin care' (ID: 6003140510344) + 'Engaged Shoppers' (ID: 6003102938472).",
          suggested_budget_share_pct: 40
        },
        {
          name: "Advantage+ Audience Guardrailed",
          type: "Broad / Advantage+",
          details: "Advantage+ audience with demographic constraints (US/CA, age 24-50).",
          suggested_budget_share_pct: 30
        }
      ],
      location: "United States & Canada",
      budget_allocation: {
        daily_budget_usd: 822.37,
        monthly_budget_usd: 25000.0,
        tofu_pct: 50,
        mofu_pct: 30,
        bofu_pct: 20,
        breakdown_notes: "Allocates 50% to high-affinity discovery and 50% to warm retargeting and consideration to protect margin."
      },
      placements: ["Advantage+ Placements", "Instagram Reels", "Instagram Feed", "Facebook Feed"],
      messaging_hooks: [
        "The clinical way to repair your skin barrier without 10 different serums.",
        "Dermatologist tested formula engineered for daily hydration."
      ],
      creative_formats: ["Static Carousel Product Showcase", "Single Image Clinical Proof", "Tested 9:16 Video Testimonial"],
      cta: "Shop Now",
      conversion_destination: "https://luminaskin.example.com/serum",
      kpis: {
        primary_metric: "Target ROAS & CPA Stability",
        target_roas_range: "3.6x - 4.8x",
        target_cpa_usd: 22.50,
        expected_ctr_range: "1.5% - 2.2%",
        target_conversion_rate: "3.8% - 5.0%",
        benchmarking_disclaimer: "Projections represent target optimization benchmarks based on historical industry models, not guaranteed performance."
      },
      assumptions: [
        "Client has existing website traffic or historical pixel data for 30-day warm retargeting pools.",
        "Core product value proposition is already proven with baseline customer satisfaction."
      ],
      risks: [
        "Audience saturation risk within 30-45 days due to narrower retargeting pools.",
        "Mitigation: Refresh static creatives bi-weekly and expand interest clusters gradually."
      ],
      compatible_ad_set_settings: {
        campaign_objective: "OUTCOME_SALES",
        optimization_goal: "OFFSITE_CONVERSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        is_valid_configuration: true
      },
      creative_angles: [
        {
          concept: "Clinical Simplicity & Routine Relief",
          hook: "The clinical formula replacing 10-step morning routines.",
          primary_text: "Clinically demonstrated to soothe fragile moisture barriers. Formulated specifically for women experiencing routine fatigue.",
          headline: "Meet Hydra-Barrier Ceramide Nectar",
          visual_direction: "Crisp editorial product photo on white marble with clinical ingredient callouts.",
          cta: "Shop Now"
        }
      ]
    },
    balanced: {
      id: "comp_strat_demo_01_balanced",
      tier: "balanced",
      name: "ScaleEngine: Hydra-Barrier Advantage+ Full-Funnel",
      tagline: "Meta AI algorithmic discovery combined with mid-funnel consideration and dynamic retargeting.",
      objective: "OUTCOME_SALES",
      target_audience: [
        {
          name: "Advantage+ Audience (Open Algorithmic Targeting)",
          type: "Broad / Advantage+",
          details: "Open targeting, machine learning driven delivery based on pixel purchase event feedback.",
          suggested_budget_share_pct: 70
        },
        {
          name: "High-Intent Engaged Shoppers & Niche Interests",
          type: "Interest Stacking",
          details: "Verified Meta Interest: 'Natural skincare' (ID: 6003139268393) & 'Engaged Shoppers'.",
          suggested_budget_share_pct: 20
        },
        {
          name: "Dynamic Catalog / 7-Day View Content",
          type: "Retargeting",
          details: "7-day abandon cart and high-intent product page viewers.",
          suggested_budget_share_pct: 10
        }
      ],
      location: "United States & Canada",
      budget_allocation: {
        daily_budget_usd: 822.37,
        monthly_budget_usd: 25000.0,
        tofu_pct: 70,
        mofu_pct: 20,
        bofu_pct: 10,
        breakdown_notes: "Standard 70/20/10 acquisition model: 70% cold Advantage+ discovery, 20% video nurturing, 10% bottom-of-funnel conversion."
      },
      placements: ["Advantage+ Placements (Automatic Placement Optimization across FB/IG)"],
      messaging_hooks: [
        "Why everything you were told about barrier repair is completely backwards.",
        "Throw away your 10-step routine right now.",
        "If your face stings after washing it, listen carefully."
      ],
      creative_formats: ["Short-form 9:16 Reels Video", "Dynamic Product Ads (DPA)", "Split-Screen Before/After Demonstration"],
      cta: "Shop Now",
      conversion_destination: "https://luminaskin.example.com/serum",
      kpis: {
        primary_metric: "Scaled Blended ROAS & Net Profit",
        target_roas_range: "3.2x - 4.4x",
        target_cpa_usd: 26.50,
        expected_ctr_range: "1.8% - 2.8%",
        target_conversion_rate: "3.2% - 4.2%",
        benchmarking_disclaimer: "Projections represent target optimization benchmarks based on historical industry models, not guaranteed performance."
      },
      assumptions: [
        "Meta Pixel is recording at least 50 conversion events per week to exit the learning phase.",
        "Advantage+ Creative enhancements (music, text variations, image expansion) are enabled."
      ],
      risks: [
        "First 5 to 7 days of campaign launch may experience CPM fluctuations during algorithmic calibration.",
        "Mitigation: Avoid editing ad sets during learning phase; use automated rules for budget scaling."
      ],
      compatible_ad_set_settings: {
        campaign_objective: "OUTCOME_SALES",
        optimization_goal: "OFFSITE_CONVERSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        is_valid_configuration: true
      },
      creative_angles: [
        {
          concept: "Pattern Interrupt Problem-Solver",
          hook: "Stop layering 10 different products every single morning.",
          primary_text: "Our 3-in-1 formula delivers 142% hydration boost in 72 hours. Perfect for sensitive skin.",
          headline: "The Minimalist Skincare Breakthrough",
          visual_direction: "Fast-paced vertical Reel: Creator wiping off 8 bottles, holding up 1 bottle.",
          cta: "Shop Now"
        }
      ]
    },
    experimental: {
      id: "comp_strat_demo_01_experimental",
      tier: "experimental",
      name: "AlphaHacks: Hydra-Barrier Contrarian Growth",
      tagline: "Aggressive contrarian hooks, creator UGC micro-demos, and WhatsApp direct conversational closing.",
      objective: "OUTCOME_SALES",
      target_audience: [
        {
          name: "Contrarian Broad Cold Testing (100% Unrestricted)",
          type: "Broad / Advantage+",
          details: "Broad unrestricted targeting letting provocative hooks filter the audience algorithmically.",
          suggested_budget_share_pct: 80
        },
        {
          name: "Lookalike 1% High LTV Customers & WhatsApp Chatted",
          type: "Lookalike",
          details: "1% Lookalike of top 10% highest lifetime value customers and qualified leads.",
          suggested_budget_share_pct: 20
        }
      ],
      location: "United States & Canada",
      budget_allocation: {
        daily_budget_usd: 822.37,
        monthly_budget_usd: 25000.0,
        tofu_pct: 80,
        mofu_pct: 15,
        bofu_pct: 5,
        breakdown_notes: "Aggressive 80% cold test allocation designed for fast creative iteration and unlocking viral winning angles."
      },
      placements: ["Instagram Reels Exclusively", "Instagram Stories", "WhatsApp Direct Feed"],
      messaging_hooks: [
        "Stop trusting skincare influencers. Watch what this sensor reads in 60 seconds.",
        "Sweat destroys your barrier if left on your skin for more than 15 minutes.",
        "What French women put on their face before midnight."
      ],
      creative_formats: ["Raw Native UGC Reels (Lo-Fi)", "Real-time Sensor Test Demos", "WhatsApp Click-to-Chat Video Ad"],
      cta: "Claim Offer",
      conversion_destination: "https://luminaskin.example.com/vip-offer",
      kpis: {
        primary_metric: "Customer Acquisition Velocity & Volume",
        target_roas_range: "2.8x - 4.0x",
        target_cpa_usd: 31.00,
        expected_ctr_range: "2.4% - 3.8%",
        target_conversion_rate: "2.8% - 3.8%",
        benchmarking_disclaimer: "Projections represent target optimization benchmarks based on historical industry models, not guaranteed performance."
      },
      assumptions: [
        "Client can produce or test 3-5 fresh creative hooks weekly to capitalize on algorithmic momentum.",
        "WhatsApp response time is under 5 minutes during business hours for conversational funnels."
      ],
      risks: [
        "Higher creative fatigue rate due to high-intensity contrarian hooks.",
        "Mitigation: Kill sub-par ad variants within 48 hours and scale top 10% winning creatives immediately."
      ],
      compatible_ad_set_settings: {
        campaign_objective: "OUTCOME_SALES",
        optimization_goal: "OFFSITE_CONVERSIONS",
        destination_type: "WEBSITE",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        is_valid_configuration: true
      },
      creative_angles: [
        {
          concept: "The High-Contrast Sensor Challenge",
          hook: "I put this $15 moisture sensor on my face after 7 days.",
          primary_text: "Watch the real-time sensor readout jump from 18% to 84% in under 60 seconds without greasy residue.",
          headline: "Instant Hydration Guarantee",
          visual_direction: "Over-the-shoulder handheld phone recording real-time digital screen meter.",
          cta: "Claim Offer"
        }
      ]
    }
  },
  zero_guarantee_compliance_notice: "COMPLIANCE NOTICE: MetaPilot AI strictly adheres to Meta Advertising Standards and truth-in-advertising guidelines. No performance results or revenue amounts are guaranteed. All KPIs represent directional modeling based on budget."
};

export const FALLBACK_SAVED_STRATEGIES: SavedStrategyRecord[] = [
  {
    id: "saved_strat_01",
    client_id: "cli_lumina_glow",
    selected_tier: "balanced",
    strategy_plan: FALLBACK_COMPREHENSIVE_STRATEGY.strategies.balanced,
    saved_at: "2026-10-17T09:15:00Z",
    created_by: "lead@metapilot-demo.internal",
    notes: "Approved Q4 Advantage+ Full Funnel architecture for Lumina Skin Co."
  }
];

// ---------------------------------------------------------
// Automations, Reporting, & Notifications Fallbacks
// ---------------------------------------------------------

export const FALLBACK_BACKGROUND_JOBS: BackgroundJob[] = [
  {
    id: "job_daily_sync",
    job_type: "DAILY_METRICS_SYNC",
    name: "Authorized Ad Metrics Synchronization",
    schedule_cron: "0 2 * * *",
    cadence: "Daily at 02:00 UTC",
    status: "COMPLETED",
    retry_count: 0,
    max_retries: 3,
    last_run_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    next_run_at: new Date(Date.now() + 3600000 * 20).toISOString(),
    execution_duration_sec: 4.82,
    result_summary: {
      synced_accounts: 3,
      records_ingested: 48,
      sync_window: "LAST_30_DAYS",
      meta_api_status: "200_OK"
    }
  },
  {
    id: "job_daily_anomalies",
    job_type: "DAILY_ANOMALY_DETECTION",
    name: "Automated Performance Anomaly Scanner",
    schedule_cron: "30 2 * * *",
    cadence: "Daily at 02:30 UTC",
    status: "COMPLETED",
    retry_count: 0,
    max_retries: 3,
    last_run_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    next_run_at: new Date(Date.now() + 3600000 * 20.5).toISOString(),
    execution_duration_sec: 2.15,
    result_summary: {
      anomalies_flagged: 2,
      critical_issues: 1,
      notifications_dispatched: 2
    }
  },
  {
    id: "job_weekly_report",
    job_type: "WEEKLY_PERFORMANCE_REPORT",
    name: "Executive Weekly Performance Summary & Recommendations",
    schedule_cron: "0 6 * * 1",
    cadence: "Every Monday at 06:00 UTC",
    status: "COMPLETED",
    retry_count: 0,
    max_retries: 3,
    last_run_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    next_run_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    execution_duration_sec: 7.94,
    result_summary: {
      reports_generated: 3,
      recommendations_scoped: 15,
      delivery_channels: ["IN_APP", "EXECUTIVE_DOWNLOAD"]
    }
  },
  {
    id: "job_creative_workflow",
    job_type: "CREATIVE_WORKFLOW_DISPATCH",
    name: "Reels & Campaign Approval Notification Dispatcher",
    schedule_cron: "*/15 * * * *",
    cadence: "Every 15 minutes",
    status: "COMPLETED",
    retry_count: 0,
    max_retries: 3,
    last_run_at: new Date(Date.now() - 60000 * 12).toISOString(),
    next_run_at: new Date(Date.now() + 60000 * 3).toISOString(),
    execution_duration_sec: 1.12,
    result_summary: {
      pending_reel_approvals_alerted: 2,
      pending_campaign_approvals_alerted: 1,
      publications_tracked: 4
    }
  },
  {
    id: "job_approval_sweep",
    job_type: "APPROVE_EXPIRED_SWEEP",
    name: "Stale Approval & Budget Policy Revocation Sweep",
    schedule_cron: "0 * * * *",
    cadence: "Hourly on the hour",
    status: "COMPLETED",
    retry_count: 0,
    max_retries: 3,
    last_run_at: new Date(Date.now() - 3600000).toISOString(),
    next_run_at: new Date(Date.now() + 3600000).toISOString(),
    execution_duration_sec: 0.84,
    result_summary: {
      expired_records_revoked: 0,
      active_guardrails_verified: 4
    }
  }
];

export const FALLBACK_PERFORMANCE_ANOMALIES: PerformanceAnomaly[] = [
  {
    id: "anom_ctr_drop_01",
    client_id: "cli_lumina_glow",
    metric: "CTR",
    severity: "WARNING",
    headline: "CTR decreased 28.4% WoW on Advantage+ Shopping",
    explanation: "Click-through rate dropped from 2.68% to 1.92% over the last 3 days. Average frequency increased to 3.82, signaling creative saturation on primary UGC video.",
    current_value: 1.92,
    benchmark_value: 2.68,
    percentage_change: -28.36,
    detected_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    supporting_data: {
      previous_7d_ctr: 2.68,
      last_3d_ctr: 1.92,
      frequency_spike: 3.82,
      affected_adset: "Advantage+ Shopping - Broad Females 21-45"
    },
    acknowledged: false
  },
  {
    id: "anom_cpa_spike_02",
    client_id: "cli_lumina_glow",
    metric: "CPA",
    severity: "CRITICAL",
    headline: "CPA spiked 34.2% above target on Retargeting set",
    explanation: "Cost per acquisition escalated from $18.50 to $24.82 (+34.2%). Link click cost increased as audience pool size reached exhaustion.",
    current_value: 24.82,
    benchmark_value: 18.50,
    percentage_change: 34.16,
    detected_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    supporting_data: {
      target_cpa: 18.50,
      current_cpa: 24.82,
      reach_exhaustion_pct: 88.4,
      affected_adset: "Retargeting - Cart Abandoners 14D"
    },
    acknowledged: false
  }
];

export const FALLBACK_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif_reel_01",
    tenant_id: "org_apex_growth",
    client_id: "cli_lumina_glow",
    notification_type: "REEL_APPROVAL_REQUIRED",
    title: "Reel Approval Required",
    message: "New production draft 'Glass Skin Morning Routine' requires executive review prior to Instagram publishing.",
    entity_id: "reel_101",
    entity_type: "REEL",
    action_url: "/reels",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: "notif_camp_02",
    tenant_id: "org_apex_growth",
    client_id: "cli_lumina_glow",
    notification_type: "CAMPAIGN_APPROVAL_PENDING",
    title: "Campaign Activation Approval Pending",
    message: "Campaign 'Q4 Advantage+ Full Funnel' draft created in PAUSED status. Needs authorized client sign-off before Meta activation.",
    entity_id: "camp_draft_q4",
    entity_type: "CAMPAIGN",
    action_url: "/campaigns",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false
  },
  {
    id: "notif_pub_03",
    tenant_id: "org_apex_growth",
    client_id: "cli_lumina_glow",
    notification_type: "PUBLICATION_SUCCESS",
    title: "Instagram Reel Published Successfully",
    message: "Reel '72hr Barrier Repair UGC' is live on @luminaglow (IG Media ID: ig_media_883921).",
    entity_id: "reel_102",
    entity_type: "REEL",
    action_url: "/reels",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    read_at: new Date(Date.now() - 86400000 + 3600000).toISOString()
  },
  {
    id: "notif_anom_04",
    tenant_id: "org_apex_growth",
    client_id: "cli_lumina_glow",
    notification_type: "ANOMALY_DETECTED",
    title: "Performance Anomaly Detected",
    message: "CPA spiked 34.2% on Retargeting set. Anomaly scanner recommends creative refresh or audience expansion.",
    entity_id: "anom_cpa_spike_02",
    entity_type: "ANOMALY",
    action_url: "/automations",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    read: false
  },
  {
    id: "notif_rep_05",
    tenant_id: "org_apex_growth",
    client_id: "cli_lumina_glow",
    notification_type: "WEEKLY_REPORT_READY",
    title: "Weekly Performance Report Generated",
    message: "Executive weekly summary comparing WoW performance with 5 prioritized recommendations is ready.",
    entity_id: "rep_weekly_2026_w41",
    entity_type: "REPORT",
    action_url: "/automations",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    read: true,
    read_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString()
  }
];

export const FALLBACK_PERFORMANCE_REPORTS: PerformanceReport[] = [
  {
    id: "rep_weekly_2026_w41",
    client_id: "cli_lumina_glow",
    period_start: "2026-10-10T00:00:00Z",
    period_end: "2026-10-17T00:00:00Z",
    generated_at: "2026-10-17T06:00:00Z",
    status: "GENERATED",
    csv_download_url: "/api/v1/automations/reports/rep_weekly_2026_w41/csv",
    summary_markdown: "### Weekly Performance Summary (Lumina Glow Skin)\n\nOverall advertising efficiency improved this week with a **+12.6% increase in blended ROAS** (3.84x vs 3.41x) and a **-10.7% decrease in acquisition cost** ($18.42 vs $20.63). Ad spend scaled cautiously by +6.8% to $3,480.00.\n\nKey drivers include top-performing UGC video variations maintaining a strong 48% 3-second hook retention. Retargeting CPA, however, showed signs of saturation (+34% spike), prompting an automatic recommendation to expand custom audience lookbacks.",
    kpi_summary: {
      current_period: {
        spend: 3480.0,
        impressions: 215400,
        link_clicks: 5820,
        ctr_percent: 2.70,
        conversions: 189,
        cpa: 18.42,
        roas: 3.84
      },
      previous_period: {
        spend: 3258.0,
        impressions: 197600,
        link_clicks: 5178,
        ctr_percent: 2.62,
        conversions: 158,
        cpa: 20.63,
        roas: 3.41
      },
      wow_change_pct: {
        spend: 6.8,
        impressions: 9.0,
        link_clicks: 12.4,
        ctr_percent: 3.1,
        conversions: 19.6,
        cpa: -10.7,
        roas: 12.6
      }
    },
    top_performing_creatives: [
      { name: "Ad 01 - Barrier 72hr UGC Reel", roas: 4.82, cpa: 14.20, spend: 1240.0 },
      { name: "Ad 02 - Morning Routine Step 3", roas: 3.95, cpa: 17.50, spend: 980.0 },
      { name: "Ad 03 - Dermatologist Breakdown", roas: 3.40, cpa: 21.10, spend: 720.0 }
    ],
    anomalies_detected: FALLBACK_PERFORMANCE_ANOMALIES,
    prioritized_recommendations: FALLBACK_RECOMMENDATIONS
  }
];

export const FALLBACK_ACTION_VALIDATION: ActionValidationResponse = {
  action_type: "ACTIVATE_CAMPAIGN",
  allowed: true,
  requires_human_approval: true,
  reason: "Action validated within server-side safety boundaries with verified human approval record.",
  client_monthly_budget_usd: 25000.0,
  client_daily_budget_limit_usd: 1666.67,
  budget_limit_exceeded: false,
  approval_expired: false
};




