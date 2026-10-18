import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import {
  CampaignDraft,
  MetaConnectionHealth,
  CampaignWorkflowStatus
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Activity,
  Key,
  RefreshCw,
  LogOut,
  Target,
  Image as ImageIcon,
  DollarSign,
  Clock,
  Sparkles,
  Sliders,
  Eye,
  Check
} from 'lucide-react';

export const CampaignsPage: React.FC<{ onOpenCreate: () => void }> = ({ onOpenCreate }) => {
  const { activeClient } = useClient();
  const [campaigns, setCampaigns] = useState<CampaignDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>('cmp_draft_901');

  // Meta Connection Health State
  const [health, setHealth] = useState<MetaConnectionHealth | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Approval Modal State
  const [selectedForApproval, setSelectedForApproval] = useState<CampaignDraft | null>(null);
  const [approvalReason, setApprovalReason] = useState('Director reviewed targeting, budget, and creative assets for Q4 launch.');
  const [confirmedBudget, setConfirmedBudget] = useState(false);
  const [approving, setApproving] = useState(false);

  // Activation Modal State
  const [selectedForActivation, setSelectedForActivation] = useState<CampaignDraft | null>(null);
  const [confirmedLiveActivation, setConfirmedLiveActivation] = useState(false);
  const [approverDeclaration, setApproverDeclaration] = useState('I hereby authorize live daily advertising spend on Meta.');
  const [activating, setActivating] = useState(false);

  // Push to Meta State
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);

  const fetchCampaignsAndHealth = async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const [campaignsData, healthData] = await Promise.all([
        api.getCampaigns(activeClient.id),
        api.getMetaHealth(activeClient.id)
      ]);
      setCampaigns(campaignsData);
      setHealth(healthData);
    } catch (err) {
      console.error("Error loading campaigns & health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndHealth();
  }, [activeClient]);

  // Request Approval
  const handleRequestApproval = async (campaignId: string) => {
    try {
      const updated = await api.requestCampaignApproval(campaignId);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert(`Request approval error: ${err.message || 'Validation failed'}`);
    }
  };

  // Sign & Grant Approval
  const handleExecuteApproval = async () => {
    if (!selectedForApproval) return;
    setApproving(true);
    try {
      const updated = await api.approveCampaign(selectedForApproval.id, approvalReason);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedForApproval(null);
    } catch (err: any) {
      alert(`Approval failed: ${err.message || 'Signature rejected'}`);
    } finally {
      setApproving(false);
    }
  };

  // Push Campaign to Meta (PAUSED)
  const handlePushToMeta = async (campaign: CampaignDraft) => {
    setPushingId(campaign.id);
    try {
      const updated = await api.pushCampaignToMeta(campaign.id, `idem_${campaign.id}_${Date.now()}`);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert(`Meta Push error: ${err.message || 'API error'}`);
    } finally {
      setPushingId(null);
    }
  };

  // Execute Live Activation
  const handleExecuteActivation = async () => {
    if (!selectedForActivation) return;
    setActivating(true);
    try {
      const updated = await api.activateCampaign(selectedForActivation.id, {
        confirm_activation: confirmedLiveActivation,
        confirmed_daily_budget: selectedForActivation.daily_budget_usd,
        approver_declaration: approverDeclaration
      });
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedForActivation(null);
    } catch (err: any) {
      alert(`Activation failed: ${err.message || 'Server rejected activation'}`);
    } finally {
      setActivating(false);
    }
  };

  // Emergency Pause
  const handlePauseCampaign = async (campaignId: string) => {
    setPausingId(campaignId);
    try {
      const updated = await api.pauseCampaign(campaignId);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert(`Pause error: ${err.message}`);
    } finally {
      setPausingId(null);
    }
  };

  // Disconnect Meta
  const handleDisconnect = async () => {
    if (!activeClient) return;
    if (!confirm('Are you sure you want to disconnect this Meta Ad Account? This will revoke access tokens immediately.')) return;
    setDisconnecting(true);
    try {
      await api.disconnectMeta(activeClient.id);
      if (health) setHealth({ ...health, is_connected: false, health_status: 'DISCONNECTED' });
      alert('Meta connection successfully disconnected and token revoked.');
    } catch (err: any) {
      alert(`Disconnect error: ${err.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  const getWorkflowBadge = (status?: CampaignWorkflowStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="default" size="sm">1. DRAFT</Badge>;
      case 'VALIDATED':
        return <Badge variant="info" size="sm">2. VALIDATED</Badge>;
      case 'APPROVAL_PENDING':
        return <Badge variant="warning" size="sm">3. APPROVAL PENDING</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">4. APPROVED</Badge>;
      case 'PAUSED_IN_META':
        return <Badge variant="purple" size="sm">5. PAUSED IN META</Badge>;
      case 'ACTIVATION_PENDING':
        return <Badge variant="warning" size="sm">6. ACTIVATION PENDING</Badge>;
      case 'ACTIVE':
        return <Badge variant="success" size="sm">7. ACTIVE (SPENDING)</Badge>;
      default:
        return <Badge variant="default" size="sm">DRAFT</Badge>;
    }
  };

  if (!activeClient) return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-indigo-400" />
              <span>Official Meta Campaign Management</span>
            </h1>
            <Badge variant="purple">Meta Graph API v21.0</Badge>
            <Badge variant="default">Mode: Demo / Official API</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build 4-tier hierarchies (Campaign → Ad Set → Creative → Ad) with strict initial <span className="font-mono text-amber-400">PAUSED</span> status, cryptographic approval hashing, and authorized activation guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={<Activity className="w-4 h-4 text-emerald-400" />}
            onClick={() => setHealthModalOpen(true)}
          >
            Connection Health
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={onOpenCreate}
          >
            New Campaign Builder
          </Button>
        </div>
      </div>

      {/* Connection & Account Health Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Advertising Account:</span>
            <span className="font-mono text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {activeClient.meta_ad_account_id || 'act_4829104820'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Currency:</span>
            <span className="font-bold text-slate-200">{health?.account_currency || 'USD'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Timezone:</span>
            <span className="text-slate-200">{health?.account_timezone || 'America/Los_Angeles'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Connection Health:</span>
            <Badge variant={health?.is_connected ? 'success' : 'danger'} size="sm">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${health?.is_connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {health?.health_status || 'HEALTHY'}
              </span>
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px]">{health?.token_masked || 'EAAC••••••••7890'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setHealthModalOpen(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> Inspect Token &amp; Scopes
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      </div>

      {/* Safety Notice Callout */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-200 block">Strict Safe-Spend Guardrail Active</span>
          <p className="text-slate-400 mt-0.5">
            Every newly pushed campaign, ad set, and creative is created strictly in <strong className="text-amber-400 font-mono">PAUSED</strong> status. If campaign settings are modified after sign-off, approval is automatically revoked. No AI recommendation can activate live spending without fresh, explicit human authorization.
          </p>
        </div>
      </div>

      {/* Main Campaign Management Table */}
      <Card>
        <CardHeader
          title={`Managed Meta Campaigns (${campaigns.length})`}
          subtitle={`Account: ${activeClient.name} • Safe Pacing & Approval Hash Enforcement`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Campaign Name &amp; Hierarchy</th>
                <th className="py-3 px-4">Objective</th>
                <th className="py-3 px-4">Daily Budget</th>
                <th className="py-3 px-4">Meta Delivery</th>
                <th className="py-3 px-4">Workflow Pipeline</th>
                <th className="py-3 px-4">Security Clearance</th>
                <th className="py-3 px-5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {campaigns.map(cmp => {
                const isExpanded = expandedCampaignId === cmp.id;
                return (
                  <React.Fragment key={cmp.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedCampaignId(isExpanded ? null : cmp.id)}
                          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{cmp.name}</span>
                          {cmp.needs_reapproval && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-normal">
                              Settings Mutated
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {cmp.meta_campaign_id || 'meta_unregistered_draft'} • {cmp.ad_sets?.length || cmp.ad_sets_count || 1} Ad Sets • {cmp.creatives?.length || cmp.creatives_count || 1} Creatives
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <Badge variant="default" size="sm">{cmp.objective}</Badge>
                      </td>

                      <td className="py-4 px-4 font-mono font-semibold text-slate-100">
                        ${cmp.daily_budget_usd.toFixed(2)}/day
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant={cmp.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {cmp.status === 'ACTIVE' ? (
                            <span className="flex items-center gap-1">
                              <Play className="w-2.5 h-2.5 fill-current" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Pause className="w-2.5 h-2.5 fill-current" /> Paused
                            </span>
                          )}
                        </Badge>
                      </td>

                      <td className="py-4 px-4">
                        {getWorkflowBadge(cmp.workflow_status)}
                      </td>

                      <td className="py-4 px-4">
                        {cmp.is_approved ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[130px]" title={cmp.approved_payload_hash || cmp.approval_signature || ''}>
                              Hash: {cmp.approved_payload_hash?.slice(0, 10)}...
                            </div>
                          </div>
                        ) : cmp.needs_reapproval ? (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Re-approval Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <Lock className="w-3.5 h-3.5" /> Pending Sign-off
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. Request Approval if Draft or Validated */}
                          {(!cmp.workflow_status || cmp.workflow_status === 'DRAFT' || cmp.workflow_status === 'VALIDATED') && !cmp.is_approved && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRequestApproval(cmp.id)}
                            >
                              Request Approval
                            </Button>
                          )}

                          {/* 2. Approve Draft if pending */}
                          {(!cmp.is_approved || cmp.workflow_status === 'APPROVAL_PENDING' || cmp.needs_reapproval) && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                              onClick={() => {
                                setSelectedForApproval(cmp);
                                setConfirmedBudget(false);
                              }}
                            >
                              Review &amp; Approve
                            </Button>
                          )}

                          {/* 3. Push to Meta if Approved but not in Meta */}
                          {cmp.is_approved && cmp.workflow_status === 'APPROVED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              isLoading={pushingId === cmp.id}
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                              onClick={() => handlePushToMeta(cmp)}
                            >
                              Push to Meta (PAUSED)
                            </Button>
                          )}

                          {/* 4. Go Live Activation */}
                          {cmp.is_approved && cmp.status === 'PAUSED' && (cmp.workflow_status === 'PAUSED_IN_META' || cmp.workflow_status === 'ACTIVATION_PENDING') && (
                            <Button
                              variant="success"
                              size="sm"
                              icon={<Play className="w-3 h-3 fill-current" />}
                              onClick={() => {
                                setSelectedForActivation(cmp);
                                setConfirmedLiveActivation(false);
                              }}
                            >
                              Activate Live
                            </Button>
                          )}

                          {/* 5. Emergency Pause if Active */}
                          {cmp.status === 'ACTIVE' && (
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={pausingId === cmp.id}
                              icon={<Pause className="w-3.5 h-3.5" />}
                              onClick={() => handlePauseCampaign(cmp.id)}
                            >
                              Emergency Pause
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED 4-TIER HIERARCHY ACCORDION */}
                    {isExpanded && (
                      <tr className="bg-slate-900/60 border-y border-slate-800">
                        <td colSpan={8} className="p-4 pl-12 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                              <Layers className="w-4 h-4 text-indigo-400" />
                              Official 4-Tier Campaign Hierarchy Structure
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              SHA-256 Payload Hash: {cmp.current_payload_hash || 'Computed Deterministically'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            {/* Ad Sets Box */}
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                              <span className="font-bold text-purple-400 block text-[11px] uppercase tracking-wider">
                                Tier 2: Ad Set Configuration
                              </span>
                              {cmp.ad_sets && cmp.ad_sets.length > 0 ? (
                                cmp.ad_sets.map((s, idx) => (
                                  <div key={idx} className="space-y-1 text-[11px] text-slate-300">
                                    <div className="font-semibold text-slate-100">{s.name}</div>
                                    <div className="text-slate-400">Optimization: <span className="text-slate-200 font-mono">{s.optimization_goal}</span></div>
                                    <div className="text-slate-400">Destination: <span className="text-slate-200">{s.destination_type}</span></div>
                                    <div className="text-slate-400">Targeting: <span className="text-slate-200">{s.targeting.genders} • {s.targeting.age_min}-{s.targeting.age_max}</span></div>
                                    <div className="text-slate-400">Placements: <span className="text-slate-200">{s.placements.advantage_plus_placements ? 'Advantage+ Automatic' : 'Manual'}</span></div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 text-[11px]">1 Broad Ad Set with Advantage+ targeting</p>
                              )}
                            </div>

                            {/* Creatives Box */}
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                              <span className="font-bold text-sky-400 block text-[11px] uppercase tracking-wider">
                                Tier 3: Ad Creatives &amp; Identity
                              </span>
                              {cmp.creatives && cmp.creatives.length > 0 ? (
                                cmp.creatives.map((c, idx) => (
                                  <div key={idx} className="space-y-1 text-[11px] text-slate-300">
                                    <div className="font-semibold text-slate-100">"{c.headline}"</div>
                                    <p className="text-slate-400 line-clamp-2">{c.primary_text}</p>
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">CTA: {c.call_to_action}</span>
                                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{c.destination_url}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 text-[11px]">Default primary brand copy and video asset attached</p>
                              )}
                            </div>

                            {/* Ads & Status Box */}
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                              <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
                                Tier 4: Meta Ads Delivery
                              </span>
                              <div className="space-y-1.5 text-[11px] text-slate-300">
                                <div className="flex items-center justify-between">
                                  <span>Initial Status:</span>
                                  <Badge variant="warning" size="sm">Strictly PAUSED</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Account ID:</span>
                                  <span className="font-mono text-slate-200">{activeClient.meta_ad_account_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Approval Record:</span>
                                  <span className="text-slate-200">{cmp.is_approved ? 'Verified Active' : 'Sign-off Required'}</span>
                                </div>
                                {cmp.latest_approval && (
                                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                                    Approved by <span className="text-slate-300 font-mono">{cmp.latest_approval.approver_id}</span> on {new Date(cmp.latest_approval.approved_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: EXPLICIT APPROVAL SECURITY MODAL */}
      {selectedForApproval && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForApproval(null)}
          title="Grant Explicit Campaign Approval Sign-off"
          description="Enterprise security validation before Meta synchronization"
          maxWidth="lg"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForApproval(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!confirmedBudget}
                isLoading={approving}
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                onClick={handleExecuteApproval}
              >
                Sign &amp; Issue Approval Record
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Financial Spend Authorization</span>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  Approving <span className="font-semibold text-white">{selectedForApproval.name}</span> will authorize daily spending up to <span className="font-bold text-white">${selectedForApproval.daily_budget_usd.toFixed(2)}/day</span> on authorized ad account <span className="font-mono text-white">{activeClient.meta_ad_account_id}</span>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
              <div className="text-slate-400">Campaign Target: <span className="text-slate-200">{selectedForApproval.name}</span></div>
              <div className="text-slate-400">Objective: <span className="text-slate-200">{selectedForApproval.objective}</span></div>
              <div className="text-slate-400">Computed Payload Hash: <span className="text-indigo-400 font-bold">{selectedForApproval.current_payload_hash?.slice(0, 20)}...</span></div>
              <div className="text-slate-500 text-[10px]">Note: If any headlines, copy, targeting, or budget change in the future, this approval is automatically invalidated.</div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Approval Justification / Sign-off Notes
              </label>
              <textarea
                rows={2}
                value={approvalReason}
                onChange={e => setApprovalReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={confirmedBudget}
                onChange={e => setConfirmedBudget(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300 leading-snug">
                I explicitly verify that all ad creatives, landing page destinations, targeting parameters, and budget allocation have been verified and comply with Meta Advertising Standards.
              </span>
            </label>
          </div>
        </Modal>
      )}

      {/* MODAL 2: LIVE ACTIVATION SAFETY CONFIRMATION MODAL */}
      {selectedForActivation && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedForActivation(null)}
          title="Confirm Live Campaign Activation"
          description="Final authorized step: enables actual live delivery and spend on Meta"
          maxWidth="lg"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForActivation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                disabled={!confirmedLiveActivation}
                isLoading={activating}
                icon={<Play className="w-4 h-4 fill-current" />}
                onClick={handleExecuteActivation}
              >
                Authorize &amp; Go Live
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-bold block text-red-300">Live Ad Spend Warning</span>
                <p className="text-[11px] text-red-300/90 mt-0.5">
                  You are about to activate campaign <strong className="text-white">{selectedForActivation.name}</strong>. This switches delivery on Meta from <strong className="text-amber-400">PAUSED</strong> to <strong className="text-emerald-400">ACTIVE</strong>. Real advertising charges will be billed to account <span className="font-mono text-white">{activeClient.meta_ad_account_id}</span>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Ad Account:</span>
                <span className="text-slate-200">{activeClient.meta_ad_account_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Pacing:</span>
                <span className="text-emerald-400 font-bold">${selectedForActivation.daily_budget_usd.toFixed(2)} USD/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved Hash:</span>
                <span className="text-slate-200 truncate max-w-[200px]">{selectedForActivation.approved_payload_hash}</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Approver Formal Declaration
              </label>
              <input
                type="text"
                value={approverDeclaration}
                onChange={e => setApproverDeclaration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={confirmedLiveActivation}
                onChange={e => setConfirmedLiveActivation(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-300 leading-snug">
                I consciously authorize live spend activation. I acknowledge that MetaPilot AI never activates campaigns from AI recommendations alone without this human confirmation step.
              </span>
            </label>
          </div>
        </Modal>
      )}

      {/* MODAL 3: CONNECTION HEALTH INSPECTOR MODAL */}
      {healthModalOpen && health && (
        <Modal
          isOpen={true}
          onClose={() => setHealthModalOpen(false)}
          title="Meta Marketing API Connection Health"
          description="Detailed inspection of OAuth token permissions, scopes, and account status"
          maxWidth="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setHealthModalOpen(false)}>
              Close Inspector
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Connection Status:</span>
                <span className="font-bold text-emerald-400">{health.health_status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">API Version:</span>
                <span className="text-slate-200">{health.api_version}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Currency:</span>
                <span className="text-slate-200">{health.account_currency}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timezone:</span>
                <span className="text-slate-200">{health.account_timezone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Days to Token Expiry:</span>
                <span className="text-slate-200">{health.days_until_token_expiry || 74} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Status:</span>
                <span className="text-emerald-400">{health.account_status}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-200 block mb-2">Granted OAuth Permissions / Scopes</span>
              <div className="flex flex-wrap gap-2">
                {health.granted_scopes.map(scope => (
                  <span
                    key={scope}
                    className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md font-mono text-[11px] flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-[11px]">
              <p>
                Tokens are stored using AES-256 server encryption. The client application never accesses or logs raw OAuth secrets. Revoking permissions immediately invalidates API access.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
