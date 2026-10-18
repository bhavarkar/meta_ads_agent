export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  billing_tier: string;
  members_count: number;
  clients_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: MemberRole;
  avatar_url?: string;
  joined_at: string;
}

export interface MetaConnection {
  client_id: string;
  organization_id: string;
  ad_account_id: string;
  instagram_account_id?: string;
  meta_app_id?: string;
  is_connected: boolean;
  token_masked: string;
  token_expires_at?: string;
  scopes?: string[];
  last_verified_at?: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  organization_id?: string;
  name: string;
  industry: string;
  meta_ad_account_id: string;
  instagram_handle?: string;
  monthly_budget_usd: number;
  target_roas_goal: number;
  is_active: boolean;
  created_at: string;
  active_campaigns_count: number;
  total_spend_30d: number;
  average_roas_30d: number;
}

export interface CompetitorAd {
  id: string;
  advertiser_name: string;
  page_id: string;
  headline: string;
  primary_text: string;
  call_to_action: string;
  media_type: 'video' | 'image' | 'carousel';
  media_url: string;
  thumbnail_url: string;
  estimated_active_days: number;
  first_seen: string;
  hook_type: string;
  extracted_hook_text: string;
  extracted_offer: string;
  target_angles: string[];
  creative_score: number;
}

export interface HookExtraction {
  top_hooks: Array<{
    text: string;
    type: string;
    confidence: number;
    prevalence: string;
  }>;
  primary_offers: string[];
  trending_keywords: string[];
  recommended_angles: Array<{
    angle: string;
    rationale: string;
  }>;
}

export interface AudienceTarget {
  name: string;
  type: string;
  details: string;
  suggested_budget_share_pct: number;
}

export interface AdCreativeAngle {
  concept: string;
  hook: string;
  primary_text: string;
  headline: string;
  visual_direction: string;
  cta: string;
}

export interface CampaignStrategy {
  id: string;
  client_id: string;
  strategy_name: string;
  executive_summary: string;
  recommended_funnel_structure: string[];
  suggested_daily_budget: number;
  audience_segments: AudienceTarget[];
  creative_angles: AdCreativeAngle[];
  testing_roadmap_days: number;
  expected_roas_range: string;
  created_at: string;
}

export type CampaignWorkflowStatus = 
  | 'DRAFT' 
  | 'VALIDATED' 
  | 'APPROVAL_PENDING' 
  | 'APPROVED' 
  | 'PAUSED_IN_META' 
  | 'ACTIVATION_PENDING' 
  | 'ACTIVE';

export type BudgetOwnershipLevel = 'CAMPAIGN' | 'AD_SET';
export type BudgetType = 'DAILY' | 'LIFETIME';

export interface AudienceTargetingConfig {
  age_min: number;
  age_max: number;
  genders: 'ALL' | 'MEN' | 'WOMEN';
  locations: string[];
  interests: Array<{ id: string; name: string }>;
  advantage_plus_audience: boolean;
  custom_audiences?: string[];
}

export interface PlacementsConfig {
  advantage_plus_placements: boolean;
  platforms: string[];
  facebook_positions: string[];
  instagram_positions: string[];
}

export interface AdSetDraft {
  id?: string;
  meta_adset_id?: string;
  name: string;
  optimization_goal: string;
  billing_event: string;
  destination_type: string;
  daily_budget_usd?: number;
  lifetime_budget_usd?: number;
  bid_strategy: string;
  targeting: AudienceTargetingConfig;
  placements: PlacementsConfig;
  start_time?: string;
  end_time?: string;
  status: string;
  targeting_summary?: string;
}

export interface AdCreativeDraft {
  id?: string;
  meta_creative_id?: string;
  name: string;
  page_id: string;
  page_name: string;
  instagram_actor_id?: string;
  instagram_handle?: string;
  headline: string;
  primary_text: string;
  description?: string;
  call_to_action: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  destination_url: string;
}

export interface AdDraft {
  id?: string;
  meta_ad_id?: string;
  name: string;
  adset_id?: string;
  creative_id?: string;
  status: string;
}

