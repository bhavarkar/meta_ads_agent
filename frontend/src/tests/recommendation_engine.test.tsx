import { describe, it, expect } from 'vitest';
import { api } from '../services/api';
import { FALLBACK_RECOMMENDATIONS } from '../services/demoData';

describe('MetaPilot AI Marketing Expert Recommendation Engine Frontend Suite', () => {
  it('retrieves exactly five prioritized recommendations via LangGraph engine', async () => {
    const data = await api.getRecommendations('cli_lumina_glow');
    expect(data.recommendations).toBeDefined();
    expect(data.recommendations.length).toBe(5);

    const priorities = data.recommendations.map(r => r.priority);
    expect(priorities).toEqual([1, 2, 3, 4, 5]);

    // Verify 8-step LangGraph workflow logs
    expect(data.workflow_execution_logs).toBeDefined();
    expect(data.workflow_execution_logs?.length).toBe(8);
  });

  it('validates recommendation structure including causal mechanism and uncertainty estimates', async () => {
    const data = await api.getRecommendations('cli_lumina_glow');

    for (const rec of data.recommendations) {
      // Title
      expect(rec.title.length).toBeGreaterThan(5);

      // Problem identified
      expect(rec.problem_identified.length).toBeGreaterThan(15);

      // Supporting evidence list
      expect(rec.supporting_evidence.length).toBeGreaterThanOrEqual(1);

      // Recommended action
      expect(rec.recommended_action.length).toBeGreaterThan(10);

      // Expected mechanism of improvement (causality over correlation)
      expect(rec.expected_mechanism.length).toBeGreaterThan(20);

      // Impact estimate with uncertainty
      expect(rec.impact_estimate).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(rec.impact_estimate?.uncertainty_rating);
      expect(rec.impact_estimate?.rationale.toLowerCase()).toMatch(/not guaranteed|no guarantee|directional/);

      // Confidence, effort, risk
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(rec.confidence_level);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(rec.effort_required);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(rec.risk);

      // Priority score
      expect(rec.priority_score).toBeGreaterThanOrEqual(1);
      expect(rec.priority_score).toBeLessThanOrEqual(100);

      // Category belongs to marketing categories
      expect(typeof rec.category).toBe('string');
      expect(rec.category.length).toBeGreaterThan(2);

      // Approval required boolean
      expect(typeof rec.approval_required).toBe('boolean');
    }
  });

  it('enforces human approval on state-altering and budget actions', async () => {
    const data = await api.getRecommendations('cli_lumina_glow');
    const budgetRec = data.recommendations.find(r => r.category.includes('Budget') || r.action_type === 'REALLOCATE_BUDGET');
    expect(budgetRec).toBeDefined();
    expect(budgetRec?.approval_required).toBe(true);

    const creativeRec = data.recommendations.find(r => r.action_type === 'SWAP_CREATIVE');
    expect(creativeRec).toBeDefined();
    expect(creativeRec?.approval_required).toBe(true);
  });

  it('handles user feedback actions: Accept, Reject, Snooze, Mark Implemented', async () => {
    const recId = FALLBACK_RECOMMENDATIONS[0].id;
    const clientId = 'cli_lumina_glow';

    // 1. Accept
    const accepted = await api.submitRecommendationFeedback(recId, clientId, 'ACCEPTED', 'Approved for rollout');
    expect(accepted.status).toBe('ACCEPTED');

    // 2. Reject
    const rejected = await api.submitRecommendationFeedback(recId, clientId, 'REJECTED', 'Dismissed');
    expect(rejected.status).toBe('REJECTED');

    // 3. Snooze
    const snoozed = await api.submitRecommendationFeedback(recId, clientId, 'SNOOZED', 'Snooze 48h');
    expect(snoozed.status).toBe('SNOOZED');

    // 4. Mark Implemented
    const implemented = await api.submitRecommendationFeedback(recId, clientId, 'IMPLEMENTED', 'Implemented externally');
    expect(implemented.status).toBe('IMPLEMENTED');
  });

  it('converts an authorized recommendation into a separate campaign approval request', async () => {
    const recId = 'rec_bg_alloc_02';
    const clientId = 'cli_lumina_glow';

    const converted = await api.convertRecommendationToApproval(recId, clientId, 'Authorize Reels budget shift');
    expect(converted.status).toBe('ACCEPTED');
    expect(converted.approval_request_id).toBeDefined();
    expect(converted.approval_request_id).toContain('appr_rec_');
  });

  it('provides evidence attribution links pointing to verified sources', async () => {
    const data = await api.getRecommendations('cli_lumina_glow');
    const withLinks = data.recommendations.filter(r => r.evidence_links && r.evidence_links.length > 0);
    expect(withLinks.length).toBeGreaterThan(0);

    const firstLink = withLinks[0].evidence_links?.[0];
    expect(firstLink?.title).toBeDefined();
    expect(firstLink?.url).toBeDefined();
    expect(firstLink?.url.length).toBeGreaterThan(0);
  });
});
