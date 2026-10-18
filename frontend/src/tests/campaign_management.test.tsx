import { describe, it, expect } from 'vitest';
import { api } from '../services/api';
import { FALLBACK_CAMPAIGNS } from '../services/demoData';

describe('Official Meta Ads Campaign Creation and Management Suite', () => {
  it('fetches authorized ad account details and verifies Meta connection health', async () => {
    const health = await api.getMetaHealth('cli_lumina_glow');
    expect(health).toBeDefined();
    expect(health.is_connected).toBe(true);
    expect(health.health_status).toBe('HEALTHY');
    expect(health.account_currency).toBe('USD');
    expect(health.account_timezone).toBe('America/Los_Angeles');
    expect(health.api_version).toBe('v21.0');
    expect(health.granted_scopes).toContain('ads_management');
    expect(health.granted_scopes).toContain('ads_read');
    expect(health.days_until_token_expiry).toBeGreaterThan(0);

    const accounts = await api.getAuthorizedAdAccounts('cli_lumina_glow');
    expect(accounts).toBeDefined();
    expect(accounts.length).toBeGreaterThanOrEqual(1);
    expect(accounts[0].id).toBe('act_4829104820');
    expect(accounts[0].currency).toBe('USD');
    expect(accounts[0].permissions).toContain('ADMINISTER');
  });

  it('supports token revocation and ad account disconnection', async () => {
    const res = await api.disconnectMeta('cli_lumina_glow');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message.toLowerCase()).toContain('revoked');
  });

  it('validates campaign hierarchy against Graph API v21.0 rules', async () => {
    const validDraft = {
      name: 'Q4_Scale_Advantage_Test',
      objective: 'OUTCOME_SALES',
      daily_budget_usd: 150.0,
      budget_level: 'CAMPAIGN' as const,
      ad_sets: [
        {
          name: 'Core Audience',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          billing_event: 'IMPRESSIONS',
          destination_type: 'WEBSITE',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          targeting: {
            age_min: 21,
            age_max: 55,
            genders: 'WOMEN' as const,
            locations: ['US'],
            interests: [{ id: '6003140510344', name: 'Skin care' }],
            advantage_plus_audience: true
          },
          placements: {
            advantage_plus_placements: true,
            platforms: ['facebook', 'instagram'],
            facebook_positions: ['feed', 'story', 'reels'],
            instagram_positions: ['stream', 'story', 'reels', 'explore']
          }
        }
      ],
      creatives: [
        {
          name: 'Hero UGC',
          page_id: 'page_lumina_official',
          page_name: 'Lumina Skin Co.',
          headline: 'Restore Your Moisture Barrier in 72 Hours',
          primary_text: 'Dermatologist-tested ceramide formula restores natural glow.',
          call_to_action: 'SHOP_NOW',
          media_type: 'VIDEO' as const,
          media_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4',
          destination_url: 'https://luminaskin.com/serum'
        }
      ]
    };

    const valResult = await api.validateCampaign(validDraft);
    expect(valResult).toBeDefined();
    expect(valResult.is_valid).toBe(true);
    expect(valResult.graph_api_version).toBe('v21.0');
    expect(valResult.compatible_settings?.default_optimization_goal).toBe('OFFSITE_CONVERSIONS');
  });

  it('creates 4-tier campaign hierarchy with guaranteed initial PAUSED status', async () => {
    const newCampaign = await api.createCampaign({
      client_id: 'cli_lumina_glow',
      name: 'New_Tier_Hierarchy_Test',
      objective: 'OUTCOME_SALES',
      budget_level: 'CAMPAIGN',
      budget_type: 'DAILY',
      daily_budget_usd: 125.0,
      ad_sets: [
        {
          name: 'Ad Set 01 - Core Advantage+',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          billing_event: 'IMPRESSIONS',
          destination_type: 'WEBSITE',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          targeting: {
            age_min: 25,
            age_max: 50,
            genders: 'ALL',
            locations: ['US'],
            interests: [{ id: '6003140510344', name: 'Skin care' }],
            advantage_plus_audience: true
          },
          placements: {
            advantage_plus_placements: true,
            platforms: ['facebook', 'instagram'],
            facebook_positions: ['feed', 'story'],
            instagram_positions: ['stream', 'reels']
          }
        }
      ],
      creatives: [
        {
          name: 'Creative 01',
          page_id: 'page_lumina_official',
          page_name: 'Lumina Skin Co.',
          headline: 'Clean Beauty Formulated By Dermis',
          primary_text: 'Barrier soothing serum for sensitive skin types.',
          call_to_action: 'SHOP_NOW',
          media_type: 'IMAGE',
          media_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
          destination_url: 'https://luminaskin.com/barrier'
        }
      ],
      ads: [
        {
          name: 'Ad 01 - Clean Beauty',
          status: 'PAUSED'
        }
      ]
    });

    expect(newCampaign).toBeDefined();
    expect(newCampaign.status).toBe('PAUSED'); // Strict PAUSED rule
    expect(newCampaign.workflow_status).toBe('VALIDATED');
    expect(newCampaign.is_approved).toBe(false);
    expect(newCampaign.ad_sets?.length).toBeGreaterThanOrEqual(1);
    expect(newCampaign.creatives?.length).toBeGreaterThanOrEqual(1);
  });

  it('manages full campaign workflow: Draft -> Request Approval -> Approve -> Push to Meta -> Activate', async () => {
    // 1. List campaigns
    const campaigns = await api.getCampaigns('cli_lumina_glow');
    expect(campaigns.length).toBeGreaterThanOrEqual(2);
    const target = campaigns[0];

    // 2. Request Approval
    const reqAppr = await api.requestCampaignApproval(target.id);
    expect(reqAppr.workflow_status).toBe('APPROVAL_PENDING');

    // 3. Grant Explicit Approval
    const approved = await api.approveCampaign(target.id, 'Director approved budget spend.');
    expect(approved.is_approved).toBe(true);
    expect(approved.workflow_status).toBe('APPROVED');
    expect(approved.approved_by).toBeDefined();
    expect(approved.approval_signature).toBeDefined();

    // 4. Push to Meta (PAUSED)
    const pushed = await api.pushCampaignToMeta(target.id, `token_${Date.now()}`);
    expect(pushed.status).toBe('PAUSED'); // Still PAUSED!
    expect(pushed.workflow_status).toBe('PAUSED_IN_META');
    expect(pushed.meta_campaign_id).toBeDefined();

    // 5. Activate live campaign
    const activated = await api.activateCampaign(target.id, {
      confirm_activation: true,
      confirmed_daily_budget: target.daily_budget_usd,
      approver_declaration: 'I authorize live Meta spend'
    });
    expect(activated.status).toBe('ACTIVE');
    expect(activated.workflow_status).toBe('ACTIVE');

    // 6. Emergency Pause
    const paused = await api.pauseCampaign(target.id);
    expect(paused.status).toBe('PAUSED');
    expect(paused.workflow_status).toBe('PAUSED_IN_META');
  });

  it('guarantees fallback demo campaigns conform to 4-tier hierarchy specifications', () => {
    expect(FALLBACK_CAMPAIGNS.length).toBeGreaterThanOrEqual(3);

    for (const cmp of FALLBACK_CAMPAIGNS) {
      expect(cmp.id).toBeDefined();
      expect(cmp.client_id).toBeDefined();
      expect(cmp.name).toBeDefined();
      expect(cmp.daily_budget_usd).toBeGreaterThanOrEqual(10.0);
      expect(cmp.status).toBe('PAUSED'); // All initialized PAUSED
      expect(cmp.workflow_status).toBeDefined();
      expect(cmp.ad_sets).toBeDefined();
      expect(cmp.creatives).toBeDefined();
      expect(cmp.ads).toBeDefined();

      // Check ad set hierarchy
      if (cmp.ad_sets && cmp.ad_sets.length > 0) {
        const adSet = cmp.ad_sets[0];
        expect(adSet.name).toBeDefined();
        expect(adSet.optimization_goal).toBeDefined();
        expect(adSet.targeting).toBeDefined();
        expect(adSet.targeting.locations.length).toBeGreaterThan(0);
        expect(adSet.status).toBe('PAUSED');
      }

      // Check creative hierarchy
      if (cmp.creatives && cmp.creatives.length > 0) {
        const creative = cmp.creatives[0];
        expect(creative.headline).toBeDefined();
        expect(creative.primary_text).toBeDefined();
        expect(creative.call_to_action).toBeDefined();
        expect(creative.destination_url).toBeDefined();
      }
    }
  });
});
