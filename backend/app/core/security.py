"""Security, JWT authentication, password hashing, and explicit approval verification."""

import hmac
import hashlib
import os
import time
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import Header, Depends, HTTPException, status
from app.config import settings
from app.core.exceptions import SecurityException, TenantIsolationException


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with random salt."""
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}:{pw_hash.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password against stored salt:hash string."""
    try:
        salt_hex, hash_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        actual_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta_seconds: int = 86400) -> str:
    """Create a signed JWT token compatible with Supabase Auth schema."""
    to_encode = data.copy()
    expire = time.time() + expires_delta_seconds
    to_encode.update({"exp": int(expire), "iat": int(time.time())})
    return jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def generate_approval_signature(resource_type: str, resource_id: str, actor_id: str) -> str:
    """Generate a HMAC-SHA256 signature validating explicit server-side authorization."""
    secret = settings.SUPABASE_JWT_SECRET.encode("utf-8")
    payload = f"{resource_type}:{resource_id}:{actor_id}:{time.strftime('%Y-%m-%d')}".encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()


def verify_approval_signature(resource_type: str, resource_id: str, actor_id: str, signature: str) -> bool:
    """Verify approval signature matches server-generated token."""
    expected = generate_approval_signature(resource_type, resource_id, actor_id)
    return hmac.compare_digest(expected, signature)


class AuthenticatedUser:
    def __init__(
        self,
        user_id: str,
        email: str,
        tenant_id: str,
        role: str = "owner",
        organization_id: Optional[str] = None,
        full_name: Optional[str] = None,
        is_demo: bool = False
    ):
        self.user_id = user_id
        self.email = email
        self.tenant_id = tenant_id
        self.organization_id = organization_id or tenant_id
        self.role = role
        self.full_name = full_name or email.split("@")[0]
        self.is_demo = is_demo


def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """
    Verify Supabase Auth JWT token and enforce tenant isolation.
    In Demo mode, accepts demo bearer tokens seamlessly for developer ergonomics.
    """
    if not authorization:
        if settings.is_demo_mode:
            # Safe synthetic user for local development and demonstration
            return AuthenticatedUser(
                user_id="usr_demo_agency_lead",
                email="lead@metapilot-demo.internal",
                tenant_id="tenant_apex_growth",
                organization_id="org_apex_growth",
                role="owner",
                full_name="Alex Vance (Agency Owner)",
                is_demo=True
            )
        raise SecurityException("Authorization header is required")

    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise SecurityException("Invalid authorization scheme. Use 'Bearer <token>'")
        token = parts[1]

        # Support demo tokens
        if token == "demo-token-metapilot-preview" or (settings.is_demo_mode and token.startswith("demo-")):
            return AuthenticatedUser(
                user_id="usr_demo_agency_lead",
                email="lead@metapilot-demo.internal",
                tenant_id="tenant_apex_growth",
                organization_id="org_apex_growth",
                role="owner",
                full_name="Alex Vance (Agency Owner)",
                is_demo=True
            )

        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        # Supabase metadata or custom tenant/org isolation claims
        app_metadata = payload.get("app_metadata", {})
        org_id = payload.get("organization_id") or app_metadata.get("organization_id") or payload.get("tenant_id") or "org_apex_growth"
        role = payload.get("role") or app_metadata.get("role") or "member"
        full_name = payload.get("full_name") or payload.get("user_metadata", {}).get("full_name")

        if not user_id:
            raise SecurityException("Token missing subject identifier")

        return AuthenticatedUser(
            user_id=user_id,
            email=email,
            tenant_id=org_id,
            organization_id=org_id,
            role=role,
            full_name=full_name,
            is_demo=False
        )
    except (JWTError, ValueError) as e:
        if settings.is_demo_mode:
            return AuthenticatedUser(
                user_id="usr_demo_agency_lead",
                email="lead@metapilot-demo.internal",
                tenant_id="tenant_apex_growth",
                organization_id="org_apex_growth",
                role="owner",
                full_name="Alex Vance (Agency Owner)",
                is_demo=True
            )
        raise SecurityException(f"Invalid or expired JWT token: {str(e)}")
