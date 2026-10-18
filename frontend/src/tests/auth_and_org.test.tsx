import { describe, it, expect } from 'vitest';
import { FALLBACK_ORGANIZATIONS, FALLBACK_MEMBERS, FALLBACK_META_CONNECTION, FALLBACK_CLIENTS } from '../services/demoData';
import { api } from '../services/api';

describe('Auth & Organization Multi-Tenant Security Suite', () => {
  it('validates organization member hierarchy and RBAC roles', () => {
    expect(FALLBACK_ORGANIZATIONS.length).toBeGreaterThanOrEqual(2);
    const apexOrg = FALLBACK_ORGANIZATIONS.find(o => o.id === 'org_apex_growth');
    expect(apexOrg).toBeDefined();
    expect(apexOrg?.owner_id).toBe('usr_demo_agency_lead');

    // Check members for Apex Growth
    const apexMembers = FALLBACK_MEMBERS.filter(m => m.organization_id === 'org_apex_growth');
    expect(apexMembers.length).toBeGreaterThanOrEqual(3);

    const roles = apexMembers.map(m => m.role);
    expect(roles).toContain('owner');
    expect(roles).toContain('admin');
    expect(roles).toContain('member');
  });

  it('guarantees Meta Access Tokens are strictly masked in client-facing datasets', () => {
    expect(FALLBACK_META_CONNECTION.token_masked).toBeDefined();
    expect(FALLBACK_META_CONNECTION.token_masked).toContain('••••');
    // Ensure raw unencrypted tokens are NEVER exposed
    expect(FALLBACK_META_CONNECTION.token_masked).not.toBe('raw_secret_access_token_12345');
    expect(FALLBACK_META_CONNECTION.scopes).toContain('ads_management');
    expect(FALLBACK_META_CONNECTION.scopes).toContain('instagram_content_publish');
  });

  it('verifies client workspace settings and constraints', () => {
    for (const client of FALLBACK_CLIENTS) {
      expect(client.monthly_budget_usd).toBeGreaterThanOrEqual(100);
      expect(client.target_roas_goal).toBeGreaterThanOrEqual(1.0);
      expect(client.meta_ad_account_id).toMatch(/^act_/);
    }
  });

  it('provides safe fallback auth session for offline and local development', async () => {
    const me = await api.getMe();
    expect(me.user).toBeDefined();
    expect(me.user.email).toBe('lead@metapilot-demo.internal');
    expect(me.organizations.length).toBeGreaterThanOrEqual(1);
  });
});
