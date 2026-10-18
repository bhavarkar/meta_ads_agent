"""Test suite for AI Keyword Intelligence, 3-Strategy Comparison, and Policy Compliance."""

import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer demo-token-metapilot-preview"}


def test_generate_three_campaign_strategies():
    """Verify production generation of Conservative, Balanced, and Experimental strategies."""
    payload = {
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare & Beauty",
        "location": "United States & Canada",
        "budget_type": "monthly",
        "budget_amount": 25000.0,
        "product_service": "Hydra-Barrier Ceramide Nectar",
        "customer_profile": "Women 22-42, active skincare buyers, routine fatigue",
        "campaign_objective": "OUTCOME_SALES",
        "destination_type": "WEBSITE",
        "destination_url": "https://luminaskin.example.com/serum",
        "available_media_assets": ["9:16 UGC Reels", "Studio Carousel", "Static Editorial"],
        "competitor_research_results": [
            "Throw away your 10-step routine right now.",
            "If your skin stings when washing your face, your barrier is damaged."
        ]
    }

    res = client.post("/api/v1/strategies/generate-comprehensive", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    data = res.json()

    # Verify 3 distinct strategies exist
    assert "conservative" in data["strategies"]
    assert "balanced" in data["strategies"]
    assert "experimental" in data["strategies"]

    # Verify each strategy structure
    for tier in ["conservative", "balanced", "experimental"]:
        strat = data["strategies"][tier]
        assert strat["tier"] == tier
        assert strat["name"] is not None
        assert strat["objective"] == "OUTCOME_SALES"
        assert len(strat["target_audience"]) >= 2
        assert strat["location"] == "United States & Canada"
        assert strat["budget_allocation"]["monthly_budget_usd"] == 25000.0
        assert strat["budget_allocation"]["daily_budget_usd"] > 0
        assert len(strat["placements"]) >= 1
        assert len(strat["messaging_hooks"]) >= 1
        assert len(strat["creative_formats"]) >= 1
        assert strat["cta"] in ["Shop Now", "Send WhatsApp Message", "Claim Starter Offer", "Get Offer", "Order Today"]
        assert strat["conversion_destination"].startswith("http")
        assert strat["kpis"]["target_roas_range"] is not None
        assert strat["kpis"]["target_cpa_usd"] > 0
        assert len(strat["assumptions"]) >= 1
        assert len(strat["risks"]) >= 1
        assert strat["compatible_ad_set_settings"]["is_valid_configuration"] is True


def test_keyword_intelligence_strict_separation():
    """Verify research keywords, ad copy keywords, and Meta targeting suggestions are strictly separated."""
    payload = {
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare & Beauty",
        "product_service": "Barrier Repair Nectar",
        "customer_profile": "Skincare buyers",
        "budget_amount": 10000.0,
        "campaign_objective": "OUTCOME_SALES"
    }

    res = client.post("/api/v1/strategies/generate-comprehensive", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    kw_intel = res.json()["keyword_intelligence"]

    # 1. Research keywords
    assert len(kw_intel["research_keywords"]) >= 3
    for r_kw in kw_intel["research_keywords"]:
        assert isinstance(r_kw, str)

    # 2. Ad copy keywords
    assert len(kw_intel["ad_copy_keywords"]) >= 3
    for c_kw in kw_intel["ad_copy_keywords"]:
        assert isinstance(c_kw, str)

    # 3. Meta targeting suggestions (with validation)
    assert len(kw_intel["meta_targeting_suggestions"]) >= 3
    has_targetable = False
    has_untargetable = False

    for target_item in kw_intel["meta_targeting_suggestions"]:
        assert "name" in target_item
        assert "is_targetable" in target_item
        assert "validation_source" in target_item

        if target_item["is_targetable"] and target_item["meta_interest_id"]:
            has_targetable = True
            # Legitimate Meta Graph API interest ID should be numeric string
            assert target_item["meta_interest_id"].isdigit()
        elif not target_item["is_targetable"]:
            has_untargetable = True
            assert target_item["type"] == "ad_copy_keyword_only"
            assert "Untargetable" in target_item["validation_source"]

    assert has_targetable, "Should identify verified Meta Interest IDs"
    assert has_untargetable, "Should explicitly flag arbitrary terms as untargetable on Meta"


def test_targeting_validation_endpoint():
    """Test standalone endpoint to validate targeting terms against Meta's registry."""
    req_body = {
        "keywords": [
            "Skin care",
            "Engaged Shoppers",
            "Advantage+ Audience",
            "3-in-1 barrier repair serum",
            "Small business"
        ]
    }
    res = client.post("/api/v1/strategies/validate-targeting", json=req_body, headers=AUTH_HEADERS)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 5

    # "Skin care" should be a verified interest
    skincare = next(i for i in items if i["name"] == "Skin care")
    assert skincare["is_targetable"] is True
    assert skincare["meta_interest_id"] == "6003140510344"

    # "3-in-1 barrier repair serum" is an untargetable keyword
    arbitrary = next(i for i in items if "3-in-1" in i["name"])
    assert arbitrary["is_targetable"] is False
    assert arbitrary["meta_interest_id"] is None
    assert arbitrary["type"] == "ad_copy_keyword_only"


def test_policy_compliance_and_sensitive_checks():
    """Verify policy checks for healthcare personal attributes and housing/credit special ad categories."""
    # Test Healthcare policy check
    health_payload = {
        "client_id": "cli_lumina_glow",
        "industry": "Healthcare & Wellness",
        "product_service": "Eczema Barrier Cream",
        "customer_profile": "Patients with severe acne",
        "budget_amount": 5000.0,
        "campaign_objective": "OUTCOME_SALES"
    }
    res = client.post("/api/v1/strategies/generate-comprehensive", json=health_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    compliance = res.json()["policy_compliance"]
    assert compliance["is_restricted_industry"] is True
    assert len(compliance["policy_warnings"]) >= 1

    # Test Housing Special Ad Category
    housing_payload = {
        "client_id": "cli_lumina_glow",
        "industry": "Real Estate & Housing",
        "product_service": "Luxury Condos",
        "customer_profile": "Home buyers",
        "budget_amount": 8000.0,
        "campaign_objective": "OUTCOME_LEADS"
    }
    res2 = client.post("/api/v1/strategies/generate-comprehensive", json=housing_payload, headers=AUTH_HEADERS)
    assert res2.status_code == 201
    compliance2 = res2.json()["policy_compliance"]
    assert compliance2["special_ad_category"] == "HOUSING"
    assert compliance2["is_restricted_industry"] is True


def test_zero_invented_benchmarks_guarantee():
    """Confirm AI output contains truth-in-advertising disclaimer and no guaranteed revenue claims."""
    payload = {
        "client_id": "cli_lumina_glow",
        "industry": "DTC Skincare",
        "product_service": "Serum",
        "customer_profile": "Women",
        "budget_amount": 5000.0
    }
    res = client.post("/api/v1/strategies/generate-comprehensive", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    data = res.json()

    assert "zero_guarantee_compliance_notice" in data
    assert "No performance results or revenue amounts are guaranteed" in data["zero_guarantee_compliance_notice"]

    # Check KPI disclaimers
    for tier in ["conservative", "balanced", "experimental"]:
        strat = data["strategies"][tier]
        assert "benchmarking_disclaimer" in strat["kpis"]
        assert "not guaranteed performance" in strat["kpis"]["benchmarking_disclaimer"]


def test_save_and_retrieve_strategy():
    """Verify saving a selected strategy tier and retrieving client strategy history."""
    save_payload = {
        "client_id": "cli_lumina_glow",
        "comprehensive_strategy_id": "dummy_comp_123",
        "selected_tier": "balanced",
        "notes": "Selected balanced strategy for Q4 scale test"
    }
    save_res = client.post("/api/v1/strategies/save", json=save_payload, headers=AUTH_HEADERS)
    assert save_res.status_code == 201
    saved_data = save_res.json()
    assert saved_data["client_id"] == "cli_lumina_glow"
    assert saved_data["selected_tier"] == "balanced"
    assert saved_data["strategy_plan"]["tier"] == "balanced"

    # List saved strategies
    list_res = client.get("/api/v1/strategies?client_id=cli_lumina_glow", headers=AUTH_HEADERS)
    assert list_res.status_code == 200
    history = list_res.json()
    assert len(history) >= 1
    assert any(s["id"] == saved_data["id"] for s in history)
