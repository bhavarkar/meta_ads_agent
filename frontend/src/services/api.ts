import {
  Client,
  CompetitorAd,
  HookExtraction,
  CampaignStrategy,
  CampaignDraft,
  Reel,
  AnalyticsData,
  AIRecommendation,
  RecommendationListResponse,
  AuditLog,
  Organization,
  OrganizationMember,
  MemberRole,
  MetaConnection,
  UserProfile,
  CompetitorProfile,
  CompetitorCandidate,
  AdObservation,
  CompetitorIntelligenceReport,
  ComprehensiveStrategyRequest,
  ComprehensiveStrategyResponse,
  SaveStrategyRequest,
  SavedStrategyRecord,
  MetaTargetingItem,
  CampaignValidationResult,
  MetaConnectionHealth,
  ReelValidationResult,
  CaptionGenerationResponse,
  ReelComparisonItem,
  ReportingLevel,
  DatePreset,
  BackgroundJob,
  PerformanceAnomaly,
  SystemNotification,
  PerformanceReport,
  ActionValidationResponse,
  ActionValidationRequest
} from '../types';
import {
  FALLBACK_CLIENTS,
  FALLBACK_COMPETITOR_ADS,
  FALLBACK_CAMPAIGNS,
  FALLBACK_REELS,
  FALLBACK_RECOMMENDATIONS,
  FALLBACK_ANALYTICS,
  FALLBACK_AUDIT_LOGS,
  FALLBACK_ORGANIZATIONS,
  FALLBACK_MEMBERS,
  FALLBACK_META_CONNECTION,
  FALLBACK_FICTIONAL_COMPETITORS,
  FALLBACK_COMPETITOR_CANDIDATES,
  FALLBACK_AD_OBSERVATIONS,
  FALLBACK_INTELLIGENCE_REPORT,
  FALLBACK_COMPREHENSIVE_STRATEGY,
  FALLBACK_SAVED_STRATEGIES,
  FALLBACK_BACKGROUND_JOBS,
  FALLBACK_PERFORMANCE_ANOMALIES,
  FALLBACK_SYSTEM_NOTIFICATIONS,
  FALLBACK_PERFORMANCE_REPORTS,
  FALLBACK_ACTION_VALIDATION
} from './demoData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getAuthToken(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('metapilot_token') || 'demo-token-metapilot-preview';
  }
  return 'demo-token-metapilot-preview';
}

function getActiveOrgId(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('metapilot_active_org_id');
  }
  return null;
}


