import { describe, it, expect } from 'vitest';
import {
  FALLBACK_COMPREHENSIVE_STRATEGY,
  FALLBACK_SAVED_STRATEGIES
} from '../services/demoData';
import { api } from '../services/api';

describe('AI Keyword Intelligence and Campaign Strategy Module Suite', () => {
  it('generates three distinct campaign strategies: Conservative, Balanced, Experimental', async () => {
    const res = await api.generateComprehensiveStrategy({
      client_id: 'cli_lumina_glow',
      industry: 'DTC Skincare & Beauty',
      location: 'United States & Canada',
      budget_type: 'monthly',
      budget_amount: 25000.0,
      product_service: 'Hydra-Barrier Ceramide Nectar',
      customer_profile: 'Women 22-45, active skincare buyers',
      campaign_objective: 'OUTCOME_SALES',
      destination_type: 'WEBSITE'
    });

    expect(res).toBeDefined();
    expect(res.strategies).toBeDefined();
    expect(res.strategies.conservative).toBeDefined();
    expect(res.strategies.balanced).toBeDefined();
    expect(res.strategies.experimental).toBeDefined();

    // Verify Conservative strategy attributes
    const conservative = res.strategies.conservative;
    expect(conservative.tier).toBe('conservative');
    expect(conservative.objective).toBe('OUTCOME_SALES');
    expect(conservative.budget_allocation.monthly_budget_usd).toBe(25000.0);
    expect(conservative.budget_allocation.tofu_pct).toBe(50);
    expect(conservative.budget_allocation.mofu_pct).toBe(30);
    expect(conservative.budget_allocation.bofu_pct).toBe(20);
    expect(conservative.kpis.target_roas_range).toBeDefined();
    expect(conservative.assumptions.length).toBeGreaterThan(0);
    expect(conservative.risks.length).toBeGreaterThan(0);

    // Verify Balanced strategy attributes
    const balanced = res.strategies.balanced;
    expect(balanced.tier).toBe('balanced');
    expect(balanced.budget_allocation.tofu_pct).toBe(70);
    expect(balanced.budget_allocation.mofu_pct).toBe(20);
    expect(balanced.budget_allocation.bofu_pct).toBe(10);
    expect(balanced.placements).toBeDefined();

    // Verify Experimental strategy attributes
    const experimental = res.strategies.experimental;
    expect(experimental.tier).toBe('experimental');
    expect(experimental.budget_allocation.tofu_pct).toBe(80);
    expect(experimental.messaging_hooks.length).toBeGreaterThan(0);
  });

  it('strictly separates research keywords, ad copy keywords, and verified Meta targeting suggestions', async () => {
    const res = await api.generateComprehensiveStrategy({
      client_id: 'cli_lumina_glow',
      industry: 'DTC Skincare & Beauty',
      budget_amount: 15000.0,
      product_service: 'Barrier Serum',
      customer_profile: 'Sensitive skin'
    });

    const intel = res.keyword_intelligence;
    expect(intel.research_keywords.length).toBeGreaterThanOrEqual(3);
    expect(intel.ad_copy_keywords.length).toBeGreaterThanOrEqual(3);
    expect(intel.meta_targeting_suggestions.length).toBeGreaterThanOrEqual(3);

    // Ensure Meta targeting suggestions distinguish targetable IDs from untargetable keywords
    const targetableItems = intel.meta_targeting_suggestions.filter(t => t.is_targetable);
    const untargetableItems = intel.meta_targeting_suggestions.filter(t => !t.is_targetable);

    expect(targetableItems.length).toBeGreaterThan(0);
    expect(untargetableItems.length).toBeGreaterThan(0);

    // Targetable items must have verification source
    for (const item of targetableItems) {
      expect(item.validation_source).toBeDefined();
      if (item.meta_interest_id) {
        expect(item.meta_interest_id).toMatch(/^\d+$/);
      }
    }

    // Untargetable items must be marked for ad copy / search only
    for (const item of untargetableItems) {
      expect(item.type).toBe('ad_copy_keyword_only');
      expect(item.is_targetable).toBe(false);
      expect(item.validation_source).toContain('Untargetable');
    }
  });

  it('validates targeting terms through targeting registry API', async () => {
    const terms = ['Skin care', 'Cosmetics', 'Untargetable long tail query term'];
    const validated = await api.validateTargetingKeywords(terms);
    expect(validated.length).toBeGreaterThan(0);

    const skincare = validated.find(v => v.name.toLowerCase().includes('skin care'));
    expect(skincare).toBeDefined();
    expect(skincare?.is_targetable).toBe(true);
  });

  it('evaluates industry policy compliance and special ad categories', async () => {
    const res = await api.generateComprehensiveStrategy({
      client_id: 'cli_lumina_glow',
      industry: 'DTC Skincare & Beauty',
      budget_amount: 20000.0,
      product_service: 'Anti-aging Nectar',
      customer_profile: 'Women'
    });

    const compliance = res.policy_compliance;
    expect(compliance).toBeDefined();
    expect(compliance.compliance_score).toBeGreaterThanOrEqual(50);
    expect(compliance.compliance_score).toBeLessThanOrEqual(100);
    expect(compliance.policy_warnings).toBeDefined();
    expect(compliance.recommended_disclosures.length).toBeGreaterThanOrEqual(1);
  });

  it('supports selecting and saving strategies into history', async () => {
    const saved = await api.saveStrategy({
      client_id: 'cli_lumina_glow',
      comprehensive_strategy_id: 'strat_test_123',
      selected_tier: 'balanced',
      notes: 'Test client saved strategy'
    });

    expect(saved.id).toBeDefined();
    expect(saved.selected_tier).toBe('balanced');
    expect(saved.strategy_plan).toBeDefined();

    const history = await api.getSavedStrategies('cli_lumina_glow');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].client_id).toBe('cli_lumina_glow');
  });

  it('guarantees zero invented benchmarks and complies with truth-in-advertising', async () => {
    const res = await api.generateComprehensiveStrategy({
      client_id: 'cli_lumina_glow',
      industry: 'DTC Skincare',
      budget_amount: 10000.0,
      product_service: 'Cream',
      customer_profile: 'Buyers'
    });

    expect(res.zero_guarantee_compliance_notice).toContain('COMPLIANCE NOTICE');
    expect(res.zero_guarantee_compliance_notice).toContain('No performance results or revenue amounts are guaranteed');

    for (const tier of ['conservative', 'balanced', 'experimental'] as const) {
      const plan = res.strategies[tier];
      expect(plan.kpis.benchmarking_disclaimer).toContain('not guaranteed performance');
    }
  });
});