export interface CampaignApprovalRecord {
  approver_id: string;
  approver_email?: string;
  approved_payload_hash: string;
  ad_account_id: string;
  budget_amount: number;
  budget_type: string;
  currency: string;
  approved_at: string;
  expires_at: string;
  action_type: string;
  signature: string;
}

export interface CampaignValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  graph_api_version: string;
  compatible_settings?: {
    campaign_objective: string;
    default_optimization_goal: string;
    valid_destinations: string[];
    default_bid_strategy: string;
  };
}

export interface MetaConnectionHealth {
  client_id: string;
  ad_account_id: string;
  is_connected: boolean;
  health_status: 'HEALTHY' | 'TOKEN_EXPIRING' | 'MISSING_PERMISSIONS' | 'DISCONNECTED';
  token_masked: string;
  token_expires_at?: string;
  days_until_token_expiry?: number;
  account_currency: string;
  account_timezone: string;
  account_status: string;
  granted_scopes: string[];
  missing_scopes: string[];
  api_version: string;
  last_checked_at: string;
}

export interface CampaignDraft {
  id: string;
  client_id: string;
  meta_campaign_id?: string;
  name: string;
  objective: string;
  budget_level?: BudgetOwnershipLevel;
  budget_type?: BudgetType;
  daily_budget_usd: number;
  lifetime_budget_usd?: number;
  special_ad_category?: string;
  status: 'PAUSED' | 'ACTIVE' | 'ARCHIVED';
  workflow_status?: CampaignWorkflowStatus;
  approval_required: boolean;
  is_approved: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_signature?: string | null;
  latest_approval?: CampaignApprovalRecord | null;
  approved_payload_hash?: string | null;
  current_payload_hash?: string | null;
  needs_reapproval?: boolean;
  ad_sets_count: number;
  creatives_count: number;
  ad_sets?: AdSetDraft[];
  creatives?: AdCreativeDraft[];
  ads?: AdDraft[];
  validation_errors?: string[];
  created_at: string;
  updated_at: string;
  is_demo: boolean;
  idempotency_token?: string | null;
}

export type ReelPublishStatus = 
  | 'DRAFT'
  | 'READY'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'PREVIEW_VERIFIED'
  | 'APPROVED_FOR_PUBLISHING';

export type RightsOwnership = 'OWNED' | 'LICENSED' | 'THIRD_PARTY_RESTRICTED';

export interface Reel {
  id: string;
  client_id: string;
  instagram_ig_id?: string | null;
  title: string;
  video_url: string;
  thumbnail_url: string;
  caption: string;
  hashtags: string[];
  status: ReelPublishStatus;
  duration_seconds: number;
  aspect_ratio: string;
  preview_verified: boolean;
  is_approved: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_binding_hash?: string | null;
  approval_signature?: string | null;
  approval_invalidated?: boolean;
  // Media & Codec Specifications
  file_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  video_codec?: string;
  audio_codec?: string;
  width?: number;
  height?: number;
  // Ownership & Rights
  rights_ownership?: RightsOwnership;
  is_commercial_cleared?: boolean;
  competitor_creative_blocked?: boolean;
  origin?: 'ORIGINAL_UPLOAD' | 'COMPETITOR_BENCHMARK';
  // Container & Publishing Pipeline
  ig_container_id?: string | null;
  container_status?: string | null;
  published_media_id?: string | null;
  permalink?: string | null;
  published_at?: string | null;
  scheduled_at?: string | null;
  retry_count?: number;
  last_error?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  is_demo: boolean;
  // Organic vs Ad Separation
  is_ad_creative?: boolean;
  publishing_channel?: 'ORGANIC_REEL' | 'PAID_AD_CAMPAIGN';
}

export interface CaptionOption {
  id: string;
  angle_name: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  full_caption: string;
  tone: string;
}

export interface CaptionGenerationResponse {
  client_id: string;
  options: CaptionOption[];
  suggested_hooks: string[];
  recommended_hashtags: {
    niche: string[];
    industry: string[];
    trending: string[];
    community: string[];
  };
  cta_variations: string[];
}

