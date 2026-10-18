"""FastAPI Authorization Dependencies for Tenant Isolation and Role-Based Access Control."""

from typing import Optional, Callable
from fastapi import Depends, HTTPException, status, Path
from app.core.security import AuthenticatedUser, get_current_user
from app.core.exceptions import TenantIsolationException


# In-memory store for Organization Memberships (supports local dev and Supabase sync)
# Format: org_id -> { user_id: role }
_ORG_MEMBERSHIP_STORE = {
    "org_apex_growth": {
        "usr_demo_agency_lead": "owner",
        "d0000000-0000-0000-0000-000000000001": "owner",
        "d0000000-0000-0000-0000-000000000002": "admin",
        "d0000000-0000-0000-0000-000000000003": "member"
    },
    "tenant_apex_growth": {
        "usr_demo_agency_lead": "owner",
        "d0000000-0000-0000-0000-000000000001": "owner",
        "d0000000-0000-0000-0000-000000000002": "admin",
        "d0000000-0000-0000-0000-000000000003": "member"
    },
    "org_rival_media": {
        "d0000000-0000-0000-0000-000000000004": "owner",
        "usr_rival_admin": "owner"
    }
}


def register_org_membership(org_id: str, user_id: str, role: str):
    """Register or update a user's role in an organization."""
    if org_id not in _ORG_MEMBERSHIP_STORE:
        _ORG_MEMBERSHIP_STORE[org_id] = {}
    _ORG_MEMBERSHIP_STORE[org_id][user_id] = role


def remove_org_membership(org_id: str, user_id: str):
    """Remove a user from an organization."""
    if org_id in _ORG_MEMBERSHIP_STORE and user_id in _ORG_MEMBERSHIP_STORE[org_id]:
        del _ORG_MEMBERSHIP_STORE[org_id][user_id]


def get_user_role_in_org(org_id: str, user_id: str) -> Optional[str]:
    """Retrieve user's role in the specified organization."""
    return _ORG_MEMBERSHIP_STORE.get(org_id, {}).get(user_id)


def require_org_member(org_id: str = Path(...), user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """
    Enforce organization tenant isolation.
    Prevent users from accessing another organization's records through modified URL parameters or API IDs.
    """
    # Check if user's primary active org matches
    if user.organization_id == org_id or user.tenant_id == org_id:
        return user

    # Check registered memberships
    role = get_user_role_in_org(org_id, user.user_id)
    if role:
        user.organization_id = org_id
        user.role = role
        return user

    # Deny cross-tenant access with strict 403 Forbidden
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access denied: User does not belong to organization '{org_id}'"
    )


def require_org_admin(org_id: str = Path(...), user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """
    Enforce that user holds 'owner' or 'admin' role in the requested organization.
    """
    authorized_user = require_org_member(org_id=org_id, user=user)
    role = get_user_role_in_org(org_id, user.user_id) or user.role
    if role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative privileges ('owner' or 'admin') required for this action"
        )
    return authorized_user


def verify_client_access(client_id: str, user: AuthenticatedUser, clients_store: list) -> dict:
    """
    Verify client exists and belongs to the authenticated user's organization.
    Prevents Insecure Direct Object References (IDOR) when requesting client-scoped endpoints.
    """
    client = next((c for c in clients_store if getattr(c, "id", None) == client_id or (isinstance(c, dict) and c.get("id") == client_id)), None)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client workspace '{client_id}' not found"
        )

    client_org = getattr(client, "organization_id", None) or getattr(client, "tenant_id", None)
    if isinstance(client, dict):
        client_org = client.get("organization_id") or client.get("tenant_id")

    # Verify tenant boundary
    if client_org not in (user.organization_id, user.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Client workspace '{client_id}' does not belong to your organization"
        )

    return client
