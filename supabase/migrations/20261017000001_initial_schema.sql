-- ====================================================================
-- MetaPilot AI: Initial Schema Migration
-- Production Supabase PostgreSQL Schema with Strict Constraints
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations / Tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Managed Clients (Multi-Client support for Agencies & Brands)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    meta_ad_account_id VARCHAR(64) NOT NULL,
    instagram_handle VARCHAR(100),
    monthly_budget_usd NUMERIC(12, 2) NOT NULL DEFAULT 5000.00,
    target_roas_goal NUMERIC(4, 2) NOT NULL DEFAULT 3.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Campaign Drafts (Strict PAUSED initial status)
CREATE TABLE IF NOT EXISTS public.campaign_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Instagram Reels Studio Pipeline
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Competitor Intelligence Monitored Creatives
CREATE TABLE IF NOT EXISTS public.competitor_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    advertiser_name VARCHAR(255) NOT NULL,
    meta_page_id VARCHAR(64) NOT NULL,
    headline TEXT NOT NULL,
    primary_text TEXT NOT NULL,
    call_to_action VARCHAR(64) NOT NULL,
    media_type VARCHAR(32) NOT NULL DEFAULT 'video',
    media_url TEXT NOT NULL,
    hook_type VARCHAR(64) NOT NULL,
    extracted_hook_text TEXT NOT NULL,
    extracted_offer TEXT NOT NULL,
    target_angles TEXT[] DEFAULT '{}',
    creative_score INT NOT NULL CHECK (creative_score BETWEEN 1 AND 100),
    estimated_active_days INT NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance multi-tenant filtering
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaign_drafts(client_id);
CREATE INDEX IF NOT EXISTS idx_reels_client_id ON public.reels(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
