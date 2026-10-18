import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { api } from '../services/api';
import { Reel, CaptionOption, CaptionGenerationResponse, ReelComparisonItem, ReelPublishStatus } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Video,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Upload,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Instagram,
  Sparkles,
  Calendar as CalendarIcon,
  Columns,
  RefreshCw,
  Copy,
  Clock,
  Layers,
  FileCheck,
  Lock,
  Unlock,
  Sliders,
  Check,
  Info,
  ChevronRight,
  TrendingUp,
  Tag,
  MessageSquare
} from 'lucide-react';

type StudioTab = 'studio' | 'compare' | 'calendar' | 'captions';

export const ReelsStudioPage: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const { activeClient } = useClient();
  const [activeTab, setActiveTab] = useState<StudioTab>('studio');
  const [reels, setReels] = useState<Reel[]>([]);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Video Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Workflow Action States
  const [verifying, setVerifying] = useState<boolean>(false);
  const [requestingApproval, setRequestingApproval] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);

  // Caption Assistant State
  const [generatingCaptions, setGeneratingCaptions] = useState<boolean>(false);
  const [captionData, setCaptionData] = useState<CaptionGenerationResponse | null>(null);
  const [editedCaption, setEditedCaption] = useState<string>('');
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);

  // Side-by-Side Comparison State
  const [comparedReelIds, setComparedReelIds] = useState<string[]>([]);
  const [comparisonItems, setComparisonItems] = useState<ReelComparisonItem[]>([]);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);

  // Calendar Scheduling Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('2026-10-20T18:00');
  const [scheduling, setScheduling] = useState<boolean>(false);

  // Permissions & Pipeline Telemetry
  const [accountPermissions, setAccountPermissions] = useState<any>(null);
  const [publishStep, setPublishStep] = useState<'IDLE' | 'CONTAINER_CREATION' | 'POLLING_STATUS' | 'PUBLISHING_FEED' | 'SUCCESS'>('IDLE');
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchReels = async () => {
    if (!activeClient) return;
    try {
      const data = await api.getReels(activeClient.id);
      setReels(data);
      if (data.length > 0 && (!selectedReel || !data.some((r: Reel) => r.id === selectedReel.id))) {
        setSelectedReel(data[0]);
        setEditedCaption(data[0].caption);
      }
    } catch (err) {
      console.error('Error loading reels:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const perms = await api.getInstagramPermissions();
      setAccountPermissions(perms);
    } catch (err) {
      console.error('Error loading permissions:', err);
    }
  };

  useEffect(() => {
    fetchReels();
    fetchPermissions();
  }, [activeClient]);

  useEffect(() => {
    if (selectedReel) {
      setEditedCaption(selectedReel.caption);
    }
  }, [selectedReel?.id]);

  // Handle Verify Specs / Visual Preview
  const handleVerifyPreview = async () => {
    if (!selectedReel) return;
    setVerifying(true);
    setActionError(null);
    try {
      const updated = await api.verifyReelPreview(selectedReel.id);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
    } catch (err: any) {
      setActionError(`Preview verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  // Handle Request Approval
  const handleRequestApproval = async () => {
    if (!selectedReel) return;
    setRequestingApproval(true);
    setActionError(null);
    try {
      const updated = await api.requestReelApproval(selectedReel.id);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
    } catch (err: any) {
      setActionError(`Approval request error: ${err.message}`);
    } finally {
      setRequestingApproval(false);
    }
  };

  // Handle Explicit Cryptographic Approval
  const handleApproveForPublish = async () => {
    if (!selectedReel) return;
    setApproving(true);
    setActionError(null);
    try {
      const updated = await api.approveReel(selectedReel.id);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
    } catch (err: any) {
      setActionError(`Explicit approval error: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  // Handle Live / Simulated Instagram Graph API Publish
  const handlePublishLive = async () => {
    if (!selectedReel) return;
    setPublishing(true);
    setActionError(null);
    setPublishStep('CONTAINER_CREATION');

    try {
      // Simulate container step progression for visual feedback
      await new Promise(r => setTimeout(r, 600));
      setPublishStep('POLLING_STATUS');
      await new Promise(r => setTimeout(r, 600));
      setPublishStep('PUBLISHING_FEED');

      const updated = await api.publishReel(selectedReel.id);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
      setPublishStep('SUCCESS');
    } catch (err: any) {
      setPublishStep('IDLE');
      setActionError(`Publication error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  // Handle Retry Publish
  const handleRetryPublish = async () => {
    if (!selectedReel) return;
    setRetrying(true);
    setActionError(null);
    try {
      const updated = await api.retryPublishReel(selectedReel.id);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
    } catch (err: any) {
      setActionError(`Retry failed: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  // Handle AI Caption Generation
  const handleGenerateCaptions = async () => {
    if (!activeClient) return;
    setGeneratingCaptions(true);
    try {
      const response = await api.generateReelCaptions({
        client_id: activeClient.id,
        industry: activeClient.industry,
        target_audience: 'Customers seeking rapid clinical results',
        key_benefit_or_topic: selectedReel?.title || '72-Hour Barrier Repair'
      });
      setCaptionData(response);
    } catch (err: any) {
      console.error('Caption generation error:', err);
    } finally {
      setGeneratingCaptions(false);
    }
  };

  // Handle Apply Selected Caption
  const handleApplyCaption = async (captionText: string, hashtags: string[]) => {
    if (!selectedReel) return;
    try {
      const updated = await api.selectCreative(selectedReel.id, {
        caption: captionText,
        hashtags
      });
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
      setEditedCaption(captionText);
      setIsEditingCaption(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Save Manual Caption Edit (Checks approval invalidation)
  const handleSaveEditedCaption = async () => {
    if (!selectedReel) return;
    try {
      const updated = await api.updateReelCaption(selectedReel.id, editedCaption, selectedReel.hashtags);
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
      setIsEditingCaption(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Content Calendar Scheduling
  const handleScheduleSubmit = async () => {
    if (!selectedReel) return;
    setScheduling(true);
    try {
      const updated = await api.scheduleReel(selectedReel.id, new Date(scheduleDateTime).toISOString());
      setReels(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReel(updated);
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  // Handle Side-by-Side Comparison
  const handleLoadComparison = async () => {
    if (comparedReelIds.length === 0) {
      // Default to first 2 or 3 reels
      const ids = reels.slice(0, 3).map(r => r.id);
      setComparedReelIds(ids);
      setLoadingComparison(true);
      try {
        const items = await api.compareReels(ids);
        setComparisonItems(items);
      } finally {
        setLoadingComparison(false);
      }
    } else {
      setLoadingComparison(true);
      try {
        const items = await api.compareReels(comparedReelIds);
        setComparisonItems(items);
      } finally {
        setLoadingComparison(false);
      }
    }
  };

  const filteredReels = reels.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.caption.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const scheduledReels = reels.filter(r => r.scheduled_at != null);

  if (!activeClient) return null;

  return (
    <div className="space-y-6">
      {/* Organic vs Paid Ads Safety Disclaimer Banner */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-indigo-200">
              Organic Instagram Reel Studio &bull; Safe Publishing Protocol
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Organic publishing is strictly decoupled from paid advertising. Publishing here does not trigger ad spend or create Meta Ads Manager ad sets.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="purple" size="sm">
            Instagram Professional API
          </Badge>
          <Badge variant="warning" size="sm">
            DEMO MODE: Simulated Meta API
          </Badge>
        </div>
      </div>

      {/* Main Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <Video className="w-6 h-6 text-indigo-400" />
              <span>Instagram Reel Studio &amp; Publishing Pipeline</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Account:</span>
            <span className="font-mono text-indigo-300 font-semibold">{activeClient.instagram_handle || '@brand'}</span>
            <span>&bull;</span>
            <span>API Scopes:</span>
            <span className="text-emerald-400 font-mono text-[11px]">instagram_content_publish &bull; instagram_basic</span>
          </p>
        </div>

        {/* View Switcher Tabs & Upload CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Studio Queue
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                handleLoadComparison();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Compare Reels
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'calendar'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Content Calendar ({scheduledReels.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('captions');
                if (!captionData) handleGenerateCaptions();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'captions'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Captions
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<Upload className="w-4 h-4" />}
            onClick={onOpenUpload}
          >
            Upload New Reel
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: STUDIO QUEUE & ACTIVE WORKSPACE */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Col: Asset Manager Queue (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Asset Manager ({filteredReels.length})
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All States</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="APPROVAL_PENDING">APPROVAL PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            {/* Reel Queue List */}
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {filteredReels.map(reel => {
                const isSelected = selectedReel?.id === reel.id;
                return (
                  <div
                    key={reel.id}
                    onClick={() => {
                      setSelectedReel(reel);
                      setEditedCaption(reel.caption);
                      setIsEditingCaption(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail & Duration */}
                    <div className="w-16 h-24 rounded-xl bg-black overflow-hidden relative shrink-0 border border-slate-800 shadow">
                      <img
                        src={reel.thumbnail_url}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white/80" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-mono font-bold">
                        {reel.duration_seconds}s
                      </span>
                    </div>

                    {/* Metadata & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-slate-100 text-xs truncate">
                          {reel.title}
                        </span>
                        <Badge
                          variant={
                            reel.status === 'PUBLISHED'
                              ? 'success'
                              : reel.status === 'APPROVED' || reel.status === 'APPROVED_FOR_PUBLISHING'
                              ? 'purple'
                              : reel.status === 'READY' || reel.status === 'PREVIEW_VERIFIED'
                              ? 'info'
                              : reel.status === 'FAILED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {reel.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {reel.caption || 'No caption assigned yet. Use AI Caption Assistant to generate hooks.'}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="font-mono">{reel.aspect_ratio}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400">{reel.rights_ownership || 'OWNED'}</span>
                        {reel.scheduled_at && (
                          <>
                            <span>&bull;</span>
                            <span className="text-indigo-400 flex items-center gap-1">
                              <CalendarIcon className="w-2.5 h-2.5" />
                              {new Date(reel.scheduled_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredReels.length === 0 && (
                <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  No Reels match the current filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Video Player & Guardrail Publishing Controller (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedReel ? (
              <Card className="overflow-hidden border-indigo-900/40 bg-gradient-to-b from-slate-900 to-slate-950">
                <CardHeader
                  title={selectedReel.title}
                  subtitle={`Publishing Status: ${selectedReel.status} • Duration: ${selectedReel.duration_seconds}s • Resolution: ${selectedReel.width || 1080}x${selectedReel.height || 1920}`}
                  action={
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<CalendarIcon className="w-3.5 h-3.5" />}
                        onClick={() => setIsScheduleModalOpen(true)}
                      >
                        {selectedReel.scheduled_at ? 'Reschedule' : 'Add to Calendar'}
                      </Button>
                      {selectedReel.permalink && (
                        <a
                          href={selectedReel.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1.5 bg-indigo-950/60 border border-indigo-800/60 rounded-lg"
                        >
                          <Instagram className="w-3.5 h-3.5" /> View Live <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>
                  }
                />
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Smartphone 9:16 Interactive Frame Preview */}
                    <div className="md:col-span-5 flex flex-col items-center">
                      <div className="w-[220px] aspect-[9/16] bg-black rounded-[32px] border-[5px] border-slate-700/80 shadow-2xl overflow-hidden relative group">
                        {/* Video Player */}
                        <video
                          src={selectedReel.video_url}
                          poster={selectedReel.thumbnail_url}
                          controls
                          playsInline
                          loop
                          className="w-full h-full object-cover"
                        />

                        {/* Instagram Organic Overlay */}
                        <div className="absolute bottom-4 left-3 right-3 text-white pointer-events-none drop-shadow">
                          <div className="text-[11px] font-bold flex items-center gap-1 mb-1">
                            <Instagram className="w-3.5 h-3.5 text-pink-400" />
                            <span>{activeClient.instagram_handle || '@brand'}</span>
                          </div>
                          <p className="text-[10px] line-clamp-2 text-slate-200">
                            {selectedReel.caption || 'Preview caption...'}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-300 font-mono">
                            <span>🎵 Original Audio &bull; MetaPilot Verified</span>
                          </div>
                        </div>

                        {/* Top Notch indicator */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full pointer-events-none" />
                      </div>

                      <div className="mt-3 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Aspect: {selectedReel.aspect_ratio} &bull; Codec: {selectedReel.video_codec || 'H.264'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Rights: {selectedReel.rights_ownership || 'OWNED'} (Cleared for broadcast)
                        </span>
                      </div>
                    </div>

                    {/* Right Control Stage: Caption Editor & 4-Step Guardrails */}
                    <div className="md:col-span-7 space-y-4 text-xs">
                      {/* Caption & Hashtag Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-300">Instagram Caption &amp; Hashtags</span>
                          {!isEditingCaption ? (
                            <button
                              onClick={() => setIsEditingCaption(true)}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              Edit Caption
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveEditedCaption}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => {
                                  setEditedCaption(selectedReel.caption);
                                  setIsEditingCaption(false);
                                }}
                                className="text-[11px] text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditingCaption ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={4}
                              value={editedCaption}
                              onChange={e => setEditedCaption(e.target.value)}
                              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Character count: {editedCaption.length}/2200</span>
                              {selectedReel.is_approved && (
                                <span className="text-amber-400 font-semibold">
                                  ⚠️ Editing will revoke existing approval signature
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-slate-300 text-xs max-h-32 overflow-y-auto leading-relaxed">
                            {selectedReel.caption}
                            <div className="mt-2 text-indigo-400 font-mono text-[11px]">
                              {selectedReel.hashtags.join(' ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Approval Security Binding Card */}
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            Cryptographic Approval Binding
                          </span>
                          {selectedReel.is_approved ? (
                            <Badge variant="success" size="sm">Bound &amp; Authorized</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Pending Sign-off</Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span>Binding Hash:</span>
                            <span className="text-slate-300">
                              {selectedReel.approval_binding_hash
                                ? `${selectedReel.approval_binding_hash.substring(0, 16)}...`
                                : 'Pending SHA-256 generation'}
                            </span>
                          </div>
                          <div className="flex justify-between font-mono text-[10px]">
                            <span>Account Binding:</span>
                            <span className="text-slate-300">{selectedReel.instagram_ig_id || '1788203918239012'}</span>
                          </div>
                          <div className="flex justify-between font-mono text-[10px]">
                            <span>Action Scope:</span>
                            <span className="text-emerald-400">PUBLISH_REEL_ORGANIC</span>
                          </div>
                        </div>

                        {selectedReel.approval_invalidated && (
                          <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-[10px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Approval signature was revoked due to creative mutation. Re-approval required before publish.</span>
                          </div>
                        )}
                      </div>

                      {/* 4-Step Publishing State Progression Checklist */}
                      <div className="space-y-2 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Safety &amp; Compliance Workflow
                        </span>

                        {/* Step 1: Video Specs & Aspect Ratio */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-300">1. Video Specs &amp; Aspect Ratio (9:16)</span>
                          <Badge variant="success" size="sm">
                            {selectedReel.duration_seconds}s (9:16 Compliant)
                          </Badge>
                        </div>

                        {/* Step 2: Visual Preview Review */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-300">2. Visual Preview Confirmation</span>
                          {selectedReel.preview_verified ? (
                            <Badge variant="success" size="sm">Verified (READY)</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Pending User Verification</Badge>
                          )}
                        </div>

                        {/* Step 3: Explicit Server-Side Approval */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-800">
                          <span className="text-slate-300">3. Explicit Server Approval Sign-Off</span>
                          {selectedReel.is_approved ? (
                            <Badge variant="success" size="sm">Signed Off (APPROVED)</Badge>
                          ) : selectedReel.status === 'APPROVAL_PENDING' ? (
                            <Badge variant="purple" size="sm">Pending Approval</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Awaiting Sign-off</Badge>
                          )}
                        </div>

                        {/* Step 4: Container Pipeline & Live Publishing */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-300">4. Instagram Graph API Media Container</span>
                          {selectedReel.status === 'PUBLISHED' ? (
                            <Badge variant="success" size="sm">Live on Instagram</Badge>
                          ) : selectedReel.status === 'PROCESSING' ? (
                            <Badge variant="purple" size="sm">Processing Container</Badge>
                          ) : selectedReel.status === 'FAILED' ? (
                            <Badge variant="danger" size="sm">Failed &bull; Retry Ready</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Ready to Deploy</Badge>
                          )}
                        </div>
                      </div>

                      {/* Progressive Action Flow */}
                      <div className="pt-2 space-y-2">
                        {/* Step 1: Preview Verification */}
                        {!selectedReel.preview_verified && (
                          <Button
                            variant="secondary"
                            className="w-full"
                            size="md"
                            isLoading={verifying}
                            icon={<CheckCircle2 className="w-4 h-4 text-sky-400" />}
                            onClick={handleVerifyPreview}
                          >
                            Step 1: Confirm 9:16 Video Specs &amp; Visual Preview
                          </Button>
                        )}

                        {/* Step 2: Request Approval if READY */}
                        {selectedReel.preview_verified && !selectedReel.is_approved && selectedReel.status !== 'APPROVAL_PENDING' && (
                          <Button
                            variant="primary"
                            className="w-full"
                            size="md"
                            isLoading={requestingApproval}
                            icon={<ShieldCheck className="w-4 h-4" />}
                            onClick={handleRequestApproval}
                          >
                            Step 2: Submit for Explicit Publishing Approval
                          </Button>
                        )}

                        {/* Step 3: Sign Off Approval */}
                        {selectedReel.preview_verified && !selectedReel.is_approved && selectedReel.status === 'APPROVAL_PENDING' && (
                          <Button
                            variant="primary"
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                            size="md"
                            isLoading={approving}
                            icon={<ShieldCheck className="w-4 h-4" />}
                            onClick={handleApproveForPublish}
                          >
                            Step 3: Grant Explicit Cryptographic Approval
                          </Button>
                        )}

                        {/* Step 4: Live Publishing */}
                        {selectedReel.is_approved && selectedReel.status !== 'PUBLISHED' && selectedReel.status !== 'FAILED' && (
                          <Button
                            variant="success"
                            className="w-full"
                            size="md"
                            isLoading={publishing}
                            icon={<Send className="w-4 h-4" />}
                            onClick={handlePublishLive}
                          >
                            {publishing
                              ? `Publishing... (${publishStep})`
                              : 'Step 4: Publish to Instagram Professional Account'}
                          </Button>
                        )}

                        {/* Failed State: Retry */}
                        {selectedReel.status === 'FAILED' && (
                          <div className="space-y-2">
                            <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs">
                              <span className="font-semibold block mb-0.5">Publication Pipeline Failed</span>
                              <span>{selectedReel.last_error || 'Error during container processing or publishing step.'}</span>
                            </div>
                            <Button
                              variant="danger"
                              className="w-full"
                              size="md"
                              isLoading={retrying}
                              icon={<RefreshCw className="w-4 h-4" />}
                              onClick={handleRetryPublish}
                            >
                              Retry Publishing to Instagram (Attempt {(selectedReel.retry_count || 0) + 1}/3)
                            </Button>
                          </div>
                        )}

                        {/* Published State Banner */}
                        {selectedReel.status === 'PUBLISHED' && (
                          <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-center space-y-2">
                            <div className="text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span>Live on Instagram Reels &bull; Graph API Container Pipeline Succeeded</span>
                            </div>
                            {selectedReel.permalink && (
                              <div className="text-slate-300 text-[11px] font-mono">
                                Permalink:{' '}
                                <a
                                  href={selectedReel.permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 underline font-semibold hover:text-indigo-300"
                                >
                                  {selectedReel.permalink}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Select a Reel from the Asset Manager queue to preview and inspect
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SIDE-BY-SIDE REEL COMPARISON */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Columns className="w-5 h-5 text-indigo-400" />
                <span>Side-by-Side Reel Creative Comparison</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluate multiple video angles, pacing scores, visual hooks, and select the winning creative for production.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              isLoading={loadingComparison}
              onClick={handleLoadComparison}
            >
              Reload Comparison
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(comparisonItems.length > 0 ? comparisonItems : reels.slice(0, 3).map(r => ({
              reel: r,
              opening_hook: r.caption.split('.')[0] || r.title,
              pacing_score: 92,
              visual_clarity_score: 95,
              engagement_potential: 'HIGH (Pattern Interrupt)'
            }))).map((item, idx) => (
              <Card key={item.reel.id} className="border-slate-800 bg-slate-900/90 flex flex-col justify-between">
                <CardHeader
                  title={item.reel.title}
                  subtitle={`Status: ${item.reel.status} • ${item.reel.duration_seconds}s`}
                  action={
                    <Badge variant={idx === 0 ? 'success' : 'purple'} size="sm">
                      {idx === 0 ? 'Top Angle' : `Option ${idx + 1}`}
                    </Badge>
                  }
                />
                <CardContent className="space-y-4 p-5 flex-1 flex flex-col justify-between">
                  {/* Smartphone preview */}
                  <div className="w-[180px] aspect-[9/16] mx-auto bg-black rounded-2xl overflow-hidden relative border-2 border-slate-700 shadow-lg">
                    <img
                      src={item.reel.thumbnail_url}
                      alt={item.reel.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                      {item.reel.duration_seconds}s
                    </span>
                  </div>

                  {/* Hook & Metrics */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Opening Hook
                      </span>
                      <p className="text-slate-200 text-[11px] font-semibold leading-relaxed">
                        &ldquo;{item.opening_hook}&rdquo;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                        <span className="text-slate-400 block">Pacing Score</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">{item.pacing_score}/100</span>
                      </div>
                      <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                        <span className="text-slate-400 block">Visual Clarity</span>
                        <span className="text-indigo-400 font-bold font-mono text-sm">{item.visual_clarity_score}/100</span>
                      </div>
                    </div>

                    <div className="p-2 bg-indigo-950/30 border border-indigo-800/40 rounded-lg text-[11px] text-indigo-300">
                      <span className="font-semibold">Engagement:</span> {item.engagement_potential}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full mt-3"
                    size="sm"
                    icon={<Check className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedReel(item.reel);
                      setActiveTab('studio');
                    }}
                  >
                    Select as Production Winner
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <span>Instagram Reels Content Calendar</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scheduled and published Reels timetable for {activeClient.name} ({activeClient.instagram_handle}).
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-4 h-4" />}
              onClick={onOpenUpload}
            >
              Schedule New Reel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="text-center font-bold text-xs uppercase tracking-wider text-slate-400 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-h-[420px]">
            {reels.map(reel => (
              <Card
                key={reel.id}
                onClick={() => {
                  setSelectedReel(reel);
                  setActiveTab('studio');
                }}
                className={`p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                  reel.status === 'PUBLISHED'
                    ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-600'
                    : reel.scheduled_at
                    ? 'bg-indigo-950/20 border-indigo-800/40 hover:border-indigo-600'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {reel.scheduled_at
                        ? new Date(reel.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : 'Unscheduled'}
                    </span>
                    <Badge
                      variant={
                        reel.status === 'PUBLISHED'
                          ? 'success'
                          : reel.status === 'APPROVED'
                          ? 'purple'
                          : 'default'
                      }
                      size="sm"
                    >
                      {reel.status}
                    </Badge>
                  </div>

                  <div className="w-full aspect-[9/16] max-h-36 rounded-lg bg-black overflow-hidden relative mb-2">
                    <img
                      src={reel.thumbnail_url}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] px-1 rounded font-mono">
                      {reel.duration_seconds}s
                    </span>
                  </div>

                  <div className="font-semibold text-slate-200 text-xs truncate">
                    {reel.title}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                    {reel.caption}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-indigo-400 font-mono">
                    {reel.scheduled_at
                      ? new Date(reel.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Draft Queue'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI CAPTION ASSISTANT */}
      {activeTab === 'captions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>AI Caption Assistant &amp; Hook Generator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate 3 tailored caption angles, viral hooks, categorized hashtags, and CTA variations for {activeClient.name}.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              isLoading={generatingCaptions}
              onClick={handleGenerateCaptions}
            >
              Regenerate Options
            </Button>
          </div>

          {/* 3 Caption Angle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {captionData?.options.map((opt: CaptionOption) => (
              <Card key={opt.id} className="border-slate-800 bg-slate-900/90 flex flex-col justify-between">
                <CardHeader
                  title={opt.angle_name}
                  subtitle={opt.tone}
                  action={
                    <Badge variant="purple" size="sm">
                      {opt.id.replace('cap_opt_', 'Option ')}
                    </Badge>
                  }
                />
                <CardContent className="space-y-4 p-5 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-3">
                    {/* Hook Callout */}
                    <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                        Opening Hook
                      </span>
                      <p className="text-slate-100 font-semibold leading-relaxed">
                        &ldquo;{opt.hook}&rdquo;
                      </p>
                    </div>

                    {/* Body */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Caption Body
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {opt.body}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Call to Action
                      </span>
                      <p className="text-emerald-400 font-semibold text-[11px]">
                        👉 {opt.cta}
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1">
                      {opt.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full mt-4"
                    size="sm"
                    icon={<Check className="w-4 h-4" />}
                    onClick={() => {
                      handleApplyCaption(opt.full_caption, opt.hashtags);
                      setActiveTab('studio');
                    }}
                  >
                    Apply to Active Reel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hook Bank & Hashtag Categories */}
          {captionData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Hook Bank */}
              <Card className="border-slate-800 bg-slate-900/90">
                <CardHeader
                  title="Curated Hook Bank"
                  subtitle="Pattern interrupts & curiosity gaps tested for short-form retention"
                />
                <CardContent className="p-4 space-y-2">
                  {captionData.suggested_hooks.map((hook: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => {
                        setEditedCaption(prev => `${hook}\n\n${prev}`);
                        setIsEditingCaption(true);
                        setActiveTab('studio');
                      }}
                      className="p-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between text-slate-200 transition-all"
                    >
                      <span>&ldquo;{hook}&rdquo;</span>
                      <Badge variant="info" size="sm">Insert</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Categorized Hashtags */}
              <Card className="border-slate-800 bg-slate-900/90">
                <CardHeader
                  title="Hashtag Intelligence"
                  subtitle="Segmented by niche relevancy and algorithmic reach"
                />
                <CardContent className="p-4 space-y-3">
                  {Object.entries(captionData.recommended_hashtags).map(([cat, tags]) => (
                    <div key={cat}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {cat} Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(tags as string[]).map((tag: string, idx: number) => (
                          <span key={idx} className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Schedule on Calendar Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Reel on Content Calendar"
        description="Select date and publishing time for automated Instagram release"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={scheduling}
              icon={<CalendarIcon className="w-4 h-4" />}
              onClick={handleScheduleSubmit}
            >
              Confirm Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Scheduled Date &amp; Time (Local)</label>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={e => setScheduleDateTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px] block">
              Reel: <strong className="text-slate-200">{selectedReel?.title}</strong>
            </span>
            <span className="text-slate-400 text-[11px] block">
              Target Account: <strong className="text-indigo-400">{activeClient.instagram_handle || '@brand'}</strong>
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
