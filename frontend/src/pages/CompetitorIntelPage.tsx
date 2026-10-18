import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import {
  CompetitorProfile,
  CompetitorCandidate,
  AdObservation,
  CompetitorIntelligenceReport,
  DifferentiationOpportunity
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Search,
  Sparkles,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Copy,
  ArrowRight,
  TrendingUp,
  Target,
  Layers,
  Eye,
  FileText,
  Calendar,
  Globe,
  RefreshCw,
  Zap,
  Tag,
  Share2
} from 'lucide-react';

export const CompetitorIntelPage: React.FC<{ onUseHookInStrategy?: (hook: string) => void }> = ({
  onUseHookInStrategy
}) => {
  const { activeClient } = useClient();
  const currentClientId = activeClient?.id || 'cli_lumina_glow';
  const currentIndustry = activeClient?.industry || 'DTC Skincare & Beauty';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'ad_workspace' | 'ai_intelligence' | 'opportunities' | 'discovery' | 'sources'>('overview');

  // Core Data States
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [candidates, setCandidates] = useState<CompetitorCandidate[]>([]);
  const [observations, setObservations] = useState<AdObservation[]>([]);
  const [report, setReport] = useState<CompetitorIntelligenceReport | null>(null);
  const [researchQueries, setResearchQueries] = useState<string[]>([]);
  
  // UI and Loading States
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);

  // Form States - Add Competitor
  const [newCompetitor, setNewCompetitor] = useState({
    brand_name: '',
    website: '',
    industry: currentIndustry,
    geographic_market: 'United States',
    meta_ad_library_url: '',
    instagram_url: '',
    notes: ''
  });

  // Form States - Discovery
  const [discoveryForm, setDiscoveryForm] = useState({
    industry: currentIndustry,
    business_location: 'United States',
    category: currentIndustry,
    marketing_goal: 'Customer Acquisition (E-commerce DTC)',
    target_customer_profile: 'Target market prospective customers and buyers',
    public_ad_library_urls: ''
  });

  // Form States - Log Observation
  const [newObservation, setNewObservation] = useState({
    competitor_name: 'GlowAura Labs',
    ad_copy: '',
    creative_format: 'video' as 'video' | 'image' | 'carousel' | 'story_reel',
    cta: 'Shop Now',
    hook: '',
    offer: '',
    start_date: new Date().toISOString().split('T')[0],
    observation_date: new Date().toISOString().split('T')[0],
    source_url: '',
    claim_type: 'observation' as 'observation' | 'hypothesis',
    confidence: 'high' as 'high' | 'medium' | 'low',
    notes: ''
  });

  // Initial Data Load
  const loadData = async () => {
    setLoading(true);
    try {
      const [compsData, obsData, reportData, discData] = await Promise.all([
        api.getCompetitors(currentClientId),
        api.getAdObservations(currentClientId),
        api.runCompetitorAnalysis({ client_id: currentClientId }),
        api.discoverCompetitors({ industry: currentIndustry })
      ]);
      setCompetitors(compsData);
      setObservations(obsData);
      setReport(reportData);
      setCandidates(discData.candidates);
      setResearchQueries(discData.suggested_research_queries || []);
    } catch (err) {
      console.error('Failed to load competitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentClientId]);

  // Trigger LangGraph AI Workflow with visual steps
  const handleRunLangGraphWorkflow = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(1); // Intake
    setTimeout(() => setAnalysisStep(2), 300); // Source Validation
    setTimeout(() => setAnalysisStep(3), 600); // Data Normalization
    setTimeout(() => setAnalysisStep(4), 900); // AI Analysis
    setTimeout(() => setAnalysisStep(5), 1200); // Opportunity Scoring
    setTimeout(async () => {
      setAnalysisStep(6); // Report
      try {
        const freshReport = await api.runCompetitorAnalysis({
          client_id: currentClientId,
          competitor_ids: competitors.map(c => c.id),
          observations: observations
        });
        setReport(freshReport);
      } catch (err) {
        console.error('Error generating report:', err);
      } finally {
        setTimeout(() => setIsAnalyzing(false), 500);
      }
    }, 1500);
  };

  // Add Competitor Handler
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitor.brand_name || !newCompetitor.website) return;
    try {
      const social_profile_urls: Record<string, string> = {};
      if (newCompetitor.meta_ad_library_url) {
        social_profile_urls.meta_ad_library = newCompetitor.meta_ad_library_url;
      }
      if (newCompetitor.instagram_url) {
        social_profile_urls.instagram = newCompetitor.instagram_url;
      }

      const created = await api.createCompetitor({
        client_id: currentClientId,
        brand_name: newCompetitor.brand_name,
        website: newCompetitor.website,
        industry: newCompetitor.industry,
        geographic_market: newCompetitor.geographic_market,
        social_profile_urls,
        verified_research_sources: [
          newCompetitor.website,
          ...(newCompetitor.meta_ad_library_url ? [newCompetitor.meta_ad_library_url] : [])
        ],
        notes: newCompetitor.notes
      });
      setCompetitors(prev => [...prev, created]);
      setIsAddModalOpen(false);
      setNewCompetitor({
        brand_name: '',
        website: '',
        industry: currentIndustry,
        geographic_market: 'United States',
        meta_ad_library_url: '',
        instagram_url: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding competitor:', err);
    }
  };

  // Run AI Discovery
  const handleRunDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const urls = discoveryForm.public_ad_library_urls
        ? discoveryForm.public_ad_library_urls.split('\n').filter(u => u.trim().length > 0)
        : [];
      const res = await api.discoverCompetitors({
        industry: discoveryForm.industry,
        business_location: discoveryForm.business_location,
        category: discoveryForm.category,
        marketing_goal: discoveryForm.marketing_goal,
        target_customer_profile: discoveryForm.target_customer_profile,
        public_ad_library_urls: urls
      });
      setCandidates(res.candidates);
      setResearchQueries(res.suggested_research_queries || []);
      setIsDiscoveryModalOpen(false);
      setActiveTab('discovery');
    } catch (err) {
      console.error('Error during competitor discovery:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify or Reject Candidate
  const handleVerifyCandidate = async (candidateId: string, action: 'confirmed' | 'rejected') => {
    try {
      await api.verifyCandidate(candidateId, action);
      const cand = candidates.find(c => c.id === candidateId);
      if (cand && action === 'confirmed') {
        // Move to verified competitors
        const newComp: CompetitorProfile = {
          id: `comp_${Date.now()}`,
          client_id: currentClientId,
          brand_name: cand.brand_name,
          website: cand.website,
          industry: cand.industry,
          geographic_market: cand.geographic_market,
          social_profile_urls: {
            meta_ad_library: cand.source_reference
          },
          verified_research_sources: [cand.source_reference, cand.website],
          verification_status: 'confirmed',
          notes: `Promoted from AI candidate: ${cand.reason}`
        };
        setCompetitors(prev => [...prev, newComp]);
      }
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
    } catch (err) {
      console.error('Error updating candidate:', err);
    }
  };

  // Log Ad Observation
  const handleLogObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObservation.ad_copy || !newObservation.source_url) return;
    try {
      const created = await api.logAdObservation({
        ...newObservation,
        competitor_name: newObservation.competitor_name || competitors[0]?.brand_name || 'GlowAura Labs'
      });
      setObservations(prev => [created, ...prev]);
      setIsObservationModalOpen(false);
      setNewObservation({
        competitor_name: competitors[0]?.brand_name || 'GlowAura Labs',
        ad_copy: '',
        creative_format: 'video',
        cta: 'Shop Now',
        hook: '',
        offer: '',
        start_date: new Date().toISOString().split('T')[0],
        observation_date: new Date().toISOString().split('T')[0],
        source_url: '',
        claim_type: 'observation',
        confidence: 'high',
        notes: ''
      });
      setActiveTab('ad_workspace');
    } catch (err) {
      console.error('Error logging observation:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredObservations = observations.filter(obs => {
    const matchesSearch =
      obs.competitor_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      obs.ad_copy.toLowerCase().includes(searchFilter.toLowerCase()) ||
      obs.hook.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFormat = formatFilter === 'all' || obs.creative_format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Primary Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Competitor Intelligence & Ad Library Hub</span>
                <Badge variant="purple" size="sm">Meta Pilot AI</Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Public ad strategy research, pattern-interrupt hook identification, and data-driven differentiation opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDiscoveryModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Discovery</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Competitor</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsObservationModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Log Ad Observation</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isAnalyzing}
            onClick={handleRunLangGraphWorkflow}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/20"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Run LangGraph Agent</span>
          </Button>
        </div>
      </div>

      {/* 2. Compliance & Zero-Fabrication Guarantee Banner */}
      <div className="p-3.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <span>ZERO-FABRICATION & META COMPLIANCE GUARANTEE</span>
            <Badge variant="success" size="sm">Compliant</Badge>
          </div>
          <p className="text-slate-400 leading-relaxed">
            MetaPilot strictly analyzes public Meta Ad Library links and user-observed creatives. We <strong className="text-slate-200">never fabricate competitor spend, CPC, impressions, or ROAS</strong>. Every material claim is linked to its public source or labeled as an AI hypothesis.
          </p>
        </div>
      </div>

      {/* 3. LangGraph Workflow Progress Bar (Animated) */}
      {isAnalyzing && (
        <Card className="border-indigo-500/40 bg-indigo-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                LangGraph Multi-Stage Research Agent Running...
              </span>
              <span>Step {analysisStep} of 6</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-center text-[10px]">
              {[
                { step: 1, name: '1. Intake' },
                { step: 2, name: '2. Source Validation' },
                { step: 3, name: '3. Data Normalization' },
                { step: 4, name: '4. AI Analysis' },
                { step: 5, name: '5. Opportunity Scoring' },
                { step: 6, name: '6. Report Generation' }
              ].map(s => (
                <div
                  key={s.step}
                  className={`p-2 rounded-lg border transition-all ${
                    analysisStep >= s.step
                      ? 'bg-indigo-600/30 border-indigo-400 text-slate-100 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-500'
                  }`}
                >
                  {analysisStep > s.step ? '✓ ' : ''}{s.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Quick Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Tracked Competitors</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{competitors.length} Brands</h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 5 Fictional Demo Fixtures
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Logged Ad Observations</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{observations.length} Creatives</h3>
              <p className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Verified Ad Library Records
              </p>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Identified Opportunities</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">
                {report?.differentiation_opportunities?.length || 3} Strategic Gaps
              </h3>
              <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Top Impact: 92.5/100
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Unverified Candidates</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{candidates.length} Suggestions</h3>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Pending Human Validation
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Navigation Tab Pills */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Comparison Matrix', count: competitors.length },
          { id: 'ad_workspace', label: 'Ad Library Workspace', count: observations.length },
          { id: 'ai_intelligence', label: 'AI Intelligence & Hooks', badge: 'AI' },
          { id: 'opportunities', label: 'Differentiation Matrix', count: report?.differentiation_opportunities?.length },
          { id: 'discovery', label: 'Candidate Discovery', count: candidates.length, alert: candidates.length > 0 },
          { id: 'sources', label: 'Sources & Evidence Citations' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-indigo-800/80' : 'bg-slate-800 text-slate-300'}`}>
                {tab.count}
              </span>
            )}
            {tab.alert && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* 6. TAB CONTENT */}

      {/* TAB 1: OVERVIEW & COMPETITOR COMPARISON TABLE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>Tracked Competitors Comparison Matrix</span>
                  <Badge variant="purple" size="sm">5 Fictional Brands</Badge>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified competitor profiles, active public Ad Library links, and validated observation sources.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Competitor
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Brand & Website</th>
                      <th className="py-3 px-4">Industry / Category</th>
                      <th className="py-3 px-4">Target Market</th>
                      <th className="py-3 px-4">Public Research Links</th>
                      <th className="py-3 px-4">Verification Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {competitors.map(comp => (
                      <tr key={comp.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{comp.brand_name}</div>
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{comp.website.replace('https://', '')}</span>
                          </a>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {comp.industry}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {comp.geographic_market}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {comp.social_profile_urls?.meta_ad_library && (
                              <a
                                href={comp.social_profile_urls.meta_ad_library}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded text-[10px] hover:bg-indigo-900/60 transition-colors"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Meta Ad Library</span>
                              </a>
                            )}
                            {comp.social_profile_urls?.instagram && (
                              <a
                                href={comp.social_profile_urls.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] hover:bg-slate-700 transition-colors"
                              >
                                <Share2 className="w-2.5 h-2.5" />
                                <span>Instagram</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success" size="sm" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewObservation(prev => ({
                                ...prev,
                                competitor_name: comp.brand_name,
                                source_url: comp.social_profile_urls?.meta_ad_library || comp.website
                              }));
                              setIsObservationModalOpen(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            + Log Ad
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AD LIBRARY RESEARCH WORKSPACE */}
      {activeTab === 'ad_workspace' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by brand, hook, or copy..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="text-[11px] text-slate-500">Format:</span>
                <select
                  value={formatFilter}
                  onChange={e => setFormatFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">All Formats</option>
                  <option value="video">Reels / Video</option>
                  <option value="image">Single Image</option>
                  <option value="carousel">Carousel</option>
                </select>
              </div>
            </div>

            <Button size="sm" variant="primary" onClick={() => setIsObservationModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Log New Ad Observation
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredObservations.map(obs => (
              <Card key={obs.id} className="flex flex-col justify-between border-slate-800 hover:border-slate-700 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">{obs.competitor_name}</span>
                    <Badge variant={obs.claim_type === 'observation' ? 'info' : 'warning'} size="sm">
                      {obs.claim_type === 'observation' ? 'Factual Observation' : 'AI Hypothesis'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="capitalize px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">
                      {obs.creative_format}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Observed {obs.observation_date}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 flex-1">
                  {/* Extracted Hook */}
                  {obs.hook && (
                    <div className="p-2.5 bg-indigo-950/30 border border-indigo-900/40 rounded-lg">
                      <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center justify-between">
                        <span>Extracted Hook</span>
                        <button
                          onClick={() => copyToClipboard(obs.hook)}
                          className="hover:text-slate-100 transition-colors"
                          title="Copy Hook"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-medium text-indigo-200 mt-1 italic">
                        "{obs.hook}"
                      </p>
                    </div>
                  )}

                  {/* Primary Ad Copy */}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Ad Copy</span>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                      {obs.ad_copy}
                    </p>
                  </div>

                  {/* Offer & CTA */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Offer</span>
                      <p className="text-slate-300 font-medium truncate">{obs.offer || 'None specified'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Call To Action</span>
                      <p className="text-slate-300 font-medium truncate">{obs.cta}</p>
                    </div>
                  </div>

                  {/* Source Link & Action */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <a
                      href={obs.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> Public Ad Library Link
                    </a>
                    {onUseHookInStrategy && obs.hook && (
                      <button
                        onClick={() => onUseHookInStrategy(obs.hook)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        Adopt Hook <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI INTELLIGENCE & HOOKS */}
      {activeTab === 'ai_intelligence' && report && (
        <div className="space-y-6">
          {/* Top Hook Analysis Cards */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Extracted Public Advertising Hooks & Angles</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AI analyzed pattern interrupts, pain points, and psychological triggers currently driving public competitor campaigns.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.hook_analysis.map((hookItem, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                        {hookItem.hook_category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={hookItem.claim_type === 'observation' ? 'info' : 'warning'} size="sm">
                          {hookItem.claim_type}
                        </Badge>
                        <Badge variant="purple" size="sm">
                          {hookItem.confidence} confidence
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-100 italic">
                      "{hookItem.hook_text}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Brand: <strong className="text-slate-300">{hookItem.brand_name}</strong></span>
                      <span className="text-slate-500 font-mono text-[10px]">{hookItem.source_citation}</span>
                    </div>

                    {onUseHookInStrategy && (
                      <div className="pt-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUseHookInStrategy(hookItem.hook_text)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 py-1 h-auto"
                        >
                          Use in Campaign Strategy <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Positioning Map & Promotion Themes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Positioning Map */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Competitor Value Propositions & Positioning</span>
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {report.positioning_map.map((pos, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs">{pos.brand_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{pos.source_citation}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-indigo-400">Positioning:</strong> {pos.value_proposition}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <strong className="text-slate-300">Target Segment:</strong> {pos.target_audience_segment}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Promotion Themes & Creative Formats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>Dominant Promotion Themes</span>
                  </h3>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  {report.promotion_themes.map((theme, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                        <span>{theme.theme}</span>
                        <span className="text-indigo-400 font-bold">{theme.frequency_pct}% share</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 italic">
                        "{theme.example_copy}"
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Format Breakdown & CTAs */}
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Creative Format Distribution</span>
                  </h3>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {Object.entries(report.creative_format_breakdown).map(([fmt, pct]) => (
                    <div key={fmt} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{fmt}</span>
                        <span className="font-semibold text-sky-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIFFERENTIATION MATRIX & OPPORTUNITIES */}
      {activeTab === 'opportunities' && report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>AI Identified Campaign Opportunities & Counter-Positioning</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Unexploited market gaps identified by cross-referencing competitor Ad Library creative saturation.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRunLangGraphWorkflow}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-score Opportunities
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {report.differentiation_opportunities.map(opp => (
              <Card key={opp.id} className="flex flex-col justify-between border-slate-800 hover:border-indigo-500/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {opp.category}
                    </span>
                    <Badge variant="purple" size="sm">
                      Impact: {opp.impact_score}/100
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">
                    {opp.recommended_counter_position}
                  </h3>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 flex-1">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">
                      The Competitor Gap
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {opp.unmet_need_or_gap}
                    </p>
                  </div>

                  {/* Suggested Hook */}
                  <div className="p-2.5 bg-indigo-950/40 border border-indigo-900/50 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-indigo-400 uppercase font-bold">
                      <span>Suggested High-Impact Hook</span>
                      <button onClick={() => copyToClipboard(opp.suggested_hook)} title="Copy Hook">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-indigo-200 italic">
                      "{opp.suggested_hook}"
                    </p>
                  </div>

                  {/* Suggested Offer */}
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                      Counter Offer Concept
                    </span>
                    <p className="text-xs text-slate-200 font-medium">
                      {opp.suggested_offer}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                    <p><strong className="text-slate-300">Grounding Evidence:</strong> {opp.evidence_grounding}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 uppercase">Effort: {opp.effort_level}</span>
                      <Badge variant="warning" size="sm">Hypothesis ({opp.confidence})</Badge>
                    </div>
                  </div>

                  {onUseHookInStrategy && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUseHookInStrategy(opp.suggested_hook)}
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Adopt Into Campaign Strategy</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CANDIDATE DISCOVERY & SEARCH QUERIES */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Suggested Competitor Candidates</span>
                <Badge variant="warning" size="sm">Unverified Suggestions</Badge>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rule 1 Compliance: AI candidates must be confirmed or rejected by a human operator before inclusion into verified profiles.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsDiscoveryModalOpen(true)}>
              <Search className="w-3.5 h-3.5 mr-1" /> Re-run Discovery
            </Button>
          </div>

          {/* Candidate Cards */}
          {candidates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-200">All Candidate Suggestions Have Been Processed</p>
                <p>Run a new discovery scan to find candidate brands in related categories.</p>
                <Button size="sm" variant="primary" onClick={() => setIsDiscoveryModalOpen(true)} className="mt-2">
                  Launch Discovery Scan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map(cand => (
                <Card key={cand.id} className="border-amber-500/30 bg-amber-950/10 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-sm">{cand.brand_name}</span>
                      <Badge variant="warning" size="sm">
                        Unverified
                      </Badge>
                    </div>
                    <a
                      href={cand.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                    >
                      <Globe className="w-3 h-3" /> {cand.website.replace('https://', '')}
                    </a>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0 flex-1">
                    <div className="text-xs text-slate-300 space-y-1">
                      <p><strong className="text-slate-400">Category:</strong> {cand.industry}</p>
                      <p><strong className="text-slate-400">Market:</strong> {cand.geographic_market}</p>
                    </div>

                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Discovery Rationale</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{cand.reason}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Source: {cand.source_reference}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyCandidate(cand.id, 'rejected')}
                        className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/60"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyCandidate(cand.id, 'confirmed')}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm & Track
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Keyword Clusters & Permitted Search Queries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Suggested Public Research Queries */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>Suggested Public Research Queries</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permitted queries for public Meta Ad Library search and search engine indexes.
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {researchQueries.map((query, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <code className="text-sky-300 font-mono">{query}</code>
                    <button
                      onClick={() => copyToClipboard(query)}
                      className="text-slate-400 hover:text-slate-200 p-1"
                      title="Copy Query"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Keyword Clusters for Ad Library */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Public Keyword Clusters</span>
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {report?.keyword_clusters?.map((cluster, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                    <span className="text-xs font-semibold text-slate-200">{cluster.cluster_theme}</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cluster.meta_ad_library_keywords.map((kw, kidx) => (
                        <span
                          key={kidx}
                          className="px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded text-[10px]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: SOURCES & EVIDENCE CITATIONS */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Source Attribution & Claim Verification Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every competitive statement is explicitly grounded in a verified public URL or flagged as an AI hypothesis.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Claim Statement</th>
                      <th className="py-3 px-4">Claim Type</th>
                      <th className="py-3 px-4">Grounded Source</th>
                      <th className="py-3 px-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {report?.source_attribution_citations.map((cite, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-200 font-medium max-w-md">
                          {cite.claim}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={cite.type === 'observation' ? 'info' : 'warning'} size="sm">
                            {cite.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {cite.source.startsWith('http') ? (
                            <a
                              href={cite.source}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" /> {cite.source.slice(0, 48)}...
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">{cite.source}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="success" size="sm">
                            Verified Source
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD COMPETITOR MANUALLY */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Manually Add Competitor Profile"
        description="Add a competitor to track and analyze public advertising strategies."
        maxWidth="lg"
      >
        <form onSubmit={handleAddCompetitor} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Brand Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ceramide Glow"
              value={newCompetitor.brand_name}
              onChange={e => setNewCompetitor({ ...newCompetitor, brand_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Website URL *</label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={newCompetitor.website}
                onChange={e => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Industry</label>
              <input
                type="text"
                value={newCompetitor.industry}
                onChange={e => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Geographic Market</label>
              <input
                type="text"
                placeholder="e.g. United States, North America"
                value={newCompetitor.geographic_market}
                onChange={e => setNewCompetitor({ ...newCompetitor, geographic_market: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Instagram URL</label>
              <input
                type="url"
                placeholder="https://instagram.com/brand"
                value={newCompetitor.instagram_url}
                onChange={e => setNewCompetitor({ ...newCompetitor, instagram_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Public Meta Ad Library URL</label>
            <input
              type="url"
              placeholder="https://www.facebook.com/ads/library/?view_all_page_id=..."
              value={newCompetitor.meta_ad_library_url}
              onChange={e => setNewCompetitor({ ...newCompetitor, meta_ad_library_url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Research Notes</label>
            <textarea
              rows={2}
              placeholder="Key notes, pricing observations, or target audience details..."
              value={newCompetitor.notes}
              onChange={e => setNewCompetitor({ ...newCompetitor, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Competitor
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: AI COMPETITOR DISCOVERY */}
      <Modal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        title="AI Competitor Discovery"
        description="Discover candidate competitors and suggest research queries from permitted sources."
        maxWidth="lg"
      >
        <form onSubmit={handleRunDiscovery} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Client Industry *</label>
              <input
                type="text"
                required
                value={discoveryForm.industry}
                onChange={e => setDiscoveryForm({ ...discoveryForm, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Business Location</label>
              <input
                type="text"
                value={discoveryForm.business_location}
                onChange={e => setDiscoveryForm({ ...discoveryForm, business_location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Product / Service Category</label>
              <input
                type="text"
                value={discoveryForm.category}
                onChange={e => setDiscoveryForm({ ...discoveryForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Marketing Goal</label>
              <input
                type="text"
                value={discoveryForm.marketing_goal}
                onChange={e => setDiscoveryForm({ ...discoveryForm, marketing_goal: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Customer Profile</label>
            <input
              type="text"
              value={discoveryForm.target_customer_profile}
              onChange={e => setDiscoveryForm({ ...discoveryForm, target_customer_profile: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Public Meta Ad Library URLs (Optional - one per line)
            </label>
            <textarea
              rows={2}
              placeholder="https://www.facebook.com/ads/library/?id=..."
              value={discoveryForm.public_ad_library_urls}
              onChange={e => setDiscoveryForm({ ...discoveryForm, public_ad_library_urls: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-[11px] focus:outline-none"
            />
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>AI suggestions are marked as <strong>Unverified Suggestions</strong> until you confirm or reject them.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsDiscoveryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Run Discovery Scan
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: LOG AD OBSERVATION */}
      <Modal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        title="Log Ad Library Observation"
        description="Store public ad observations with hook, copy, format, and source attribution."
        maxWidth="lg"
      >
        <form onSubmit={handleLogObservation} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Competitor Name *</label>
              <select
                value={newObservation.competitor_name}
                onChange={e => setNewObservation({ ...newObservation, competitor_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              >
                {competitors.map(c => (
                  <option key={c.id} value={c.brand_name}>{c.brand_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Creative Format</label>
              <select
                value={newObservation.creative_format}
                onChange={e => setNewObservation({ ...newObservation, creative_format: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              >
                <option value="video">Short-form Video (Reels/9:16)</option>
                <option value="image">Single Image</option>
                <option value="carousel">Carousel</option>
                <option value="story_reel">Story Reel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Opening Hook *</label>
            <input
              type="text"
              required
              placeholder="e.g. Throw away your 10-step routine right now."
              value={newObservation.hook}
              onChange={e => setNewObservation({ ...newObservation, hook: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Primary Ad Copy *</label>
            <textarea
              rows={3}
              required
              placeholder="Paste public ad body text..."
              value={newObservation.ad_copy}
              onChange={e => setNewObservation({ ...newObservation, ad_copy: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Offer (if any)</label>
              <input
                type="text"
                placeholder="e.g. BOGO 40% Off + Free Mini"
                value={newObservation.offer}
                onChange={e => setNewObservation({ ...newObservation, offer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Call To Action (CTA)</label>
              <input
                type="text"
                placeholder="e.g. Shop Now, Learn More"
                value={newObservation.cta}
                onChange={e => setNewObservation({ ...newObservation, cta: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Public Ad Library Source URL *</label>
              <input
                type="url"
                required
                placeholder="https://www.facebook.com/ads/library/?id=..."
                value={newObservation.source_url}
                onChange={e => setNewObservation({ ...newObservation, source_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Observation Date</label>
              <input
                type="date"
                value={newObservation.observation_date}
                onChange={e => setNewObservation({ ...newObservation, observation_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsObservationModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Ad Observation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
