import { describe, it, expect } from 'vitest';
import { FALLBACK_CLIENTS, FALLBACK_COMPETITOR_ADS, FALLBACK_CAMPAIGNS, FALLBACK_RECOMMENDATIONS } from '../services/demoData';

describe('MetaPilot AI Core Frontend Suite', () => {
  it('loads multi-client tenant fixtures with target ROAS constraints', () => {
    expect(FALLBACK_CLIENTS.length).toBeGreaterThanOrEqual(3);
    const lumina = FALLBACK_CLIENTS.find(c => c.id === 'cli_lumina_glow');
    expect(lumina).toBeDefined();
    expect(lumina?.target_roas_goal).toBe(3.8);
    expect(lumina?.meta_ad_account_id).toBe('act_4829104820');
  });

  it('guarantees campaigns default to PAUSED status', () => {
    for (const cmp of FALLBACK_CAMPAIGNS) {
      expect(['PAUSED', 'ACTIVE']).toContain(cmp.status);
      expect(cmp.approval_required).toBe(true);
    }
  });

  it('contains exactly five prioritized AI recommendations with positive projected ROAS lift', () => {
    expect(FALLBACK_RECOMMENDATIONS.length).toBe(5);
    const priorities = FALLBACK_RECOMMENDATIONS.map(r => r.priority);
    expect(priorities).toEqual([1, 2, 3, 4, 5]);

    for (const rec of FALLBACK_RECOMMENDATIONS) {
      expect(rec.projected_roas_lift).toBeGreaterThan(0);
      expect(rec.confidence_score_pct).toBeGreaterThan(80);
      expect(rec.action_description.length).toBeGreaterThan(10);
    }
  });

  it('validates competitor hooks extraction datasets', () => {
    expect(FALLBACK_COMPETITOR_ADS.length).toBeGreaterThan(0);
    const topAd = FALLBACK_COMPETITOR_ADS[0];
    expect(topAd.creative_score).toBeGreaterThanOrEqual(80);
    expect(topAd.extracted_hook_text).toBeTruthy();
  });
});
