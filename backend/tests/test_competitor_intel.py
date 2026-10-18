"""Tests for the Competitor Intelligence module, LangGraph workflow, and compliance rules."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADER = {"Authorization": "Bearer demo-token-metapilot-preview"}


def test_list_five_fictional_competitors():
    """Verify that the 5 fictional competitor fixtures are available with complete profiles."""
    res = client.get("/api/v1/competitors", headers=AUTH_HEADER)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5

    names = [c["name"] for c in data]
    assert "GlowAura Labs" in names
    assert "PureBotanica Organics" in names
    assert "DermaShield Pro" in names
    assert "VelvetSkin Rituals" in names
    assert "BioHydrate Essentials" in names

    # Verify profile attributes
    glowaura = next(c for c in data if c["name"] == "GlowAura Labs")
    assert glowaura["website"] == "https://www.glowauralabs.com"
    assert glowaura["verification_status"] == "verified"
    assert len(glowaura["verified_sources"]) > 0
    assert "facebook.com/ads/library" in glowaura["ad_library_url"]


def test_manually_add_competitor():
    """Verify manual entry of a new competitor with custom ad library URL."""
    payload = {
        "client_id": "cli_lumina_glow",
        "name": "Equinox Botanical Co.",
        "website": "https://www.equinoxbotanicals.com",
        "industry": "DTC Skincare & Beauty",
        "geographic_market": "United States",
        "ad_library_url": "https://www.facebook.com/ads/library/?q=Equinox+Botanicals",
        "notes": "Testing new calming facial mist."
    }
    res = client.post("/api/v1/competitors", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Equinox Botanical Co."
    assert data["verification_status"] == "verified"
    assert "Manual User Verification" in data["verified_sources"]


def test_competitor_discovery_marks_candidates_unverified():
    """Verify AI discovery suggests candidate competitors marked as unverified until validated."""
    payload = {
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare & Beauty",
        "location": "United States",
        "product_category": "Peptide Eye Cream",
        "marketing_goal": "Direct-to-Consumer Customer Acquisition",
        "target_customer_profile": "Professionals 28-48 combating dark circles",
        "known_competitors": ["GlowAura Labs"]
    }
    res = client.post("/api/v1/competitors/discover", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    candidates = res.json()
    assert len(candidates) >= 3

    for cand in candidates:
        assert cand["verification_status"] == "unverified_suggestion"
        assert cand["suggested_search_query"]
        assert "facebook.com/ads/library" in cand["ad_library_search_url"]
        assert cand["confidence_score"] >= 80


def test_verify_or_reject_candidate():
    """Verify confirming or rejecting an AI-suggested candidate."""
    # Add a candidate first
    create_res = client.post("/api/v1/competitors", json={
        "client_id": "cli_lumina_glow",
        "name": "Candidate Brand X",
        "industry": "Skincare",
        "geographic_market": "US"
    }, headers=AUTH_HEADER)
    comp_id = create_res.json()["id"]

    # Confirm candidate
    confirm_res = client.patch(f"/api/v1/competitors/{comp_id}/verify?action=confirm", headers=AUTH_HEADER)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["verification_status"] == "verified"

    # Reject candidate
    reject_res = client.patch(f"/api/v1/competitors/{comp_id}/verify?action=reject", headers=AUTH_HEADER)
    assert reject_res.status_code == 200
    assert reject_res.json()["verification_status"] == "rejected"


def test_log_ad_observation_workspace():
    """Verify logging a user ad observation into the research workspace."""
    payload = {
        "client_id": "cli_lumina_glow",
        "advertiser_name": "GlowAura Labs",
        "headline": "3-in-1 Peptide Elixir for Sensitive Skin",
        "primary_text": "Clinically proven to repair moisture barrier in 7 days.",
        "call_to_action": "Shop Now",
        "format": "video_9_16",
        "hook_type": "Pattern Interrupt",
        "extracted_hook_text": "If you use 5 different products in the morning, stop.",
        "extracted_offer": "Buy 1 Get 1 40% Off",
        "observation_date": "2026-10-17",
        "evidence_type": "ad_library_link",
        "source_url": "https://www.facebook.com/ads/library/?active_status=all&q=GlowAura"
    }
    res = client.post("/api/v1/competitors/observations", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 201
    data = res.json()
    assert data["advertiser_name"] == "GlowAura Labs"
    assert data["format"] == "video_9_16"
    assert data["observation_date"] == "2026-10-17"
    assert data["is_verified"] is True
    assert data["is_hypothesis"] is False


def test_langgraph_competitor_research_workflow():
    """Verify autonomous execution of the 6-stage LangGraph workflow:
    Intake -> Source Validation -> Data Normalization -> AI Analysis -> Opportunity Scoring -> Report.
    """
    payload = {
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare & Beauty",
        "location": "United States",
        "product_category": "Skin Barrier Recovery Serum",
        "marketing_goal": "Direct-to-Consumer Customer Acquisition",
        "target_customer_profile": "Women 25-42 dealing with redness and moisture barrier damage",
        "competitor_names": ["GlowAura Labs", "PureBotanica Organics", "DermaShield Pro"]
    }
    res = client.post("/api/v1/competitors/analyze", json=payload, headers=AUTH_HEADER)
    assert res.status_code == 200
    report = res.json()

    # Validate report components
    assert report["id"].startswith("rep_intel_")
    assert report["industry"] == "DTC Skincare & Beauty"
    assert len(report["analyzed_competitors"]) == 3
    assert len(report["hooks_analysis"]) > 0
    assert len(report["positioning_matrix"]) > 0
    assert len(report["promotion_themes"]) > 0
    assert len(report["differentiation_opportunities"]) > 0
    assert len(report["recommended_research_keywords"]) > 0
    assert len(report["source_citations"]) > 0

    # Verify claim attribution rule: claim_type must be either observation or hypothesis
    for hook in report["hooks_analysis"]:
        assert hook["claim_type"] in ["observation", "hypothesis"]
        if hook["claim_type"] == "observation":
            assert hook["source_url"] or hook["source_citation"]

    for opp in report["differentiation_opportunities"]:
        assert opp["claim_type"] == "hypothesis"
        assert opp["projected_impact_score"] >= 80
        assert opp["recommended_test_action"]


def test_compliance_and_zero_fabrication_guarantee():
    """
    Explicitly test compliance constraints:
    - Never fabricate competitor spending, conversions, CPC, leads, or ROAS.
    - Official compliance disclaimer must be prominently provided in all reports.
    """
    res = client.post("/api/v1/competitors/analyze", json={
        "client_id": "cli_lumina_glow",
        "industry": "Skincare"
    }, headers=AUTH_HEADER)
    assert res.status_code == 200
    report = res.json()

    # Verify compliance disclaimer
    disclaimer = report["compliance_disclaimer"]
    assert "Zero Fabrication Guarantee" in disclaimer
    assert "Competitor spending, conversions, CPC" in disclaimer

    # Ensure no fabricated spend or conversion metrics exist in the report or competitor ad objects
    ads_res = client.get("/api/v1/competitors/ads", headers=AUTH_HEADER)
    assert ads_res.status_code == 200
    for ad in ads_res.json():
        assert "competitor_spend" not in ad
        assert "competitor_roas" not in ad
        assert "competitor_conversions" not in ad
        assert "competitor_cpc" not in ad
