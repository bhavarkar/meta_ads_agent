"""Organization management and team membership endpoints with strict role-based access control."""

import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path
from app.core.security import AuthenticatedUser, get_current_user
from app.dependencies import require_org_member, require_org_admin, register_org_membership, remove_org_membership
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberResponse,
    InviteMemberRequest,
    UpdateMemberRoleRequest
)
from app.core.audit import record_audit_event

router = APIRouter(prefix="/organizations", tags=["Organizations & Teams"])

# In-memory organization registry
_ORGS_DB: Dict[str, Dict[str, Any]] = {
    "org_apex_growth": {
        "id": "org_apex_growth",
        "name": "Apex Growth Agency",
        "slug": "apex-growth",
        "owner_id": "usr_demo_agency_lead",
        "billing_tier": "agency_enterprise",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
    },
    "tenant_apex_growth": {
        "id": "tenant_apex_growth",
        "name": "Apex Growth Agency",
        "slug": "apex-growth-tenant",
        "owner_id": "usr_demo_agency_lead",
        "billing_tier": "agency_enterprise",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
    },
    "org_rival_media": {
        "id": "org_rival_media",
        "name": "Rival Media Labs",
        "slug": "rival-media",
        "owner_id": "d0000000-0000-0000-0000-000000000004",
        "billing_tier": "agency_starter",
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-01T00:00:00Z"
    }
}

# Member records: list of dicts
_MEMBERS_DB: List[Dict[str, Any]] = [
    {
        "id": "mem_01",
        "organization_id": "org_apex_growth",
        "user_id": "usr_demo_agency_lead",
        "email": "lead@metapilot-demo.internal",
        "full_name": "Alex Vance",
        "role": "owner",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "joined_at": "2026-01-01T00:00:00Z"
    },
    {
        "id": "mem_02",
        "organization_id": "org_apex_growth",
        "user_id": "d0000000-0000-0000-0000-000000000002",
        "email": "sarah@apex-growth.com",
        "full_name": "Sarah Connor",
        "role": "admin",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        "joined_at": "2026-01-10T10:00:00Z"
    },
    {
        "id": "mem_03",
        "organization_id": "org_apex_growth",
        "user_id": "d0000000-0000-0000-0000-000000000003",
        "email": "jordan@apex-growth.com",
        "full_name": "Jordan Lee",
        "role": "member",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
        "joined_at": "2026-02-01T14:30:00Z"
    },
    {
        "id": "mem_04",
        "organization_id": "org_rival_media",
        "user_id": "d0000000-0000-0000-0000-000000000004",
        "email": "rival@rival-agency.com",
        "full_name": "David Rival",
        "role": "owner",
        "avatar_url": None,
        "joined_at": "2026-02-01T00:00:00Z"
    }
]


