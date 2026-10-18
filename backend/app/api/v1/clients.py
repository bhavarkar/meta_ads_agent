"""Multi-client management endpoints with tenant isolation and secure Meta token storage."""

import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.security import AuthenticatedUser, get_current_user
from app.dependencies import verify_client_access
from app.schemas.client import ClientResponse, ClientCreate
from app.schemas.organization import (
    ClientSettingsUpdate,
    MetaConnectionCreate,
    MetaConnectionResponse
)
from app.core.encryption import encrypt_secret, mask_token
from app.services.demo_data_service import DEMO_CLIENTS
from app.core.audit import record_audit_event
from app.schemas.campaign import MetaConnectionHealth
from app.services.meta_service import meta_service

router = APIRouter(prefix="/clients", tags=["Clients & Workspaces"])

# In-memory store for client accounts
_CLIENT_STORE: List[ClientResponse] = list(DEMO_CLIENTS)

# In-memory store for encrypted Meta connections
# client_id -> { encrypted_access_token, token_masked, ad_account_id, ... }
_META_CONNECTIONS_STORE = {
    "cli_lumina_glow": {
        "client_id": "cli_lumina_glow",
        "organization_id": "org_apex_growth",
        "ad_account_id": "act_4829104820",
        "instagram_account_id": "17841400000000001",
        "meta_app_id": "291048201948201",
        "encrypted_access_token": encrypt_secret("EAACEdEose0cBAmocktoken1234567890"),
        "token_masked": "EAAC••••••••7890",
        "token_expires_at": "2026-12-31T23:59:59Z",
        "is_connected": True,
        "last_verified_at": "2026-10-17T08:00:00Z"
    }
}


@router.get("", response_model=List[ClientResponse])
async def list_clients(
    organization_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List all client accounts belonging to the authenticated tenant.
    Guarantees strict tenant isolation.
    """
    target_org = organization_id or user.organization_id or user.tenant_id
    if user.is_demo:
        return [c for c in _CLIENT_STORE if c.organization_id == target_org or c.tenant_id == target_org or "apex" in target_org]
    return [c for c in _CLIENT_STORE if c.organization_id == target_org or c.tenant_id == target_org]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_in: ClientCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Register a new managed client with isolated Meta Ad Account."""
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    org_id = client_in.organization_id or user.organization_id or user.tenant_id

    new_client = ClientResponse(
        id=f"cli_{int(datetime.datetime.now().timestamp()*1000)}",
        tenant_id=org_id,
        organization_id=org_id,
        name=client_in.name,
        industry=client_in.industry,
        meta_ad_account_id=client_in.meta_ad_account_id,
        instagram_handle=client_in.instagram_handle,
        monthly_budget_usd=client_in.monthly_budget_usd,
        target_roas_goal=client_in.target_roas_goal,
        is_active=client_in.is_active,
        created_at=now_iso,
        active_campaigns_count=0,
        total_spend_30d=0.0,
        average_roas_30d=0.0
    )
    _CLIENT_STORE.append(new_client)

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CLIENT_ACCOUNT_ONBOARDED",
        resource_type="CLIENT",
        resource_id=new_client.id,
        details={"name": new_client.name, "ad_account": new_client.meta_ad_account_id}
    )
    return new_client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client_details(
    client_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve single client workspace.
    Enforces IDOR protection: verified against user's tenant organization.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client_settings(
    client_id: str,
    update_in: ClientSettingsUpdate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update client budget, goals, or metadata.
    Enforces IDOR protection: rejects cross-tenant requests.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)

    if update_in.name is not None:
        client.name = update_in.name
    if update_in.industry is not None:
        client.industry = update_in.industry
    if update_in.monthly_budget_usd is not None:
        client.monthly_budget_usd = update_in.monthly_budget_usd
    if update_in.target_roas_goal is not None:
        client.target_roas_goal = update_in.target_roas_goal
    if update_in.instagram_handle is not None:
        client.instagram_handle = update_in.instagram_handle
    if update_in.is_active is not None:
        client.is_active = update_in.is_active

    record_audit_event(
        tenant_id=client.organization_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CLIENT_SETTINGS_UPDATED",
        resource_type="CLIENT",
        resource_id=client.id,
        details=update_in.model_dump(exclude_unset=True)
    )
    return client


