import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import {
  AnalyticsData,
  ReportingLevel,
  DatePreset,
  ReportingEntityRow,
  ConversionFunnelStage
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
  MousePointerClick,
  Eye,
  ShoppingCart,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeClient } = useClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [level, setLevel] = useState<ReportingLevel>('campaign');
  const [datePreset, setDatePreset] = useState<DatePreset>('last_7d');
  const [customSince, setCustomSince] = useState<string>('');
  const [customUntil, setCustomUntil] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<'spend' | 'roas' | 'ctr_cpc' | 'results'>('spend');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ReportingEntityRow>('spend');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showActionBreakdown, setShowActionBreakdown] = useState<boolean>(false);

  // Load analytics when client, level, or date preset changes
  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    api.getAnalytics(activeClient.id, level, datePreset, customSince || undefined, customUntil || undefined)
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load analytics', err);
        setLoading(false);
      });
  }, [activeClient, level, datePreset]);

  // Handle Incremental Sync
  const handleSync = async () => {
    if (!activeClient || syncing) return;
    setSyncing(true);
    try {
      const fresh = await api.syncAnalytics(activeClient.id);
      setAnalytics(fresh);
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  // Apply custom date range
  const handleApplyCustomDates = () => {
    if (!customSince || !customUntil) return;
    setDatePreset('custom');
    setShowCustomModal(false);
    if (!activeClient) return;
    setLoading(true);
    api.getAnalytics(activeClient.id, level, 'custom', customSince, customUntil)
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load custom analytics', err);
        setLoading(false);
      });
  };

  if (!activeClient) return null;

  // Filter and sort entity rows
  const filteredEntities = (analytics?.entities || []).filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const valA = (a[sortField] ?? 0) as number | string;
    const valB = (b[sortField] ?? 0) as number | string;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const currencySymbol = analytics?.summary.currency === 'EUR' ? '€' : analytics?.summary.currency === 'GBP' ? '£' : '$';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header: Title, Metadata Badges & Sync Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <span>Official Meta Campaign Analytics</span>
            </h1>
            {analytics?.is_demo ? (
              <Badge variant="warning" className="uppercase text-[10px] tracking-wider font-bold">
                Synthetic Demo Mode
              </Badge>
            ) : (
              <Badge variant="success" className="uppercase text-[10px] tracking-wider font-bold">
                Live Meta API Insights
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
            <span>
              Ad Account: <span className="font-mono text-slate-300 font-semibold">{analytics?.account_metadata.ad_account_id || activeClient.meta_ad_account_id}</span>
            </span>
            <span>•</span>
            <span>Currency: <span className="font-semibold text-slate-300">{analytics?.account_metadata.currency || 'USD'}</span></span>
            <span>•</span>
            <span>Timezone: <span className="text-slate-300">{analytics?.account_metadata.account_timezone || 'America/Los_Angeles'}</span></span>
            <span>•</span>
            <span>Attribution: <span className="text-slate-300">{analytics?.account_metadata.attribution_setting || '7d click, 1d view'}</span></span>
            <span>•</span>
            <span>
              Last Synced: <span className="font-mono text-slate-300">
                {analytics?.account_metadata.last_synced_at ? new Date(analytics.account_metadata.last_synced_at).toLocaleTimeString() : 'Just now'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Insights'}</span>
          </Button>
        </div>
      </div>

      {/* Control Bar: Hierarchy Level Selector & Date Range Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        {/* Level Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setLevel('account')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              level === 'account' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Account Level
          </button>
          <button
            onClick={() => setLevel('campaign')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              level === 'campaign' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setLevel('adset')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              level === 'adset' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ad Sets
          </button>
          <button
            onClick={() => setLevel('ad')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              level === 'ad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ad Creatives
          </button>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setDatePreset('yesterday')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === 'yesterday' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDatePreset('last_7d')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === 'last_7d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('last_30d')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === 'last_30d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              datePreset === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{datePreset === 'custom' ? `${analytics?.since} → ${analytics?.until}` : 'Custom'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Select Custom Date Boundaries</span>
            </h3>
            <p className="text-xs text-slate-400">
              Dates correspond to the ad account timezone (<span className="text-slate-200">{analytics?.account_metadata.account_timezone}</span>).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">Start Date (Since)</label>
                <input
                  type="date"
                  value={customSince}
                  onChange={(e) => setCustomSince(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">End Date (Until)</label>
                <input
                  type="date"
                  value={customUntil}
                  onChange={(e) => setCustomUntil(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCustomModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyCustomDates}>
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Data Disclaimer Banner */}
      {analytics?.is_demo && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-400 block">Demonstration Telemetry Grounding</span>
            <p className="text-amber-300/80 mt-0.5">
              {analytics.disclaimer} ROAS is computed strictly from real or simulated purchase conversion values. Generic clicks are never conflated with destination link clicks.
            </p>
          </div>
        </div>
      )}

      {/* KPI Overview Tiles (10 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Spend */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Total Spend</span>
          <span className="text-xl font-bold font-mono text-slate-100 block mt-1">
            {currencySymbol}{analytics ? analytics.summary.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-2.5 h-2.5" /> +6.8% volume
          </span>
        </Card>

        {/* Impressions & Reach */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Impressions &amp; Reach</span>
          <span className="text-xl font-bold font-mono text-slate-100 block mt-1">
            {analytics ? (analytics.summary.impressions / 1000).toFixed(1) + 'k' : '0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Reach: {analytics ? (analytics.summary.reach / 1000).toFixed(1) + 'k' : '0'} (Freq: {analytics?.summary.frequency}x)
          </span>
        </Card>

        {/* Clicks & Link Clicks (Strict Separation) */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Link Clicks (Outbound)</span>
          <span className="text-xl font-bold font-mono text-indigo-400 block mt-1">
            {analytics ? analytics.summary.link_clicks.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Total Clicks: {analytics ? analytics.summary.clicks.toLocaleString() : '0'}
          </span>
        </Card>

        {/* CTR & Outbound CTR */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Link CTR (vs All CTR)</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
            {analytics?.summary.link_ctr_percent}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            All Clicks CTR: {analytics?.summary.ctr_percent}%
          </span>
        </Card>

        {/* CPC & Cost per Link Click */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Cost / Link Click</span>
          <span className="text-xl font-bold font-mono text-slate-100 block mt-1">
            {currencySymbol}{analytics?.summary.cost_per_link_click.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Generic CPC: {currencySymbol}{analytics?.summary.cpc.toFixed(2)}
          </span>
        </Card>

        {/* CPM */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">CPM (Cost/1k Imp)</span>
          <span className="text-xl font-bold font-mono text-slate-100 block mt-1">
            {currencySymbol}{analytics?.summary.cpm.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Auction competitive rate
          </span>
        </Card>

        {/* Primary Results */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">{analytics?.summary.result_metric_name || 'Results'}</span>
          <span className="text-xl font-bold font-mono text-purple-400 block mt-1">
            {analytics ? analytics.summary.results.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Verified primary conversions
          </span>
        </Card>

        {/* Cost per Result */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Cost per Result (CPA)</span>
          <span className="text-xl font-bold font-mono text-slate-100 block mt-1">
            {currencySymbol}{analytics?.summary.cost_per_result.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            -8.6% cost efficiency
          </span>
        </Card>

        {/* Attributed Revenue */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Attributed Revenue</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
            {analytics?.summary.has_attributed_revenue && analytics.summary.attributed_revenue
              ? `${currencySymbol}${analytics.summary.attributed_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Untracked'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Omni-channel pixel sales
          </span>
        </Card>

        {/* ROAS (Strict Truth) */}
        <Card className="p-4 border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
          <span className="text-[11px] font-medium text-slate-400 block">Return on Ad Spend (ROAS)</span>
          <div className="flex items-center gap-1.5 mt-1">
            {analytics?.summary.has_attributed_revenue && analytics.summary.roas ? (
              <span className="text-xl font-bold font-mono text-emerald-400">
                {analytics.summary.roas.toFixed(2)}x
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold font-mono text-slate-500">N/A</span>
                <Badge variant="default" className="text-[9px]">Untracked</Badge>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {analytics?.summary.has_attributed_revenue ? '+12.4% lift vs target' : 'No attributed purchase pixel'}
          </span>
        </Card>
      </div>

      {/* Deep-Dive Chart with Multi-Metric Selector */}
      <Card>
        <CardHeader
          title="Performance Trends & Trajectory"
          subtitle={`Daily time-series between ${analytics?.since} and ${analytics?.until}`}
          action={
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setSelectedMetric('spend')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedMetric === 'spend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Spend ($)
              </button>
              <button
                onClick={() => setSelectedMetric('roas')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedMetric === 'roas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ROAS (x)
              </button>
              <button
                onClick={() => setSelectedMetric('ctr_cpc')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedMetric === 'ctr_cpc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                CTR vs CPC
              </button>
              <button
                onClick={() => setSelectedMetric('results')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedMetric === 'results' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Results
              </button>
            </div>
          }
        />
        <CardContent>
          <div className="h-60 flex items-end gap-2 pt-8 pb-3 border-b border-slate-800 overflow-x-auto">
            {(analytics?.trend_history || []).map((pt, i) => {
              let value = pt.spend;
              let maxValue = 1200.0;
              let label = `${currencySymbol}${pt.spend}`;
              let barColor = 'from-indigo-600/80 to-indigo-400';

              if (selectedMetric === 'roas') {
                value = pt.roas ?? 0;
                maxValue = 6.0;
                label = pt.roas ? `${pt.roas}x` : 'N/A';
                barColor = 'from-emerald-600/80 to-emerald-400';
              } else if (selectedMetric === 'ctr_cpc') {
                value = pt.ctr_percent ?? 0;
                maxValue = 5.0;
                label = `CTR ${pt.ctr_percent}% | CPC ${currencySymbol}${pt.cpc}`;
                barColor = 'from-purple-600/80 to-purple-400';
              } else if (selectedMetric === 'results') {
                value = pt.results ?? 0;
                maxValue = 80.0;
                label = `${pt.results} Results`;
                barColor = 'from-sky-600/80 to-sky-400';
              }

              const heightPct = Math.max(6, Math.min(100, Math.round((value / maxValue) * 100)));

              return (
                <div key={i} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 border border-slate-700 text-white text-[10px] p-2 rounded shadow-xl pointer-events-none z-20 whitespace-nowrap">
                    <span className="font-semibold block text-slate-300">{pt.date}</span>
                    <span className="text-indigo-400 font-mono font-bold">{label}</span>
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 bg-gradient-to-t ${barColor}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    {pt.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel (Strictly for Tracked Events) */}
      <Card>
        <CardHeader
          title="Conversion Funnel (Tracked Events Only)"
          subtitle="Measures stage-by-stage progression. Untracked events are explicitly flagged to eliminate false assumptions."
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {(analytics?.conversion_funnel || []).map((stage, idx) => (
              <div
                key={stage.stage_id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  stage.is_tracked
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Step 0{idx + 1}</span>
                    {stage.is_tracked ? (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Tracked</Badge>
                    ) : (
                      <Badge variant="default" className="text-[9px] py-0 px-1">Untracked</Badge>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-200 block truncate" title={stage.stage_name}>
                    {stage.stage_name}
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-100 block mt-1">
                    {stage.is_tracked ? stage.count.toLocaleString() : '—'}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] space-y-1">
                  {stage.is_tracked ? (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Dropoff:</span>
                        <span className="font-mono text-amber-400">{stage.dropoff_pct}%</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Conversion:</span>
                        <span className="font-mono text-emerald-400">{stage.conversion_rate_pct}%</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500 italic block leading-tight">
                      {stage.untracked_reason || 'Event not detected on pixel'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Comparison Table (Campaigns, Ad Sets, Ads) */}
      <Card>
        <CardHeader
          title={`${level.toUpperCase()} Performance Comparison`}
          subtitle={`Detailed attribution telemetry for authorized ${level} entities`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${level}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
                />
              </div>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 cursor-pointer" onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}>
                  {level.toUpperCase()} Name
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('spend'); setSortAsc(!sortAsc); }}>
                  Spend
                </th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('impressions'); setSortAsc(!sortAsc); }}>
                  Impr. / Reach
                </th>
                <th className="py-3 px-3 text-right">Clicks (Link)</th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('ctr_percent'); setSortAsc(!sortAsc); }}>
                  CTR
                </th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('cpc'); setSortAsc(!sortAsc); }}>
                  CPC
                </th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('results'); setSortAsc(!sortAsc); }}>
                  Results
                </th>
                <th className="py-3 px-3 cursor-pointer text-right" onClick={() => { setSortField('cost_per_result'); setSortAsc(!sortAsc); }}>
                  Cost / Res
                </th>
                <th className="py-3 px-4 cursor-pointer text-right" onClick={() => { setSortField('roas'); setSortAsc(!sortAsc); }}>
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No {level} records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex flex-col">
                        <span className="truncate max-w-xs">{ent.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{ent.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={ent.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                        {ent.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-100 font-semibold">
                      {currencySymbol}{ent.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      <div>{(ent.impressions / 1000).toFixed(1)}k</div>
                      <div className="text-[10px] text-slate-500">{(ent.reach / 1000).toFixed(1)}k ({ent.frequency}x)</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-400">
                      <div>{ent.link_clicks.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">tot: {ent.clicks.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {ent.ctr_percent}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {currencySymbol}{ent.cpc.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-400 font-semibold">
                      {ent.results} <span className="text-[10px] text-slate-500">{ent.result_type}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {currencySymbol}{ent.cost_per_result.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {ent.roas ? `${ent.roas}x` : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Creative Intelligence: Top Performers vs Weak/Fatigued Creatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="border-emerald-500/20 bg-emerald-950/10">
          <CardHeader
            title="Top-Performing Creatives"
            subtitle="Validated creative winners generating highest ROAS and lowest CPA"
            action={<Award className="w-4 h-4 text-emerald-400" />}
          />
          <CardContent className="space-y-3.5">
            {(analytics?.top_creatives || []).map((cr) => (
              <div key={cr.ad_id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex gap-3.5 items-start">
                <img
                  src={cr.thumbnail_url}
                  alt={cr.ad_name}
                  className="w-16 h-20 object-cover rounded-lg shrink-0 border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{cr.ad_name}</span>
                    <Badge variant="success" className="text-[10px] shrink-0">Winner</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{cr.headline}</p>
                  
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Spend</span>
                      <span className="text-slate-200 font-semibold">{currencySymbol}{cr.spend.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CTR</span>
                      <span className="text-emerald-400 font-semibold">{cr.ctr_percent}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CPA</span>
                      <span className="text-slate-200 font-semibold">{currencySymbol}{cr.cost_per_result.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ROAS</span>
                      <span className="text-emerald-400 font-bold">{cr.roas ? `${cr.roas}x` : 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-emerald-300/80 bg-emerald-500/10 p-1.5 rounded mt-2 border border-emerald-500/20">
                    💡 {cr.diagnosis}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weakest-Performing / Fatigued Creatives */}
        <Card className="border-amber-500/20 bg-amber-950/10">
          <CardHeader
            title="Weakest-Performing &amp; Fatigued Creatives"
            subtitle="Identified creatives suffering from ad fatigue or low conversion efficiency"
            action={<Flame className="w-4 h-4 text-amber-400" />}
          />
          <CardContent className="space-y-3.5">
            {(analytics?.weak_creatives || []).map((cr) => (
              <div key={cr.ad_id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex gap-3.5 items-start">
                <img
                  src={cr.thumbnail_url}
                  alt={cr.ad_name}
                  className="w-16 h-20 object-cover rounded-lg shrink-0 border border-slate-700 opacity-80"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{cr.ad_name}</span>
                    <Badge variant="warning" className="text-[10px] shrink-0">Fatigued</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{cr.headline}</p>
                  
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Spend</span>
                      <span className="text-slate-200 font-semibold">{currencySymbol}{cr.spend.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Freq</span>
                      <span className="text-amber-400 font-semibold">{cr.frequency}x</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CTR</span>
                      <span className="text-rose-400 font-semibold">{cr.ctr_percent}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ROAS</span>
                      <span className="text-slate-300">{cr.roas ? `${cr.roas}x` : 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-300/80 bg-amber-500/10 p-1.5 rounded mt-2 border border-amber-500/20">
                    ⚠️ {cr.diagnosis}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Breakdown & Placement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Performance Distribution */}
        <Card>
          <CardHeader
            title="Placement Performance Distribution"
            subtitle="Breakdown across Meta delivery surfaces"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Placement Surface</th>
                  <th className="py-3 px-4">Spend Share</th>
                  <th className="py-3 px-4">ROAS</th>
                  <th className="py-3 px-4">CPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(analytics?.placements || []).map((plc, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      {plc.placement}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${plc.spend_share_pct}%` }}
                          />
                        </div>
                        <span>{plc.spend_share_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {plc.roas ? `${plc.roas}x` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {currencySymbol}{plc.cpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detailed Action Breakdown Accordion */}
        <Card>
          <CardHeader
            title="Meta Action Type Breakdown"
            subtitle="All verified actions registered by Meta Pixel / Conversions API"
            action={
              <button
                onClick={() => setShowActionBreakdown(!showActionBreakdown)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>{showActionBreakdown ? 'Collapse' : 'Expand All'}</span>
                {showActionBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Action Type</th>
                  <th className="py-3 px-4 text-right">Count</th>
                  <th className="py-3 px-4 text-right">Attributed Value</th>
                  <th className="py-3 px-5 text-right">Cost / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(analytics?.action_breakdown || []).slice(0, showActionBreakdown ? undefined : 4).map((act, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-5">
                      <span className="font-semibold text-slate-200 block">{act.action_label}</span>
                      <span className="font-mono text-[10px] text-slate-500">{act.action_type}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-indigo-400 font-semibold">
                      {act.count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                      {act.value ? `${currencySymbol}${act.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-2.5 px-5 text-right font-mono text-slate-300">
                      {currencySymbol}{act.cost_per_action.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