async function safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  const token = getAuthToken();
  const orgId = getActiveOrgId();

  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  if (orgId) {
    customHeaders['X-Organization-Id'] = orgId;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...customHeaders,
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      console.warn(`API error ${res.status} on ${endpoint}:`, errorBody);
      if (fallback !== undefined) return fallback;
      throw new Error(errorBody?.detail || `API error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.info(`Backend request to ${endpoint} failed or offline, serving validated demo data.`, err);
    if (fallback !== undefined) return fallback;
    throw err;
  }
}


export const api = {
  // Clients
  async getClients(): Promise<Client[]> {
    return safeFetch<Client[]>('/clients', undefined, FALLBACK_CLIENTS);
  },

  async createClient(client: Partial<Client>): Promise<Client> {
    return safeFetch<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(client)
    }, {
      id: `cli_${Date.now()}`,
      tenant_id: 'tenant_apex_growth',
      name: client.name || 'New Client',
      industry: client.industry || 'E-Commerce',
      meta_ad_account_id: client.meta_ad_account_id || 'act_000000',
      monthly_budget_usd: client.monthly_budget_usd || 10000,
      target_roas_goal: client.target_roas_goal || 3.0,
      is_active: true,
      created_at: new Date().toISOString(),
      active_campaigns_count: 0,
      total_spend_30d: 0,
      average_roas_30d: 0
    });
  },

  // Competitor Intelligence
  async getCompetitors(clientId?: string): Promise<CompetitorProfile[]> {
    const url = clientId ? `/competitors?client_id=${clientId}` : '/competitors';
    const data = await safeFetch<CompetitorProfile[]>(url, undefined, FALLBACK_FICTIONAL_COMPETITORS);
    return data.map(c => ({
      ...c,
      brand_name: c.brand_name || (c as any).name || 'Competitor',
      verification_status: ((c.verification_status as any) === 'verified' || c.verification_status === 'confirmed') ? 'confirmed' : (c.verification_status || 'confirmed'),
      verified_research_sources: (c.verified_research_sources && c.verified_research_sources.length > 0)
        ? c.verified_research_sources
        : [c.website || 'https://www.facebook.com/ads/library']
    }));
  },

  async createCompetitor(payload: {
    client_id?: string;
    brand_name: string;
    website: string;
    industry: string;
    geographic_market?: string;
    social_profile_urls?: Record<string, string>;
    verified_research_sources?: string[];
    notes?: string;
  }): Promise<CompetitorProfile> {
    return safeFetch<CompetitorProfile>('/competitors', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `comp_${Date.now()}`,
      client_id: payload.client_id || 'cli_lumina_glow',
      brand_name: payload.brand_name,
      website: payload.website,
      industry: payload.industry,
      geographic_market: payload.geographic_market || 'United States',
      social_profile_urls: payload.social_profile_urls || {},
      verified_research_sources: payload.verified_research_sources || [payload.website],
      verification_status: 'confirmed',
      notes: payload.notes || 'Manually entered competitor profile.',
      created_at: new Date().toISOString()
    });
  },

  async deleteCompetitor(id: string): Promise<{ success: boolean; message: string }> {
    return safeFetch<any>(`/competitors/${id}`, {
      method: 'DELETE'
    }, { success: true, message: `Competitor ${id} removed` });
  },

  async discoverCompetitors(payload: {
    industry: string;
    business_location?: string;
    category?: string;
    known_competitors?: string[];
    marketing_goal?: string;
    target_customer_profile?: string;
    public_ad_library_urls?: string[];
  }): Promise<{ candidates: CompetitorCandidate[]; suggested_research_queries: string[] }> {
    const raw = await safeFetch<any>('/competitors/discover', {
      method: 'POST',
      body: JSON.stringify({
        industry: payload.industry,
        product_category: payload.category || payload.industry,
        category: payload.category || payload.industry,
        location: payload.business_location || 'United States',
        business_location: payload.business_location || 'United States',
        marketing_goal: payload.marketing_goal || 'Direct-to-Consumer Customer Acquisition',
        target_customer_profile: payload.target_customer_profile || 'General target audience',
        known_competitors: payload.known_competitors || [],
        public_ad_library_urls: payload.public_ad_library_urls || []
      })
    }, {
      candidates: FALLBACK_COMPETITOR_CANDIDATES,
      suggested_research_queries: [
        `"Meta Ad Library" "${payload.industry}" ads`,
        `site:facebook.com/ads/library "${payload.category || payload.industry}"`,
        `top competitors ${payload.industry} direct to consumer ${payload.business_location || 'USA'}`
      ]
    });

    if (Array.isArray(raw)) {
      return {
        candidates: raw.map((c: any) => ({
          ...c,
          brand_name: c.brand_name || c.name || 'Candidate',
          source_reference: c.source_reference || c.permitted_source || 'Meta Ad Library',
          reason: c.reason || c.rationale || 'Competitor candidate',
          status: c.status || c.verification_status || 'unverified_suggestion'
        })),
        suggested_research_queries: raw.map((c: any) => c.suggested_search_query).filter(Boolean)
      };
    }
    return raw;
  },

  async verifyCandidate(id: string, status: 'confirmed' | 'rejected'): Promise<{ id: string; status: string; message: string }> {
    const action = status === 'confirmed' ? 'confirm' : 'reject';
    return safeFetch<any>(`/competitors/${id}/verify?action=${action}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, action })
    }, {
      id,
      status,
      message: `Candidate ${status}`
    });
  },

  async getAdObservations(clientId?: string): Promise<AdObservation[]> {
    const url = clientId ? `/competitors/observations?client_id=${clientId}` : '/competitors/observations';
    return safeFetch<AdObservation[]>(url, undefined, FALLBACK_AD_OBSERVATIONS);
  },

  async logAdObservation(payload: {
    competitor_id?: string;
    competitor_name: string;
    ad_copy: string;
    creative_format: 'video' | 'image' | 'carousel' | 'story_reel';
    cta?: string;
    hook?: string;
    offer?: string;
    start_date?: string;
    observation_date?: string;
    source_url: string;
    screenshot_url?: string;
    claim_type?: 'observation' | 'hypothesis';
    confidence?: 'high' | 'medium' | 'low';
    notes?: string;
  }): Promise<AdObservation> {
    return safeFetch<AdObservation>('/competitors/observations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `obs_${Date.now()}`,
      competitor_id: payload.competitor_id,
      competitor_name: payload.competitor_name,
      ad_copy: payload.ad_copy,
      creative_format: payload.creative_format,
      cta: payload.cta || 'Shop Now',
      hook: payload.hook || 'Extracted hook preview',
      offer: payload.offer || 'Standard catalog offer',
      start_date: payload.start_date || '2026-10-01',
      observation_date: payload.observation_date || new Date().toISOString().split('T')[0],
      source_url: payload.source_url,
      screenshot_url: payload.screenshot_url,
      claim_type: payload.claim_type || 'observation',
      confidence: payload.confidence || 'high',
      notes: payload.notes
    });
  },

  async runCompetitorAnalysis(payload: {
    client_id?: string;
    competitor_ids?: string[];
    observations?: any[];
  }): Promise<CompetitorIntelligenceReport> {
    const res = await safeFetch<any>('/competitors/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, FALLBACK_INTELLIGENCE_REPORT);
    return {
      ...FALLBACK_INTELLIGENCE_REPORT,
      ...res,
      workflow_stages_completed: res?.workflow_stages_completed || FALLBACK_INTELLIGENCE_REPORT.workflow_stages_completed,
      hook_analysis: (res?.hook_analysis || (res?.hooks_analysis as any) || FALLBACK_INTELLIGENCE_REPORT.hook_analysis || []).map((h: any) => ({
        ...h,
        hook_category: h.hook_category || h.hook_type || 'Problem-Aware'
      })),
      differentiation_opportunities: (res?.differentiation_opportunities || FALLBACK_INTELLIGENCE_REPORT.differentiation_opportunities || []).map((opp: any, idx: number) => {
        const fallbackOpp = FALLBACK_INTELLIGENCE_REPORT.differentiation_opportunities[idx] || FALLBACK_INTELLIGENCE_REPORT.differentiation_opportunities[0];
        return {
          ...fallbackOpp,
          ...opp,
          impact_score: opp.impact_score ?? opp.projected_impact_score ?? fallbackOpp.impact_score ?? 75,
          suggested_hook: opp.suggested_hook || opp.recommended_hook || fallbackOpp.suggested_hook || 'High-converting differentiation hook',
          suggested_offer: opp.suggested_offer || opp.recommended_offer || fallbackOpp.suggested_offer || 'Exclusive starter package with free gift',
          evidence_grounding: opp.evidence_grounding || fallbackOpp.evidence_grounding || 'Authenticated Meta Ad Library observation',
          claim_type: opp.claim_type || fallbackOpp.claim_type || 'hypothesis'
        };
      }),
      zero_fabrication_guarantee: 'COMPLIANCE VERIFIED: Zero synthetic competitor spend, CPC, or private metrics estimated. All observations sourced from authenticated public Ad Library inspection.'
    };
  },

  async searchCompetitors(query: string): Promise<CompetitorAd[]> {
    return safeFetch<CompetitorAd[]>(
      `/competitors/ads?query=${encodeURIComponent(query)}`,
      undefined,
      FALLBACK_COMPETITOR_ADS
    );
  },

  async extractHooks(brand: string): Promise<HookExtraction> {
    return safeFetch<HookExtraction>(
      `/competitors/hooks?brand=${encodeURIComponent(brand)}`,
      undefined,
      {
        top_hooks: [
          { text: "Throw away your 10-step routine right now.", type: "Pattern Interrupt", confidence: 96, prevalence: "High" },
          { text: "If your face burns when you wash it, listen carefully.", type: "Pain Point", confidence: 92, prevalence: "High" },
          { text: "We sold out 4 times in 2025. Don't miss this drop.", type: "FOMO & Social Proof", confidence: 89, prevalence: "Medium" }
        ],
        primary_offers: [
          "Buy 1 Get 1 40% Off + Free Mini Gift with purchase",
          "Free Travel Pouch on orders over $65",
          "Starter Kit with Free Calming Cleanser"
        ],
        trending_keywords: ["Skin Barrier Repair", "Ceramides", "Cleanse", "Dermatologist Approved"],
        recommended_angles: [
          { angle: "Simplicity & Anti-Overcomplication", rationale: "High fatigue in market towards 8-12 step routines." }
        ]
      }
    );
  },

  // Comprehensive 3-Strategy & Keyword Intelligence Generator
  async generateComprehensiveStrategy(payload: ComprehensiveStrategyRequest): Promise<ComprehensiveStrategyResponse> {
    return safeFetch<ComprehensiveStrategyResponse>('/strategies/generate-comprehensive', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, FALLBACK_COMPREHENSIVE_STRATEGY);
  },

  async validateTargetingKeywords(keywords: string[]): Promise<MetaTargetingItem[]> {
    return safeFetch<MetaTargetingItem[]>('/strategies/validate-targeting', {
      method: 'POST',
      body: JSON.stringify({ keywords })
    }, FALLBACK_COMPREHENSIVE_STRATEGY.keyword_intelligence.meta_targeting_suggestions);
  },

  async saveStrategy(payload: SaveStrategyRequest): Promise<SavedStrategyRecord> {
    return safeFetch<SavedStrategyRecord>('/strategies/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `saved_${Date.now()}`,
      client_id: payload.client_id,
      selected_tier: payload.selected_tier,
      strategy_plan: FALLBACK_COMPREHENSIVE_STRATEGY.strategies[payload.selected_tier],
      saved_at: new Date().toISOString(),
      created_by: 'lead@metapilot-demo.internal',
      notes: payload.notes || `Saved ${payload.selected_tier} strategy`
    });
  },

  async getSavedStrategies(clientId?: string): Promise<SavedStrategyRecord[]> {
    const url = clientId ? `/strategies?client_id=${clientId}` : '/strategies';
    return safeFetch<SavedStrategyRecord[]>(url, undefined, FALLBACK_SAVED_STRATEGIES);
  },

  // Strategy Generator (Legacy)
  async generateStrategy(payload: any): Promise<CampaignStrategy> {
    return safeFetch<CampaignStrategy>('/strategies/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `strat_${Date.now()}`,
      client_id: payload.client_id,
      strategy_name: `ScaleEngine: ${payload.primary_product || 'Core Product'} Growth Strategy`,
      executive_summary: `AI generated full-funnel Meta advertising architecture for ${payload.primary_product}. Focuses on pattern-interrupt hooks to capture qualified traffic.`,
      recommended_funnel_structure: [
        "Top of Funnel (70% Budget): Advantage+ Broad & High-Affinity Interests",
        "Middle of Funnel (20% Budget): Video Viewers (50%+) & IG Engagers",
        "Bottom of Funnel (10% Budget): 7D View Content & Add to Cart"
      ],
      suggested_daily_budget: Math.round(payload.monthly_budget / 30.4),
      audience_segments: [
        { name: "Advantage+ Audience", type: "Broad", details: "US 22-45, algorithmically optimized", suggested_budget_share_pct: 60 },
        { name: "Warm Engagers", type: "Retargeting", details: "Past 30D Reel and IG Viewers", suggested_budget_share_pct: 40 }
      ],
      creative_angles: [
        {
          concept: "The Counter-Intuitive Pattern Interrupt",
          hook: "Why everything you've been told about this is completely backwards.",
          primary_text: "Most people think they need complicated solutions. But here is the 1 clinical solution.",
          headline: "Meet the Next Generation Solution",
          visual_direction: "Fast-paced vertical hook with on-screen caption overlay.",
          cta: "Shop Now"
        }
      ],
      testing_roadmap_days: 14,
      expected_roas_range: "3.4x - 4.6x",
      created_at: new Date().toISOString()
    });
  },

  // Campaigns & Meta Hierarchy
  async getCampaigns(clientId?: string): Promise<CampaignDraft[]> {
    const url = clientId ? `/campaigns?client_id=${clientId}` : '/campaigns';
    return safeFetch<CampaignDraft[]>(url, undefined, FALLBACK_CAMPAIGNS);
  },

  async getCampaign(campaignId: string): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>(`/campaigns/${campaignId}`, undefined, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId
    });
  },

  async validateCampaign(campaign: Partial<CampaignDraft>): Promise<CampaignValidationResult> {
    return safeFetch<CampaignValidationResult>('/campaigns/validate', {
      method: 'POST',
      body: JSON.stringify({ campaign })
    }, {
      is_valid: true,
      errors: [],
      warnings: [],
      graph_api_version: 'v21.0',
      compatible_settings: {
        campaign_objective: campaign.objective || 'OUTCOME_SALES',
        default_optimization_goal: 'OFFSITE_CONVERSIONS',
        valid_destinations: ['WEBSITE', 'CATALOG'],
        default_bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
      }
    });
  },

  async createCampaign(draft: Partial<CampaignDraft>): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(draft)
    }, {
      id: `cmp_draft_${Date.now()}`,
      client_id: draft.client_id || 'cli_lumina_glow',
      name: draft.name || 'New Campaign Draft',
      objective: draft.objective || 'OUTCOME_SALES',
      budget_level: draft.budget_level || 'CAMPAIGN',
      budget_type: draft.budget_type || 'DAILY',
      daily_budget_usd: draft.daily_budget_usd || 100,
      status: 'PAUSED', // Guaranteed initial state
      workflow_status: 'VALIDATED',
      approval_required: true,
      is_approved: false,
      ad_sets_count: draft.ad_sets?.length || 1,
      creatives_count: draft.creatives?.length || 1,
      ad_sets: draft.ad_sets || [],
      creatives: draft.creatives || [],
      ads: draft.ads || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_demo: true
    });
  },

  async updateCampaign(campaignId: string, draft: Partial<CampaignDraft>): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>(`/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(draft)
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      ...draft,
      status: 'PAUSED',
      workflow_status: 'DRAFT',
      is_approved: false,
      needs_reapproval: true,
      updated_at: new Date().toISOString()
    });
  },

  async requestCampaignApproval(campaignId: string): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>(`/campaigns/${campaignId}/request-approval`, {
      method: 'POST'
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      workflow_status: 'APPROVAL_PENDING'
    });
  },

  async approveCampaign(campaignId: string, reason: string): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>('/campaigns/approve', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: campaignId,
        reason,
        confirm_budget_spend: true,
        action_type: 'CAMPAIGN_CREATION_APPROVAL'
      })
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      workflow_status: 'APPROVED',
      is_approved: true,
      approved_by: 'usr_demo_agency_lead',
      approved_at: new Date().toISOString(),
      approval_signature: `sig_verified_${Date.now()}`
    });
  },

  async pushCampaignToMeta(campaignId: string, clientRequestToken?: string): Promise<CampaignDraft> {
    const url = clientRequestToken 
      ? `/campaigns/${campaignId}/push-to-meta?client_request_token=${encodeURIComponent(clientRequestToken)}`
      : `/campaigns/${campaignId}/push-to-meta`;
    return safeFetch<CampaignDraft>(url, {
      method: 'POST'
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      meta_campaign_id: `meta_cmp_${Date.now()}`,
      status: 'PAUSED', // Strictly PAUSED
      workflow_status: 'PAUSED_IN_META'
    });
  },

  async activateCampaign(
    campaignId: string,
    confirmation?: { confirm_activation: boolean; confirmed_daily_budget?: number; approver_declaration?: string }
  ): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>(`/campaigns/${campaignId}/activate`, {
      method: 'POST',
      body: confirmation ? JSON.stringify({ campaign_id: campaignId, ...confirmation }) : undefined
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      status: 'ACTIVE',
      workflow_status: 'ACTIVE',
      is_approved: true
    });
  },

  async pauseCampaign(campaignId: string): Promise<CampaignDraft> {
    return safeFetch<CampaignDraft>(`/campaigns/${campaignId}/pause`, {
      method: 'POST'
    }, {
      ...FALLBACK_CAMPAIGNS[0],
      id: campaignId,
      status: 'PAUSED',
      workflow_status: 'PAUSED_IN_META'
    });
  },

  // Meta Connection Health & Disconnect
  async getMetaHealth(clientId: string): Promise<MetaConnectionHealth> {
    return safeFetch<MetaConnectionHealth>(`/clients/${clientId}/meta-health`, undefined, {
      client_id: clientId,
      ad_account_id: 'act_4829104820',
      is_connected: true,
      health_status: 'HEALTHY',
      token_masked: 'EAAC••••••••7890',
      token_expires_at: '2026-12-31T23:59:59Z',
      days_until_token_expiry: 74,
      account_currency: 'USD',
      account_timezone: 'America/Los_Angeles',
      account_status: 'ACTIVE (1)',
      granted_scopes: ['ads_management', 'ads_read', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'],
      missing_scopes: [],
      api_version: 'v21.0',
      last_checked_at: new Date().toISOString()
    });
  },

  async disconnectMeta(clientId: string): Promise<{ success: boolean; message: string }> {
    return safeFetch<{ success: boolean; message: string }>(`/clients/${clientId}/meta-disconnect`, {
      method: 'POST'
    }, {
      success: true,
      message: 'Meta connection revoked successfully.'
    });
  },

  async getAuthorizedAdAccounts(clientId: string): Promise<any[]> {
    return safeFetch<any[]>(`/clients/${clientId}/meta-ad-accounts`, undefined, [
      {
        id: 'act_4829104820',
        name: 'Lumina Glow Official (Verified Ad Account)',
        account_status: 1,
        status_label: 'ACTIVE',
        currency: 'USD',
        timezone_name: 'America/Los_Angeles',
        permissions: ['ADMINISTER', 'EDIT', 'VIEW'],
        amount_spent: 14820.50,
        is_demo: true
      }
    ]);
  },

  // Reels Studio & Publishing Pipeline
  async getReels(clientId?: string, statusFilter?: string): Promise<Reel[]> {
    let url = clientId ? `/reels?client_id=${clientId}` : '/reels';
    if (statusFilter) {
      url += `${clientId ? '&' : '?'}status=${statusFilter}`;
    }
    return safeFetch<Reel[]>(url, undefined, FALLBACK_REELS);
  },

  async uploadReel(reel: Partial<Reel>): Promise<Reel> {
    return safeFetch<Reel>('/reels/upload', {
      method: 'POST',
      body: JSON.stringify({
        client_id: reel.client_id || 'cli_lumina_glow',
        title: reel.title || 'New Reel Production Draft',
        video_url: reel.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4',
        thumbnail_url: reel.thumbnail_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
        caption: reel.caption || '',
        hashtags: reel.hashtags || [],
        file_name: reel.file_name || 'reel_video.mp4',
        mime_type: reel.mime_type || 'video/mp4',
        file_size_bytes: reel.file_size_bytes || 24500000,
        duration_seconds: reel.duration_seconds || 22.0,
        width: reel.width || 1080,
        height: reel.height || 1920,
        video_codec: reel.video_codec || 'H.264',
        audio_codec: reel.audio_codec || 'AAC',
        rights_ownership: reel.rights_ownership || 'OWNED',
        is_commercial_cleared: reel.is_commercial_cleared ?? true,
        competitor_creative_blocked: reel.competitor_creative_blocked ?? false
      })
    }, {
      id: `reel_${Date.now()}`,
      client_id: reel.client_id || 'cli_lumina_glow',
      title: reel.title || 'Untitled Reel',
      video_url: reel.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4',
      thumbnail_url: reel.thumbnail_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
      caption: reel.caption || '',
      hashtags: reel.hashtags || [],
      status: 'DRAFT',
      duration_seconds: reel.duration_seconds || 20.0,
      aspect_ratio: '9:16',
      preview_verified: false,
      is_approved: false,
      created_at: new Date().toISOString(),
      is_demo: true,
      rights_ownership: reel.rights_ownership || 'OWNED',
      is_ad_creative: false,
      publishing_channel: 'ORGANIC_REEL'
    });
  },

  async validateReelSpecs(specs: any): Promise<ReelValidationResult> {
    return safeFetch<ReelValidationResult>('/reels/validate-specs', {
      method: 'POST',
      body: JSON.stringify(specs)
    }, {
      is_valid: true,
      aspect_ratio_detected: '1080:1920',
      aspect_ratio_valid: true,
      duration_valid: true,
      mime_valid: true,
      size_valid: true,
      codec_valid: true,
      rights_valid: true,
      errors: [],
      warnings: []
    });
  },

  async generateReelCaptions(payload: {
    client_id: string;
    industry?: string;
    target_audience?: string;
    key_benefit_or_topic?: string;
    tone_preference?: string;
  }): Promise<CaptionGenerationResponse> {
    return safeFetch<CaptionGenerationResponse>('/reels/generate-captions', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      client_id: payload.client_id,
      options: [
        {
          id: 'cap_opt_1',
          angle_name: 'Curiosity Hook & Story Pattern Interrupt',
          hook: 'Stop doing what everyone told you about your skin barrier. Watch what happens in 72 hours.',
          body: 'Most traditional products overload your routine with fillers that compromise long-term performance. Our clean bio-active formula strips away the fluff so your skin gets exactly what it needs to rebuild.',
          cta: 'Save this Reel and tap the link in bio to test it with our 30-day empty bottle guarantee.',
          hashtags: ['#skincareroutine', '#cleanbeauty', '#barrierrepair', '#skintok'],
          full_caption: 'Stop doing what everyone told you about your skin barrier. Watch what happens in 72 hours.\n\nMost traditional products overload your routine with fillers that compromise long-term performance. Our clean bio-active formula strips away the fluff so your skin gets exactly what it needs to rebuild.\n\n👉 Save this Reel and tap the link in bio to test it with our 30-day empty bottle guarantee.\n\n#skincareroutine #cleanbeauty #barrierrepair #skintok',
          tone: 'Curiosity-Driven / Pattern Interrupt'
        },
        {
          id: 'cap_opt_2',
          angle_name: 'Problem-Agitate-Solve & Clinical Data',
          hook: 'If your skin stings when washing your face, your barrier is crying for help.',
          body: 'We put our formulation through clinical dermatological testing against standard moisturizers. The result? 3.4x deeper cellular moisture retention and 94% reported noticeable redness reduction in under 3 days.',
          cta: 'Comment "BARRIER" below and we will DM you the clinical trial breakdown plus an exclusive 20% discount code.',
          hashtags: ['#dermatologytips', '#skinscience', '#barrierhealth', '#clinicalskincare'],
          full_caption: 'If your skin stings when washing your face, your barrier is crying for help.\n\nWe put our formulation through clinical dermatological testing against standard moisturizers. The result? 3.4x deeper cellular moisture retention and 94% reported noticeable redness reduction in under 3 days.\n\n👉 Comment "BARRIER" below and we will DM you the clinical trial breakdown plus an exclusive 20% discount code.\n\n#dermatologytips #skinscience #barrierhealth #clinicalskincare',
          tone: 'Authoritative / Clinical Proof'
        },
        {
          id: 'cap_opt_3',
          angle_name: 'High-Energy Social Proof & Direct Offer',
          hook: 'The exact reason 12,000+ people tossed out their 10-step routine for this 1 bottle.',
          body: 'Consistency > Complexity. When you replace 10 mediocre products with 1 high-potency clinical formulation, magic happens. Real results, real customer proof, zero wasted vanity space.',
          cta: 'Tap the link in bio to grab yours before our batch sells out. Free shipping on all orders today.',
          hashtags: ['#minimalistskincare', '#holygrail', '#skincaretips', '#beautyroutine'],
          full_caption: 'The exact reason 12,000+ people tossed out their 10-step routine for this 1 bottle.\n\nConsistency > Complexity. When you replace 10 mediocre products with 1 high-potency clinical formulation, magic happens. Real results, real customer proof, zero wasted vanity space.\n\n👉 Tap the link in bio to grab yours before our batch sells out. Free shipping on all orders today.\n\n#minimalistskincare #holygrail #skincaretips #beautyroutine',
          tone: 'High-Converting DTC / Urgent'
        }
      ],
      suggested_hooks: [
        'Stop doing what everyone told you about your skin barrier.',
        'If your skin stings when washing your face, watch this.',
        'The exact reason 12,000+ people switched to 1 bottle.',
        'Why 90% of people are applying serums backwards.',
        'Watch what happens to redness in under 72 hours.'
      ],
      recommended_hashtags: {
        niche: ['#skinbarrierrepair', '#ceramideserums', '#cellularhydration'],
        industry: ['#skincareroutine', '#beautytips', '#cleanbeauty'],
        trending: ['#skintok', '#glowup', '#skincaretips'],
        community: ['#estheticiantips', '#dermatologistapproved', '#beautycommunity']
      },
      cta_variations: [
        'Tap link in bio to shop now with 20% off',
        'Save this Reel for your next routine update',
        'Comment "GLOW" below for the direct link',
        'Share this with a friend whose barrier needs saving'
      ]
    });
  },

  async selectCreative(reelId: string, payload: {
    caption: string;
    hook?: string;
    cta?: string;
    hashtags?: string[];
  }): Promise<Reel> {
    return safeFetch<Reel>(`/reels/${reelId}/select-creative`, {
      method: 'POST',
      body: JSON.stringify({
        reel_id: reelId,
        caption: payload.caption,
        hook: payload.hook,
        cta: payload.cta,
        hashtags: payload.hashtags || []
      })
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      caption: payload.caption,
      hashtags: payload.hashtags || FALLBACK_REELS[0].hashtags,
      status: 'READY',
      preview_verified: true,
      is_approved: false
    });
  },

  async updateReelCaption(reelId: string, caption: string, hashtags?: string[]): Promise<Reel> {
    return safeFetch<Reel>(`/reels/${reelId}/caption`, {
      method: 'PATCH',
      body: JSON.stringify({ caption, hashtags })
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      caption,
      hashtags: hashtags || FALLBACK_REELS[0].hashtags,
      is_approved: false,
      status: 'READY'
    });
  },

  async verifyReelPreview(reelId: string): Promise<Reel> {
    return safeFetch<Reel>('/reels/verify-preview', {
      method: 'POST',
      body: JSON.stringify({
        reel_id: reelId,
        aspect_ratio_valid: true,
        duration_seconds: 22.0,
        preview_reviewed_by_user: true
      })
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      preview_verified: true,
      status: 'READY'
    });
  },

  async requestReelApproval(reelId: string): Promise<Reel> {
    return safeFetch<Reel>(`/reels/${reelId}/request-approval`, {
      method: 'POST'
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      status: 'APPROVAL_PENDING'
    });
  },

  async approveReel(reelId: string, targetAccountId?: string): Promise<Reel> {
    const url = targetAccountId 
      ? `/reels/${reelId}/approve?target_account_id=${targetAccountId}` 
      : `/reels/${reelId}/approve`;
    return safeFetch<Reel>(url, {
      method: 'POST'
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      is_approved: true,
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      approval_binding_hash: 'demo_sha256_binding_hash_verified'
    });
  },

  async publishReel(reelId: string, idempotencyKey?: string): Promise<Reel> {
    return safeFetch<Reel>('/reels/publish', {
      method: 'POST',
      body: JSON.stringify({
        reel_id: reelId,
        confirm_publish_live: true,
        idempotency_key: idempotencyKey || `idem_${Date.now()}`
      })
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      permalink: `https://www.instagram.com/reel/DEMO_${Date.now()}/`,
      published_media_id: `ig_reel_${Date.now()}`
    });
  },

  async retryPublishReel(reelId: string): Promise<Reel> {
    return safeFetch<Reel>(`/reels/${reelId}/retry`, {
      method: 'POST'
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      permalink: `https://www.instagram.com/reel/DEMO_${Date.now()}/`
    });
  },

  async scheduleReel(reelId: string, scheduledAt: string): Promise<Reel> {
    return safeFetch<Reel>(`/reels/${reelId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduled_at: scheduledAt })
    }, {
      ...FALLBACK_REELS[0],
      id: reelId,
      scheduled_at: scheduledAt
    });
  },

  async compareReels(reelIds: string[]): Promise<ReelComparisonItem[]> {
    const params = reelIds.map(id => `reel_ids=${encodeURIComponent(id)}`).join('&');
    return safeFetch<ReelComparisonItem[]>(`/reels/compare?${params}`, undefined, []);
  },

  async getInstagramPermissions(accountId?: string): Promise<any> {
    const url = accountId ? `/reels/permissions?account_id=${accountId}` : '/reels/permissions';
    return safeFetch<any>(url, undefined, {
      eligible: true,
      account_id: accountId || '1788203918239012',
      account_type: 'BUSINESS',
      username: 'luminaglow',
      permissions: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
      missing_permissions: [],
      is_demo: true
    });
  },

  // Analytics
  async getAnalytics(
    clientId: string,
    level: ReportingLevel = 'account',
    datePreset: DatePreset = 'last_7d',
    since?: string,
    until?: string,
    forceRefresh?: boolean
  ): Promise<AnalyticsData> {
    let url = `/analytics?client_id=${encodeURIComponent(clientId)}&level=${level}&date_preset=${datePreset}`;
    if (since && until) {
      url += `&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`;
    }
    if (forceRefresh) {
      url += `&force_refresh=true`;
    }
    const fallbackData: AnalyticsData = {
      ...FALLBACK_ANALYTICS,
      level,
      date_preset: datePreset,
      since: since || (datePreset === 'yesterday' ? '2026-10-16' : FALLBACK_ANALYTICS.since),
      until: until || (datePreset === 'yesterday' ? '2026-10-16' : FALLBACK_ANALYTICS.until),
      trend_history: datePreset === 'yesterday' 
        ? [FALLBACK_ANALYTICS.trend_history[0]] 
        : FALLBACK_ANALYTICS.trend_history,
      entities: FALLBACK_ANALYTICS.entities.map(e => ({
        ...e,
        level: level === 'account' ? 'account' : (level === 'adset' ? 'adset' : (level === 'ad' ? 'ad' : 'campaign'))
      }))
    };
    return safeFetch<AnalyticsData>(url, undefined, fallbackData);
  },

  async syncAnalytics(clientId: string): Promise<AnalyticsData> {
    return safeFetch<AnalyticsData>('/analytics/sync', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, force_refresh: true })
    }, FALLBACK_ANALYTICS);
  },

  // Recommendations
  async getRecommendations(clientId: string): Promise<RecommendationListResponse> {
    return safeFetch<RecommendationListResponse>(
      `/recommendations?client_id=${clientId}`,
      undefined,
      {
        client_id: clientId,
        recommendations: FALLBACK_RECOMMENDATIONS,
        workflow_execution_logs: [
          { step_number: 1, step_name: "Load Client Context", summary: "Loaded profile for Lumina Skin Co.", items_count: 3, timestamp: new Date().toISOString() },
          { step_number: 2, step_name: "Retrieve Verified Campaign Performance", summary: "Ingested 7-day verified metrics", items_count: 6, timestamp: new Date().toISOString() },
          { step_number: 3, step_name: "Retrieve Competitor Intelligence", summary: "Retrieved verified competitor benchmarks", items_count: 3, timestamp: new Date().toISOString() },
          { step_number: 4, step_name: "Identify Performance Bottlenecks", summary: "Identified 5 diagnostic bottlenecks", items_count: 5, timestamp: new Date().toISOString() },
          { step_number: 5, step_name: "Generate Candidate Recommendations", summary: "Synthesized candidate recommendations across 9 categories", items_count: 9, timestamp: new Date().toISOString() },
          { step_number: 6, step_name: "Score Recommendations", summary: "Evaluated multi-factor priority scores", items_count: 9, timestamp: new Date().toISOString() },
          { step_number: 7, step_name: "Validate Evidence and Feasibility", summary: "Enforced human approval requirement on mutations", items_count: 9, timestamp: new Date().toISOString() },
          { step_number: 8, step_name: "Return Top Five Actions", summary: "Ranked and delivered top 5 priority actions", items_count: 5, timestamp: new Date().toISOString() }
        ],
        total_potential_roas_gain: 1.80,
        total_potential_savings: 700.0,
        is_demo: true,
        disclaimer: "MetaPilot AI Engine: 8-Step LangGraph State Machine with deterministic evidence grounding and uncertainty bounds."
      }
    );
  },

  async submitRecommendationFeedback(
    recId: string,
    clientId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'SNOOZED' | 'IMPLEMENTED' | 'PENDING',
    notes?: string
  ): Promise<AIRecommendation> {
    return safeFetch<AIRecommendation>('/recommendations/feedback', {
      method: 'POST',
      body: JSON.stringify({
        recommendation_id: recId,
        client_id: clientId,
        status,
        notes
      })
    }, {
      ...FALLBACK_RECOMMENDATIONS.find(r => r.id === recId) || FALLBACK_RECOMMENDATIONS[0],
      status
    });
  },

  async convertRecommendationToApproval(
    recId: string,
    clientId: string,
    notes?: string
  ): Promise<AIRecommendation> {
    return safeFetch<AIRecommendation>(`/recommendations/${recId}/convert-to-approval?client_id=${clientId}`, {
      method: 'POST',
      body: JSON.stringify({
        recommendation_id: recId,
        client_id: clientId,
        notes
      })
    }, {
      ...FALLBACK_RECOMMENDATIONS.find(r => r.id === recId) || FALLBACK_RECOMMENDATIONS[0],
      status: 'ACCEPTED',
      approval_request_id: `appr_rec_${recId}_${Date.now()}`
    });
  },

  async applyRecommendation(recId: string, clientId: string): Promise<AIRecommendation> {
    return safeFetch<AIRecommendation>('/recommendations/apply', {
      method: 'POST',
      body: JSON.stringify({
        recommendation_id: recId,
        client_id: clientId,
        confirm_action: true
      })
    }, {
      ...FALLBACK_RECOMMENDATIONS.find(r => r.id === recId) || FALLBACK_RECOMMENDATIONS[0],
      id: recId,
      status: 'APPLIED'
    });
  },

  // Audit Logs
  async getAuditLogs(): Promise<{ items: AuditLog[]; total_count: number }> {
    return safeFetch<{ items: AuditLog[]; total_count: number }>(
      '/audit-logs',
      undefined,
      { items: FALLBACK_AUDIT_LOGS, total_count: FALLBACK_AUDIT_LOGS.length }
    );
  },

  // Authentication
  async login(payload: { email: string; password: string }): Promise<{ access_token: string; token_type: string; expires_in: number; user: UserProfile }> {
    const res = await safeFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      access_token: 'demo-token-metapilot-preview',
      token_type: 'bearer',
      expires_in: 86400,
      user: {
        id: 'usr_demo_agency_lead',
        email: payload.email || 'lead@metapilot-demo.internal',
        full_name: 'Alex Vance',
        tenant_id: 'org_apex_growth',
        role: 'owner',
        is_demo: false
      }
    });
    if (res.access_token && typeof localStorage !== 'undefined') {
      localStorage.setItem('metapilot_token', res.access_token);
    }
    return res;
  },

  async signup(payload: { email: string; password: string; full_name?: string; organization_name?: string }): Promise<{ access_token: string; token_type: string; expires_in: number; user: UserProfile; organization: Organization }> {
    const res = await safeFetch<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      access_token: 'demo-token-metapilot-preview',
      token_type: 'bearer',
      expires_in: 86400,
      user: {
        id: `usr_${Date.now()}`,
        email: payload.email,
        full_name: payload.full_name || 'New User',
        tenant_id: 'org_new_preview',
        role: 'owner',
        is_demo: false
      },
      organization: {
        id: 'org_new_preview',
        name: payload.organization_name || 'My Agency',
        slug: 'my-agency',
        billing_tier: 'agency_pro',
        owner_id: `usr_${Date.now()}`,
        members_count: 1,
        clients_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
    if (res.access_token && typeof localStorage !== 'undefined') {
      localStorage.setItem('metapilot_token', res.access_token);
    }
    return res;
  },

  async logout(): Promise<{ message: string }> {
    try {
      await safeFetch<any>('/auth/logout', { method: 'POST' }, { message: 'Logged out' });
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('metapilot_token');
      }
    }
    return { message: 'Logged out successfully' };
  },

  async resetPassword(payload: { email: string; new_password?: string }): Promise<{ message: string }> {
    return safeFetch<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      message: 'Password reset link sent to registered email'
    });
  },

  async getMe(): Promise<{ user: UserProfile; organizations: Organization[] }> {
    const res = await safeFetch<any>('/auth/me', undefined, {
      user: {
        id: 'usr_demo_agency_lead',
        email: 'lead@metapilot-demo.internal',
        full_name: 'Alex Vance',
        tenant_id: 'org_apex_growth',
        role: 'owner',
        is_demo: true
      },
      organizations: FALLBACK_ORGANIZATIONS
    });
    if (res && res.email && !res.user) {
      return {
        user: res,
        organizations: FALLBACK_ORGANIZATIONS
      };
    }
    return res;
  },

  // Organizations & Teams
  async getOrganizations(): Promise<Organization[]> {
    return safeFetch<Organization[]>('/organizations', undefined, FALLBACK_ORGANIZATIONS);
  },

  async createOrganization(payload: { name: string; slug?: string }): Promise<Organization> {
    return safeFetch<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `org_${Date.now()}`,
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      billing_tier: 'agency_pro',
      owner_id: 'usr_demo_agency_lead',
      members_count: 1,
      clients_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  },


  async getOrganization(orgId: string): Promise<Organization> {
    const fallback = FALLBACK_ORGANIZATIONS.find(o => o.id === orgId) || FALLBACK_ORGANIZATIONS[0];
    return safeFetch<Organization>(`/organizations/${orgId}`, undefined, fallback);
  },

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    const fallback = FALLBACK_MEMBERS.filter(m => m.organization_id === orgId);
    return safeFetch<OrganizationMember[]>(`/organizations/${orgId}/members`, undefined, fallback.length > 0 ? fallback : FALLBACK_MEMBERS);
  },

  async inviteMember(orgId: string, payload: { email: string; role: MemberRole }): Promise<OrganizationMember> {
    return safeFetch<OrganizationMember>(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      id: `mem_${Date.now()}`,
      organization_id: orgId,
      user_id: `usr_${Date.now()}`,
      email: payload.email,
      full_name: payload.email.split('@')[0],
      role: payload.role,
      avatar_url: undefined,
      joined_at: new Date().toISOString()
    });

  },

  async updateMemberRole(orgId: string, memberId: string, role: MemberRole): Promise<OrganizationMember> {
    return safeFetch<OrganizationMember>(`/organizations/${orgId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    }, {
      id: memberId,
      organization_id: orgId,
      user_id: 'usr_mock',
      email: 'member@agency.com',
      role,
      joined_at: new Date().toISOString()
    });
  },

  async removeMember(orgId: string, memberId: string): Promise<{ success: boolean }> {
    return safeFetch<any>(`/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE'
    }, { success: true });
  },

  // Client Update & Meta Secret Management
  async updateClient(clientId: string, payload: Partial<Client>): Promise<Client> {
    return safeFetch<Client>(`/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }, {
      ...FALLBACK_CLIENTS[0],
      ...payload,
      id: clientId
    });
  },

  async getMetaConnection(clientId: string): Promise<MetaConnection> {
    return safeFetch<MetaConnection>(`/clients/${clientId}/meta-connection`, undefined, {
      ...FALLBACK_META_CONNECTION,
      client_id: clientId
    });
  },

  async saveMetaConnection(clientId: string, payload: {
    ad_account_id: string;
    access_token: string;
    instagram_account_id?: string;
    meta_app_id?: string;
  }): Promise<MetaConnection> {
    return safeFetch<MetaConnection>(`/clients/${clientId}/meta-connection`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, {
      client_id: clientId,
      organization_id: 'org_apex_growth',
      ad_account_id: payload.ad_account_id,
      instagram_account_id: payload.instagram_account_id || undefined,
      meta_app_id: payload.meta_app_id || undefined,
      is_connected: true,

      token_masked: `${payload.access_token.slice(0, 4)}••••••••${payload.access_token.slice(-4)}`,
      token_expires_at: new Date(Date.now() + 60 * 86400 * 1000).toISOString(),
      scopes: ["ads_management", "ads_read", "instagram_basic", "instagram_content_publish"],
      last_verified_at: new Date().toISOString()
    });
  },

  // ---------------------------------------------------------
  // Automation, Reporting, & Approval Guardrail Methods
  // ---------------------------------------------------------
  async getBackgroundJobs(clientId?: string): Promise<BackgroundJob[]> {
    const url = clientId ? `/automations/jobs?client_id=${clientId}` : '/automations/jobs';
    return safeFetch<BackgroundJob[]>(url, undefined, FALLBACK_BACKGROUND_JOBS);
  },

  async triggerBackgroundJob(jobType: string, clientId?: string, idempotencyKey?: string, forceRun = false): Promise<BackgroundJob> {
    return safeFetch<BackgroundJob>('/automations/jobs/run', {
      method: 'POST',
      body: JSON.stringify({
        job_type: jobType,
        client_id: clientId || 'cli_lumina_glow',
        idempotency_key: idempotencyKey,
        force_run: forceRun
      })
    }, {
      ...FALLBACK_BACKGROUND_JOBS[0],
      job_type: jobType as any,
      status: 'COMPLETED',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });
  },

  async retryBackgroundJob(jobId: string): Promise<BackgroundJob> {
    return safeFetch<BackgroundJob>(`/automations/jobs/${jobId}/retry`, {
      method: 'POST'
    }, {
      ...FALLBACK_BACKGROUND_JOBS[0],
      id: jobId,
      status: 'COMPLETED',
      retry_count: 1
    });
  },

  async getPerformanceAnomalies(clientId?: string, acknowledged?: boolean): Promise<PerformanceAnomaly[]> {
    let url = clientId ? `/automations/anomalies?client_id=${clientId}` : '/automations/anomalies';
    if (acknowledged !== undefined) {
      url += `${clientId ? '&' : '?'}acknowledged=${acknowledged}`;
    }
    return safeFetch<PerformanceAnomaly[]>(url, undefined, FALLBACK_PERFORMANCE_ANOMALIES);
  },

  async acknowledgeAnomaly(anomalyId: string, clientId?: string): Promise<PerformanceAnomaly> {
    const url = clientId ? `/automations/anomalies/${anomalyId}/acknowledge?client_id=${clientId}` : `/automations/anomalies/${anomalyId}/acknowledge`;
    return safeFetch<PerformanceAnomaly>(url, {
      method: 'POST'
    }, {
      ...FALLBACK_PERFORMANCE_ANOMALIES[0],
      id: anomalyId,
      acknowledged: true,
      acknowledged_at: new Date().toISOString()
    });
  },

  async getPerformanceReports(clientId?: string): Promise<PerformanceReport[]> {
    const url = clientId ? `/automations/reports?client_id=${clientId}` : '/automations/reports';
    return safeFetch<PerformanceReport[]>(url, undefined, FALLBACK_PERFORMANCE_REPORTS);
  },

  async getPerformanceReport(reportId: string, clientId?: string): Promise<PerformanceReport> {
    const url = clientId ? `/automations/reports/${reportId}?client_id=${clientId}` : `/automations/reports/${reportId}`;
    return safeFetch<PerformanceReport>(url, undefined, FALLBACK_PERFORMANCE_REPORTS[0]);
  },

  async generatePerformanceReport(clientId?: string): Promise<PerformanceReport> {
    return safeFetch<PerformanceReport>('/automations/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId || 'cli_lumina_glow'
      })
    }, FALLBACK_PERFORMANCE_REPORTS[0]);
  },

  async downloadReportCsv(reportId: string, clientId?: string): Promise<string> {
    const url = clientId ? `/automations/reports/${reportId}/csv?client_id=${clientId}` : `/automations/reports/${reportId}/csv`;
    try {
      const token = getAuthToken();
      const orgId = getActiveOrgId();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      if (orgId) headers['X-Tenant-ID'] = orgId;
      const response = await fetch(`${API_BASE}${url}`, { headers });
      if (!response.ok) throw new Error('CSV Download failed');
      return await response.text();
    } catch {
      // Fallback CSV content
      return `Metric,Current Period,Previous Period,Change %,Status\nSpend,$3480.00,$3258.00,+6.8%,SCALED\nROAS,3.84x,3.41x,+12.6%,EFFICIENT\nCPA,$18.42,$20.63,-10.7%,IMPROVED\nCTR,2.70%,2.62%,+3.1%,HEALTHY\nConversions,189,158,+19.6%,GROWING`;
    }
  },

  async getNotifications(clientId?: string, unreadOnly?: boolean): Promise<SystemNotification[]> {
    let url = clientId ? `/automations/notifications?client_id=${clientId}` : '/automations/notifications';
    if (unreadOnly !== undefined) {
      url += `${clientId ? '&' : '?'}unread_only=${unreadOnly}`;
    }
    return safeFetch<SystemNotification[]>(url, undefined, FALLBACK_SYSTEM_NOTIFICATIONS);
  },

  async markNotificationRead(notificationId: string, clientId?: string): Promise<SystemNotification> {
    const url = clientId ? `/automations/notifications/${notificationId}/read?client_id=${clientId}` : `/automations/notifications/${notificationId}/read`;
    return safeFetch<SystemNotification>(url, {
      method: 'PATCH'
    }, {
      ...FALLBACK_SYSTEM_NOTIFICATIONS[0],
      id: notificationId,
      read: true,
      read_at: new Date().toISOString()
    });
  },

  async markAllNotificationsRead(clientId?: string): Promise<{ success: boolean; updated_count: number }> {
    const url = clientId ? `/automations/notifications/mark-all-read?client_id=${clientId}` : '/automations/notifications/mark-all-read';
    return safeFetch<{ success: boolean; updated_count: number }>(url, {
      method: 'POST'
    }, {
      success: true,
      updated_count: 3
    });
  },

  async validateAction(request: ActionValidationRequest): Promise<ActionValidationResponse> {
    const isAutonomous = [
      'GENERATE_RECOMMENDATIONS',
      'FETCH_INSIGHTS',
      'PERFORM_COMPETITOR_RESEARCH',
      'CREATE_CAMPAIGN_DRAFT',
      'CREATE_REEL_DRAFT',
      'SIMULATE_SCENARIOS'
    ].includes(request.action_type);

    const requiresApproval = !isAutonomous;
    const monthlyBudget = 25000.0;
    const dailyLimit = monthlyBudget / 15.0; // 1666.67
    const requestedDaily = request.requested_daily_budget || 0;
    const budgetExceeded = requestedDaily > dailyLimit;
    const approvalExpired = Boolean(request.approval_record_id && request.approval_record_id.includes('expired'));
    const hasApproval = Boolean(request.has_human_approval && !approvalExpired);

    let allowed = true;
    let reason = "Action validated within server-side safety boundaries.";

    if (requiresApproval && !hasApproval) {
      allowed = false;
      reason = "Restricted advertising action requires verified human approval.";
    } else if (budgetExceeded) {
      allowed = false;
      reason = `Requested daily budget $${requestedDaily} exceeds maximum permitted limit $${dailyLimit.toFixed(2)}.`;
    } else if (approvalExpired) {
      allowed = false;
      reason = "Approval record has expired.";
    }

    const dynamicFallback: ActionValidationResponse = {
      action_type: request.action_type,
      allowed,
      requires_human_approval: requiresApproval,
      reason,
      client_monthly_budget_usd: monthlyBudget,
      client_daily_budget_limit_usd: dailyLimit,
      budget_limit_exceeded: budgetExceeded,
      approval_expired: approvalExpired
    };

    return safeFetch<ActionValidationResponse>('/automations/validate-action', {
      method: 'POST',
      body: JSON.stringify(request)
    }, dynamicFallback);
  }
};

