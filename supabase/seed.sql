-- ====================================================================
-- MetaPilot AI: Supabase Seed Data (Comprehensive Workspaces & Roles)
-- ====================================================================

-- 1. Insert Sample Profiles (User accounts)
INSERT INTO public.profiles (id, email, full_name, avatar_url, preferred_theme)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'owner@apex-growth.com', 'Alex Vance (Agency Owner)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', 'dark'),
    ('d0000000-0000-0000-0000-000000000002', 'admin@apex-growth.com', 'Sarah Connor (Media Lead)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', 'dark'),
    ('d0000000-0000-0000-0000-000000000003', 'member@apex-growth.com', 'Jordan Lee (Campaign Specialist)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', 'dark'),
    ('d0000000-0000-0000-0000-000000000004', 'competitor_user@rival-agency.com', 'David Rival (Cross-Tenant User)', NULL, 'dark')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 2. Insert Organizations (Tenants)
INSERT INTO public.organizations (id, name, slug, billing_tier)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Apex Growth Agency', 'apex-growth', 'agency_enterprise'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Rival Media Labs', 'rival-media', 'agency_starter')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Organization Members with Roles
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0000000-0000-0000-0000-000000000001', 'owner'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0000000-0000-0000-0000-000000000002', 'admin'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0000000-0000-0000-0000-000000000003', 'member'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0000000-0000-0000-0000-000000000004', 'owner')
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- 4. Insert Managed Clients (Brand Workspaces)
INSERT INTO public.clients (id, organization_id, name, industry, meta_ad_account_id, instagram_handle, monthly_budget_usd, target_roas_goal)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lumina Skin Co.', 'DTC Skincare & Beauty', 'act_4829104820', '@luminaglow', 25000.00, 3.80),
    ('c0000000-0000-0000-0000-000000000002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Apex Performance Wear', 'Athleisure & Fitness', 'act_9918231204', '@apexperformance', 40000.00, 3.20),
    ('c0000000-0000-0000-0000-000000000003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ZenithFlow B2B', 'B2B Productivity SaaS', 'act_1192837465', '@zenithflow_app', 15000.00, 2.50),
    ('c0000000-0000-0000-0000-000000000099', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Rival Brand Alpha', 'Rival Tech', 'act_9999999999', '@rivalbrand', 10000.00, 2.00)
ON CONFLICT DO NOTHING;

-- 5. Insert Secure Meta Connection Metadata
INSERT INTO public.meta_connections (organization_id, client_id, ad_account_id, instagram_account_id, token_masked, token_expires_at, is_valid)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0000000-0000-0000-0000-000000000001', 'act_4829104820', '17841400000000001', 'EAAC...4b8d', NOW() + INTERVAL '60 days', TRUE)
ON CONFLICT (client_id) DO NOTHING;
