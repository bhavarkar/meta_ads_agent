"""Comprehensive tests for Meta Campaign Analytics Normalization and API Module.

Verifies:
1. Metric Normalization: Spend, Impressions, Reach, Clicks, Link Clicks, CTR, CPC, CPM, Frequency.
2. Zero Denominator Safeguards: 0 impressions, 0 clicks, 0 reach, 0 spend, 0 results.
3. Link Clicks vs Generic Clicks Separation: Outbound link clicks are strictly distinct.
4. ROAS Integrity: ROAS calculated strictly from real attributed value; never fabricated.
5. Conversion Action Mapping: Differentiates purchases, leads, add to cart, and page views.
6. Conversion Funnel: Tracked vs untracked stage differentiation.
7. Date Boundary Resolution: yesterday, last_7d, last_30d, custom.
8. Multi-level Reporting: account, campaign, adset, ad hierarchy.
9. Incremental Sync Endpoint: POST /analytics/sync.
10. Account Metadata: Currency, timezone, attribution window, and demo provenance.
"""

import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.services.analytics_normalization import (
    normalize_summary_metrics,
    build_action_breakdown,
    build_conversion_funnel,
    normalize_entity_rows,
    resolve_date_boundaries,
    extract_action_count,
    extract_action_value
)


client = TestClient(app)


def test_metric_normalization_standard_values():
    """Verify standard arithmetic normalization from raw Meta Insights dictionary."""
    raw = {
        "spend": "1250.50",
        "impressions": "50000",
        "reach": "35000",
        "clicks": "1500",
        "inline_link_clicks": "1000",
        "frequency": "1.43",
        "actions": [
            {"action_type": "link_click", "value": "1000"},
            {"action_type": "landing_page_view", "value": "780"},
            {"action_type": "add_to_cart", "value": "180"},
            {"action_type": "omni_purchase", "value": "50"}
        ],
        "action_values": [
            {"action_type": "omni_purchase", "value": "4750.00"}
        ]
    }

    summary = normalize_summary_metrics(raw, currency="USD")

    # Spend & Impressions
    assert summary.total_spend == 1250.50
    assert summary.impressions == 50000
    assert summary.reach == 35000

    # Clicks & Link Clicks separation
    assert summary.clicks == 1500
    assert summary.link_clicks == 1000

    # CTR & Link CTR
    # (1500 / 50000) * 100 = 3.0%
    assert summary.ctr_percent == 3.0
    # (1000 / 50000) * 100 = 2.0%
    assert summary.link_ctr_percent == 2.0

    # CPC & Cost per link click
    # 1250.50 / 1500 = 0.83
    assert summary.cpc == 0.83
    # 1250.50 / 1000 = 1.25
    assert summary.cost_per_link_click == 1.25

    # CPM: (1250.50 / 50000) * 1000 = 25.01
    assert summary.cpm == 25.01

    # Frequency: from raw
    assert summary.frequency == 1.43

    # Results & Cost per result: 50 purchases
    assert summary.results == 50
    assert summary.result_metric_name == "Purchases"
    # 1250.50 / 50 = 25.01
    assert summary.cost_per_result == 25.01

    # Attributed revenue & ROAS
    # 4750.00 / 1250.50 = 3.80
    assert summary.has_attributed_revenue is True
    assert summary.attributed_revenue == 4750.00
    assert summary.roas == 3.80
    assert summary.currency == "USD"


def test_zero_denominators_protection():
    """Verify zero-denominator protection when impressions, clicks, reach, or results are 0."""
    raw_zeros = {
        "spend": "0.00",
        "impressions": "0",
        "reach": "0",
        "clicks": "0",
        "actions": [],
        "action_values": []
    }

    summary = normalize_summary_metrics(raw_zeros, currency="EUR")

    assert summary.total_spend == 0.0
    assert summary.impressions == 0
    assert summary.reach == 0
    assert summary.frequency == 0.0
    assert summary.clicks == 0
    assert summary.link_clicks == 0
    assert summary.ctr_percent == 0.0
    assert summary.link_ctr_percent == 0.0
    assert summary.cpc == 0.0
    assert summary.cost_per_link_click == 0.0
    assert summary.cpm == 0.0
    assert summary.results == 0
    assert summary.cost_per_result == 0.0
    assert summary.roas is None
    assert summary.has_attributed_revenue is False
    assert summary.currency == "EUR"


