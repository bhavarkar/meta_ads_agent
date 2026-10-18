import React, { useState } from 'react';
import { useClient } from '../../context/ClientContext';
import { api } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Video,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileVideo,
  Sparkles,
  Info
} from 'lucide-react';

interface UploadReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_VIDEOS = [
  {
    title: 'Barrier Repair 72hr Time-Lapse Demo',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
    duration: 24.5,
    caption: 'POV: You stopped destroying your skin barrier with aggressive scrubs and switched to 1 clean botanical nectar ✨ Redness clears in under 72 hours.',
    tags: '#skincareroutine #barrierrepair #glowingskin #beautytips'
  },
  {
    title: 'Top 3 Ingredients Dermatologists Swear By',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-woman-applying-facial-oil-41214-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
    duration: 18.2,
    caption: 'Did you know Hyaluronic Acid can actually dry out skin in low humidity if you do not seal it? Here are 3 science-backed ingredients you need instead 🧴',
    tags: '#dermatologytips #skincareingredients #skinhacks'
  },
  {
    title: '10-Step Vanity vs 1 Clinical Bottle (Split Screen)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-touching-her-face-with-cream-41589-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    duration: 21.0,
    caption: 'Stop wasting 25 minutes every morning on 10 products that cancel each other out. 1 clinical lipid formulation, 60 seconds, glowing barrier.',
    tags: '#minimalistskincare #glowup #skincaretips'
  }
];

