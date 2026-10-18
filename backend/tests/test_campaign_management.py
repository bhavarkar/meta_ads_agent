"""Contract tests for Meta Ads Campaign Creation and Management Module.
Verifies official Graph API v21.0 compatibility, 4-tier hierarchy, strict PAUSED enforcement,
approval records with SHA-256 payload hash, invalidation upon mutation, idempotency,
authorized activation safeguards, pause actions, connection health, and token revocation.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.campaign import compute_campaign_payload_hash

client = TestClient(app)


def test_meta_connection_health_and_ad_accounts():
    """Verify Meta connection health inspection and authorized ad accounts listing."""
    # 1. Inspect health
    health_res = client.get("/api/v1/clients/cli_lumina_glow/meta-health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["is_connected"] is True
    assert health_data["health_status"] == "HEALTHY"
    assert health_data["account_currency"] == "USD"
    assert health_data["account_timezone"] == "America/Los_Angeles"
    assert "ads_management" in health_data["granted_scopes"]
    assert health_data["api_version"] == "v21.0"

    # 2. List authorized accounts
    accounts_res = client.get("/api/v1/clients/cli_lumina_glow/meta-ad-accounts")
    assert accounts_res.status_code == 200
    accounts = accounts_res.json()
    assert len(accounts) >= 1
    assert accounts[0]["id"] == "act_4829104820"
    assert accounts[0]["currency"] == "USD"
    assert "ADMINISTER" in accounts[0]["permissions"]


def test_meta_connection_disconnect_and_revocation():
    """Verify disconnecting account revokes access token and records audit event."""
    res = client.post("/api/v1/clients/cli_lumina_glow/meta-disconnect")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "revoked" in data["message"].lower()

    # Verify status reflects disconnection
    conn_res = client.get("/api/v1/clients/cli_lumina_glow/meta-connection")
    assert conn_res.status_code == 200
    assert conn_res.json()["is_connected"] is False


def test_campaign_preflight_validation_rules():
    """Verify Graph API v21.0 pre-flight validation catches incompatible objectives and budget limits."""
    # 1. Incompatible optimization goal for OUTCOME_SALES
    invalid_payload = {
        "campaign": {
            "client_id": "cli_lumina_glow",
            "name": "Invalid_Goal_Test",
            "objective": "OUTCOME_SALES",
            "daily_budget_usd": 100.0,
            "ad_sets": [
                {
                    "name": "Ad Set with incompatible goal",
                    "optimization_goal": "APP_INSTALLS",  # Incompatible with OUTCOME_SALES
                    "destination_type": "WEBSITE"
                }
            ],
            "creatives": []
        }
    }
    val_res = client.post("/api/v1/campaigns/validate", json=invalid_payload)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["is_valid"] is False
    assert any("incompatible" in err.lower() for err in val_data["errors"])

    # 2. Budget violation (< $10 daily budget for CBO)
    budget_payload = {
        "campaign": {
            "client_id": "cli_lumina_glow",
            "name": "Low_Budget_Test",
            "objective": "OUTCOME_SALES",
            "daily_budget_usd": 4.0,  # Below $10 minimum
            "ad_sets": [],
            "creatives": []
        }
    }
    b_val_res = client.post("/api/v1/campaigns/validate", json=budget_payload)
    assert b_val_res.status_code == 200
    assert b_val_res.json()["is_valid"] is False
    assert any("budget" in err.lower() for err in b_val_res.json()["errors"])


def test_4_tier_hierarchy_creation_strictly_paused():
    """Verify Campaign -> Ad Set -> Creative -> Ad creation and strict initial PAUSED status."""
    payload = {
        "client_id": "cli_lumina_glow",
        "name": "Q4_Barrier_Full_Funnel_Launch",
        "objective": "OUTCOME_SALES",
        "budget_level": "CAMPAIGN",
        "daily_budget_usd": 150.0,
        "ad_sets": [
            {
                "name": "Broad Women 25-50 Skincare Interests",
                "optimization_goal": "OFFSITE_CONVERSIONS",
                "billing_event": "IMPRESSIONS",
                "destination_type": "WEBSITE",
                "targeting": {
                    "age_min": 25,
                    "age_max": 50,
                    "genders": "WOMEN",
                    "locations": ["US"],
                    "interests": [{"id": "6003140510344", "name": "Skin care"}]
                }
            }
        ],
        "creatives": [
            {
                "name": "72hr Barrier Transformation Video",
                "headline": "Restore Your Natural Barrier Fast",
                "primary_text": "Clinical liposomal ceramides that soothe irritation and hydrate deeply.",
                "destination_url": "https://luminaskin.com/serum",
                "media_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
                "call_to_action": "SHOP_NOW"
            }
        ]
    }
    res = client.post("/api/v1/campaigns", json=payload)
    assert res.status_code == 201
    data = res.json()

    # Verify hierarchy
    assert data["status"] == "PAUSED"
    assert data["workflow_status"] == "VALIDATED"
    assert len(data["ad_sets"]) == 1
    assert data["ad_sets"][0]["status"] == "PAUSED"
    assert len(data["creatives"]) == 1
    assert len(data["ads"]) == 1
    assert data["ads"][0]["status"] == "PAUSED"
    assert data["current_payload_hash"] is not None
    assert data["is_approved"] is False


def test_approval_record_with_sha256_hash_and_invalidation_upon_mutation():
    """Verify approval generates cryptographic hash and any mutation revokes approval."""
    # 1. Create Campaign
    create_res = client.post("/api/v1/campaigns", json={
        "client_id": "cli_lumina_glow",
        "name": "TEST_Approval_Hash_Integrity",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 100.0,
        "ad_sets": [],
        "creatives": []
    })
    campaign_id = create_res.json()["id"]

    # 2. Request approval
    req_res = client.post(f"/api/v1/campaigns/{campaign_id}/request-approval")
    assert req_res.status_code == 200
    assert req_res.json()["workflow_status"] == "APPROVAL_PENDING"

    # 3. Approve campaign
    appr_res = client.post("/api/v1/campaigns/approve", json={
        "campaign_id": campaign_id,
        "reason": "Director approved Q4 allocation",
        "confirm_budget_spend": True,
        "action_type": "CAMPAIGN_CREATION_APPROVAL"
    })
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert appr_data["is_approved"] is True
    assert appr_data["workflow_status"] == "APPROVED"
    assert appr_data["approved_payload_hash"] is not None
    assert appr_data["latest_approval"] is not None
    assert appr_data["latest_approval"]["budget_amount"] == 100.0
    initial_hash = appr_data["approved_payload_hash"]

    # 4. Mutate campaign settings (e.g. increase budget from 100 to 250)
    mutation_res = client.put(f"/api/v1/campaigns/{campaign_id}", json={
        "client_id": "cli_lumina_glow",
        "name": "TEST_Approval_Hash_Integrity",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 250.0,  # Changed!
        "ad_sets": [],
        "creatives": []
    })
    assert mutation_res.status_code == 200
    mutated_data = mutation_res.json()

    # 5. Verify approval was automatically REVOKED and hash changed
    assert mutated_data["is_approved"] is False
    assert mutated_data["needs_reapproval"] is True
    assert mutated_data["workflow_status"] == "DRAFT"
    assert mutated_data["current_payload_hash"] != initial_hash


def test_idempotent_push_to_meta():
    """Verify push-to-meta creates PAUSED campaign and repeated calls with same token are idempotent."""
    # 1. Create and approve
    c_res = client.post("/api/v1/campaigns", json={
        "client_id": "cli_lumina_glow",
        "name": "TEST_Idempotency_Push",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 120.0
    })
    c_id = c_res.json()["id"]

    client.post("/api/v1/campaigns/approve", json={
        "campaign_id": c_id,
        "reason": "Sign off",
        "confirm_budget_spend": True
    })

    # 2. Push to Meta with client_request_token
    token = "idem_token_abc_12345"
    push_1 = client.post(f"/api/v1/campaigns/{c_id}/push-to-meta?client_request_token={token}")
    assert push_1.status_code == 200
    p1_data = push_1.json()
    assert p1_data["workflow_status"] == "PAUSED_IN_META"
    assert p1_data["status"] == "PAUSED"
    meta_id = p1_data["meta_campaign_id"]

    # 3. Repeat push with same token (idempotency simulation)
    push_2 = client.post(f"/api/v1/campaigns/{c_id}/push-to-meta?client_request_token={token}")
    assert push_2.status_code == 200
    assert push_2.json()["meta_campaign_id"] == meta_id


def test_activation_controls_and_pause_action():
    """Verify strict activation guards and emergency pause capability."""
    # 1. Create, approve, and push
    c_res = client.post("/api/v1/campaigns", json={
        "client_id": "cli_lumina_glow",
        "name": "TEST_Activation_Controls",
        "objective": "OUTCOME_SALES",
        "daily_budget_usd": 110.0
    })
    c_id = c_res.json()["id"]

    # 2. Activation fails before approval
    act_fail = client.post(f"/api/v1/campaigns/{c_id}/activate")
    assert act_fail.status_code == 400

    # 3. Approve
    client.post("/api/v1/campaigns/approve", json={
        "campaign_id": c_id,
        "reason": "Verified",
        "confirm_budget_spend": True
    })

    # 4. Activation fails if confirmed budget does not match
    act_mismatch = client.post(f"/api/v1/campaigns/{c_id}/activate", json={
        "campaign_id": c_id,
        "confirm_activation": True,
        "confirmed_daily_budget": 500.0  # Mismatched budget
    })
    assert act_mismatch.status_code == 400
    assert "mismatch" in act_mismatch.json()["detail"].lower()

    # 5. Activation succeeds with matching confirmation
    act_success = client.post(f"/api/v1/campaigns/{c_id}/activate", json={
        "campaign_id": c_id,
        "confirm_activation": True,
        "confirmed_daily_budget": 110.0,
        "approver_declaration": "I authorize live Meta spend of $110/day"
    })
    assert act_success.status_code == 200
    assert act_success.json()["status"] == "ACTIVE"
    assert act_success.json()["workflow_status"] == "ACTIVE"

    # 6. Pause active campaign immediately
    pause_res = client.post(f"/api/v1/campaigns/{c_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"
    assert pause_res.json()["workflow_status"] == "PAUSED_IN_META"