def test_roas_integrity_when_untracked():
    """ROAS must be None and has_attributed_revenue False if no purchase value data exists."""
    raw_no_purchases = {
        "spend": "850.00",
        "impressions": "40000",
        "reach": "28000",
        "clicks": "900",
        "inline_link_clicks": "620",
        "actions": [
            {"action_type": "link_click", "value": "620"},
            {"action_type": "post_engagement", "value": "1200"}
        ],
        "action_values": []  # Zero attributed purchase value
    }

    summary = normalize_summary_metrics(raw_no_purchases, currency="USD")

    # Strict compliance: do NOT fabricate an estimated 3.5 ROAS
    assert summary.roas is None
    assert summary.has_attributed_revenue is False
    assert summary.attributed_revenue is None
    # Results fall back to link clicks when purchases and leads are absent
    assert summary.results == 620
    assert summary.result_metric_name == "Link Clicks"


def test_click_separation_generic_vs_link():
    """Clicks must never be equated to link clicks. Total clicks >= link clicks."""
    raw = {
        "spend": "500.00",
        "impressions": "20000",
        "reach": "15000",
        "clicks": "800",  # 800 total clicks (likes, comments, expand, etc.)
        "inline_link_clicks": "320",  # Only 320 clicked destination URL
        "actions": [
            {"action_type": "link_click", "value": "320"},
            {"action_type": "post_reaction", "value": "480"}
        ]
    }

    summary = normalize_summary_metrics(raw)
    assert summary.clicks == 800
    assert summary.link_clicks == 320
    assert summary.clicks > summary.link_clicks
    assert summary.ctr_percent == 4.0  # (800 / 20000) * 100
    assert summary.link_ctr_percent == 1.6  # (320 / 20000) * 100


def test_conversion_action_breakdown():
    """Verify action breakdown parses counts, values, and costs per action."""
    actions = [
        {"action_type": "omni_purchase", "value": "42"},
        {"action_type": "add_to_cart", "value": "150"},
        {"action_type": "landing_page_view", "value": "800"},
        {"action_type": "link_click", "value": "1100"}
    ]
    action_values = [
        {"action_type": "omni_purchase", "value": "3200.00"}
    ]

    breakdown = build_action_breakdown(actions, action_values, spend=1000.0)

    assert len(breakdown) == 4
    # Purchase action
    purchase_item = next(b for b in breakdown if b.action_type == "omni_purchase")
    assert purchase_item.count == 42
    assert purchase_item.value == 3200.00
    assert purchase_item.cost_per_action == round(1000.0 / 42, 2)
    assert purchase_item.action_label == "Purchases (Omni-Channel)"

    # Link click action
    link_item = next(b for b in breakdown if b.action_type == "link_click")
    assert link_item.count == 1100
    assert link_item.value is None
    assert link_item.cost_per_action == round(1000.0 / 1100, 2)


def test_conversion_funnel_tracks_configured_events_only():
    """Verify conversion funnel marks untracked stages explicitly."""
    # Scenario: Account tracks Link Clicks and Landing Page Views, but no Add to Cart or Purchases
    actions = [
        {"action_type": "link_click", "value": "1200"},
        {"action_type": "landing_page_view", "value": "900"}
    ]

    funnel = build_conversion_funnel(impressions=50000, link_clicks=1200, actions=actions)

    stage_ids = [s.stage_id for s in funnel]
    assert "impressions" in stage_ids
    assert "link_clicks" in stage_ids
    assert "landing_page_view" in stage_ids
    assert "add_to_cart" in stage_ids

    # Landing page view is tracked
    lp_stage = next(s for s in funnel if s.stage_id == "landing_page_view")
    assert lp_stage.is_tracked is True
    assert lp_stage.count == 900

    # Add to cart is untracked
    atc_stage = next(s for s in funnel if s.stage_id == "add_to_cart")
    assert atc_stage.is_tracked is False
    assert atc_stage.count == 0
    assert "not detected" in (atc_stage.untracked_reason or "")


