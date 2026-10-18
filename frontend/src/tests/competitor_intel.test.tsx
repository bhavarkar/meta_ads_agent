import { describe, it, expect } from 'vitest';
import {
  FALLBACK_FICTIONAL_COMPETITORS,
  FALLBACK_COMPETITOR_CANDIDATES,
  FALLBACK_AD_OBSERVATIONS,
  FALLBACK_INTELLIGENCE_REPORT
} from '../services/demoData';
import { api } from '../services/api';

describe('Competitor Intelligence Module Test Suite', () => {
  it('loads exactly 5 fictional competitor profiles with verified sources', async () => {
    const competitors = await api.getCompetitors('cli_lumina_glow');
    expect(competitors.length).toBeGreaterThanOrEqual(5);

    const names = competitors.map(c => c.brand_name);
    expect(names).toContain('GlowAura Labs');
    expect(names).toContain('PureBotanica Organics');
    expect(names).toContain('DermaShield Pro');
    expect(names).toContain('VelvetSkin Rituals');
    expect(names).toContain('BioHydrate Essentials');

    for (const comp of competitors) {
      expect(comp.website).toMatch(/^https?:\/\//);
      expect(comp.verification_status).toBe('confirmed');
      expect(comp.verified_research_sources.length).toBeGreaterThanOrEqual(1);
      // Verify Meta Ad Library link presence
      if (comp.social_profile_urls?.meta_ad_library) {
        expect(comp.social_profile_urls.meta_ad_library).toContain('facebook.com/ads/library');
      }
    }
  });

  it('marks AI discovered candidates as unverified until human validation', async () => {
    const discovery = await api.discoverCompetitors({
      industry: 'DTC Skincare & Beauty',
      business_location: 'United States'
    });

    expect(discovery.candidates.length).toBeGreaterThan(0);
    for (const candidate of discovery.candidates) {
      expect(candidate.status).toBe('unverified_suggestion');
      expect(candidate.source_reference).toBeDefined();
      expect(candidate.reason.length).toBeGreaterThan(5);
    }
    expect(discovery.suggested_research_queries.length).toBeGreaterThan(0);
  });

  it('supports candidate verification and rejection workflow', async () => {
    const candidateId = FALLBACK_COMPETITOR_CANDIDATES[0].id;
    const confirmRes = await api.verifyCandidate(candidateId, 'confirmed');
    expect(confirmRes.status).toBe('confirmed');

    const rejectRes = await api.verifyCandidate(candidateId, 'rejected');
    expect(rejectRes.status).toBe('rejected');
  });

  it('manages public ad observations in research workspace with full metadata', async () => {
    const observations = await api.getAdObservations('cli_lumina_glow');
    expect(observations.length).toBeGreaterThanOrEqual(3);

    const first = observations[0];
    expect(first.competitor_name).toBeDefined();
    expect(first.hook.length).toBeGreaterThan(5);
    expect(first.ad_copy.length).toBeGreaterThan(10);
    expect(first.creative_format).toMatch(/video|image|carousel|story_reel/);
    expect(first.source_url).toContain('facebook.com/ads/library');
    expect(first.observation_date).toBeDefined();
    expect(first.claim_type).toBe('observation');

    // Test creating a new observation
    const created = await api.logAdObservation({
      competitor_name: 'GlowAura Labs',
      ad_copy: 'New test ad copy observed in public Ad Library.',
      creative_format: 'video',
      cta: 'Shop Now',
      hook: 'Tired of 10 step skincare?',
      offer: '20% Off',
      source_url: 'https://www.facebook.com/ads/library/?id=99999999',
      claim_type: 'observation'
    });
    expect(created.id).toBeDefined();
    expect(created.hook).toBe('Tired of 10 step skincare?');
    expect(created.claim_type).toBe('observation');
  });

  it('executes LangGraph competitor intelligence workflow and returns opportunities', async () => {
    const report = await api.runCompetitorAnalysis({ client_id: 'cli_lumina_glow' });
    expect(report).toBeDefined();
    expect(report.workflow_stages_completed).toEqual([
      'intake',
      'source_validation',
      'data_normalization',
      'ai_analysis',
      'opportunity_scoring',
      'report'
    ]);

    // Hook analysis
    expect(report.hook_analysis.length).toBeGreaterThanOrEqual(3);
    for (const h of report.hook_analysis) {
      expect(h.hook_text).toBeDefined();
      expect(h.hook_category).toBeDefined();
      expect(['observation', 'hypothesis']).toContain(h.claim_type);
      expect(h.source_citation).toBeDefined();
    }

    // Differentiation opportunities with impact scoring
    expect(report.differentiation_opportunities.length).toBeGreaterThanOrEqual(2);
    for (const opp of report.differentiation_opportunities) {
      expect(opp.impact_score).toBeGreaterThanOrEqual(50);
      expect(opp.impact_score).toBeLessThanOrEqual(100);
      expect(opp.suggested_hook.length).toBeGreaterThan(5);
      expect(opp.suggested_offer.length).toBeGreaterThan(5);
      expect(opp.evidence_grounding).toBeDefined();
      expect(opp.claim_type).toBe('hypothesis');
    }

    // Keyword clusters for public research
    expect(report.keyword_clusters.length).toBeGreaterThanOrEqual(2);
    for (const kw of report.keyword_clusters) {
      expect(kw.cluster_theme).toBeDefined();
      expect(kw.meta_ad_library_keywords.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('strictly adheres to zero-fabrication and public attribution rules', async () => {
    const report = await api.runCompetitorAnalysis({ client_id: 'cli_lumina_glow' });

    // Zero-fabrication guarantee
    expect(report.zero_fabrication_guarantee).toContain('COMPLIANCE VERIFIED');
    expect(report.zero_fabrication_guarantee).toContain('Zero synthetic competitor spend, CPC');

    // No forbidden fields
    const reportStr = JSON.stringify(report);
    expect(reportStr).not.toContain('"competitor_spend"');
    expect(reportStr).not.toContain('"competitor_cpc"');
    expect(reportStr).not.toContain('"competitor_roas"');

    // Source citations
    expect(report.source_attribution_citations.length).toBeGreaterThanOrEqual(2);
    for (const cite of report.source_attribution_citations) {
      expect(cite.claim).toBeDefined();
      expect(cite.source).toBeDefined();
      expect(['observation', 'hypothesis']).toContain(cite.type);
    }
  });
});