export interface ReelValidationResult {
  is_valid: boolean;
  aspect_ratio_detected: string;
  aspect_ratio_valid: boolean;
  duration_valid: boolean;
  mime_valid: boolean;
  size_valid: boolean;
  codec_valid: boolean;
  rights_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ReelComparisonItem {
  reel: Reel;
  opening_hook: string;
  pacing_score: number;
  visual_clarity_score: number;
  engagement_potential: string;
}


export type DatePreset = 'yesterday' | 'last_7d' | 'last_30d' | 'custom';
export type ReportingLevel = 'account' | 'campaign' | 'adset' | 'ad';

export interface ActionBreakdownItem {
  action_type: string;
  action_label: string;
  count: number;
  value?: number | null;
  cost_per_action: number;
}

export interface ConversionFunnelStage {
  stage_id: string;
  stage_name: string;
  count: number;
  dropoff_pct: number;
  conversion_rate_pct: number;
  is_tracked: boolean;
  untracked_reason?: string | null;
}

export interface ReportingEntityRow {
  id: string;
  name: string;
  level: ReportingLevel;
  status: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  link_clicks: number;
  ctr_percent: number;
  link_ctr_percent: number;
  cpc: number;
  cpm: number;
  results: number;
  result_type: string;
  cost_per_result: number;
  roas?: number | null;
  currency: string;
}

export interface CreativePerformanceItem {
  ad_id: string;
  ad_name: string;
  headline: string;
  thumbnail_url: string;
  media_type: 'VIDEO' | 'IMAGE' | string;
  spend: number;
  impressions: number;
  frequency: number;
  link_clicks: number;
  ctr_percent: number;
  cpc: number;
  results: number;
  cost_per_result: number;
  roas?: number | null;
  performance_tier: 'TOP_PERFORMER' | 'AVERAGE' | 'WEAK_FATIGUED';
  diagnosis: string;
}

export interface AccountMetadata {
  ad_account_id: string;
  ad_account_name: string;
  currency: string;
  account_timezone: string;
  timezone_offset_hours: number;
  attribution_setting: string;
  last_synced_at: string;
  sync_status: 'SUCCESS' | 'SYNCING' | 'FAILED';
  data_source: string;
  rate_limit_percent: number;
}

export interface TimeSeriesPoint {
  date: string;
  spend: number;
  impressions?: number;
  reach?: number;
  clicks: number;
  link_clicks?: number;
  ctr_percent?: number;
  cpc?: number;
  cpm?: number;
  results?: number;
  cost_per_result?: number;
  roas?: number | null;
  conversions: number;
  cpa: number;
}

export interface PlacementBreakdown {
  placement: string;
  spend_share_pct: number;
  roas?: number | null;
  cpa: number;
  impressions?: number;
  clicks?: number;
}

export interface AnalyticsSummary {
  total_spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  link_clicks: number;
  ctr_percent: number;
  link_ctr_percent: number;
  cpc: number;
  cost_per_link_click: number;
  cpm: number;
  results: number;
  result_metric_name: string;
  cost_per_result: number;
  attributed_revenue?: number | null;
  roas?: number | null;
  has_attributed_revenue: boolean;
  currency: string;
  conversions: number;
  cpa: number;
  change_vs_previous_period_pct: {
    roas: number;
    cpa: number;
    spend: number;
    conversions: number;
  };
}

export interface AnalyticsData {
  client_id: string;
  level: ReportingLevel;
  date_preset: DatePreset;
  since: string;
  until: string;
  account_metadata: AccountMetadata;
  summary: AnalyticsSummary;
  trend_history: TimeSeriesPoint[];
  placements: PlacementBreakdown[];
  conversion_funnel: ConversionFunnelStage[];
  entities: ReportingEntityRow[];
  top_creatives: CreativePerformanceItem[];
  weak_creatives: CreativePerformanceItem[];
  action_breakdown: ActionBreakdownItem[];
  is_demo: boolean;
  disclaimer: string;
  date_range?: string;
}

export type RecommendationCategory =
  | 'Creative optimization'
  | 'Audience testing'
  | 'Budget allocation'
  | 'Conversion tracking'
  | 'Landing page optimization'
  | 'Lead quality'
  | 'Retargeting'
  | 'Campaign structure'
  | 'Instagram content strategy'
  | 'CREATIVE_FATIGUE'
  | 'BUDGET_SCALING'
  | 'AUDIENCE_EXPANSION'
  | 'BIDDING_TUNING'
  | 'OFFER_OPTIMIZATION'
  | string;

export interface ImpactEstimate {
  metric_name: string;
  estimated_change_range: string;
  uncertainty_rating: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
}

export interface EvidenceLink {
  title: string;
  url: string;
  evidence_type?: string;
}

export interface RecommendationWorkflowStepLog {
  step_number: number;
  step_name: string;
  summary: string;
  items_count: number;
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  client_id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  category: RecommendationCategory;
  problem_identified: string;
  supporting_evidence: string[];
  recommended_action: string;
  expected_mechanism: string;
  impact_estimate?: ImpactEstimate;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  effort_required: 'LOW' | 'MEDIUM' | 'HIGH';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  priority_score: number;
  approval_required: boolean;
  action_type: string;
  action_payload: Record<string, any>;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SNOOZED' | 'IMPLEMENTED' | 'APPLIED' | 'DISMISSED';
  is_insufficient_data?: boolean;
  data_warning?: string | null;
  evidence_links?: EvidenceLink[];
  approval_request_id?: string | null;
  created_at: string;