def test_date_boundary_resolution():
    """Verify date presets and custom date range parsing."""
    ref_date = datetime.date(2026, 10, 17)

    # 1. Yesterday
    s_yest, u_yest = resolve_date_boundaries("yesterday", reference_date=ref_date)
    assert s_yest == "2026-10-16"
    assert u_yest == "2026-10-16"

    # 2. Last 7 Days
    s_7, u_7 = resolve_date_boundaries("last_7d", reference_date=ref_date)
    assert s_7 == "2026-10-10"
    assert u_7 == "2026-10-16"

    # 3. Last 30 Days
    s_30, u_30 = resolve_date_boundaries("last_30d", reference_date=ref_date)
    assert s_30 == "2026-09-17"
    assert u_30 == "2026-10-16"

    # 4. Custom range
    s_cust, u_cust = resolve_date_boundaries(
        "custom",
        custom_since="2026-10-01",
        custom_until="2026-10-14",
        reference_date=ref_date
    )
    assert s_cust == "2026-10-01"
    assert u_cust == "2026-10-14"

    # 5. Inverted custom range should be auto-swapped
    s_inv, u_inv = resolve_date_boundaries(
        "custom",
        custom_since="2026-10-15",
        custom_until="2026-10-05",
        reference_date=ref_date
    )
    assert s_inv == "2026-10-05"
    assert u_inv == "2026-10-15"


def test_api_analytics_endpoint_levels_and_presets():
    """Verify GET /api/v1/analytics across reporting levels and date presets."""
    token_headers = {"Authorization": "Bearer demo-token-metapilot-preview"}

    # 1. Campaign Level with last_7d
    res = client.get(
        "/api/v1/analytics?client_id=cli_lumina_glow&level=campaign&date_preset=last_7d",
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["client_id"] == "cli_lumina_glow"
    assert data["level"] == "campaign"
    assert data["date_preset"] == "last_7d"
    assert len(data["entities"]) >= 3
    assert all(e["level"] == "campaign" for e in data["entities"])
    assert data["summary"]["total_spend"] > 0
    assert data["summary"]["impressions"] > 0
    assert data["summary"]["clicks"] > 0
    assert data["summary"]["link_clicks"] > 0
    assert len(data["trend_history"]) == 7  # 7 days

    # 2. Ad Set Level with last_30d
    res_adset = client.get(
        "/api/v1/analytics?client_id=cli_lumina_glow&level=adset&date_preset=last_30d",
        headers=token_headers
    )
    assert res_adset.status_code == 200
    data_adset = res_adset.json()
    assert data_adset["level"] == "adset"
    assert len(data_adset["entities"]) >= 4
    assert len(data_adset["trend_history"]) == 30

    # 3. Ad Level with Yesterday
    res_ad = client.get(
        "/api/v1/analytics?client_id=cli_lumina_glow&level=ad&date_preset=yesterday",
        headers=token_headers
    )
    assert res_ad.status_code == 200
    data_ad = res_ad.json()
    assert data_ad["level"] == "ad"
    assert len(data_ad["entities"]) >= 5
    assert len(data_ad["trend_history"]) == 1

    # 4. Account metadata preservation
    meta = data["account_metadata"]
    assert meta["currency"] == "USD"
    assert meta["account_timezone"] == "America/Los_Angeles"
    assert "7-day click" in meta["attribution_setting"]
    assert meta["sync_status"] == "SUCCESS"

    # 5. Creative intelligence present
    assert len(data["top_creatives"]) >= 1
    assert len(data["weak_creatives"]) >= 1
    assert data["top_creatives"][0]["performance_tier"] == "TOP_PERFORMER"
    assert data["weak_creatives"][0]["performance_tier"] == "WEAK_FATIGUED"


def test_api_analytics_sync_endpoint():
    """Verify POST /api/v1/analytics/sync performs cache refresh and snapshot update."""
    token_headers = {"Authorization": "Bearer demo-token-metapilot-preview"}
    res = client.post(
        "/api/v1/analytics/sync",
        json={"client_id": "cli_lumina_glow", "force_refresh": True},
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["client_id"] == "cli_lumina_glow"
    assert data["account_metadata"]["sync_status"] == "SUCCESS"
    assert "last_synced_at" in data["account_metadata"]
