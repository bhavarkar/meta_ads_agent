-- ====================================================================
-- MetaPilot AI: Row-Level Security (RLS) & Multi-Tenant Isolation
-- Enforces Supabase Auth UID & App Metadata Claims
-- ====================================================================

-- 1. Enable RLS on All Tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract tenant_id from auth.jwt()
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
        (auth.jwt() ->> 'tenant_id')::uuid,
        auth.uid()
    );
$$ LANGUAGE sql STABLE;

-- 2. Tenant Isolation Policies
-- Clients Table
CREATE POLICY "Tenants can only view their own clients"
    ON public.clients FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only insert their own clients"
    ON public.clients FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only update their own clients"
    ON public.clients FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

-- Campaign Drafts Table
CREATE POLICY "Tenants can only view their own campaigns"
    ON public.campaign_drafts FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only insert their own campaigns"
    ON public.campaign_drafts FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only update their own campaigns"
    ON public.campaign_drafts FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

-- Instagram Reels Table
CREATE POLICY "Tenants can only view their own reels"
    ON public.reels FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only insert their own reels"
    ON public.reels FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenants can only update their own reels"
    ON public.reels FOR UPDATE
    USING (tenant_id = public.current_tenant_id());

-- Audit Logs Table: Read-only for tenant, append-only via server service role
CREATE POLICY "Tenants can view their audit logs"
    ON public.audit_logs FOR SELECT
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);
