"""Test suite verifying campaign drafts, PAUSED enforcement, and explicit approval security."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_campaign_strictly_paused():
    """Verify newly created campaigns always have PAUSED status."""
    payload = {
        "client_id": "cli_lumina_glow",
        "name": "TEST_Campaign_Security_Validation",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 150.0,
        "ad_sets": [],
        "creatives": []
    }
    response = client.post("/api/v1/campaigns", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PAUSED"
    assert data["approval_required"] is True
    assert data["is_approved"] is False


def test_cannot_activate_without_approval():
    """Verify attempting to activate an unapproved campaign is rejected."""
    # Create draft
    payload = {
        "client_id": "cli_lumina_glow",
        "name": "TEST_Unapproved_Activation",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 75.0
    }
    create_res = client.post("/api/v1/campaigns", json=payload)
    campaign_id = create_res.json()["id"]

    # Try to activate immediately
    act_res = client.post(f"/api/v1/campaigns/{campaign_id}/activate")
    assert act_res.status_code == 400
    assert "approval" in act_res.json()["detail"].lower()


def test_full_approval_and_activation_lifecycle():
    """Verify full secure lifecycle: create PAUSED -> approve -> activate."""
    payload = {
        "client_id": "cli_lumina_glow",
        "name": "TEST_Lifecycle_Compliance",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 100.0
    }
    create_res = client.post("/api/v1/campaigns", json=payload)
    campaign_id = create_res.json()["id"]

    # Explicit approval
    approval_payload = {
        "campaign_id": campaign_id,
        "reason": "Q4 Budget approved by Marketing Director",
        "confirm_budget_spend": True
    }
    appr_res = client.post("/api/v1/campaigns/approve", json=approval_payload)
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert appr_data["is_approved"] is True
    assert appr_data["approval_signature"] is not None

    # Now activation succeeds
    act_res = client.post(f"/api/v1/campaigns/{campaign_id}/activate")
    assert act_res.status_code == 200
    assert act_res.json()["status"] == "ACTIVE"
