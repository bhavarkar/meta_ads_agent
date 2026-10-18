"""Authentication endpoints for Supabase Auth, login, signup, password reset, and session verification."""

import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    AuthenticatedUser
)
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    PasswordResetRequest,
    PasswordUpdateWithTokenRequest,
    UserProfileResponse,
    AuthTokenResponse,
    OrganizationBrief
)
from app.dependencies import register_org_membership
from app.core.audit import record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory user database for local runtime & demo synchronization
_USER_DB: Dict[str, Dict[str, Any]] = {
    "lead@metapilot-demo.internal": {
        "id": "usr_demo_agency_lead",
        "email": "lead@metapilot-demo.internal",
        "password_hash": hash_password("demo123456"),
        "full_name": "Alex Vance (Agency Owner)",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "organization_id": "org_apex_growth",
        "role": "owner",
        "created_at": "2026-01-01T00:00:00Z"
    },
    "owner@apex-growth.com": {
        "id": "d0000000-0000-0000-0000-000000000001",
        "email": "owner@apex-growth.com",
        "password_hash": hash_password("Password123!"),
        "full_name": "Alex Vance (Agency Owner)",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "organization_id": "org_apex_growth",
        "role": "owner",
        "created_at": "2026-01-01T00:00:00Z"
    },
    "sarah@apex-growth.com": {
        "id": "d0000000-0000-0000-0000-000000000002",
        "email": "sarah@apex-growth.com",
        "password_hash": hash_password("Password123!"),
        "full_name": "Sarah Connor (Media Lead)",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        "organization_id": "org_apex_growth",
        "role": "admin",
        "created_at": "2026-01-05T00:00:00Z"
    },
    "rival@rival-agency.com": {
        "id": "d0000000-0000-0000-0000-000000000004",
        "email": "rival@rival-agency.com",
        "password_hash": hash_password("Password123!"),
        "full_name": "David Rival",
        "avatar_url": None,
        "organization_id": "org_rival_media",
        "role": "owner",
        "created_at": "2026-02-01T00:00:00Z"
    }
}


@router.post("/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """
    Register new user account, initialize organization workspace, and return authenticated session.
    """
    clean_email = req.email.lower().strip()
    if clean_email in _USER_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    user_id = f"usr_{int(datetime.datetime.now().timestamp()*1000)}"
    org_slug = req.organization_name.lower().replace(" ", "-") if req.organization_name else f"org-{clean_email.split('@')[0]}"
    org_id = f"org_{org_slug}"
    org_name = req.organization_name or f"{req.full_name}'s Organization"

    # Store user
    _USER_DB[clean_email] = {
        "id": user_id,
        "email": clean_email,
        "password_hash": hash_password(req.password),
        "full_name": req.full_name,
        "avatar_url": None,
        "organization_id": org_id,
        "role": "owner",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    # Register in organization store
    register_org_membership(org_id, user_id, "owner")

    # Generate token
    token = create_access_token({
        "sub": user_id,
        "email": clean_email,
        "organization_id": org_id,
        "tenant_id": org_id,
        "role": "owner",
        "full_name": req.full_name
    })

    record_audit_event(
        tenant_id=org_id,
        actor_id=user_id,
        actor_email=clean_email,
        action="USER_SIGNUP_COMPLETED",
        resource_type="USER",
        resource_id=user_id,
        details={"organization_name": org_name, "organization_id": org_id}
    )

    user_profile = UserProfileResponse(
        id=user_id,
        email=clean_email,
        full_name=req.full_name,
        avatar_url=None,
        current_organization_id=org_id,
        current_organization_role="owner",
        organizations=[
            OrganizationBrief(
                id=org_id,
                name=org_name,
                slug=org_slug,
                role="owner",
                billing_tier="agency_pro"
            )
        ],
        is_demo=False
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=86400,
        user=user_profile
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login(req: LoginRequest):
    """
    Authenticate user with email and password, returning signed JWT session token.
    """
    clean_email = req.email.lower().strip()
    user_record = _USER_DB.get(clean_email)

    if not user_record or not verify_password(req.password, user_record["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    org_id = user_record["organization_id"]
    role = user_record.get("role", "member")

    token = create_access_token({
        "sub": user_record["id"],
        "email": clean_email,
        "organization_id": org_id,
        "tenant_id": org_id,
        "role": role,
        "full_name": user_record.get("full_name")
    })

    record_audit_event(
        tenant_id=org_id,
        actor_id=user_record["id"],
        actor_email=clean_email,
        action="USER_LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=user_record["id"]
    )

    user_profile = UserProfileResponse(
        id=user_record["id"],
        email=clean_email,
        full_name=user_record.get("full_name"),
        avatar_url=user_record.get("avatar_url"),
        current_organization_id=org_id,
        current_organization_role=role,
        organizations=[
            OrganizationBrief(
                id=org_id,
                name="Apex Growth Agency" if "apex" in org_id else "My Workspace",
                slug=org_id.replace("org_", ""),
                role=role,
                billing_tier="agency_enterprise" if "apex" in org_id else "agency_pro"
            )
        ],
        is_demo=clean_email == "lead@metapilot-demo.internal"
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=86400,
        user=user_profile
    )


@router.post("/logout")
async def logout(user: AuthenticatedUser = Depends(get_current_user)):
    """Terminate authenticated session and record audit event."""
    record_audit_event(
        tenant_id=user.organization_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="USER_LOGOUT",
        resource_type="USER",
        resource_id=user.user_id
    )
    return {"status": "success", "message": "Successfully logged out"}


@router.post("/reset-password")
async def reset_password(req: PasswordResetRequest):
    """
    Trigger password reset workflow.
    In development and demo mode, generates a verified recovery token.
    """
    clean_email = req.email.lower().strip()
    user_record = _USER_DB.get(clean_email)
    if not user_record:
        # Prevent account enumeration: return success even if email not registered
        return {
            "status": "success",
            "message": "If an account exists with this email address, password reset instructions have been sent."
        }

    reset_token = f"rst_{int(datetime.datetime.now().timestamp()*1000)}"
    return {
        "status": "success",
        "message": "Password reset link generated",
        "reset_token": reset_token,
        "instructions": "Use this token to set a new password."
    }


@router.get("/me", response_model=UserProfileResponse)
async def get_current_profile(user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve the authenticated user's profile and active organizations."""
    return UserProfileResponse(
        id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        current_organization_id=user.organization_id,
        current_organization_role=user.role,
        organizations=[
            OrganizationBrief(
                id=user.organization_id,
                name="Apex Growth Agency" if "apex" in user.organization_id else "Default Organization",
                slug=user.organization_id.replace("org_", ""),
                role=user.role,
                billing_tier="agency_enterprise" if "apex" in user.organization_id else "agency_pro"
            )
        ],
        is_demo=user.is_demo
    )