  // Backward compatibility fields
  diagnosis: string;
  action_description: string;
  projected_roas_lift: number;
  projected_weekly_savings_usd: number;
  confidence_score_pct: number;
}

export interface RecommendationListResponse {
  client_id: string;
  recommendations: AIRecommendation[];
  workflow_execution_logs?: RecommendationWorkflowStepLog[];
  total_potential_roas_gain: number;
  total_potential_savings: number;
  is_demo: boolean;
  disclaimer: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  tenant_id: string;
  role: MemberRole | string;
  is_demo: boolean;
}

export type CompetitorVerificationStatus = 'unverified_suggestion' | 'confirmed' | 'rejected';
export type ClaimType = 'observation' | 'hypothesis';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CompetitorProfile {
  id: string;
  client_id?: string;
  brand_name: string;
  website: string;
  industry: string;
  geographic_market: string;
  social_profile_urls: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    meta_ad_library?: string;
    [key: string]: string | undefined;
  };
  verified_research_sources: string[];
  verification_status: CompetitorVerificationStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitorCandidate {
  id: string;
  brand_name: string;
  website: string;
  industry: string;
  geographic_market: string;
  source_reference: string;
  reason: string;
  status: CompetitorVerificationStatus;
}

export interface AdObservation {
  id: string;
  competitor_id?: string;
  competitor_name: string;
  ad_copy: string;
  creative_format: 'video' | 'image' | 'carousel' | 'story_reel';
  cta: string;
  hook: string;
  offer: string;
  start_date?: string;
  observation_date: string;
  source_url: string;
  screenshot_url?: string;
  claim_type: ClaimType;
  confidence: ConfidenceLevel;
  notes?: string;
}

export interface HookAnalysisItem {
  hook_text: string;
  hook_category: string;
  brand_name: string;
  claim_type: ClaimType;
  confidence: ConfidenceLevel;
  source_citation: string;
  frequency_estimate: string;
}

export interface PositioningItem {
  brand_name: string;
  value_proposition: string;
  target_audience_segment: string;
  claim_type: ClaimType;
  confidence: ConfidenceLevel;
  source_citation: string;
}

export interface PromotionThemeItem {
  theme: string;
  frequency_pct: number;
  brands_using: string[];
  example_copy: string;
  claim_type: ClaimType;
}

export interface CTAPatternItem {
  cta_text: string;
  frequency_pct: number;
  primary_funnel_stage: string;
}

export interface DifferentiationOpportunity {
  id: string;
  category: string;
  unmet_need_or_gap: string;
  recommended_counter_position: string;
  suggested_hook: string;
  suggested_offer: string;
  impact_score: number;
  effort_level: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence_grounding: string;
  confidence: ConfidenceLevel;
  claim_type: ClaimType;
}

export interface KeywordClusterItem {
  cluster_theme: string;
  public_search_queries: string[];
  meta_ad_library_keywords: string[];
}

export interface SourceCitationItem {
  claim: string;
  source: string;
  verified: boolean;
  type: ClaimType;
}

export interface CompetitorIntelligenceReport {
  id: string;
  client_id: string;
  generated_at: string;
  competitors_analyzed: string[];
  observations_count: number;
  workflow_stages_completed: string[];
  hook_analysis: HookAnalysisItem[];
  positioning_map: PositioningItem[];
  promotion_themes: PromotionThemeItem[];
  creative_format_breakdown: Record<string, number>;
  cta_patterns: CTAPatternItem[];
  differentiation_opportunities: DifferentiationOpportunity[];
  keyword_clusters: KeywordClusterItem[];
  source_attribution_citations: SourceCitationItem[];
  zero_fabrication_guarantee: string;
}

// --- Keyword Intelligence & 3-Strategy Types ---

export interface MetaTargetingItem {
  name: string;
  type: string; // 'interest' | 'behavior' | 'advantage_plus' | 'custom_audience' | 'ad_copy_keyword_only';
  meta_interest_id?: string | null;
  is_targetable: boolean;
  validation_source: string;
  description: string;
}

export interface KeywordIntelligence {
  research_keywords: string[];
  ad_copy_keywords: string[];
  meta_targeting_suggestions: MetaTargetingItem[];
  marketing_message_themes: string[];
  customer_pain_points: string[];
  advertising_hooks: string[];
  creative_ideas: string[];
  suggested_cta_options: string[];
  offer_suggestions: string[];
  audience_hypotheses: string[];
}

export interface StrategyBudgetAllocation {
  daily_budget_usd: number;
  monthly_budget_usd: number;
  tofu_pct: number;
  mofu_pct: number;
  bofu_pct: number;
  breakdown_notes: string;
}

export interface StrategyKPIs {
  primary_metric: string;
  target_roas_range: string;
  target_cpa_usd: number;
  expected_ctr_range: string;
  target_conversion_rate: string;
  benchmarking_disclaimer: string;
}

export interface CompatibleAdSetSettings {
  campaign_objective: string;
  optimization_goal: string;
  destination_type: string;
  bid_strategy: string;
  is_valid_configuration: boolean;
}

export interface SingleStrategyPlan {
  id: string;
  tier: 'conservative' | 'balanced' | 'experimental';
  name: string;
  tagline: string;
  objective: string;
  target_audience: AudienceTarget[];
  location: string;
  budget_allocation: StrategyBudgetAllocation;
  placements: string[];
  messaging_hooks: string[];
  creative_formats: string[];
  cta: string;
  conversion_destination: string;
  kpis: StrategyKPIs;
  assumptions: string[];
  risks: string[];
  compatible_ad_set_settings: CompatibleAdSetSettings;
  creative_angles: AdCreativeAngle[];
}

export interface PolicyComplianceReport {
  industry: string;
  special_ad_category: 'NONE' | 'CREDIT' | 'EMPLOYMENT' | 'HOUSING' | string;
  is_restricted_industry: boolean;
  prohibited_attributes_detected: string[];
  policy_warnings: string[];
  recommended_disclosures: string[];
  compliance_score: number;
}

export interface ComprehensiveStrategyRequest {
  client_id: string;
  industry: string;
  location?: string;
  budget_type?: 'monthly' | 'daily';
  budget_amount: number;
  product_service: string;
  customer_profile: string;
  campaign_objective?: string;
  destination_type?: 'WEBSITE' | 'WHATSAPP';
  destination_url?: string;
  available_media_assets?: string[];
  competitor_research_results?: string[];
  historical_performance?: string;
}

export interface ComprehensiveStrategyResponse {
  id: string;
  client_id: string;
  created_at: string;
  industry: string;
  location: string;
  keyword_intelligence: KeywordIntelligence;
  policy_compliance: PolicyComplianceReport;
  strategies: {
    conservative: SingleStrategyPlan;
    balanced: SingleStrategyPlan;
    experimental: SingleStrategyPlan;
  };
  zero_guarantee_compliance_notice: string;
}

export interface SaveStrategyRequest {
  client_id: string;
  comprehensive_strategy_id: string;
  selected_tier: 'conservative' | 'balanced' | 'experimental';
  notes?: string;
}

export interface SavedStrategyRecord {
  id: string;
  client_id: string;
  strategy_plan: SingleStrategyPlan;
  selected_tier: 'conservative' | 'balanced' | 'experimental';
  saved_at: string;
  created_by?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------
// Automation, Reporting, & Approval Guardrail Types
// ---------------------------------------------------------

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
export type JobType =
  | 'DAILY_METRICS_SYNC'
  | 'DAILY_ANOMALY_DETECTION'
  | 'WEEKLY_PERFORMANCE_REPORT'
  | 'CREATIVE_WORKFLOW_DISPATCH'
  | 'APPROVE_EXPIRED_SWEEP';

export interface BackgroundJob {
  id: string;
  job_type: JobType;
  name: string;
  schedule_cron: string;
  cadence: string;
  status: JobStatus;
  client_id?: string | null;
  tenant_id?: string;
  idempotency_key?: string | null;
  retry_count: number;
  max_retries: number;
  started_at?: string | null;
  completed_at?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  error_details?: string | null;
  execution_duration_sec?: number | null;
  result_summary?: Record<string, any> | null;
}

export type AnomalySeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AnomalyMetric = 'CTR' | 'CPC' | 'CPA' | 'SPEND' | 'ROAS' | 'IMPRESSIONS' | 'FREQUENCY';

export interface PerformanceAnomaly {
  id: string;
  client_id: string;
  metric: AnomalyMetric;
  severity: AnomalySeverity;
  headline: string;
  explanation: string;
  current_value: number;
  benchmark_value: number;
  percentage_change: number;
  detected_at: string;
  supporting_data: Record<string, any>;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
}

export type NotificationType =
  | 'REEL_APPROVAL_REQUIRED'
  | 'CAMPAIGN_APPROVAL_PENDING'
  | 'PUBLICATION_SUCCESS'
  | 'PUBLICATION_FAILED'
  | 'ANOMALY_DETECTED'
  | 'WEEKLY_REPORT_READY';

export interface SystemNotification {
  id: string;
  tenant_id: string;
  client_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  entity_id?: string | null;
  entity_type?: string | null;
  action_url?: string | null;
  created_at: string;
  read: boolean;
  read_at?: string | null;
}

export interface PerformanceReport {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  summary_markdown: string;
  kpi_summary: {
    current_period: Record<string, number>;
    previous_period: Record<string, number>;
    wow_change_pct: Record<string, number>;
  };
  top_performing_creatives: Array<{
    name: string;
    roas: number;
    cpa: number;
    spend: number;
  }>;
  anomalies_detected: PerformanceAnomaly[];
  prioritized_recommendations: AIRecommendation[];
  status: string;
  csv_download_url?: string | null;
}

export type RecommendationActionItem = AIRecommendation;

export interface ActionValidationRequest {
  action_type: string;
  client_id: string;
  tenant_id?: string;
  requested_daily_budget?: number | null;
  has_human_approval?: boolean;
  approval_record_id?: string | null;
}

export interface ActionValidationResponse {
  action_type: string;
  allowed: boolean;
  requires_human_approval: boolean;
  reason: string;
  client_monthly_budget_usd: number;
  client_daily_budget_limit_usd: number;
  budget_limit_exceeded: boolean;
  approval_expired: boolean;
}



