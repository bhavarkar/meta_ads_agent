import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import {
  ComprehensiveStrategyResponse,
  SingleStrategyPlan,
  SavedStrategyRecord,
  ComprehensiveStrategyRequest
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Sparkles,
  Layers,
  Target,
  DollarSign,
  Copy,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Search,
  MessageSquare,
  Globe,
  Share2,
  TrendingUp,
  Flame,
  Bookmark,
  History,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface StrategyGeneratorPageProps {
  initialHook?: string;
  onCampaignCreated?: () => void;
}

export const StrategyGeneratorPage: React.FC<StrategyGeneratorPageProps> = ({
  initialHook = '',
  onCampaignCreated
}) => {
  const { activeClient } = useClient();

  // Navigation tab for strategy view
  const [activeStrategyTier, setActiveStrategyTier] = useState<'balanced' | 'conservative' | 'experimental'>('balanced');
  const [activeSubTab, setActiveSubTab] = useState<'comparison' | 'keywords' | 'policy' | 'history'>('comparison');

  // Form Inputs
  const [industry, setIndustry] = useState('DTC Skincare & Beauty');
  const [location, setLocation] = useState('United States & Canada');
  const [budgetType, setBudgetType] = useState<'monthly' | 'daily'>('monthly');
  const [budgetAmount, setBudgetAmount] = useState<number>(activeClient?.monthly_budget_usd || 25000);
  const [productService, setProductService] = useState('Hydra-Barrier Ceramide Nectar');
  const [customerProfile, setCustomerProfile] = useState('Women 22-45, active skincare buyers, routine fatigue, damaged barrier');
  const [campaignObjective, setCampaignObjective] = useState('OUTCOME_SALES');
  const [destinationType, setDestinationType] = useState<'WEBSITE' | 'WHATSAPP'>('WEBSITE');
  const [destinationUrl, setDestinationUrl] = useState('https://luminaskin.example.com/serum');
  const [availableMedia, setAvailableMedia] = useState<string[]>([
    'Short-form 9:16 Reels/Video',
    'Static Editorial Images',
    'Carousel Showcase'
  ]);
  const [competitorHook, setCompetitorHook] = useState(
    initialHook || 'Throw away your 10-step routine right now.'
  );
  const [historicalPerformance, setHistoricalPerformance] = useState(
    'Historical 30D average ROAS: 4.12x, CPA: $21.20, Instagram Reels top-performing placement.'
  );

  // Results State
  const [comprehensiveStrategy, setComprehensiveStrategy] = useState<ComprehensiveStrategyResponse | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [savedSuccessTier, setSavedSuccessTier] = useState<string | null>(null);
  const [draftSuccess, setDraftSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync initial hook if prop updates
  useEffect(() => {
    if (initialHook) {
      setCompetitorHook(initialHook);
    }
  }, [initialHook]);

  // Load saved strategies for active client
  useEffect(() => {
    if (activeClient) {
      api.getSavedStrategies(activeClient.id).then(res => {
        setSavedStrategies(res);
      }).catch(err => {
        console.warn('Failed to load saved strategies:', err);
      });
    }
  }, [activeClient]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleMediaToggle = (media: string) => {
    setAvailableMedia(prev =>
      prev.includes(media) ? prev.filter(m => m !== media) : [...prev, media]
    );
  };

  // Generate Strategy
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    setLoading(true);
    setDraftSuccess(false);
    setSavedSuccessTier(null);

    try {
      const payload: ComprehensiveStrategyRequest = {
        client_id: activeClient.id,
        industry,
        location,
        budget_type: budgetType,
        budget_amount: Number(budgetAmount),
        product_service: productService,
        customer_profile: customerProfile,
        campaign_objective: campaignObjective,
        destination_type: destinationType,
        destination_url: destinationType === 'WEBSITE' ? destinationUrl : undefined,
        available_media_assets: availableMedia,
        competitor_research_results: [competitorHook],
        historical_performance: historicalPerformance
      };

      const result = await api.generateComprehensiveStrategy(payload);
      setComprehensiveStrategy(result);
      setActiveSubTab('comparison');
    } catch (err) {
      console.error('Error generating strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Chosen Strategy Option
  const handleSaveStrategy = async (tier: 'conservative' | 'balanced' | 'experimental') => {
    if (!comprehensiveStrategy || !activeClient) return;
    setSaving(true);
    try {
      const saved = await api.saveStrategy({
        client_id: activeClient.id,
        comprehensive_strategy_id: comprehensiveStrategy.id,
        selected_tier: tier,
        notes: `Selected ${tier.toUpperCase()} strategy for ${productService} (${new Date().toLocaleDateString()})`
      });
      setSavedStrategies(prev => [saved, ...prev]);
      setSavedSuccessTier(tier);
      setTimeout(() => setSavedSuccessTier(null), 3000);
    } catch (err) {
      console.error('Error saving strategy:', err);
    } finally {
      setSaving(false);
    }
  };

  // Create Campaign Draft in strictly PAUSED state
  const handleCreateDraft = async (plan: SingleStrategyPlan) => {
    if (!activeClient) return;
    setDrafting(true);
    try {
      await api.createCampaign({
        client_id: activeClient.id,
        name: plan.name,
        objective: plan.objective as any,
        daily_budget_usd: plan.budget_allocation.daily_budget_usd,
        status: 'PAUSED', // Strictly PAUSED
        approval_required: true
      });
      setDraftSuccess(true);
      if (onCampaignCreated) onCampaignCreated();
    } catch (err) {
      console.error('Error creating campaign draft:', err);
    } finally {
      setDrafting(false);
    }
  };

  if (!activeClient) return null;

  const currentPlan = comprehensiveStrategy?.strategies[activeStrategyTier];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>AI Keyword Intelligence & Campaign Strategy Suite</span>
                <Badge variant="purple" size="sm">Meta ODAX 2026</Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Transform competitor observations, customer psychology, and business requirements into 3 validated Meta advertising architectures.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedStrategies.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSubTab('history')}
              className="flex items-center gap-1.5"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>Saved Strategies ({savedStrategies.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Meta Compliance & Zero-Guarantee Notice */}
      <div className="p-3.5 bg-slate-900/90 border border-indigo-500/30 rounded-xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold text-indigo-300">
            <span>TRUTH-IN-ADVERTISING & META TARGETING COMPLIANCE GUARANTEE</span>
            <Badge variant="info" size="sm">Strict Separation</Badge>
          </div>
          <p className="text-slate-400 leading-relaxed">
            MetaPilot AI strictly separates <strong>market research keywords</strong>, <strong>ad copy power words</strong>, and <strong>validated Meta targeting entities</strong>. We do not invent performance benchmarks or guarantee financial results. All targets reflect directional budget models.
          </p>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader
              title="Campaign Strategy Inputs"
              subtitle="Configure client requirements, budget, and competitor intelligence"
            />
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
                {/* Industry & Location */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="DTC Skincare & Beauty">DTC Skincare & Beauty</option>
                      <option value="Athleisure & Fitness">Athleisure & Fitness Wear</option>
                      <option value="B2B Productivity SaaS">B2B Productivity SaaS</option>
                      <option value="Healthcare & Wellness">Healthcare & Wellness (Sensitive)</option>
                      <option value="Real Estate & Housing">Real Estate & Housing (Special Ad)</option>
                      <option value="Financial Services & Credit">Financial Services (Special Ad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Target Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. United States & Canada"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Budget Amount and Type */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Budget ({budgetType === 'monthly' ? 'Monthly' : 'Daily'})
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        value={budgetAmount}
                        onChange={e => setBudgetAmount(Number(e.target.value))}
                        className="w-full pl-6 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Pacing Type</label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setBudgetType('monthly')}
                        className={`flex-1 py-1.5 text-center transition-colors ${
                          budgetType === 'monthly' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetType('daily')}
                        className={`flex-1 py-1.5 text-center transition-colors ${
                          budgetType === 'daily' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-950 text-slate-400'
                        }`}
                      >
                        Daily
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Product or Service</label>
                  <input
                    type="text"
                    required
                    value={productService}
                    onChange={e => setProductService(e.target.value)}
                    placeholder="e.g. Hydra-Barrier Ceramide Nectar"
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Customer Profile */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Target Customer Profile</label>
                  <textarea
                    rows={2}
                    value={customerProfile}
                    onChange={e => setCustomerProfile(e.target.value)}
                    placeholder="Demographics, pain points, core desire..."
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>

                {/* Campaign Objective (Meta ODAX) */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Campaign Objective (Meta ODAX)</label>
                  <select
                    value={campaignObjective}
                    onChange={e => setCampaignObjective(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  >
                    <option value="OUTCOME_SALES">OUTCOME_SALES (E-Commerce Purchases & ROAS)</option>
                    <option value="OUTCOME_LEADS">OUTCOME_LEADS (Inquiries, Forms, WhatsApp)</option>
                    <option value="OUTCOME_ENGAGEMENT">OUTCOME_ENGAGEMENT (Conversations & Reels Views)</option>
                    <option value="OUTCOME_TRAFFIC">OUTCOME_TRAFFIC (High-Intent Link Clicks)</option>
                    <option value="OUTCOME_AWARENESS">OUTCOME_AWARENESS (Reach & Brand Lift)</option>
                    <option value="OUTCOME_APP_PROMOTION">OUTCOME_APP_PROMOTION (App Installs)</option>
                  </select>
                </div>

                {/* Conversion Destination */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Conversion Destination</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDestinationType('WEBSITE')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        destinationType === 'WEBSITE'
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website Landing Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinationType('WHATSAPP')}
                      className={`flex-1 py-1.5 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        destinationType === 'WHATSAPP'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Direct Chat</span>
                    </button>
                  </div>
                  {destinationType === 'WEBSITE' ? (
                    <input
                      type="url"
                      value={destinationUrl}
                      onChange={e => setDestinationUrl(e.target.value)}
                      placeholder="https://client-store.com/landing-page"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
                    />
                  ) : (
                    <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Configures click-to-WhatsApp messaging ads with pre-filled consultation message.</span>
                    </div>
                  )}
                </div>

                {/* Available Media Assets */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1.5">Available Media Assets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      'Short-form 9:16 Reels/Video',
                      'Static Editorial Images',
                      'Carousel Showcase',
                      'Raw UGC Video Clips'
                    ].map(media => (
                      <button
                        key={media}
                        type="button"
                        onClick={() => handleMediaToggle(media)}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] text-left transition-colors flex items-center justify-between ${
                          availableMedia.includes(media)
                            ? 'bg-slate-800 border-indigo-500 text-indigo-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="truncate">{media}</span>
                        {availableMedia.includes(media) && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competitor Hook Input */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Competitor Hook or Angle (Imported / Custom)
                  </label>
                  <input
                    type="text"
                    value={competitorHook}
                    onChange={e => setCompetitorHook(e.target.value)}
                    placeholder="e.g. Throw away your 10-step routine right now."
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
                    isLoading={loading}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    <span>Synthesize 3 Strategy Options</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Strategy Cards & Keyword Intel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {comprehensiveStrategy ? (
            <>
              {/* Output Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveSubTab('comparison')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeSubTab === 'comparison'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3-Strategy Comparison</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('keywords')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeSubTab === 'keywords'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Keyword Intelligence</span>
                  <Badge variant="purple" size="sm">Separated</Badge>
                </button>

                <button
                  onClick={() => setActiveSubTab('policy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeSubTab === 'policy'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Policy Audit</span>
                  {comprehensiveStrategy.policy_compliance.is_restricted_industry && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>

                {savedStrategies.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('history')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeSubTab === 'history'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Saved History ({savedStrategies.length})</span>
                  </button>
                )}
              </div>

              {/* SUB-TAB 1: 3-STRATEGY COMPARISON & SELECTION */}
              {activeSubTab === 'comparison' && (
                <div className="space-y-4">
                  {/* Strategy Tier Selector Cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        tier: 'conservative',
                        title: 'Conservative',
                        badge: 'Lowest Risk',
                        color: 'emerald',
                        tagline: 'High-confidence proven angles & warm retargeting.'
                      },
                      {
                        tier: 'balanced',
                        title: 'Balanced',
                        badge: 'Recommended',
                        color: 'indigo',
                        tagline: '70/20/10 Advantage+ Shopping full-funnel.'
                      },
                      {
                        tier: 'experimental',
                        title: 'Experimental',
                        badge: 'High Velocity',
                        color: 'purple',
                        tagline: 'Contrarian hooks, raw UGC & WhatsApp direct.'
                      }
                    ].map(item => (
                      <button
                        key={item.tier}
                        type="button"
                        onClick={() => setActiveStrategyTier(item.tier as any)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          activeStrategyTier === item.tier
                            ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-100">{item.title}</span>
                            <Badge variant={item.tier === 'balanced' ? 'purple' : item.tier === 'conservative' ? 'success' : 'info'} size="sm">
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{item.tagline}</p>
                        </div>
                        <div className="mt-2 text-[10px] font-semibold text-indigo-400">
                          {comprehensiveStrategy.strategies[item.tier as 'balanced'].kpis.target_roas_range} ROAS Target
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Active Strategy Plan Detail Card */}
                  {currentPlan && (
                    <Card className="border-indigo-500/40">
                      <CardHeader
                        title={currentPlan.name}
                        subtitle={currentPlan.tagline}
                        action={
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveStrategy(activeStrategyTier)}
                              isLoading={saving}
                              className="text-xs"
                            >
                              <Bookmark className="w-3.5 h-3.5 mr-1 text-amber-400" />
                              <span>{savedSuccessTier === activeStrategyTier ? 'Saved!' : 'Save This Strategy'}</span>
                            </Button>
                          </div>
                        }
                      />
                      <CardContent className="space-y-4 text-xs">
                        {/* Target KPIs & Pacing */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target ROAS</span>
                            <span className="text-base font-bold text-emerald-400 font-mono">
                              {currentPlan.kpis.target_roas_range}
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target CPA</span>
                            <span className="text-base font-bold text-indigo-400 font-mono">
                              ${currentPlan.kpis.target_cpa_usd}
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Daily Pacing</span>
                            <span className="text-base font-bold text-slate-200 font-mono">
                              ${currentPlan.budget_allocation.daily_budget_usd}/day
                            </span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination</span>
                            <span className="text-xs font-semibold text-slate-200 truncate block mt-0.5">
                              {currentPlan.compatible_ad_set_settings.destination_type}
                            </span>
                          </div>
                        </div>

                        {/* Budget Allocation Funnel Bar */}
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span>Funnel Budget Allocation</span>
                            <span className="text-slate-400">
                              TOFU: {currentPlan.budget_allocation.tofu_pct}% | MOFU: {currentPlan.budget_allocation.mofu_pct}% | BOFU: {currentPlan.budget_allocation.bofu_pct}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${currentPlan.budget_allocation.tofu_pct}%` }}
                              className="bg-indigo-500 h-full"
                              title="Top of Funnel (Cold)"
                            />
                            <div
                              style={{ width: `${currentPlan.budget_allocation.mofu_pct}%` }}
                              className="bg-sky-500 h-full"
                              title="Middle of Funnel (Nurture)"
                            />
                            <div
                              style={{ width: `${currentPlan.budget_allocation.bofu_pct}%` }}
                              className="bg-emerald-500 h-full"
                              title="Bottom of Funnel (Retargeting)"
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {currentPlan.budget_allocation.breakdown_notes}
                          </p>
                        </div>

                        {/* Target Audiences Breakdown */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-indigo-400" />
                            <span>Target Audiences & Segmentation</span>
                          </span>
                          <div className="space-y-1.5">
                            {currentPlan.target_audience.map((aud, i) => (
                              <div
                                key={i}
                                className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-200">{aud.name}</span>
                                    <Badge variant="default" size="sm">{aud.type}</Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{aud.details}</p>
                                </div>
                                <span className="font-mono text-indigo-400 font-bold text-xs shrink-0">
                                  {aud.suggested_budget_share_pct}% share
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Primary Hooks & Placements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-amber-400">
                              Core Messaging Hooks
                            </span>
                            <div className="space-y-1">
                              {currentPlan.messaging_hooks.map((h, i) => (
                                <p key={i} className="text-[11px] text-slate-300 italic">
                                  "{h}"
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-sky-400">
                              Validated Placements & Formats
                            </span>
                            <div className="space-y-1 text-[11px] text-slate-300">
                              <p><strong className="text-slate-400">Placements:</strong> {currentPlan.placements.join(', ')}</p>
                              <p><strong className="text-slate-400">Creative Formats:</strong> {currentPlan.creative_formats.join(', ')}</p>
                              <p><strong className="text-slate-400">CTA:</strong> {currentPlan.cta}</p>
                            </div>
                          </div>
                        </div>

                        {/* Assumptions and Risks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Core Assumptions</span>
                            <ul className="list-disc list-inside text-[11px] text-slate-400 mt-1 space-y-0.5">
                              {currentPlan.assumptions.map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-400">Risk Factors & Mitigation</span>
                            <ul className="list-disc list-inside text-[11px] text-slate-400 mt-1 space-y-0.5">
                              {currentPlan.risks.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Action: Draft to Meta in PAUSED state */}
                        <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2.5">
                          <div className="flex items-start gap-2 text-xs">
                            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-100">Production Safety Guardrail: Strict PAUSED Draft</span>
                              <p className="text-[11px] text-slate-400">
                                This will push a draft campaign to your connected Meta account in strictly <strong>PAUSED</strong> status. No ad spend will run without explicit approval.
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="success"
                            size="md"
                            className="w-full text-xs font-semibold"
                            isLoading={drafting}
                            disabled={draftSuccess}
                            onClick={() => handleCreateDraft(currentPlan)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            <span>
                              {draftSuccess
                                ? `Campaign Draft Created in PAUSED State`
                                : `Draft ${currentPlan.name} to Meta (PAUSED)`}
                            </span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: KEYWORD INTELLIGENCE & TARGETING AUDIT */}
              {activeSubTab === 'keywords' && (
                <div className="space-y-4">
                  {/* Category 1: Market Research Keywords */}
                  <Card>
                    <CardHeader
                      title="Market Research & Search Keywords"
                      subtitle="High-intent search queries for SEO, Google, Amazon, and customer problem research"
                    />
                    <CardContent className="space-y-2 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {comprehensiveStrategy.keyword_intelligence.research_keywords.map((kw, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"
                          >
                            <code className="text-sky-300 font-mono text-[11px]">{kw}</code>
                            <button
                              onClick={() => copyToClipboard(kw)}
                              className="text-slate-400 hover:text-slate-200 p-1"
                              title="Copy Keyword"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category 2: Ad Copy Keywords */}
                  <Card>
                    <CardHeader
                      title="Ad Copy Vocabulary & Power Phrases"
                      subtitle="High-converting language and emotional triggers for headlines and body text"
                    />
                    <CardContent className="space-y-2 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {comprehensiveStrategy.keyword_intelligence.ad_copy_keywords.map((word, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded-lg text-xs font-medium flex items-center gap-1.5"
                          >
                            <span>{word}</span>
                            <button onClick={() => copyToClipboard(word)} className="hover:text-white">
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category 3: Meta Targeting Suggestions with Strict Validation */}
                  <Card className="border-indigo-500/30">
                    <CardHeader
                      title="Validated Meta Targeting Suggestions"
                      subtitle="Rule 3 Enforcement: Verification against official Meta Graph API interest/behavior IDs"
                    />
                    <CardContent className="space-y-2.5 pt-0">
                      {comprehensiveStrategy.keyword_intelligence.meta_targeting_suggestions.map((target, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                            target.is_targetable
                              ? 'bg-slate-950 border-emerald-500/30'
                              : 'bg-amber-950/10 border-amber-500/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100">{target.name}</span>
                              {target.is_targetable ? (
                                <Badge variant="success" size="sm">
                                  {target.meta_interest_id ? `Meta ID: ${target.meta_interest_id}` : 'Advantage+ AI'}
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  Untargetable on Meta
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{target.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Source: {target.validation_source}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Customer Psychology & Offers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader title="Customer Pain Points" />
                      <CardContent className="space-y-1.5 pt-0 text-xs">
                        {comprehensiveStrategy.keyword_intelligence.customer_pain_points.map((p, i) => (
                          <div key={i} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                            {p}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader title="Offer Suggestions" />
                      <CardContent className="space-y-1.5 pt-0 text-xs">
                        {comprehensiveStrategy.keyword_intelligence.offer_suggestions.map((o, i) => (
                          <div key={i} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 font-medium">
                            {o}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: POLICY COMPLIANCE AUDIT */}
              {activeSubTab === 'policy' && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader
                      title="Industry-Specific Meta Advertising Policy Audit"
                      subtitle="Evaluated against Special Ad Categories, Personal Attributes, and Sensitive Health rules"
                      action={
                        <Badge variant="purple" size="md">
                          Compliance Score: {comprehensiveStrategy.policy_compliance.compliance_score}/100
                        </Badge>
                      }
                    />
                    <CardContent className="space-y-3 pt-0 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Special Ad Category
                          </span>
                          <span className="text-sm font-bold text-slate-200">
                            {comprehensiveStrategy.policy_compliance.special_ad_category}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            Restricted Industry Status
                          </span>
                          <span className={`text-sm font-bold ${comprehensiveStrategy.policy_compliance.is_restricted_industry ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {comprehensiveStrategy.policy_compliance.is_restricted_industry ? 'Sensitive / Restricted' : 'Standard Commercial'}
                          </span>
                        </div>
                      </div>

                      {/* Warnings */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-200">Policy Warnings & Guardrails</span>
                        {comprehensiveStrategy.policy_compliance.policy_warnings.length === 0 ? (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>No high-risk policy violations detected in current messaging angles.</span>
                          </div>
                        ) : (
                          comprehensiveStrategy.policy_compliance.policy_warnings.map((warn, i) => (
                            <div key={i} className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-300 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{warn}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Recommended Disclosures */}
                      {comprehensiveStrategy.policy_compliance.recommended_disclosures.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          <span className="text-xs font-bold text-slate-200">Recommended Landing Page Disclosures</span>
                          <ul className="list-disc list-inside text-slate-400 space-y-1">
                            {comprehensiveStrategy.policy_compliance.recommended_disclosures.map((disc, i) => (
                              <li key={i}>{disc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SUB-TAB 4: SAVED STRATEGIES HISTORY */}
              {activeSubTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Saved Strategy Archives for {activeClient.name}
                    </h3>
                  </div>

                  {savedStrategies.map(item => (
                    <Card key={item.id} className="border-slate-800 hover:border-slate-700 transition-colors">
                      <CardContent className="p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{item.strategy_plan.name}</span>
                            <Badge variant={item.selected_tier === 'conservative' ? 'success' : item.selected_tier === 'balanced' ? 'purple' : 'info'} size="sm">
                              {item.selected_tier.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(item.saved_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{item.strategy_plan.tagline}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                          <span className="text-emerald-400 font-semibold font-mono">
                            Target ROAS: {item.strategy_plan.kpis.target_roas_range} (${item.strategy_plan.budget_allocation.daily_budget_usd}/day)
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCreateDraft(item.strategy_plan)}
                          >
                            <Layers className="w-3.5 h-3.5 mr-1" /> Draft to Meta (PAUSED)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
              <Sparkles className="w-10 h-10 text-indigo-400/50 mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-300">Strategy Architect Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Configure your product parameters on the left and click "Synthesize 3 Strategy Options" to generate Conservative, Balanced, and Experimental architectures with validated Meta targeting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
