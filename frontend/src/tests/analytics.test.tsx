import { describe, it, expect } from 'vitest';
import { api } from '../services/api';

describe('Official Meta Marketing API Analytics Suite', () => {
  it('retrieves normalized account-level analytics with strict click and conversion integrity', async () => {
    const data = await api.getAnalytics('cli_lumina_glow', 'account', 'last_7d');
    expect(data).toBeDefined();
    expect(data.client_id).toBe('cli_lumina_glow');
    expect(data.level).toBe('account');
    expect(data.date_preset).toBe('last_7d');

    // 1. Spend, Impressions, Reach, Frequency
    expect(data.summary.total_spend).toBeGreaterThan(0);
    expect(data.summary.impressions).toBeGreaterThan(0);
    expect(data.summary.reach).toBeGreaterThan(0);
    expect(data.summary.frequency).toBeGreaterThanOrEqual(1.0);

    // 2. Strict Clicks Separation: Link Clicks vs Generic Clicks
    expect(data.summary.clicks).toBeGreaterThanOrEqual(data.summary.link_clicks);
    expect(data.summary.link_clicks).toBeGreaterThan(0);
    expect(data.summary.ctr_percent).toBeGreaterThan(0);
    expect(data.summary.link_ctr_percent).toBeGreaterThan(0);
    expect(data.summary.cpc).toBeGreaterThan(0);
    expect(data.summary.cost_per_link_click).toBeGreaterThan(0);

    // 3. ROAS Integrity: Supported only by attributed value data
    expect(data.summary.has_attributed_revenue).toBe(true);
    expect(data.summary.roas).toBeGreaterThan(0);
    expect(data.summary.attributed_revenue).toBeGreaterThan(0);

    // 4. Account Metadata
    expect(data.account_metadata.currency).toBe('USD');
    expect(data.account_metadata.account_timezone).toBe('America/Los_Angeles');
    expect(data.account_metadata.attribution_setting).toContain('7-day click');
    expect(data.account_metadata.sync_status).toBe('SUCCESS');
  });

  it('supports multi-level reporting: campaign, adset, and ad hierarchies', async () => {
    // 1. Campaign Level
    const campaignData = await api.getAnalytics('cli_lumina_glow', 'campaign', 'last_7d');
    expect(campaignData.level).toBe('campaign');
    expect(campaignData.entities.length).toBeGreaterThanOrEqual(3);
    const firstCamp = campaignData.entities[0];
    expect(firstCamp.level).toBe('campaign');
    expect(firstCamp.spend).toBeGreaterThan(0);
    expect(firstCamp.results).toBeGreaterThan(0);
    expect(firstCamp.roas).toBeGreaterThan(0);

    // 2. Ad Set Level
    const adsetData = await api.getAnalytics('cli_lumina_glow', 'adset', 'last_7d');
    expect(adsetData.level).toBe('adset');
    expect(adsetData.entities.length).toBeGreaterThanOrEqual(3);
    expect(adsetData.entities[0].level).toBe('adset');

    // 3. Ad Creative Level
    const adData = await api.getAnalytics('cli_lumina_glow', 'ad', 'last_7d');
    expect(adData.level).toBe('ad');
    expect(adData.entities.length).toBeGreaterThanOrEqual(3);
    expect(adData.entities[0].level).toBe('ad');
  });

  it('supports date presets: yesterday, last 7 days, last 30 days, and custom date range', async () => {
    // Yesterday
    const yestData = await api.getAnalytics('cli_lumina_glow', 'account', 'yesterday');
    expect(yestData.date_preset).toBe('yesterday');
    expect(yestData.trend_history.length).toBeGreaterThanOrEqual(1);

    // Last 30 Days
    const monthData = await api.getAnalytics('cli_lumina_glow', 'account', 'last_30d');
    expect(monthData.date_preset).toBe('last_30d');
    expect(monthData.trend_history.length).toBeGreaterThanOrEqual(7);

    // Custom Date Range
    const customData = await api.getAnalytics(
      'cli_lumina_glow',
      'campaign',
      'custom',
      '2026-10-01',
      '2026-10-15'
    );
    expect(customData.date_preset).toBe('custom');
    expect(customData.since).toBe('2026-10-01');
    expect(customData.until).toBe('2026-10-15');
  });

  it('validates conversion funnel stages and flags untracked events without fabrication', async () => {
    const data = await api.getAnalytics('cli_lumina_glow', 'account', 'last_7d');
    expect(data.conversion_funnel).toBeDefined();
    expect(data.conversion_funnel.length).toBeGreaterThanOrEqual(5);

    // Tracked stages: Impressions -> Link Clicks -> Purchases
    const impStage = data.conversion_funnel.find(s => s.stage_id === 'impressions');
    expect(impStage).toBeDefined();
    expect(impStage?.is_tracked).toBe(true);

    const linkStage = data.conversion_funnel.find(s => s.stage_id === 'link_clicks');
    expect(linkStage).toBeDefined();
    expect(linkStage?.is_tracked).toBe(true);
    expect(linkStage?.conversion_rate_pct).toBeGreaterThan(0);

    // Untracked stage: Mobile App Installs
    const untrackedStage = data.conversion_funnel.find(s => s.is_tracked === false);
    expect(untrackedStage).toBeDefined();
    expect(untrackedStage?.count).toBe(0);
    expect(untrackedStage?.untracked_reason).toBeDefined();
  });

  it('identifies top-performing creatives and flags fatigued creatives with diagnoses', async () => {
    const data = await api.getAnalytics('cli_lumina_glow', 'ad', 'last_7d');

    // Top performers
    expect(data.top_creatives.length).toBeGreaterThanOrEqual(1);
    const winner = data.top_creatives[0];
    expect(winner.performance_tier).toBe('TOP_PERFORMER');
    expect(winner.roas).toBeGreaterThan(4.0);
    expect(winner.diagnosis).toBeDefined();

    // Weak / Fatigued creatives
    expect(data.weak_creatives.length).toBeGreaterThanOrEqual(1);
    const fatigued = data.weak_creatives[0];
    expect(fatigued.performance_tier).toBe('WEAK_FATIGUED');
    expect(fatigued.frequency).toBeGreaterThan(3.5);
    expect(fatigued.diagnosis.toLowerCase()).toContain('fatigue');
  });

  it('triggers incremental sync and refreshes local metric snapshot', async () => {
    const syncRes = await api.syncAnalytics('cli_lumina_glow');
    expect(syncRes).toBeDefined();
    expect(syncRes.account_metadata.sync_status).toBe('SUCCESS');
    expect(syncRes.account_metadata.last_synced_at).toBeDefined();
    expect(syncRes.summary.total_spend).toBeGreaterThan(0);
  });
});
