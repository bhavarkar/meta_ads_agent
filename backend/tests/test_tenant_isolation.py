"""Test suite verifying cross-tenant isolation, IDOR prevention, and secure secret storage."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token_for_user(email: str, password: str = "Password123!") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_cross_tenant_organization_access_denied():
    """Verify user in Org A cannot access records belonging to Org B via URL ID tampering."""
    # User in org_apex_growth
    apex_token = get_token_for_user("owner@apex-growth.com")

    # Attempt to access Rival Media Labs org record (org_rival_media)
    res = client.get(
        "/api/v1/organizations/org_rival_media",
        headers={"Authorization": f"Bearer {apex_token}"}
    )
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()


def test_cross_tenant_member_listing_denied():
    """Verify user in Org A cannot inspect team members of Org B."""
    apex_token = get_token_for_user("owner@apex-growth.com")

    res = client.get(
        "/api/v1/organizations/org_rival_media/members",
        headers={"Authorization": f"Bearer {apex_token}"}
    )
    assert res.status_code == 403


def test_cross_tenant_client_workspace_idor_blocked():
    """Verify user cannot read or update client records belonging to another tenant."""
    # First, let Rival user create a client workspace in org_rival_media
    rival_token = get_token_for_user("rival@rival-agency.com")
    create_client_res = client.post(
        "/api/v1/clients",
        headers={"Authorization": f"Bearer {rival_token}"},
        json={
            "name": "Rival Confidential Brand",
            "industry": "Stealth Tech",
            "meta_ad_account_id": "act_88888888",
            "monthly_budget_usd": 50000.0,
            "target_roas_goal": 4.0,
            "organization_id": "org_rival_media"
        }
    )
    assert create_client_res.status_code == 201
    rival_client_id = create_client_res.json()["id"]

    # Now Apex user attempts to access Rival client
    apex_token = get_token_for_user("owner@apex-growth.com")
    res = client.get(
        f"/api/v1/clients/{rival_client_id}",
        headers={"Authorization": f"Bearer {apex_token}"}
    )
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()

    # Apex user attempts to modify Rival client settings
    patch_res = client.patch(
        f"/api/v1/clients/{rival_client_id}",
        headers={"Authorization": f"Bearer {apex_token}"},
        json={"monthly_budget_usd": 100.0}
    )
    assert patch_res.status_code == 403


def test_secure_meta_token_storage_never_exposes_raw_secret():
    """Verify Meta access tokens are encrypted and masked, never leaking in responses."""
    apex_token = get_token_for_user("owner@apex-growth.com")
    raw_secret_token = "EAACEdEose0cBAsuper_secret_unmasked_access_token_1234567890"

    # Save connection
    post_res = client.post(
        "/api/v1/clients/cli_lumina_glow/meta-connection",
        headers={"Authorization": f"Bearer {apex_token}"},
        json={
            "ad_account_id": "act_4829104820",
            "instagram_account_id": "17841400000000001",
            "access_token": raw_secret_token
        }
    )
    assert post_res.status_code == 200
    data = post_res.json()

    # Raw secret must NEVER be in response!
    assert raw_secret_token not in str(data)
    assert "token_masked" in data
    assert data["token_masked"].startswith("EAAC")
    assert "••••••••" in data["token_masked"]

    # Querying GET connection status also returns masked token
    get_res = client.get(
        "/api/v1/clients/cli_lumina_glow/meta-connection",
        headers={"Authorization": f"Bearer {apex_token}"}
    )
    assert get_res.status_code == 200
    assert raw_secret_token not in str(get_res.json())
    assert get_res.json()["token_masked"].startswith("EAAC")