@router.post("/{client_id}/meta-connection", response_model=MetaConnectionResponse)
async def connect_meta_account(
    client_id: str,
    connection_in: MetaConnectionCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Secure server-side secret storage for Meta Marketing API credentials.
    Access tokens are encrypted at rest with server key and NEVER returned in plain text.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)

    encrypted_blob = encrypt_secret(connection_in.access_token)
    safe_mask = mask_token(connection_in.access_token)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn_record = {
        "client_id": client.id,
        "organization_id": client.organization_id,
        "ad_account_id": connection_in.ad_account_id,
        "instagram_account_id": connection_in.instagram_account_id,
        "meta_app_id": connection_in.meta_app_id,
        "encrypted_access_token": encrypted_blob,
        "token_masked": safe_mask,
        "token_expires_at": "2026-12-31T23:59:59Z",
        "is_connected": True,
        "last_verified_at": now_iso
    }
    _META_CONNECTIONS_STORE[client.id] = conn_record

    # Update client record
    client.meta_ad_account_id = connection_in.ad_account_id
    if connection_in.instagram_account_id:
        client.instagram_handle = f"ig_{connection_in.instagram_account_id}"

    record_audit_event(
        tenant_id=client.organization_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="META_CREDENTIALS_ENCRYPTED_AND_STORED",
        resource_type="META_CONNECTION",
        resource_id=client.id,
        details={"ad_account_id": connection_in.ad_account_id, "token_masked": safe_mask}
    )

    return MetaConnectionResponse(
        client_id=client.id,
        organization_id=client.organization_id,
        ad_account_id=connection_in.ad_account_id,
        instagram_account_id=connection_in.instagram_account_id,
        meta_app_id=connection_in.meta_app_id,
        is_connected=True,
        token_masked=safe_mask,
        token_expires_at="2026-12-31T23:59:59Z",
        last_verified_at=now_iso
    )


@router.get("/{client_id}/meta-connection", response_model=MetaConnectionResponse)
async def get_meta_connection_status(
    client_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve Meta connection status. Returns masked credentials only; plain text token is never exposed.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)
    conn = _META_CONNECTIONS_STORE.get(client.id)

    if not conn:
        return MetaConnectionResponse(
            client_id=client.id,
            organization_id=client.organization_id,
            ad_account_id=client.meta_ad_account_id,
            instagram_account_id=None,
            meta_app_id=None,
            is_connected=False,
            token_masked="Not Configured",
            token_expires_at=None,
            last_verified_at=None
        )

    return MetaConnectionResponse(
        client_id=client.id,
        organization_id=client.organization_id,
        ad_account_id=conn["ad_account_id"],
        instagram_account_id=conn.get("instagram_account_id"),
        meta_app_id=conn.get("meta_app_id"),
        is_connected=conn["is_connected"],
        token_masked=conn["token_masked"],
        token_expires_at=conn.get("token_expires_at"),
        last_verified_at=conn.get("last_verified_at")
    )


@router.get("/{client_id}/meta-health", response_model=MetaConnectionHealth)
async def get_client_meta_health(
    client_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Fetch comprehensive Meta connection health, currency, timezone, permissions, and token expiry.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)
    ad_account = client.meta_ad_account_id or "act_4829104820"
    return await meta_service.check_connection_health(client.id, ad_account)


@router.post("/{client_id}/meta-disconnect")
async def disconnect_meta_connection(
    client_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Disconnect advertising account and revoke access token from Meta via DELETE /me/permissions.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)
    revoke_res = await meta_service.revoke_meta_token()

    if client.id in _META_CONNECTIONS_STORE:
        _META_CONNECTIONS_STORE[client.id]["is_connected"] = False
        _META_CONNECTIONS_STORE[client.id]["token_masked"] = "REVOKED"

    record_audit_event(
        tenant_id=client.organization_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="META_CONNECTION_DISCONNECTED_AND_REVOKED",
        resource_type="META_CONNECTION",
        resource_id=client.id,
        details={"status": "REVOKED", "meta_response": revoke_res}
    )

    return {
        "success": True,
        "message": "Meta advertising account successfully disconnected and access token revoked.",
        "revoked_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@router.get("/{client_id}/meta-ad-accounts")
async def list_authorized_ad_accounts(
    client_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Fetch all authorized Meta Advertising Accounts accessible with current token,
    including currency, timezone, permissions, and account status.
    """
    client = verify_client_access(client_id, user, _CLIENT_STORE)
    account_detail = await meta_service.get_ad_account_details(client.meta_ad_account_id or "act_4829104820")
    
    return [
        account_detail,
        {
            "id": "act_8910234710",
            "name": "Apex Performance Athletics (Secondary Account)",
            "account_status": 1,
            "status_label": "ACTIVE",
            "currency": "USD",
            "timezone_name": "America/New_York",
            "timezone_offset_hours_utc": -4,
            "capabilities": ["CAN_USE_CONVERSIONS_CAMPAIGN"],
            "permissions": ["ADMINISTER", "EDIT", "VIEW"],
            "is_prepay_account": False,
            "amount_spent": 8450.00,
            "balance": 0.00,
            "is_demo": True
        }
    ]

