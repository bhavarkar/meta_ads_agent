import React, { useEffect, useState } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import { AnalyticsData, CampaignDraft, AIRecommendation } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  DollarSign,
  TrendingUp,
  Target,
  MousePointer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Video,
  Lightbulb,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenCreateCampaign: () => void;
  onOpenUploadReel: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateCampaign,
  onOpenUploadReel
}) => {
  const { activeClient } = useClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignDraft[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClient) return;
    setLoading(true);
    Promise.all([
      api.getAnalytics(activeClient.id),
      api.getCampaigns(activeClient.id),
      api.getRecommendations(activeClient.id)
    ])
      .then(([aData, cData, rData]) => {
        setAnalytics(aData);
        setCampaigns(cData);
        setRecommendations(rData.recommendations);
      })
      .finally(() => setLoading(false));
  }, [activeClient]);

  if (!activeClient) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner with Client Health and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Account Overview
            </span>
            <Badge variant="purple" size="sm">
              Target ROAS: {activeClient.target_roas_goal}x
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{activeClient.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ad Account: <span className="font-mono text-slate-300">{activeClient.meta_ad_account_id}</span> • Instagram: <span className="text-slate-300">{activeClient.instagram_handle || 'Not connected'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={() => onNavigate('strategy')}
          >
            AI Strategy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Video className="w-3.5 h-3.5 text-emerald-400" />}
            onClick={onOpenUploadReel}
          >
            New Reel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={onOpenCreateCampaign}
          >
            Draft Campaign
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: 14D Spend */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">14-Day Spend</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">
              ${analytics?.summary.total_spend.toLocaleString() || '12,180'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +6.8%
              </span>
              <span className="text-slate-500">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Average ROAS */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Blended ROAS</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {analytics?.summary.roas || '4.35'}x
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.4%
              </span>
              <span className="text-slate-500">above {activeClient.target_roas_goal}x target</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Cost Per Acquisition (CPA) */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Cost Per Acquisition (CPA)</span>
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-500">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">
              ${analytics?.summary.cpa || '17.65'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -8.6%
              </span>
              <span className="text-slate-500">efficiency improving</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Click-Through Rate (CTR) */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Link CTR</span>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <MousePointer className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100">
              {analytics?.summary.ctr_percent || '2.42'}%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-slate-300 font-medium">
                {analytics?.summary.clicks.toLocaleString() || '22,530'} clicks
              </span>
              <span className="text-slate-500">at ${analytics?.summary.cpc || '0.54'} CPC</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Performance Chart & Top AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: ROAS Performance & Daily Spend Trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="ROAS & Daily Spend Trajectory"
            subtitle="14-day chronological performance across authorized Meta campaigns"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('analytics')}>
                Full Analytics →
              </Button>
            }
          />
          <CardContent>
            {analytics?.trend_history && (
              <div className="space-y-4">
                {/* Visual Chart Bars */}
                <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
                  {analytics.trend_history.map((point, i) => {
                    const maxRoas = 5.0;
                    const heightPct = Math.min(100, Math.round(((point.roas ?? 0) / maxRoas) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-800 text-white text-[10px] p-1.5 rounded shadow pointer-events-none z-10 whitespace-nowrap">
                          {point.date}: {point.roas ? `${point.roas}x` : 'N/A'} ROAS (${point.spend})
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600/70 to-indigo-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] text-slate-500 truncate w-full text-center">
                          {point.date.replace('Day ', 'D')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend & Summary */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                      <span>ROAS Performance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                      <span>Target Baseline ({activeClient.target_roas_goal}x)</span>
                    </div>
                  </div>
                  <span className="text-amber-400/90 text-[11px] font-medium">
                    ⚡ Advantage+ Reels driving 52% of total conversions
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Col: Priority 1 AI Recommendation Spotlight */}
        <Card className="flex flex-col justify-between border-indigo-900/40 bg-gradient-to-b from-indigo-950/20 to-slate-900">
          <CardHeader
            title="Top Priority AI Opportunity"
            subtitle="Prioritized by predicted marginal ROAS impact"
            action={<Badge variant="purple" size="sm">Priority #1</Badge>}
          />
          <CardContent className="space-y-4">
            {recommendations.length > 0 ? (
              <>
                <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/90 border border-indigo-800/60 px-2 py-0.5 rounded">
                      {recommendations[0].category}
                    </span>
                    {recommendations[0].approval_required && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                        Requires Approval
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                    <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{recommendations[0].title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {recommendations[0].problem_identified || recommendations[0].diagnosis}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Projected ROAS Lift</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      +{recommendations[0].projected_roas_lift}x
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Confidence Score</span>
                    <span className="text-indigo-400 font-bold text-sm">
                      {recommendations[0].confidence_score_pct}%
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="sm"
                    onClick={() => onNavigate('recommendations')}
                  >
                    View All 5 Recommendations →
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Loading recommendations...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Campaign Drafts & Safety Status */}
      <Card>
        <CardHeader
          title="Active & Guarded Campaign Drafts"
          subtitle="All new campaigns are initialized with PAUSED safety enforcement"
          action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate('campaigns')}>
              Manage All Drafts →
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Campaign Name</th>
                <th className="py-3 px-4">Objective</th>
                <th className="py-3 px-4">Daily Budget</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4">Approval State</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campaigns.slice(0, 3).map(cmp => (
                <tr key={cmp.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-5 font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>{cmp.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{cmp.objective}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    ${cmp.daily_budget_usd}/day
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={cmp.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {cmp.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {cmp.is_approved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                        Approval Required
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('campaigns')}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
