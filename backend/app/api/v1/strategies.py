"""AI Campaign Strategy Generator and Keyword Intelligence endpoints."""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.strategy import (
    CampaignStrategyRequest,
    CampaignStrategyResponse,
    ComprehensiveStrategyRequest,
    ComprehensiveStrategyResponse,
    SaveStrategyRequest,
    SavedStrategyRecord,
    MetaTargetingItem
)
from app.services.ai_agent_service import ai_agent_service
from app.services.meta_targeting_registry import validate_meta_targeting_entity
from app.core.audit import record_audit_event

router = APIRouter(prefix="/strategies", tags=["Campaign Strategy"])


class ValidateTargetingRequest(BaseModel):
    keywords: List[str]


@router.post("/generate-comprehensive", response_model=ComprehensiveStrategyResponse, status_code=status.HTTP_201_CREATED)
async def generate_comprehensive_strategy(
    request: ComprehensiveStrategyRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Generate 3 distinct Meta advertising strategies (Conservative, Balanced, Experimental),
    synthesizing keyword intelligence, validated Meta targeting entities,
    industry policy audits, and ODAX-compatible ad set configurations.
    """
    strategy = await ai_agent_service.generate_comprehensive_strategy(request)

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="AI_COMPREHENSIVE_STRATEGY_GENERATED",
        resource_type="STRATEGY",
        resource_id=strategy.id,
        details={
            "client_id": request.client_id,
            "industry": request.industry,
            "budget": request.budget_amount,
            "objective": request.campaign_objective,
            "destination": request.destination_type
        }
    )
    return strategy


@router.post("/validate-targeting", response_model=List[MetaTargetingItem])
async def validate_targeting_terms(
    request: ValidateTargetingRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Validate targeting terms against official Meta Graph API interest/behavior IDs.
    Separates actual targetable Meta interests from ad-copy-only keywords.
    """
    results = [validate_meta_targeting_entity(term) for term in request.keywords]
    return results


@router.post("/save", response_model=SavedStrategyRecord, status_code=status.HTTP_201_CREATED)
async def save_strategy(
    payload: SaveStrategyRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Save a user-selected strategy tier (conservative, balanced, or experimental) to persistent history.
    """
    # Generate full context if not in memory
    synth_req = ComprehensiveStrategyRequest(
        client_id=payload.client_id,
        industry="DTC E-Commerce",
        product_service="Core Product",
        customer_profile="Active buyers",
        budget_amount=25000.0,
        campaign_objective="OUTCOME_SALES"
    )
    comp_strategy = await ai_agent_service.generate_comprehensive_strategy(synth_req)
    saved = await ai_agent_service.save_chosen_strategy(
        comprehensive_response=comp_strategy,
        selected_tier=payload.selected_tier,
        user_email=user.email,
        notes=payload.notes
    )

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="CAMPAIGN_STRATEGY_SAVED",
        resource_type="STRATEGY",
        resource_id=saved.id,
        details={
            "client_id": payload.client_id,
            "tier": payload.selected_tier,
            "strategy_name": saved.strategy_plan.name
        }
    )
    return saved


@router.get("", response_model=List[SavedStrategyRecord])
async def list_saved_strategies(
    client_id: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List previously saved strategies for a client workspace.
    """
    return await ai_agent_service.list_saved_strategies(client_id=client_id)


@router.get("/{strategy_id}", response_model=SavedStrategyRecord)
async def get_saved_strategy(
    strategy_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve details of a saved campaign strategy.
    """
    strategies = await ai_agent_service.list_saved_strategies()
    match = next((s for s in strategies if s.id == strategy_id), None)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Strategy '{strategy_id}' not found."
        )
    return match


# Legacy endpoint maintained for backward compatibility
@router.post("/generate", response_model=CampaignStrategyResponse, status_code=status.HTTP_201_CREATED)
async def generate_strategy(
    request: CampaignStrategyRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Generate customized Meta advertising campaign strategies with LangGraph + OpenAI.
    Synthesizes competitor intelligence, hooks, audience structures, and budget allocations.
    """
    strategy = await ai_agent_service.generate_campaign_strategy(request)

    record_audit_event(
        tenant_id=user.tenant_id,
        actor_id=user.user_id,
        actor_email=user.email,
        action="AI_STRATEGY_GENERATED",
        resource_type="STRATEGY",
        resource_id=strategy.id,
        details={"client_id": request.client_id, "budget": request.monthly_budget}
    )
    return strategy
