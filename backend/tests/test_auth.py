"""Test suite for Supabase Auth, login, signup, and session management."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_successful():
    """Verify email/password login returns valid JWT token and user profile."""
    res = client.post("/api/v1/auth/login", json={
        "email": "owner@apex-growth.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "owner@apex-growth.com"
    assert data["user"]["current_organization_role"] == "owner"


def test_login_invalid_credentials():
    """Verify invalid password returns 401 Unauthorized."""
    res = client.post("/api/v1/auth/login", json={
        "email": "owner@apex-growth.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_signup_creates_user_and_workspace():
    """Verify signup creates new account, organization, and returns session."""
    unique_email = f"newuser_{pytest.__version__.replace('.', '')}@startup.io"
    res = client.post("/api/v1/auth/signup", json={
        "email": unique_email,
        "password": "SecurePassword99!",
        "full_name": "Taylor Growth",
        "organization_name": "Taylor Media Agency"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert len(data["user"]["organizations"]) >= 1
    assert data["user"]["organizations"][0]["name"] == "Taylor Media Agency"


def test_password_reset_flow():
    """Verify password reset generates recovery response without email enumeration."""
    res = client.post("/api/v1/auth/reset-password", json={
        "email": "owner@apex-growth.com"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Non-existent email should also return friendly message
    res2 = client.post("/api/v1/auth/reset-password", json={
        "email": "nonexistent@nowhere.com"
    })
    assert res2.status_code == 200
    assert res2.json()["status"] == "success"


def test_me_endpoint_with_bearer_token():
    """Verify /auth/me returns profile when bearer token is supplied."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "owner@apex-growth.com",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == "owner@apex-growth.com"
    assert data["current_organization_role"] == "owner"
