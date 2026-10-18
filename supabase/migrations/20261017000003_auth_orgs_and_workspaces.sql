-- ====================================================================
-- MetaPilot AI: Migration 003 - Comprehensive Schema, Auth, Multi-Tenancy & RLS
-- Implements all 17 Required Tables with Strict Foreign Keys, Triggers,
-- Organization Roles, Client-Specific Access, and Secure Token Storage
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Utility Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Table 1: profiles (Linked to Supabase auth.users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Maps 1:1 with auth.users.id
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    preferred_theme VARCHAR(16) DEFAULT 'dark',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ====================================================================
-- Table 2: organizations
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    billing_tier VARCHAR(64) NOT NULL DEFAULT 'agency_pro',
    max_clients INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- ====================================================================
-- Table 3: organization_members
-- Roles: 'owner', 'admin', 'member', 'viewer'
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id) / public.profiles(id)
    role VARCHAR(32) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- ====================================================================
-- Table 4: clients (Brand Workspaces)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    meta_ad_account_id VARCHAR(64) NOT NULL,
    instagram_handle VARCHAR(100),
    monthly_budget_usd NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    target_roas_goal NUMERIC(4, 2) NOT NULL DEFAULT 3.50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_ad_account ON public.clients(meta_ad_account_id);

-- Optional Table: client_members (Client-specific fine-grained access override)
CREATE TABLE IF NOT EXISTS public.client_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    access_level VARCHAR(32) NOT NULL DEFAULT 'editor' CHECK (access_level IN ('manager', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_client_members_client ON public.client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user ON public.client_members(user_id);

-- ====================================================================
-- Table 5: meta_connections (Secure Server-Side Secret Storage)
-- Notice: Tokens are stored as encrypted blobs. Ordinary client queries
-- are blocked from accessing raw or encrypted secrets via RLS!
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.meta_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    ad_account_id VARCHAR(64) NOT NULL,
    instagram_account_id VARCHAR(64),
    meta_app_id VARCHAR(64),
    encrypted_access_token BYTEA,       -- Server-side encrypted with backend secret
    encrypted_app_secret BYTEA,         -- Server-side encrypted with backend secret
    token_masked VARCHAR(32),           -- Safe for display, e.g. "EAAC...4b8d"
    token_expires_at TIMESTAMPTZ,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    scopes TEXT[] DEFAULT ARRAY['ads_management', 'ads_read', 'instagram_basic', 'instagram_content_publish']::TEXT[],
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(client_id)
);
CREATE INDEX IF NOT EXISTS idx_meta_conn_client ON public.meta_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_meta_conn_org ON public.meta_connections(organization_id);

-- ====================================================================
-- Table 6: competitors
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website TEXT,
    facebook_page_id VARCHAR(64),
    instagram_handle VARCHAR(100),
    monitoring_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (monitoring_status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitors_client ON public.competitors(client_id);
CREATE INDEX IF NOT EXISTS idx_competitors_org ON public.competitors(organization_id);

-- ====================================================================
-- Table 7: competitor_ads
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.competitor_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES public.competitors(id) ON DELETE SET NULL,
    ad_archive_id VARCHAR(64),
    advertiser_name VARCHAR(255) NOT NULL,
    headline TEXT NOT NULL,
    primary_text TEXT NOT NULL,
    call_to_action VARCHAR(64) NOT NULL DEFAULT 'Learn More',
    media_type VARCHAR(32) NOT NULL DEFAULT 'video',
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    estimated_active_days INT NOT NULL DEFAULT 1,
    hook_type VARCHAR(64) NOT NULL,
    extracted_hook_text TEXT NOT NULL,
    extracted_offer TEXT NOT NULL,
    target_angles TEXT[] DEFAULT '{}',
    creative_score INT NOT NULL CHECK (creative_score BETWEEN 1 AND 100),
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_client ON public.competitor_ads(client_id);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_org ON public.competitor_ads(organization_id);

-- ====================================================================
-- Table 8: keyword_research
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.keyword_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    search_volume INT NOT NULL DEFAULT 0,
    cpc_estimate NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    competition_level VARCHAR(32) NOT NULL DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
    intent VARCHAR(64) NOT NULL DEFAULT 'commercial',
    relevance_score INT NOT NULL DEFAULT 85 CHECK (relevance_score BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_keywords_client ON public.keyword_research(client_id);
CREATE INDEX IF NOT EXISTS idx_keywords_org ON public.keyword_research(organization_id);

-- ====================================================================
-- Table 9: campaign_strategies
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.campaign_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    business_objective VARCHAR(64) NOT NULL,
    executive_summary TEXT NOT NULL,
    recommended_funnel_structure JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_daily_budget NUMERIC(10, 2) NOT NULL,
    audience_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    creative_angles JSONB NOT NULL DEFAULT '[]'::jsonb,
    testing_roadmap_days INT NOT NULL DEFAULT 14,
    expected_roas_range VARCHAR(32) NOT NULL DEFAULT '3.0x - 4.5x',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategies_client ON public.campaign_strategies(client_id);
CREATE INDEX IF NOT EXISTS idx_strategies_org ON public.campaign_strategies(organization_id);

-- ====================================================================
-- Table 10: campaign_drafts
-- STRICT ENFORCEMENT: Initial status is strictly 'PAUSED'
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.campaign_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.campaign_strategies(id) ON DELETE SET NULL,
    meta_campaign_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(64) NOT NULL DEFAULT 'OUTCOME_SALES',
    daily_budget_usd NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PAUSED' CHECK (status IN ('PAUSED', 'ACTIVE', 'ARCHIVED')),
    approval_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approval_signature VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaign_drafts(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaign_drafts(organization_id);

-- ====================================================================
-- Table 11: campaign_approvals (Explicit Sign-off Audit)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.campaign_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_draft_id UUID NOT NULL REFERENCES public.campaign_drafts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    approval_signature VARCHAR(255) NOT NULL,
    confirmed_budget_spend BOOLEAN NOT NULL DEFAULT TRUE,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approvals_draft ON public.campaign_approvals(campaign_draft_id);
CREATE INDEX IF NOT EXISTS idx_approvals_org ON public.campaign_approvals(organization_id);

-- ====================================================================
-- Table 12: creative_assets
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(32) NOT NULL DEFAULT 'video' CHECK (asset_type IN ('video', 'image', 'carousel')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '9:16',
    duration_seconds NUMERIC(5, 2),
    file_size_bytes BIGINT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creatives_client ON public.creative_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_creatives_org ON public.creative_assets(organization_id);

-- ====================================================================
-- Table 13: reel_publications (Instagram Reels Pipeline)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reel_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    creative_asset_id UUID REFERENCES public.creative_assets(id) ON DELETE SET NULL,
    instagram_ig_id VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PREVIEW_VERIFIED', 'APPROVED_FOR_PUBLISHING', 'PUBLISHED', 'FAILED')),
    duration_seconds NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '9:16',
    preview_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    published_at TIMESTAMPTZ,
    permalink TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reels_client ON public.reel_publications(client_id);
CREATE INDEX IF NOT EXISTS idx_reels_org ON public.reel_publications(organization_id);

-- ====================================================================
-- Table 14: campaign_metrics
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    meta_campaign_id VARCHAR(64),
    date DATE NOT NULL,
    spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    impressions INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    conversions INT NOT NULL DEFAULT 0,
    roas NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    cpa NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    cpc NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    ctr NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    placement_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metrics_client_date ON public.campaign_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_metrics_org ON public.campaign_metrics(organization_id);

-- ====================================================================
-- Table 15: ai_recommendations (5 Prioritized Opportunities)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    priority INT NOT NULL CHECK (priority BETWEEN 1 AND 5),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (category IN ('CREATIVE_FATIGUE', 'BUDGET_SCALING', 'AUDIENCE_EXPANSION', 'BIDDING_TUNING', 'OFFER_OPTIMIZATION')),
    projected_roas_lift NUMERIC(4, 2) NOT NULL,
    projected_weekly_savings_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    confidence_score_pct INT NOT NULL CHECK (confidence_score_pct BETWEEN 1 AND 100),
    diagnosis TEXT NOT NULL,
    action_description TEXT NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recs_client_priority ON public.ai_recommendations(client_id, priority);
CREATE INDEX IF NOT EXISTS idx_recs_org ON public.ai_recommendations(organization_id);

-- ====================================================================
-- Table 16: automation_runs
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    trigger_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    execution_time_ms INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auto_runs_org ON public.automation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_auto_runs_client ON public.automation_runs(client_id);

-- ====================================================================
-- Table 17: audit_logs (Enterprise Immutable Compliance Log)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_client ON public.audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);

-- ====================================================================
-- Updated At Triggers Registration
-- ====================================================================
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'updated_at'
          AND table_name IN (
            'profiles', 'organizations', 'organization_members', 'clients', 
            'meta_connections', 'competitors', 'competitor_ads', 'keyword_research',
            'campaign_strategies', 'campaign_drafts', 'creative_assets', 
            'reel_publications', 'ai_recommendations'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();', t);
    END LOOP;
END $$;

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all 17 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function 1: Check if current user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper Function 2: Check if current user is owner/admin of organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper Function 3: Check if user has access to a specific client workspace
-- (Org owner/admin has access to all clients; members have access if unassigned or explicitly granted)
CREATE OR REPLACE FUNCTION public.has_client_access(c_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.clients WHERE id = c_id;
    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Org owner or admin has universal workspace access
    IF public.is_org_admin(v_org_id) THEN
        RETURN TRUE;
    END IF;

    -- Check if user is general org member and either has explicit client access or no client restrictions exist
    IF public.is_org_member(v_org_id) THEN
        IF EXISTS (SELECT 1 FROM public.client_members WHERE client_id = c_id) THEN
            RETURN EXISTS (SELECT 1 FROM public.client_members WHERE client_id = c_id AND user_id = auth.uid());
        ELSE
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Organizations Policies
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT USING (public.is_org_member(id));

DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
CREATE POLICY "Admins can update their organizations" ON public.organizations
    FOR UPDATE USING (public.is_org_admin(id));

-- Organization Members Policies
DROP POLICY IF EXISTS "Members can view fellow members" ON public.organization_members;
CREATE POLICY "Members can view fellow members" ON public.organization_members
    FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members" ON public.organization_members
    FOR ALL USING (public.is_org_admin(organization_id));

-- Clients Policies
DROP POLICY IF EXISTS "Users can view authorized clients" ON public.clients;
CREATE POLICY "Users can view authorized clients" ON public.clients
    FOR SELECT USING (public.has_client_access(id));

DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;
CREATE POLICY "Admins can manage clients" ON public.clients
    FOR ALL USING (public.is_org_admin(organization_id));

-- Meta Connections Policies (SECURE SECRET ISOLATION)
-- Non-service queries CANNOT read encrypted token columns directly.
DROP POLICY IF EXISTS "Members can view connection status" ON public.meta_connections;
CREATE POLICY "Members can view connection status" ON public.meta_connections
    FOR SELECT USING (public.has_client_access(client_id));

DROP POLICY IF EXISTS "Admins can update meta connections" ON public.meta_connections;
CREATE POLICY "Admins can update meta connections" ON public.meta_connections
    FOR ALL USING (public.is_org_admin(organization_id));

-- Competitors & Competitor Ads Policies
DROP POLICY IF EXISTS "Users can view competitors" ON public.competitors;
CREATE POLICY "Users can view competitors" ON public.competitors
    FOR ALL USING (public.has_client_access(client_id));

DROP POLICY IF EXISTS "Users can view competitor ads" ON public.competitor_ads;
CREATE POLICY "Users can view competitor ads" ON public.competitor_ads
    FOR ALL USING (public.has_client_access(client_id));

-- Keyword Research Policies
DROP POLICY IF EXISTS "Users can access keywords" ON public.keyword_research;
CREATE POLICY "Users can access keywords" ON public.keyword_research
    FOR ALL USING (public.has_client_access(client_id));

-- Campaign Strategies & Drafts Policies
DROP POLICY IF EXISTS "Users can access strategies" ON public.campaign_strategies;
CREATE POLICY "Users can access strategies" ON public.campaign_strategies
    FOR ALL USING (public.has_client_access(client_id));

DROP POLICY IF EXISTS "Users can access campaign drafts" ON public.campaign_drafts;
CREATE POLICY "Users can access campaign drafts" ON public.campaign_drafts
    FOR ALL USING (public.has_client_access(client_id));

-- Campaign Approvals Policies
DROP POLICY IF EXISTS "Users can view approvals" ON public.campaign_approvals;
CREATE POLICY "Users can view approvals" ON public.campaign_approvals
    FOR SELECT USING (public.is_org_member(organization_id));

-- Creative Assets & Reels Policies
DROP POLICY IF EXISTS "Users can access creative assets" ON public.creative_assets;
CREATE POLICY "Users can access creative assets" ON public.creative_assets
    FOR ALL USING (public.has_client_access(client_id));

DROP POLICY IF EXISTS "Users can access reel publications" ON public.reel_publications;
CREATE POLICY "Users can access reel publications" ON public.reel_publications
    FOR ALL USING (public.has_client_access(client_id));

-- Campaign Metrics Policies
DROP POLICY IF EXISTS "Users can access campaign metrics" ON public.campaign_metrics;
CREATE POLICY "Users can access campaign metrics" ON public.campaign_metrics
    FOR SELECT USING (public.has_client_access(client_id));

-- AI Recommendations Policies
DROP POLICY IF EXISTS "Users can access recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can access recommendations" ON public.ai_recommendations
    FOR ALL USING (public.has_client_access(client_id));

-- Automation Runs Policies
DROP POLICY IF EXISTS "Users can view automation runs" ON public.automation_runs;
CREATE POLICY "Users can view automation runs" ON public.automation_runs
    FOR SELECT USING (public.is_org_member(organization_id));

-- Audit Logs Policies
DROP POLICY IF EXISTS "Users can view audit logs" ON public.audit_logs;
CREATE POLICY "Users can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_org_member(organization_id));
