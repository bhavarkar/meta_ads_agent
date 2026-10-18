import { describe, it, expect } from 'vitest';
import { api } from '../services/api';
import { FALLBACK_REELS } from '../services/demoData';

describe('Instagram Reel Studio Frontend Suite', () => {
  it('loads multi-state fallback reels with 9:16 aspect ratio and duration constraints', () => {
    expect(FALLBACK_REELS.length).toBeGreaterThanOrEqual(2);
    for (const reel of FALLBACK_REELS) {
      expect(reel.aspect_ratio).toBe('9:16');
      expect(reel.duration_seconds).toBeGreaterThanOrEqual(3.0);
      expect(reel.duration_seconds).toBeLessThanOrEqual(90.0);
      expect(reel.rights_ownership).toBe('OWNED');
      expect(reel.is_ad_creative).toBe(false);
      expect(reel.publishing_channel).toBe('ORGANIC_REEL');
    }
  });

  it('validates video specs via pre-flight check API', async () => {
    const validSpecs = {
      mime_type: 'video/mp4',
      file_size_bytes: 25000000,
      duration_seconds: 24.5,
      width: 1080,
      height: 1920,
      video_codec: 'H.264',
      audio_codec: 'AAC',
      rights_ownership: 'OWNED'
    };

    const res = await api.validateReelSpecs(validSpecs);
    expect(res.is_valid).toBe(true);
    expect(res.aspect_ratio_valid).toBe(true);
    expect(res.duration_valid).toBe(true);
    expect(res.size_valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('generates 3 distinct AI caption options with hooks, hashtags, and CTA variations', async () => {
    const res = await api.generateReelCaptions({
      client_id: 'cli_lumina_glow',
      industry: 'DTC Skincare & Beauty',
      target_audience: 'Women 25-40 seeking barrier health',
      key_benefit_or_topic: '72-Hour Ceramide Barrier Repair'
    });

    expect(res.options.length).toBe(3);
    for (const opt of res.options) {
      expect(opt.hook.length).toBeGreaterThan(10);
      expect(opt.body.length).toBeGreaterThan(20);
      expect(opt.cta.length).toBeGreaterThan(5);
      expect(opt.hashtags.length).toBeGreaterThan(0);
      expect(opt.full_caption.length).toBeGreaterThan(50);
    }

    expect(res.suggested_hooks.length).toBeGreaterThanOrEqual(3);
    expect(res.recommended_hashtags.niche.length).toBeGreaterThan(0);
    expect(res.cta_variations.length).toBeGreaterThanOrEqual(3);
  });

  it('manages complete Reels workflow: Draft -> Preview Verification -> Creative Selection -> Approval -> Publish', async () => {
    // 1. Upload new Reel
    const newReel = await api.uploadReel({
      client_id: 'cli_lumina_glow',
      title: 'Clinical Time-Lapse Test Reel',
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4',
      caption: 'Initial draft caption',
      duration_seconds: 22.0
    });
    expect(newReel.id).toBeTruthy();
    expect(['DRAFT', 'READY']).toContain(newReel.status);

    // 2. Preview verification
    const verified = await api.verifyReelPreview(newReel.id);
    expect(verified.preview_verified).toBe(true);
    expect(['READY', 'PREVIEW_VERIFIED']).toContain(verified.status);

    // 3. Select creative with custom caption
    const selected = await api.selectCreative(newReel.id, {
      caption: 'Updated high-converting AI generated caption with verified hooks',
      hashtags: ['#barrierhealth', '#skinscience']
    });
    expect(selected.status).toBe('READY');
    expect(selected.caption).toContain('high-converting');

    // 4. Approve for publishing with cryptographic binding
    const approved = await api.approveReel(newReel.id);
    expect(approved.is_approved).toBe(true);
    expect(['APPROVED', 'APPROVED_FOR_PUBLISHING']).toContain(approved.status);
    expect(approved.approval_binding_hash).toBeTruthy();

    // 5. Publish to live/simulated Instagram Graph API
    const published = await api.publishReel(newReel.id);
    expect(published.status).toBe('PUBLISHED');
    expect(published.permalink).toBeTruthy();
    expect(published.permalink).toContain('instagram.com/reel/');
  });

  it('schedules Reel on Content Calendar and checks account permissions', async () => {
    const scheduled = await api.scheduleReel('reel_101', '2026-10-22T19:00:00Z');
    expect(scheduled.scheduled_at).toBe('2026-10-22T19:00:00Z');

    const perms = await api.getInstagramPermissions('1788203918239012');
    expect(perms.eligible).toBe(true);
    expect(perms.permissions).toContain('instagram_content_publish');
    expect(perms.permissions).toContain('instagram_basic');
  });

  it('compares multiple candidate Reels side-by-side', async () => {
    const comparison = await api.compareReels(['reel_101', 'reel_102']);
    expect(Array.isArray(comparison)).toBe(true);
  });
});
