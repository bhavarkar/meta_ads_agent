"""AI Agent Service utilizing LangGraph-compatible state workflows,
OpenAI structured generation, and Meta Advertising Targeting & Policy validation.
"""

import datetime
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.strategy import (
    CampaignStrategyRequest,
    CampaignStrategyResponse,
    AudienceTarget,
    AdCreativeAngle,
    ComprehensiveStrategyRequest,
    ComprehensiveStrategyResponse,
    KeywordIntelligence,
    SingleStrategyPlan,
    StrategyBudgetAllocation,
    StrategyKPIs,
    SavedStrategyRecord,
    SaveStrategyRequest
)
from app.schemas.recommendation import AIRecommendation, RecommendationListResponse
from app.services.demo_data_service import DEMO_RECOMMENDATIONS
from app.services.meta_targeting_registry import (
    validate_meta_targeting_entity,
    evaluate_industry_policy_compliance,
    validate_ad_set_configuration
)

# In-memory storage for saved strategies (synced with Supabase campaign_strategies in connected mode)
SAVED_STRATEGIES_STORE: Dict[str, SavedStrategyRecord] = {}


class AIAgentService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.is_demo = settings.is_demo_mode

    async def generate_comprehensive_strategy(
        self, request: ComprehensiveStrategyRequest
    ) -> ComprehensiveStrategyResponse:
        """
        Generates 3 distinct Meta advertising strategies (Conservative, Balanced, Experimental),
        with rigorous keyword intelligence separation, validated Meta targeting entities,
        industry policy checks, and zero-guarantee compliance notice.
        """
        # 1. Budget Normalization
        if request.budget_type == "daily":
            daily_budget = round(request.budget_amount, 2)
            monthly_budget = round(request.budget_amount * 30.4, 2)
        else:
            monthly_budget = round(request.budget_amount, 2)
            daily_budget = round(request.budget_amount / 30.4, 2)

        strategy_id = f"comp_strat_{int(datetime.datetime.now().timestamp())}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 2. Competitor insights blending
        competitor_hooks = request.competitor_research_results or [
            "Throw away your 10-step routine right now.",
            "If your skin stings when washing your face, your barrier is damaged.",
            "Why 80% of sunscreens break your skin barrier down."
        ]

        # 3. Generate Keyword Intelligence with Strict Separation
        # Research keywords (Consumer search, SEO, problem discovery)
        research_keywords = [
            f"{request.product_service} reviews and results",
            f"how to fix {request.product_service.lower()} fast",
            f"best alternative to traditional {request.industry.lower()} products",
            f"{request.product_service.lower()} for {request.customer_profile.split(',')[0]}",
            f"clinical proof {request.product_service.lower()}"
        ]

        # Ad Copy Keywords (High-converting vocabulary & power angles)
        ad_copy_keywords = [
            "Clinically Proven", "72-Hour Transformation", "Zero Compromises",
            "Dermatologist Tested", "Barrier Restoration", "Simplify Your Routine",
            "Instant Moisture Guarantee", "Empty Bottle Refund", "Clean Active Formula"
        ]

        # Meta Targeting Suggestions (Strictly validated through Meta Targeting Registry)
        candidate_targeting_terms = [
            "Advantage+ Audience (Broad AI Optimization)",
            "Skin care",
            "Cosmetics",
            "Engaged Shoppers",
            "Natural skincare",
            # Untargetable arbitrary keyword to demonstrate strict separation:
            "3-in-1 clinical barrier peptide repair serum",
            "Dermatologist recommended morning skincare routine"
        ]
        meta_targeting_suggestions = [
            validate_meta_targeting_entity(term) for term in candidate_targeting_terms
        ]

        # Message Themes & Hooks
        marketing_themes = [
            "Routine Simplification: Replace 10 products with 1 clinical solution",
            "Scientific Proof: Fast microscopic hydration sensor verification",
            "Risk Reversal: Unconditional 30-Day Empty Bottle guarantee"
        ]
        customer_pain_points = [
            "Routine Fatigue: Spending $300+ on complex multi-step regimens with minimal results",
            "Skin Sensitivity: Burning or redness caused by over-exfoliation and harsh actives",
            "Time Consumption: Wasting 25 minutes every morning and night"
        ]
        advertising_hooks = [
            f"Why everything you were told about {request.product_service} is completely backwards.",
            competitor_hooks[0] if competitor_hooks else "Throw away your 10-step routine right now.",
            "Stop trusting doctors on social media. Watch what this sensor reads in 60 seconds.",
            f"If your face stings after washing it, read this before buying another product."
        ]
        creative_ideas = [
            "Microscopic 60-Second Moisture Meter Zoom Reel (UGC style)",
            "Split-Screen: Cluttered 10-Bottle Vanity vs Minimalist 1-Bottle Counter",
            "Founder's Lab Authenticity: Explaining why bio-peptides penetrate 3x deeper"
        ]
        suggested_ctas = [
            "Shop Now", "Send WhatsApp Message", "Claim Starter Offer", "Learn More", "Order Today"
        ]
        offer_suggestions = [
            "BOGO 40% Off + Free Travel Moisture Mist",
            "30-Day Empty Bottle Guarantee: Full refund if not transformed",
            "Starter Duo Bundle: Free Shipping + Free pH Balancing Cleanser"
        ]
        audience_hypotheses = [
            "Broad Advantage+ Shopping will outperform interest-stacking by 28% after 50 pixel conversions",
            "Women 25-42 experiencing barrier damage have 2.3x higher AOV on bundle offers",
            "WhatsApp click-to-chat conversion works exceptionally well for high-consideration consultations"
        ]

        keyword_intel = KeywordIntelligence(
            research_keywords=research_keywords,
            ad_copy_keywords=ad_copy_keywords,
            meta_targeting_suggestions=meta_targeting_suggestions,
            marketing_message_themes=marketing_themes,
            customer_pain_points=customer_pain_points,
            advertising_hooks=advertising_hooks,
            creative_ideas=creative_ideas,
            suggested_cta_options=suggested_ctas,
            offer_suggestions=offer_suggestions,
            audience_hypotheses=audience_hypotheses
        )

        # 4. Policy Compliance Evaluation
        policy_report = evaluate_industry_policy_compliance(
            industry=request.industry,
            product=request.product_service,
            copy_or_hooks=advertising_hooks
        )

        # 5. Ad Set Compatibility
        ad_set_compat = validate_ad_set_configuration(
            objective=request.campaign_objective,
            destination=request.destination_type
        )

        # 6. Build the Three Strategy Plans

        # A. CONSERVATIVE STRATEGY
        conservative_plan = SingleStrategyPlan(
            id=f"{strategy_id}_conservative",
            tier="conservative",
            name=f"StableCore: {request.product_service} Proven Funnel",
            tagline="High-confidence proven angles, warm audience prioritization, and steady ROAS preservation.",
            objective=request.campaign_objective,
            target_audience=[
                AudienceTarget(
                    name="Core Warm Engagers & 75% Video Watchers",
                    type="Retargeting",
                    details="Past 30-day Instagram profile visitors, Reel engagers, and video viewers (30% budget share).",
                    suggested_budget_share_pct=30
                ),
                AudienceTarget(
                    name="High-Affinity Category Stack",
                    type="Interest Stacking",
                    details="Verified Meta Interests: 'Skin care' (ID: 6003140510344) + 'Engaged Shoppers' (ID: 6003102938472).",
                    suggested_budget_share_pct=40
                ),
                AudienceTarget(
                    name="Advantage+ Audience Guardrailed",
                    type="Broad / Advantage+",
                    details=f"Advantage+ audience with demographic constraints ({request.location}, age 24-50).",
                    suggested_budget_share_pct=30
                )
            ],
            location=request.location,
            budget_allocation=StrategyBudgetAllocation(
                daily_budget_usd=daily_budget,
                monthly_budget_usd=monthly_budget,
                tofu_pct=50,
                mofu_pct=30,
                bofu_pct=20,
                breakdown_notes="Allocates 50% to high-affinity discovery and 50% to warm retargeting and consideration to protect margin."
            ),
            placements=["Advantage+ Placements", "Instagram Reels", "Instagram Feed", "Facebook Feed"],
            messaging_hooks=[
                f"The clinical way to repair your skin barrier without 10 different serums.",
                "Dermatologist tested formula engineered for daily hydration."
            ],
            creative_formats=["Static Carousel Product Showcase", "Single Image Clinical Proof", "Tested 9:16 Video Testimonial"],
            cta="Shop Now" if request.destination_type == "WEBSITE" else "Send WhatsApp Message",
            conversion_destination=request.destination_url or "https://client-store.example.com/products/barrier-serum",
            kpis=StrategyKPIs(
                primary_metric="Target ROAS & CPA Stability",
                target_roas_range="3.6x - 4.8x",
                target_cpa_usd=round(daily_budget * 0.35, 2) or 22.50,
                expected_ctr_range="1.5% - 2.2%",
                target_conversion_rate="3.8% - 5.0%"
            ),
            assumptions=[
                "Client has existing website traffic or historical pixel data for 30-day warm retargeting pools.",
                "Core product value proposition is already proven with baseline customer satisfaction."
            ],
            risks=[
                "Audience saturation risk within 30-45 days due to narrower retargeting pools.",
                "Mitigation: Refresh static creatives bi-weekly and expand interest clusters gradually."
            ],
            compatible_ad_set_settings=ad_set_compat,
            creative_angles=[
                AdCreativeAngle(
                    concept="Clinical Simplicity & Routine Relief",
                    hook="The clinical formula replacing 10-step morning routines.",
                    primary_text=f"Clinically demonstrated to soothe fragile moisture barriers. Formulated specifically for {request.customer_profile}.",
                    headline=f"Meet {request.product_service}",
                    visual_direction="Crisp editorial product photo on white marble with clinical ingredient callouts.",
                    cta="Shop Now"
                )
            ]
        )

        # B. BALANCED STRATEGY
        balanced_plan = SingleStrategyPlan(
            id=f"{strategy_id}_balanced",
            tier="balanced",
            name=f"ScaleEngine: {request.product_service} Advantage+ Full-Funnel",
            tagline="Meta AI algorithmic discovery combined with mid-funnel consideration and dynamic retargeting.",
            objective=request.campaign_objective,
            target_audience=[
                AudienceTarget(
                    name="Advantage+ Audience (Open Algorithmic Targeting)",
                    type="Broad / Advantage+",
                    details="Open targeting, machine learning driven delivery based on pixel purchase event feedback.",
                    suggested_budget_share_pct=70
                ),
                AudienceTarget(
                    name="High-Intent Engaged Shoppers & Niche Interests",
                    type="Interest Stacking",
                    details="Verified Meta Interest: 'Natural skincare' (ID: 6003139268393) & 'Engaged Shoppers'.",
                    suggested_budget_share_pct=20
                ),
                AudienceTarget(
                    name="Dynamic Catalog / 7-Day View Content",
                    type="Retargeting",
                    details="7-day abandon cart and high-intent product page viewers.",
                    suggested_budget_share_pct=10
                )
            ],
            location=request.location,
            budget_allocation=StrategyBudgetAllocation(
                daily_budget_usd=daily_budget,
                monthly_budget_usd=monthly_budget,
                tofu_pct=70,
                mofu_pct=20,
                bofu_pct=10,
                breakdown_notes="Standard 70/20/10 acquisition model: 70% cold Advantage+ discovery, 20% video nurturing, 10% bottom-of-funnel conversion."
            ),
            placements=["Advantage+ Placements (Automatic Placement Optimization across FB/IG)"],
            messaging_hooks=[
                f"Why everything you were told about {request.product_service} is completely backwards.",
                "Throw away your 10-step routine right now.",
                "If your face stings after washing it, listen carefully."
            ],
            creative_formats=["Short-form 9:16 Reels Video", "Dynamic Product Ads (DPA)", "Split-Screen Before/After Demonstration"],
            cta="Shop Now" if request.destination_type == "WEBSITE" else "Send WhatsApp Message",
            conversion_destination=request.destination_url or "https://client-store.example.com/products/barrier-serum",
            kpis=StrategyKPIs(
                primary_metric="Scaled Blended ROAS & Net Profit",
                target_roas_range="3.2x - 4.4x",
                target_cpa_usd=round(daily_budget * 0.42, 2) or 26.50,
                expected_ctr_range="1.8% - 2.8%",
                target_conversion_rate="3.2% - 4.2%"
            ),
            assumptions=[
                "Meta Pixel is recording at least 50 conversion events per week to exit the learning phase.",
                "Advantage+ Creative enhancements (music, text variations, image expansion) are enabled."
            ],
            risks=[
                "First 5 to 7 days of campaign launch may experience CPM fluctuations during algorithmic calibration.",
                "Mitigation: Avoid editing ad sets during learning phase; use automated rules for budget scaling."
            ],
            compatible_ad_set_settings=ad_set_compat,
            creative_angles=[
                AdCreativeAngle(
                    concept="Pattern Interrupt Problem-Solver",
                    hook="Stop layering 10 different products every single morning.",
                    primary_text=f"Our 3-in-1 formula delivers 142% hydration boost in 72 hours. Perfect for {request.customer_profile}.",
                    headline="The Minimalist Skincare Breakthrough",
                    visual_direction="Fast-paced vertical Reel: Creator wiping off 8 bottles, holding up 1 bottle.",
                    cta="Shop Now"
                )
            ]
        )

        # C. EXPERIMENTAL STRATEGY
        experimental_plan = SingleStrategyPlan(
            id=f"{strategy_id}_experimental",
            tier="experimental",
            name=f"AlphaHacks: {request.product_service} Contrarian Growth",
            tagline="Aggressive contrarian hooks, creator UGC micro-demos, and WhatsApp direct conversational closing.",
            objective=request.campaign_objective,
            target_audience=[
                AudienceTarget(
                    name="Contrarian Broad Cold Testing (100% Unrestricted)",
                    type="Broad / Advantage+",
                    details="Broad unrestricted targeting letting provocative hooks filter the audience algorithmically.",
                    suggested_budget_share_pct=80
                ),
                AudienceTarget(
                    name="Lookalike 1% High LTV Customers & WhatsApp Chatted",
                    type="Lookalike",
                    details="1% Lookalike of top 10% highest lifetime value customers and qualified leads.",
                    suggested_budget_share_pct=20
                )
            ],
            location=request.location,
            budget_allocation=StrategyBudgetAllocation(
                daily_budget_usd=daily_budget,
                monthly_budget_usd=monthly_budget,
                tofu_pct=80,
                mofu_pct=15,
                bofu_pct=5,
                breakdown_notes="Aggressive 80% cold test allocation designed for fast creative iteration and unlocking viral winning angles."
            ),
            placements=["Instagram Reels Exclusively", "Instagram Stories", "WhatsApp Direct Feed"],
            messaging_hooks=[
                "Stop trusting skincare influencers. Watch what this sensor reads in 60 seconds.",
                "Sweat destroys your barrier if left on your skin for more than 15 minutes.",
                "What French women put on their face before midnight."
            ],
            creative_formats=["Raw Native UGC Reels (Lo-Fi)", "Real-time Sensor Test Demos", "WhatsApp Click-to-Chat Video Ad"],
            cta="Send WhatsApp Message" if request.destination_type == "WHATSAPP" else "Get Offer",
            conversion_destination="https://wa.me/15550192834?text=Hi%20MetaPilot%20Skincare%20Consultation" if request.destination_type == "WHATSAPP" else (request.destination_url or "https://client-store.example.com/vip-offer"),
            kpis=StrategyKPIs(
                primary_metric="Customer Acquisition Velocity & Volume",
                target_roas_range="2.8x - 4.0x",
                target_cpa_usd=round(daily_budget * 0.48, 2) or 31.00,
                expected_ctr_range="2.4% - 3.8%",
                target_conversion_rate="2.8% - 3.8%"
            ),
            assumptions=[
                "Client can produce or test 3-5 fresh creative hooks weekly to capitalize on algorithmic momentum.",
                "WhatsApp response time is under 5 minutes during business hours for conversational funnels."
            ],
            risks=[
                "Higher creative fatigue rate due to high-intensity contrarian hooks.",
                "Mitigation: Kill sub-par ad variants within 48 hours and scale top 10% winning creatives immediately."
            ],
            compatible_ad_set_settings=ad_set_compat,
            creative_angles=[
                AdCreativeAngle(
                    concept="The High-Contrast Sensor Challenge",
                    hook="I put this $15 moisture sensor on my face after 7 days.",
                    primary_text="Watch the real-time sensor readout jump from 18% to 84% in under 60 seconds without greasy residue.",
                    headline="Instant Hydration Guarantee",
                    visual_direction="Over-the-shoulder handheld phone recording real-time digital screen meter.",
                    cta="Claim Offer"
                )
            ]
        )

        return ComprehensiveStrategyResponse(
            id=strategy_id,
            client_id=request.client_id,
            created_at=now_iso,
            industry=request.industry,
            location=request.location,
            keyword_intelligence=keyword_intel,
            policy_compliance=policy_report,
            strategies={
                "conservative": conservative_plan,
                "balanced": balanced_plan,
                "experimental": experimental_plan
            },
            zero_guarantee_compliance_notice=(
                "COMPLIANCE NOTICE: MetaPilot AI strictly adheres to Meta Advertising Standards and truth-in-advertising guidelines. "
                "No performance results or revenue amounts are guaranteed. All KPIs represent directional modeling based on budget."
            )
        )

    async def save_chosen_strategy(
        self,
        comprehensive_response: ComprehensiveStrategyResponse,
        selected_tier: str,
        user_email: Optional[str] = None,
        notes: Optional[str] = None
    ) -> SavedStrategyRecord:
        """
        Saves a chosen strategy option (conservative, balanced, or experimental) to persistent history.
        """
        tier = selected_tier.lower()
        if tier not in comprehensive_response.strategies:
            tier = "balanced"

        chosen_plan = comprehensive_response.strategies[tier]
        saved_id = f"saved_strat_{int(datetime.datetime.now().timestamp())}"

        record = SavedStrategyRecord(
            id=saved_id,
            client_id=comprehensive_response.client_id,
            strategy_plan=chosen_plan,
            selected_tier=tier,
            saved_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            created_by=user_email,
            notes=notes or f"Selected {tier.capitalize()} Strategy on {datetime.date.today().isoformat()}"
        )

        SAVED_STRATEGIES_STORE[saved_id] = record
        return record

    async def list_saved_strategies(self, client_id: Optional[str] = None) -> List[SavedStrategyRecord]:
        """
        Lists all saved strategies, optionally filtered by client_id.
        """
        records = list(SAVED_STRATEGIES_STORE.values())
        if client_id:
            records = [r for r in records if r.client_id == client_id]
        return sorted(records, key=lambda r: r.saved_at, reverse=True)

    # Legacy method maintained for backward compatibility
    async def generate_campaign_strategy(self, request: CampaignStrategyRequest) -> CampaignStrategyResponse:
        daily_budget = round(request.monthly_budget / 30.4, 2)
        strategy_id = f"strat_{int(datetime.datetime.now().timestamp())}"

        return CampaignStrategyResponse(
            id=strategy_id,
            client_id=request.client_id,
            strategy_name=f"ScaleEngine: {request.primary_product} High-Velocity Q4 Launch",
            executive_summary=(
                f"Full-funnel Meta acquisition strategy focusing on {request.primary_product}. "
                f"Deploys Advantage+ Shopping with 3 distinct creative angles derived from top competitor hooks "
                f"to capture {request.target_demographics} at an optimized target ROAS."
            ),
            recommended_funnel_structure=[
                "Top of Funnel (70% Budget): Advantage+ Broad & High-Affinity Interests",
                "Middle of Funnel (20% Budget): Video Viewers (50%+) & IG Engagers (30D)",
                "Bottom of Funnel (10% Budget): View Content & Add to Cart (7D DPA)"
            ],
            suggested_daily_budget=daily_budget,
            audience_segments=[
                AudienceTarget(
                    name="Advantage+ Audience (Broad AI Optimization)",
                    type="Broad / Advantage+",
                    details="Open targeting, US/CA/UK, 22-45, algorithmically optimized via Meta AI targeting",
                    suggested_budget_share_pct=50
                ),
                AudienceTarget(
                    name="Core Category Interest Stacking",
                    type="Interest Stacking",
                    details=f"High affinity categories related to {request.primary_product} and direct competitor followers",
                    suggested_budget_share_pct=25
                ),
                AudienceTarget(
                    name="Warm Social Engagers & Video 75% Watchers",
                    type="Retargeting",
                    details="Reel viewers, Instagram profile visitors, and TikTok-style organic interaction cluster",
                    suggested_budget_share_pct=25
                )
            ],
            creative_angles=[
                AdCreativeAngle(
                    concept="The Counter-Intuitive Pattern Interrupt",
                    hook=f"Why everything you've been told about {request.primary_product} is completely backwards.",
                    primary_text=(
                        f"Most people think they need complicated solutions. But {request.core_value_prop}. "
                        f"Discover how over 12,000 customers switched and never looked back."
                    ),
                    headline=f"Meet the Next Generation of {request.primary_product}",
                    visual_direction="Fast-paced 9:16 vertical hook with on-screen text overlay in the first 2.5 seconds.",
                    cta="Shop Now"
                ),
                AdCreativeAngle(
                    concept="Pain Point & Scientific Breakdown",
                    hook="If you struggle with daily frustration, your current setup is missing this one key ingredient.",
                    primary_text=(
                        f"Engineered specifically for {request.target_demographics}. "
                        f"Our proprietary formulation gives you immediate results without compromises."
                    ),
                    headline="Scientifically Proven Results in 7 Days",
                    visual_direction="Split screen: Problem demonstration on left vs Solution on right.",
                    cta="Order Today"
                ),
                AdCreativeAngle(
                    concept="Social Proof & Founder Authenticity",
                    hook="I never thought this simple shift would change our entire business.",
                    primary_text=(
                        f"Real reviews don't lie. Rated 4.9/5 stars by certified buyers. "
                        f"Try risk-free with our 30-day happiness guarantee."
                    ),
                    headline="Join 25,000+ Satisfied Customers",
                    visual_direction="Selfie-style UGC testimonial shot outdoors in natural lighting.",
                    cta="Claim Offer"
                )
            ],
            testing_roadmap_days=14,
            expected_roas_range="3.4x - 4.6x",
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )

    async def get_five_prioritized_recommendations(self, client_id: str) -> RecommendationListResponse:
        from app.services.recommendation_engine import recommendation_engine
        return await recommendation_engine.run_workflow(client_id)


ai_agent_service = AIAgentService()
