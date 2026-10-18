import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import {
  BackgroundJob,
  PerformanceAnomaly,
  PerformanceReport,
  ActionValidationResponse
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Cpu,
  Clock,
  RefreshCw,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Video,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Calendar,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export const AutomationsPage: React.FC = () => {
  const { activeClient } = useClient();
  const [activeTab, setActiveTab] = useState<'reports' | 'jobs' | 'anomalies' | 'policies'>('reports');

  // Reports state
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PerformanceReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Background Jobs state
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  // Anomalies state
  const [anomalies, setAnomalies] = useState<PerformanceAnomaly[]>([]);

  // Policy Sandbox state
  const [sandboxAction, setSandboxAction] = useState<string>('ACTIVATE_CAMPAIGN');
  const [sandboxBudget, setSandboxBudget] = useState<number>(2000);
  const [sandboxApprovalRecord, setSandboxApprovalRecord] = useState<string>('appr_valid_record_01');
  const [validationResult, setValidationResult] = useState<ActionValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);

  // General loading & message state
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadData = async () => {
    if (!activeClient) return;
    try {
      setLoading(true);
      const [reportsData, jobsData, anomaliesData] = await Promise.all([
        api.getPerformanceReports(activeClient.id),
        api.getBackgroundJobs(activeClient.id),
        api.getPerformanceAnomalies(activeClient.id)
      ]);
      setReports(reportsData);
      if (reportsData.length > 0) {
        setSelectedReport(reportsData[0]);
      }
      setJobs(jobsData);
      setAnomalies(anomaliesData);
    } catch (err) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeClient?.id]);

  const handleGenerateReport = async () => {
    if (!activeClient) return;
    try {
      setGeneratingReport(true);
      setFeedbackMessage({ type: 'info', text: 'Generating weekly performance report with WoW analytics and 5 recommendations...' });
      const newReport = await api.generatePerformanceReport(activeClient.id);
      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      setFeedbackMessage({ type: 'success', text: `Weekly report ${newReport.id} successfully generated!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to generate report. Check background job status.' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadCsv = async (reportId: string) => {
    try {
      setFeedbackMessage({ type: 'info', text: 'Preparing CSV export...' });
      const csvText = await api.downloadReportCsv(reportId, activeClient?.id);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `metapilot_report_${reportId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedbackMessage({ type: 'success', text: 'CSV report downloaded successfully.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to download CSV.' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTriggerJob = async (jobType: string) => {
    if (!activeClient) return;
    try {
      setTriggeringJob(jobType);
      const idempotencyKey = `manual_${jobType}_${Date.now()}`;
      setFeedbackMessage({ type: 'info', text: `Triggering ${jobType} (idempotency key: ${idempotencyKey.slice(0, 18)}...)...` });
      const result = await api.triggerBackgroundJob(jobType, activeClient.id, idempotencyKey, true);
      setJobs(prev => prev.map(j => (j.job_type === jobType ? result : j)));
      setFeedbackMessage({ type: 'success', text: `Job executed with status: ${result.status}` });
      setTimeout(() => setFeedbackMessage(null), 3500);
      loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to trigger job.' });
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      setTriggeringJob(jobId);
      const result = await api.retryBackgroundJob(jobId);
      setJobs(prev => prev.map(j => (j.id === jobId ? result : j)));
      setFeedbackMessage({ type: 'success', text: `Job ${jobId} retried. New status: ${result.status}` });
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to retry job.' });
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleAcknowledgeAnomaly = async (anomalyId: string) => {
    try {
      const updated = await api.acknowledgeAnomaly(anomalyId, activeClient?.id);
      setAnomalies(prev => prev.map(a => (a.id === anomalyId ? updated : a)));
      setFeedbackMessage({ type: 'success', text: 'Anomaly acknowledged.' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to acknowledge anomaly.' });
    }
  };

  const handleValidateActionSandbox = async () => {
    if (!activeClient) return;
    try {
      setValidating(true);
      const response = await api.validateAction({
        action_type: sandboxAction,
        client_id: activeClient.id,
        requested_daily_budget: sandboxBudget,
        has_human_approval: sandboxApprovalRecord !== 'none',
        approval_record_id: sandboxApprovalRecord !== 'none' ? sandboxApprovalRecord : null
      });
      setValidationResult(response);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print Stylesheet injection for clean printable reports */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Automations & Reporting Hub
            </h1>
            <Badge variant="success" className="gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Server Scheduled
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated metric syncs, anomaly alarms, weekly executive reporting, and guarded approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generatingReport ? 'Generating...' : 'Run Weekly Report Now'}
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-200 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 no-print">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Executive Reports & History ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Background Jobs Engine ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'anomalies'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Performance Anomalies ({anomalies.filter(a => !a.acknowledged).length} active)
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'policies'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Approval Guardrails & Policy Matrix
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE REPORTS & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* History selector bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs text-slate-400 block">Select Historical Report Period:</span>
                <div className="flex items-center gap-2 mt-1">
                  {reports.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedReport?.id === rep.id
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {new Date(rep.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(rep.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedReport && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadCsv(selectedReport.id)}
                  className="gap-1.5 text-xs text-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs text-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export PDF
                </Button>
              </div>
            )}
          </div>

          {/* Report Content View */}
          {selectedReport ? (
            <div id="printable-report" className="space-y-6">
              {/* Report Header Card */}
              <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Official Weekly Performance Report
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {selectedReport.id}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                        Executive Marketing Performance Brief
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Client: <strong className="text-slate-200">{activeClient?.name}</strong> | Window:{' '}
                        {new Date(selectedReport.period_start).toLocaleDateString()} to{' '}
                        {new Date(selectedReport.period_end).toLocaleDateString()} | Generated at:{' '}
                        {new Date(selectedReport.generated_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Report Status</span>
                      <Badge variant="success" className="mt-1 font-semibold">
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Summary Markdown Narrative */}
                  <div className="mt-5 p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedReport.summary_markdown}
                  </div>
                </CardContent>
              </Card>

              {/* Week-over-Week KPI Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Spend */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Ad Spend</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      ${selectedReport.kpi_summary.current_period.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <span>vs ${selectedReport.kpi_summary.previous_period.spend.toFixed(0)}</span>
                      <span className="font-semibold text-indigo-400">
                        {selectedReport.kpi_summary.wow_change_pct.spend > 0 ? '+' : ''}
                        {selectedReport.kpi_summary.wow_change_pct.spend}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROAS */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Blended ROAS</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-emerald-400">
                      {selectedReport.kpi_summary.current_period.roas.toFixed(2)}x
                    </span>
                    <div className="flex items-center gap-1 text-[11px] mt-1">
                      <span className="text-slate-400">vs {selectedReport.kpi_summary.previous_period.roas.toFixed(2)}x</span>
                      <span className="font-semibold text-emerald-400 flex items-center">
                        <TrendingUp className="w-3 h-3 inline mr-0.5" />
                        +{selectedReport.kpi_summary.wow_change_pct.roas}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* CPA */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Cost / Acquisition</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      ${selectedReport.kpi_summary.current_period.cpa.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] mt-1">
                      <span className="text-slate-400">vs ${selectedReport.kpi_summary.previous_period.cpa.toFixed(2)}</span>
                      <span className="font-semibold text-emerald-400 flex items-center">
                        <TrendingDown className="w-3 h-3 inline mr-0.5" />
                        {selectedReport.kpi_summary.wow_change_pct.cpa}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conversions */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Conversions</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      {selectedReport.kpi_summary.current_period.conversions}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <span>vs {selectedReport.kpi_summary.previous_period.conversions}</span>
                      <span className="font-semibold text-emerald-400">
                        +{selectedReport.kpi_summary.wow_change_pct.conversions}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTR */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Link CTR</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      {selectedReport.kpi_summary.current_period.ctr_percent.toFixed(2)}%
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <span>vs {selectedReport.kpi_summary.previous_period.ctr_percent.toFixed(2)}%</span>
                      <span className="font-semibold text-indigo-400">
                        +{selectedReport.kpi_summary.wow_change_pct.ctr_percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Impressions */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Impressions</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      {(selectedReport.kpi_summary.current_period.impressions / 1000).toFixed(1)}k
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <span>+{(selectedReport.kpi_summary.wow_change_pct.impressions)}% YoY</span>
                    </div>
                  </div>
                </div>

                {/* Link Clicks */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Link Clicks</span>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-white">
                      {selectedReport.kpi_summary.current_period.link_clicks.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <span>+{selectedReport.kpi_summary.wow_change_pct.link_clicks}% WoW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Creatives */}
              <Card className="border-slate-800 bg-slate-900/40">
                <CardHeader className="py-4 px-6 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-white">Top Performing Creatives</h3>
                    </div>
                    <span className="text-xs text-slate-400">Sorted by verified ROAS</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800/40 text-slate-400 border-b border-slate-800 font-medium">
                        <tr>
                          <th className="py-3 px-6">Creative / Ad Name</th>
                          <th className="py-3 px-6">Spend</th>
                          <th className="py-3 px-6">CPA</th>
                          <th className="py-3 px-6 text-right">Attributed ROAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedReport.top_performing_creatives.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-800/20">
                            <td className="py-3 px-6 font-medium text-slate-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] flex items-center justify-center font-bold">
                                {i + 1}
                              </span>
                              {c.name}
                            </td>
                            <td className="py-3 px-6 text-slate-300">${c.spend.toFixed(2)}</td>
                            <td className="py-3 px-6 text-slate-300">${c.cpa.toFixed(2)}</td>
                            <td className="py-3 px-6 text-right font-bold text-emerald-400">{c.roas.toFixed(2)}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Prioritized 5 Recommendations Section */}
              <Card className="border-slate-800 bg-slate-900/40">
                <CardHeader className="py-4 px-6 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-white">
                        Five Prioritized Next Actions ({selectedReport.prioritized_recommendations.length})
                      </h3>
                    </div>
                    <Badge variant="warning" className="text-[10px]">
                      Approval Required Before Execution
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {selectedReport.prioritized_recommendations.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                            #{rec.priority || idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">{rec.title}</span>
                          <Badge variant="default" className="text-[10px]">
                            {rec.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{rec.recommended_action}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            Confidence:{' '}
                            <strong className="text-slate-300 font-medium">{rec.confidence_level}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Risk: <strong className="text-slate-300 font-medium">{rec.risk}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Impact:{' '}
                            <strong className="text-emerald-400 font-medium">
                              {rec.impact_estimate?.estimated_change_range || 'Directional lift'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {rec.approval_required ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Needs Approval
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Auto-Approved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No historical report generated yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Trigger the weekly performance report job to generate the first comprehensive client brief.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                className="mt-4 text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                Generate First Report Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BACKGROUND JOBS ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Server-Side Execution Guarantee:</strong> All scheduled jobs run on reliable cloud infrastructure via FastAPI background tasks and cron workers, completely decoupled from user browser sessions or local laptops. Duplicate executions are prevented via UUID idempotency hashes.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <Card key={job.id} className="border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{job.schedule_cron}</span>
                    <Badge
                      variant={
                        job.status === 'COMPLETED'
                          ? 'success'
                          : job.status === 'RUNNING'
                          ? 'warning'
                          : job.status === 'FAILED'
                          ? 'danger'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-2">{job.name}</h3>
                  <span className="text-xs text-slate-400 block mt-0.5">{job.cadence}</span>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Last Run:</span>
                      <span className="text-slate-300">
                        {job.last_run_at ? new Date(job.last_run_at).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Run:</span>
                      <span className="text-slate-300">
                        {job.next_run_at ? new Date(job.next_run_at).toLocaleTimeString() : 'Scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Execution Duration:</span>
                      <span className="text-slate-300 font-mono">
                        {job.execution_duration_sec ? `${job.execution_duration_sec}s` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retry Attempts:</span>
                      <span className="text-slate-300 font-mono">
                        {job.retry_count} / {job.max_retries}
                      </span>
                    </div>
                  </div>

                  {job.error_details && (
                    <div className="mt-3 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400">
                      Error: {job.error_details}
                    </div>
                  )}

                  {job.result_summary && (
                    <div className="mt-3 p-2 rounded bg-slate-800/50 border border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                      {Object.entries(job.result_summary).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize">{k.replace('_', ' ')}:</span>
                          <span className="font-semibold text-slate-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <div className="p-4 pt-0 border-t border-slate-800/40 mt-auto flex items-center justify-end gap-2">
                  {job.status === 'FAILED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetryJob(job.id)}
                      disabled={triggeringJob === job.id}
                      className="w-full text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retry Failed Job
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerJob(job.job_type)}
                      disabled={triggeringJob === job.job_type}
                      className="w-full text-xs text-slate-300 gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-indigo-400" />
                      {triggeringJob === job.job_type ? 'Executing...' : 'Run Now (Idempotent)'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PERFORMANCE ANOMALIES */}
      {/* ========================================================================= */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Automated anomaly detectors scan account performance against 7-day rolling baselines every morning.
            </p>
            <span className="text-xs text-slate-400">
              Total Recorded: <strong className="text-white">{anomalies.length}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">All Metrics Normal</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  No statistical anomalies or performance deviations detected in the current window.
                </p>
              </div>
            ) : (
              anomalies.map(anom => (
                <div
                  key={anom.id}
                  className={`p-4 rounded-xl border transition-all ${
                    anom.acknowledged
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : anom.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          anom.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{anom.headline}</span>
                          <Badge
                            variant={anom.severity === 'CRITICAL' ? 'danger' : 'warning'}
                            className="text-[10px]"
                          >
                            {anom.severity}
                          </Badge>
                          <Badge variant="default" className="text-[10px]">
                            {anom.metric}
                          </Badge>
                          {anom.acknowledged && (
                            <span className="text-[10px] text-emerald-400 font-medium">✓ Acknowledged</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{anom.explanation}</p>

                        {/* Supporting metrics breakdown */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">
                            Current Value: <strong className="text-white font-mono">{anom.current_value}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">
                            Benchmark: <strong className="text-white font-mono">{anom.benchmark_value}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800/80">
                            Change:{' '}
                            <strong
                              className={`font-mono font-bold ${
                                anom.percentage_change > 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {anom.percentage_change > 0 ? '+' : ''}
                              {anom.percentage_change}%
                            </strong>
                          </span>
                          <span className="text-slate-500">
                            Detected: {new Date(anom.detected_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!anom.acknowledged ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAnomaly(anom.id)}
                          className="text-xs text-slate-200 hover:text-white"
                        >
                          Acknowledge
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Ack at {anom.acknowledged_at ? new Date(anom.acknowledged_at).toLocaleTimeString() : 'Recorded'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: APPROVAL GUARDRAILS & POLICY MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Policy Overview Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="py-4 px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Autonomous Actions (Permitted Automatically)</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <strong className="text-emerald-400 block mb-0.5">Market & Competitor Research:</strong>
                  Periodic Ad Library scraping, observational logging, and keyword analysis run safely on cron without live Meta mutations.
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <strong className="text-emerald-400 block mb-0.5">Performance Analysis & Recommendations:</strong>
                  LangGraph 8-step engine generates candidate next actions and scores bottlenecks autonomously.
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <strong className="text-emerald-400 block mb-0.5">Draft Creation (Paused by Default):</strong>
                  Campaign and Reel drafts are created in strictly PAUSED status. No spend is incurred without client approval.
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="py-4 px-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Guarded Actions (Strict Human Approval Required)</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <strong className="text-amber-400 block mb-0.5">Campaign Activation on Meta:</strong>
                  Changing campaign status to ACTIVE requires a cryptographic SHA-256 signed approval record.
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <strong className="text-amber-400 block mb-0.5">Instagram Reel Publishing:</strong>
                  Public broadcast to client Instagram professional accounts requires explicit user review.
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <strong className="text-amber-400 block mb-0.5">Server-Side Budget Enforcement:</strong>
                  Daily budget limit of <strong className="text-white">${((activeClient?.monthly_budget_usd || 25000) / 15).toFixed(2)}</strong> is strictly enforced. Any mutation exceeding this ceiling is rejected server-side.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Server-Side Policy Sandbox */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="py-4 px-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Live Guardrail Policy Validator Sandbox</h3>
                </div>
                <span className="text-xs text-slate-400">Tests backend /validate-action endpoint</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs text-slate-400 mb-4">
                Test any action against server-side authorization boundaries, client budget limits, and approval record TTL validity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Action</label>
                  <select
                    value={sandboxAction}
                    onChange={e => setSandboxAction(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="ACTIVATE_CAMPAIGN">ACTIVATE_CAMPAIGN (Restricted)</option>
                    <option value="PUBLISH_REEL_INSTAGRAM">PUBLISH_REEL_INSTAGRAM (Restricted)</option>
                    <option value="SCALE_BUDGET">SCALE_BUDGET (Restricted)</option>
                    <option value="GENERATE_RECOMMENDATIONS">GENERATE_RECOMMENDATIONS (Autonomous)</option>
                    <option value="FETCH_INSIGHTS">FETCH_INSIGHTS (Autonomous)</option>
                    <option value="CREATE_CAMPAIGN_DRAFT">CREATE_CAMPAIGN_DRAFT (Autonomous)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Requested Daily Budget ($) [Limit: ${((activeClient?.monthly_budget_usd || 25000) / 15).toFixed(0)}]
                  </label>
                  <input
                    type="number"
                    value={sandboxBudget}
                    onChange={e => setSandboxBudget(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Human Approval Token</label>
                  <select
                    value={sandboxApprovalRecord}
                    onChange={e => setSandboxApprovalRecord(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs"
                  >
                    <option value="appr_valid_record_01">Valid Active Approval (appr_valid_01)</option>
                    <option value="appr_expired_record_99">Expired Approval (appr_expired_99)</option>
                    <option value="none">No Approval Provided (null)</option>
                  </select>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleValidateActionSandbox}
                disabled={validating}
                className="text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                {validating ? 'Evaluating...' : 'Evaluate Policy in Server Sandbox'}
              </Button>

              {/* Validation Result Box */}
              {validationResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                    validationResult.allowed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    {validationResult.allowed ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>Action Allowed by Server Policies</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <span>Action Blocked by Server Safety Guardrail</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-200">{validationResult.reason}</p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-slate-400 block">Requires Approval:</span>
                      <strong className="text-white">{String(validationResult.requires_human_approval)}</strong>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-slate-400 block">Daily Limit:</span>
                      <strong className="text-white">${validationResult.client_daily_budget_limit_usd.toFixed(2)}</strong>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-slate-400 block">Budget Exceeded:</span>
                      <strong className={validationResult.budget_limit_exceeded ? 'text-rose-400' : 'text-emerald-400'}>
                        {String(validationResult.budget_limit_exceeded)}
                      </strong>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded">
                      <span className="text-slate-400 block">Approval Expired:</span>
                      <strong className={validationResult.approval_expired ? 'text-rose-400' : 'text-emerald-400'}>
                        {String(validationResult.approval_expired)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
