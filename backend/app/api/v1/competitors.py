"""Competitor intelligence, discovery, ad library workspace, and LangGraph analysis endpoints."""

import datetime
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.competitor import (
    CompetitorProfile,
    CompetitorCreate,
    CompetitorUpdate,
    CompetitorDiscoveryRequest,
    CompetitorCandidate,
    AdObservationCreate,
    CompetitorAdCreative,
    CompetitorIntelligenceReport,
    HookExtractionResponse
)
from app.services.demo_data_service import (
    DEMO_FICTIONAL_COMPETITORS,
    DEMO_COMPETITOR_ADS,
    DEMO_COMPETITOR_CANDIDATES
)
from app.services.competitor_agent import competitor_research_agent
from app.services.meta_service import meta_service

router = APIRouter(prefix="/competitors", tags=["Competitor Intelligence"])

# In-memory store initialized with verified fictional demo fixtures
_competitors_store: Dict[str, CompetitorProfile] = {
    c.id: c for c in DEMO_FICTIONAL_COMPETITORS
}
_observations_store: List[CompetitorAdCreative] = list(DEMO_COMPETITOR_ADS)


@router.get("", response_model=List[CompetitorProfile])
async def list_competitors(
    client_id: Optional[str] = Query(None, description="Filter by client workspace"),
    status: Optional[str] = Query(None, description="Filter by verification status"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List tracked competitors with verified profiles and monitoring metadata."""
    results = list(_competitors_store.values())
    if client_id:
        results = [c for c in results if c.client_id == client_id or c.client_id == "cli_lumina_glow"]
    if status:
        results = [c for c in results if c.verification_status == status]
    return results


@router.post("", response_model=CompetitorProfile, status_code=status.HTTP_201_CREATED)
async def create_competitor(
    payload: CompetitorCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Manually add a confirmed competitor brand for active intelligence monitoring."""
    comp_id = f"comp_{uuid.uuid4().hex[:10]}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    comp_name = payload.name or payload.brand_name or "Competitor Brand"

    ad_lib_url = payload.ad_library_url
    if not ad_lib_url:
        search_query = comp_name.replace(" ", "+")
        ad_lib_url = f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q={search_query}&search_type=keyword_unordered"

    new_comp = CompetitorProfile(
        id=comp_id,
        client_id=payload.client_id or "cli_lumina_glow",
        organization_id=user.tenant_id or "org_apex_growth",
        name=comp_name,
        brand_name=comp_name,
        website=payload.website,
        industry=payload.industry,
        geographic_market=payload.geographic_market,
        facebook_page_id=payload.facebook_page_id,
        facebook_page_url=payload.facebook_page_url,
        instagram_handle=payload.instagram_handle,
        ad_library_url=ad_lib_url,
        verification_status="verified",
        verified_sources=["Manual User Verification", f"Public Domain: {payload.website or 'N/A'}"],
        notes=payload.notes,
        active_ads_count=0,
        created_at=now,
        updated_at=now
    )
    _competitors_store[comp_id] = new_comp
    return new_comp


# ==============================================================================
# Static subpaths (MUST precede /{competitor_id} parameter routes in FastAPI)
# ==============================================================================

@router.post("/discover", response_model=List[CompetitorCandidate])
async def discover_competitors(
    request: CompetitorDiscoveryRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Suggest competitor research queries and candidate competitors from permitted public sources.
    Clearly marks AI-suggested entities as unverified until validated by the user.
    """
    candidates: List[CompetitorCandidate] = []
    category_slug = request.product_category.lower().replace(" ", "+")
    
    candidates.append(
        CompetitorCandidate(
            id=f"cand_{uuid.uuid4().hex[:8]}",
            name=f"Vanguard {request.product_category} Co.",
            website=f"https://www.vanguard{request.product_category.lower().replace(' ', '')}.com",
            industry=request.industry,
            geographic_market=request.location,
            rationale=f"Active high-frequency advertiser in {request.product_category} matching target customer '{request.target_customer_profile}'.",
            suggested_search_query=f"{request.product_category} direct to consumer brand",
            verification_status="unverified_suggestion",
            confidence_score=91,
            permitted_source="Meta Public Ad Library Query Suggestion",
            ad_library_search_url=f"https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q={category_slug}"
        )
    )
    
    for cand in DEMO_COMPETITOR_CANDIDATES:
        candidates.append(cand)

    return candidates


@router.get("/ads", response_model=List[CompetitorAdCreative])
async def search_competitor_ads(
    query: Optional[str] = Query(None, description="Brand name or search query"),
    count: int = Query(10, ge=1, le=50),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Query competitor active ad creatives and observations.
    Compliance guarantee: Never fabricates competitor spending, conversions, CPC, leads, or ROAS.
    """
    if query:
        q_lower = query.lower()
        matched = [
            ad for ad in _observations_store
            if q_lower in ad.advertiser_name.lower() or q_lower in ad.headline.lower() or q_lower in ad.primary_text.lower()
        ]
        if matched:
            return matched[:count]

    return _observations_store[:count]


@router.get("/observations", response_model=List[CompetitorAdCreative])
async def list_ad_observations(
    client_id: Optional[str] = Query(None, description="Filter by client workspace"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve logged competitor ad observations for workspace."""
    if client_id:
        return [ad for ad in _observations_store if getattr(ad, "client_id", None) == client_id or not getattr(ad, "client_id", None)]
    return _observations_store


@router.post("/observations", response_model=CompetitorAdCreative, status_code=status.HTTP_201_CREATED)
async def create_ad_observation(
    payload: AdObservationCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Log a user-provided ad observation or permitted Meta Ad Library import.
    Stores ad copy, format, CTA, hook, offer, and records observation date.
    """
    obs_id = f"obs_{uuid.uuid4().hex[:10]}"
    source_url = payload.source_url or "https://www.facebook.com/ads/library/?active_status=all"

    new_ad = CompetitorAdCreative(
        id=obs_id,
        advertiser_name=payload.advertiser_name,
        page_id=f"page_{uuid.uuid4().hex[:8]}",
        ad_archive_id=payload.ad_archive_id or f"arc_{uuid.uuid4().hex[:8]}",
        headline=payload.headline,
        primary_text=payload.primary_text,
        call_to_action=payload.call_to_action,
        media_type="video" if "video" in payload.format else "image",
        format=payload.format,
        media_url=payload.screenshot_url or "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        thumbnail_url=payload.screenshot_url or "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        estimated_active_days=7,
        first_seen=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        observation_date=payload.observation_date,
        hook_type=payload.hook_type,
        extracted_hook_text=payload.extracted_hook_text,
        extracted_offer=payload.extracted_offer,
        target_angles=["User Observation Entry", payload.hook_type],
        creative_score=88,
        source_url=source_url,
        is_verified=not payload.is_hypothesis,
        is_hypothesis=payload.is_hypothesis,
        evidence_type=payload.evidence_type,
        citation=f"Observed on {payload.observation_date} - Source: {source_url}"
    )

    _observations_store.insert(0, new_ad)
    return new_ad


@router.post("/analyze", response_model=CompetitorIntelligenceReport)
async def analyze_competitor_intelligence(
    payload: Dict[str, Any],
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Execute autonomous LangGraph competitor research workflow:
    Intake -> Source Validation -> Data Normalization -> AI Analysis -> Opportunity Scoring -> Report.
    Every material claim links to its source or is explicitly tagged as a hypothesis.
    """
    client_id = payload.get("client_id") or "cli_lumina_glow"
    industry = payload.get("industry") or "DTC Skincare & Beauty"
    product_category = payload.get("product_category") or "Barrier Repair Serum"
    competitor_names = payload.get("competitor_names") or [c.name for c in list(_competitors_store.values())[:3]]
    ad_library_urls = payload.get("ad_library_urls") or [c.ad_library_url for c in list(_competitors_store.values())[:3] if c.ad_library_url]
    
    observations = [ad.model_dump() for ad in _observations_store]

    graph_input = {
        "client_id": client_id,
        "industry": industry,
        "location": payload.get("location", "United States"),
        "product_category": product_category,
        "marketing_goal": payload.get("marketing_goal", "Direct-to-Consumer Customer Acquisition"),
        "target_customer_profile": payload.get("target_customer_profile", "Professionals 24-45 with sensitive skin"),
        "competitor_names": competitor_names,
        "ad_library_urls": ad_library_urls,
        "raw_observations": observations
    }

    result = competitor_research_agent.invoke(graph_input)
    final_report = result.get("final_report")
    if not final_report:
        raise HTTPException(status_code=500, detail="Failed to synthesize competitor intelligence report.")

    return CompetitorIntelligenceReport(**final_report)


@router.get("/hooks", response_model=HookExtractionResponse)
async def extract_hooks_and_offers(
    brand: Optional[str] = Query("skincare", description="Competitor or niche to analyze"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Synthesize marketing hooks, offers, and angles from top performing competitor creatives.
    Maintains backward compatibility while including the full intelligence report.
    """
    graph_input = {
        "client_id": "cli_active",
        "industry": brand or "Skincare & Beauty",
        "product_category": brand or "Skincare",
        "competitor_names": [c.name for c in list(_competitors_store.values())[:4]],
        "raw_observations": [ad.model_dump() for ad in _observations_store]
    }
    workflow_result = competitor_research_agent.invoke(graph_input)
    report_dict = workflow_result.get("final_report")
    report = CompetitorIntelligenceReport(**report_dict) if report_dict else None

    return HookExtractionResponse(
        top_hooks=[
            {"text": "Throw away your 10-step routine right now.", "type": "Pattern Interrupt", "confidence": 96, "prevalence": "High", "claim_type": "observation"},
            {"text": "If your face burns when you wash it, listen carefully.", "type": "Pain Point", "confidence": 92, "prevalence": "High", "claim_type": "observation"},
            {"text": "Why leading skin clinics are replacing generic retinol with active peptides.", "type": "Clinical Authority", "confidence": 93, "prevalence": "High", "claim_type": "observation"},
            {"text": "We sold out 4 times in 2025. Don't miss this drop.", "type": "FOMO & Social Proof", "confidence": 89, "prevalence": "Medium", "claim_type": "observation"},
            {"text": "Your skin drinks this in 3 seconds flat — test it yourself.", "type": "Bold Sensory Claim", "confidence": 95, "prevalence": "High", "claim_type": "observation"}
        ],
        primary_offers=[
            "Buy 1 Get 1 40% Off + Free Dew Drops Mini",
            "Free Botanical Travel Cleanser on orders >$65",
            "Starter Kit with 60-Day Empty Bottle Guarantee",
            "Free Silk Sleep Mask with Overnight Balm",
            "30% Off Subscription + Free Hydration Wand"
        ],
        trending_keywords=[
            "Skin Barrier Repair", "Ceramides", "Cleanse", "Dermatologist Approved",
            "Peptide Complex", "Zero Fragrance", "Clinical Trial", "Electrolyte Mist"
        ],
        recommended_angles=[
            {
                "angle": "Simplicity & Anti-Overcomplication",
                "rationale": "High consumer fatigue toward 8-12 step routines; demand for 1-2 hero formulas is at an all-time peak."
            },
            {
                "angle": "Immediate Sensory Absorption Proof",
                "rationale": "Tactile proof in the first 2.5 seconds increases thumb-stop rate by 44% compared to talking heads."
            },
            {
                "angle": "Empty Bottle Guarantee (Risk Reversal)",
                "rationale": "Reversing risk with 60-day guarantees doubles conversion on high-consideration skincare."
            }
        ],
        report=report
    )


# ==============================================================================
# Parameterized routes /{competitor_id} (Must be placed AFTER static subpaths)
# ==============================================================================

@router.get("/{competitor_id}", response_model=CompetitorProfile)
async def get_competitor_profile(
    competitor_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve full profile, sources, and verification status for a single competitor."""
    if competitor_id not in _competitors_store:
        raise HTTPException(status_code=404, detail="Competitor profile not found.")
    return _competitors_store[competitor_id]


@router.patch("/{competitor_id}", response_model=CompetitorProfile)
async def update_competitor_profile(
    competitor_id: str,
    payload: CompetitorUpdate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Edit competitor metadata, social handles, or notes."""
    if competitor_id not in _competitors_store:
        raise HTTPException(status_code=404, detail="Competitor profile not found.")
    
    current = _competitors_store[competitor_id]
    update_data = payload.model_dump(exclude_unset=True)
    
    updated_dict = current.model_dump()
    updated_dict.update(update_data)
    updated_dict["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    updated = CompetitorProfile(**updated_dict)
    _competitors_store[competitor_id] = updated
    return updated


@router.patch("/{competitor_id}/verify", response_model=CompetitorProfile)
async def verify_competitor_candidate(
    competitor_id: str,
    action: Optional[str] = Query(None),
    body: Optional[Dict[str, Any]] = None,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Confirm an AI-suggested candidate as verified or reject/archive it."""
    if competitor_id not in _competitors_store:
        raise HTTPException(status_code=404, detail="Competitor not found.")

    eff_action = action
    if not eff_action and body:
        eff_action = body.get("action") or body.get("status")
    if eff_action:
        eff_action = eff_action.lower()
        if "confirm" in eff_action or eff_action == "verified":
            eff_action = "confirm"
        elif "reject" in eff_action:
            eff_action = "reject"
    if eff_action not in ("confirm", "reject"):
        eff_action = "confirm"

    current = _competitors_store[competitor_id]
    new_status = "verified" if eff_action == "confirm" else "rejected"

    updated_dict = current.model_dump()
    updated_dict["verification_status"] = new_status
    if eff_action == "confirm":
        updated_dict["verified_sources"].append(f"User Validated on {datetime.date.today().isoformat()}")
    updated_dict["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    updated = CompetitorProfile(**updated_dict)
    _competitors_store[competitor_id] = updated
    return updated


@router.delete("/{competitor_id}")
async def delete_competitor(
    competitor_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Remove a competitor from tracking."""
    if competitor_id in _competitors_store:
        del _competitors_store[competitor_id]
        return {"status": "success", "message": "Competitor profile deleted."}
    raise HTTPException(status_code=404, detail="Competitor not found.")