@router.get("", response_model=List[OrganizationResponse])
async def list_user_organizations(user: AuthenticatedUser = Depends(get_current_user)):
    """List all organizations the current authenticated user belongs to."""
    user_org_ids = [m["organization_id"] for m in _MEMBERS_DB if m["user_id"] == user.user_id]
    if user.organization_id not in user_org_ids:
        user_org_ids.append(user.organization_id)

    results = []
    for org_id in set(user_org_ids):
        org = _ORGS_DB.get(org_id)
        if org:
            mem_count = len([m for m in _MEMBERS_DB if m["organization_id"] == org_id])
            results.append(
                OrganizationResponse(
                    id=org["id"],
                    name=org["name"],
                    slug=org["slug"],
                    owner_id=org["owner_id"],
                    billing_tier=org["billing_tier"],
                    members_count=max(mem_count, 1),
                    clients_count=3 if "apex" in org_id else 1,
                    created_at=org["created_at"],
                    updated_at=org["updated_at"]
                )
            )
    return results


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(req: OrganizationCreate, user: AuthenticatedUser = Depends(get_current_user)):
    """Create a new organization workspace with current user as owner."""
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    slug = req.slug or req.name.lower().replace(" ", "-")
    org_id = f"org_{slug}_{int(datetime.datetime.now().timestamp())}"

    new_org = {
        "id": org_id,
        "name": req.name,
        "slug": slug,
        "owner_id": user.user_id,
        "billing_tier": req.billing_tier,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    _ORGS_DB[org_id] = new_org

    # Register member as owner
    _MEMBERS_DB.append({
        "id": f"mem_{int(datetime.datetime.now().timestamp()*1000)}",
        "organization_id": org_id,
        "user_id": user.user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": "owner",
        "avatar_url": None,
        "joined_at": now_iso
    })
    register_org_membership(org_id, user.user_id, "owner")

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="ORGANIZATION_CREATED",
        resource_type="ORGANIZATION",
        resource_id=org_id,
        details={"name": req.name, "slug": slug}
    )

    return OrganizationResponse(
        id=org_id,
        name=req.name,
        slug=slug,
        owner_id=user.user_id,
        billing_tier=req.billing_tier,
        members_count=1,
        clients_count=0,
        created_at=now_iso,
        updated_at=now_iso
    )


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    user: AuthenticatedUser = Depends(require_org_member)
):
    """Retrieve organization details. Enforces strict tenant membership."""
    org = _ORGS_DB.get(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    mem_count = len([m for m in _MEMBERS_DB if m["organization_id"] == org_id])
    return OrganizationResponse(
        id=org["id"],
        name=org["name"],
        slug=org["slug"],
        owner_id=org["owner_id"],
        billing_tier=org["billing_tier"],
        members_count=mem_count,
        clients_count=3 if "apex" in org_id else 1,
        created_at=org["created_at"],
        updated_at=org["updated_at"]
    )


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    req: OrganizationUpdate,
    user: AuthenticatedUser = Depends(require_org_admin)
):
    """Update organization settings. Enforces administrative permissions."""
    org = _ORGS_DB.get(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if req.name:
        org["name"] = req.name
    if req.billing_tier:
        org["billing_tier"] = req.billing_tier
    org["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _ORGS_DB[org_id] = org

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="ORGANIZATION_UPDATED",
        resource_type="ORGANIZATION",
        resource_id=org_id,
        details=req.model_dump(exclude_unset=True)
    )

    mem_count = len([m for m in _MEMBERS_DB if m["organization_id"] == org_id])
    return OrganizationResponse(
        id=org["id"],
        name=org["name"],
        slug=org["slug"],
        owner_id=org["owner_id"],
        billing_tier=org["billing_tier"],
        members_count=mem_count,
        clients_count=3 if "apex" in org_id else 1,
        created_at=org["created_at"],
        updated_at=org["updated_at"]
    )


@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
async def list_members(
    org_id: str,
    user: AuthenticatedUser = Depends(require_org_member)
):
    """List team members of the organization. Protected against cross-tenant snooping."""
    members = [m for m in _MEMBERS_DB if m["organization_id"] == org_id]
    return [
        OrganizationMemberResponse(
            id=m["id"],
            organization_id=m["organization_id"],
            user_id=m["user_id"],
            email=m["email"],
            full_name=m.get("full_name"),
            role=m["role"],
            avatar_url=m.get("avatar_url"),
            joined_at=m["joined_at"]
        )
        for m in members
    ]


@router.post("/{org_id}/members", response_model=OrganizationMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    org_id: str,
    req: InviteMemberRequest,
    user: AuthenticatedUser = Depends(require_org_admin)
):
    """Invite or add a team member to the organization with assigned role."""
    clean_email = req.email.lower().strip()
    existing = next((m for m in _MEMBERS_DB if m["organization_id"] == org_id and m["email"] == clean_email), None)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this organization"
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    new_user_id = f"usr_{int(datetime.datetime.now().timestamp()*1000)}"
    new_member_id = f"mem_{int(datetime.datetime.now().timestamp()*1000)}"

    new_member = {
        "id": new_member_id,
        "organization_id": org_id,
        "user_id": new_user_id,
        "email": clean_email,
        "full_name": clean_email.split("@")[0].replace(".", " ").title(),
        "role": req.role,
        "avatar_url": None,
        "joined_at": now_iso
    }
    _MEMBERS_DB.append(new_member)
    register_org_membership(org_id, new_user_id, req.role)

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="TEAM_MEMBER_INVITED",
        resource_type="ORGANIZATION_MEMBER",
        resource_id=new_member_id,
        details={"email": clean_email, "role": req.role}
    )

    return OrganizationMemberResponse(
        id=new_member["id"],
        organization_id=new_member["organization_id"],
        user_id=new_member["user_id"],
        email=new_member["email"],
        full_name=new_member["full_name"],
        role=new_member["role"],
        avatar_url=new_member["avatar_url"],
        joined_at=new_member["joined_at"]
    )


@router.patch("/{org_id}/members/{user_id}", response_model=OrganizationMemberResponse)
async def update_member_role(
    org_id: str,
    user_id: str,
    req: UpdateMemberRoleRequest,
    user: AuthenticatedUser = Depends(require_org_admin)
):
    """Update role for a member of the organization."""
    member = next((m for m in _MEMBERS_DB if m["organization_id"] == org_id and m["user_id"] == user_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this organization")

    member["role"] = req.role
    register_org_membership(org_id, user_id, req.role)

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="TEAM_MEMBER_ROLE_UPDATED",
        resource_type="ORGANIZATION_MEMBER",
        resource_id=member["id"],
        details={"member_id": user_id, "new_role": req.role}
    )

    return OrganizationMemberResponse(
        id=member["id"],
        organization_id=member["organization_id"],
        user_id=member["user_id"],
        email=member["email"],
        full_name=member.get("full_name"),
        role=member["role"],
        avatar_url=member.get("avatar_url"),
        joined_at=member["joined_at"]
    )


@router.delete("/{org_id}/members/{user_id}")
async def remove_member(
    org_id: str,
    user_id: str,
    user: AuthenticatedUser = Depends(require_org_admin)
):
    """Remove member from organization. Prevents orphan organizations by protecting the last owner."""
    member = next((m for m in _MEMBERS_DB if m["organization_id"] == org_id and m["user_id"] == user_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this organization")

    if member["role"] == "owner":
        owners = [m for m in _MEMBERS_DB if m["organization_id"] == org_id and m["role"] == "owner"]
        if len(owners) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the sole owner of an organization"
            )

    _MEMBERS_DB.remove(member)
    remove_org_membership(org_id, user_id)

    record_audit_event(
        tenant_id=org_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="TEAM_MEMBER_REMOVED",
        resource_type="ORGANIZATION_MEMBER",
        resource_id=member["id"],
        details={"removed_user_id": user_id, "removed_email": member["email"]}
    )

    return {"status": "success", "message": "Member removed successfully"}