export const UploadReelModal: React.FC<UploadReelModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { activeClient } = useClient();
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState(PRESET_VIDEOS[0].url);
  const [thumbnailUrl, setThumbnailUrl] = useState(PRESET_VIDEOS[0].thumbnail);
  const [caption, setCaption] = useState(PRESET_VIDEOS[0].caption);
  const [hashtags, setHashtags] = useState(PRESET_VIDEOS[0].tags);

  // Media Specs
  const [mimeType, setMimeType] = useState<'video/mp4' | 'video/quicktime'>('video/mp4');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(24500000); // 24.5MB
  const [durationSeconds, setDurationSeconds] = useState<number>(24.5);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1920);
  const [videoCodec, setVideoCodec] = useState<string>('H.264');
  const [audioCodec, setAudioCodec] = useState<string>('AAC');

  // Rights & Ownership
  const [rightsOwnership, setRightsOwnership] = useState<'OWNED' | 'LICENSED' | 'THIRD_PARTY_RESTRICTED'>('OWNED');
  const [isCommercialCleared, setIsCommercialCleared] = useState<boolean>(true);
  const [isCompetitorCreative, setIsCompetitorCreative] = useState<boolean>(false);

  // Validation State
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESET_VIDEOS[0]) => {
    setTitle(preset.title);
    setVideoUrl(preset.url);
    setThumbnailUrl(preset.thumbnail);
    setDurationSeconds(preset.duration);
    setCaption(preset.caption);
    setHashtags(preset.tags);
    setValidationResult(null);
    setErrorMsg(null);
  };

  const handleValidateSpecs = async () => {
    setValidating(true);
    setErrorMsg(null);
    try {
      const res = await api.validateReelSpecs({
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        duration_seconds: durationSeconds,
        width,
        height,
        video_codec: videoCodec,
        audio_codec: audioCodec,
        rights_ownership: rightsOwnership
      });
      setValidationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    if (isCompetitorCreative) {
      setErrorMsg('Cannot upload competitor creatives: Third-party competitor creatives are blocked from publishing.');
      return;
    }

    if (rightsOwnership === 'THIRD_PARTY_RESTRICTED') {
      setErrorMsg('Cannot upload restricted assets: Commercial broadcast usage permissions are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.uploadReel({
        client_id: activeClient.id,
        title: title || 'New Reel Production Draft',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        caption,
        hashtags: hashtags.split(' ').filter(t => t.startsWith('#')),
        file_name: videoUrl.split('/').pop() || 'reel_video.mp4',
        mime_type: mimeType,
        file_size_bytes: fileSizeBytes,
        duration_seconds: durationSeconds,
        width,
        height,
        video_codec: videoCodec,
        audio_codec: audioCodec,
        rights_ownership: rightsOwnership,
        is_commercial_cleared: isCommercialCleared,
        competitor_creative_blocked: isCompetitorCreative,
        origin: isCompetitorCreative ? 'COMPETITOR_BENCHMARK' : 'ORIGINAL_UPLOAD',
        is_ad_creative: false
      });
      onSuccess();
      onClose();
      setTitle('');
    } catch (err: any) {
      console.error('Upload reel error:', err);
      setErrorMsg(err.message || 'Failed to upload Reel draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Instagram Reel Asset"
      description="Validate 9:16 vertical video specs, verify ownership rights, and ingest into production pipeline"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={validating}
            onClick={handleValidateSpecs}
          >
            Pre-flight Specs Check
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={loading}
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={handleSubmit}
          >
            Ingest to Reel Studio
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Preset Selector Banner */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quick-Fill Demo Reel Assets
            </span>
            <span className="text-[10px] text-slate-500 font-mono">9:16 Vertical MP4</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_VIDEOS.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-indigo-950/40 hover:border-indigo-500/50 border border-slate-700/60 transition-all text-[11px]"
              >
                <div className="font-semibold text-slate-200 truncate">{preset.title}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.duration}s • MP4</div>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Reel Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 72hr Barrier Repair Time-Lapse"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-300 block mb-1">MIME Type &amp; Format</label>
            <select
              value={mimeType}
              onChange={e => setMimeType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="video/mp4">MP4 Video (video/mp4) - Recommended</option>
              <option value="video/quicktime">QuickTime MOV (video/quicktime)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1">Video Asset URL (Direct MP4 or MOV stream)</label>
          <input
            type="url"
            required
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1">Thumbnail Poster URL</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={e => setThumbnailUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Video Technical Specifications Grid */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              Media Specifications &amp; Codecs
            </span>
            <span className="text-[10px] text-slate-400">Meta Container Ready</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Resolution</span>
              <div className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px]">
                {width} x {height} (9:16)
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Duration (3s - 90s)</span>
              <input
                type="number"
                step="0.1"
                min="3"
                max="90"
                value={durationSeconds}
                onChange={e => setDurationSeconds(parseFloat(e.target.value) || 20.0)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">File Size</span>
              <div className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px]">
                {(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB (&lt; 100MB)
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Video Codec</span>
              <select
                value={videoCodec}
                onChange={e => setVideoCodec(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
              >
                <option value="H.264">H.264 / AVC</option>
                <option value="HEVC">HEVC / H.265</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ownership & Usage Rights Safeguard */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ownership &amp; Usage Rights Compliance
            </span>
            <Badge variant="purple" size="sm">Brand Protected</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-lg border border-slate-700 cursor-pointer">
              <input
                type="radio"
                name="rights"
                checked={rightsOwnership === 'OWNED'}
                onChange={() => setRightsOwnership('OWNED')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-200">Brand Owned Creative</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-lg border border-slate-700 cursor-pointer">
              <input
                type="radio"
                name="rights"
                checked={rightsOwnership === 'LICENSED'}
                onChange={() => setRightsOwnership('LICENSED')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-200">Licensed / Creator UGC</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-slate-800/80 rounded-lg border border-slate-700 cursor-pointer">
              <input
                type="radio"
                name="rights"
                checked={rightsOwnership === 'THIRD_PARTY_RESTRICTED'}
                onChange={() => setRightsOwnership('THIRD_PARTY_RESTRICTED')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400">Restricted / Blocked</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCommercialCleared}
                onChange={e => setIsCommercialCleared(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Full internal commercial broadcast license confirmed</span>
            </label>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <label className="flex items-center gap-2 text-amber-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompetitorCreative}
                onChange={e => setIsCompetitorCreative(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <span>Competitor creative benchmark (Will be strictly blocked from live publishing)</span>
            </label>
          </div>
        </div>

        {/* Validation Feedback Banner */}
        {validationResult && (
          <div className={`p-3 rounded-xl border text-xs ${
            validationResult.is_valid
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
          }`}>
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              {validationResult.is_valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All Media Specifications Valid for Instagram Reels (9:16, 24.5s, H.264/AAC)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Validation Errors Detected ({validationResult.errors.length})</span>
                </>
              )}
            </div>
            {validationResult.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200 mt-1">
                {validationResult.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Initial Caption & Tags */}
        <div>
          <label className="font-semibold text-slate-300 block mb-1">Initial Reel Caption</label>
          <textarea
            rows={2}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Draft caption or use AI Caption Assistant once ingested..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-300 block mb-1">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </form>
    </Modal>
  );
};
