import { describe, it, expect } from 'vitest';
import { api } from '../services/api';
import {
  FALLBACK_BACKGROUND_JOBS,
  FALLBACK_PERFORMANCE_ANOMALIES,
  FALLBACK_SYSTEM_NOTIFICATIONS,
  FALLBACK_PERFORMANCE_REPORTS
} from '../services/demoData';

describe('MetaPilot AI Automations, Reporting & Approval Hub Test Suite', () => {
  // -------------------------------------------------------------
  // 1. Background Jobs Engine & Idempotent Scheduling
  // -------------------------------------------------------------
  it('retrieves scheduled server-side background jobs with cron cadences and execution states', async () => {
    const jobs = await api.getBackgroundJobs('cli_lumina_glow');
    expect(jobs).toBeDefined();
    expect(jobs.length).toBeGreaterThanOrEqual(5);

    const jobTypes = jobs.map(j => j.job_type);
    expect(jobTypes).toContain('DAILY_METRICS_SYNC');
    expect(jobTypes).toContain('DAILY_ANOMALY_DETECTION');
    expect(jobTypes).toContain('WEEKLY_PERFORMANCE_REPORT');
    expect(jobTypes).toContain('CREATIVE_WORKFLOW_DISPATCH');
    expect(jobTypes).toContain('APPROVE_EXPIRED_SWEEP');

    for (const job of jobs) {
      expect(job.schedule_cron).toBeTruthy();
      expect(job.cadence).toBeTruthy();
      expect(job.max_retries).toBe(3);
      expect(job.retry_count).toBeGreaterThanOrEqual(0);
      expect(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING']).toContain(job.status);
    }
  });

  it('triggers an idempotent background job run and returns execution status', async () => {
    const idempotencyKey = `idemp_test_sync_${Date.now()}`;
    const result = await api.triggerBackgroundJob(
      'DAILY_METRICS_SYNC',
      'cli_lumina_glow',
      idempotencyKey,
      false
    );
    expect(result).toBeDefined();
    expect(result.job_type).toBe('DAILY_METRICS_SYNC');
    expect(result.status).toBe('COMPLETED');
  });

  it('handles background job retry execution with retry count increment', async () => {
    const retriedJob = await api.retryBackgroundJob('job_daily_sync');
    expect(retriedJob).toBeDefined();
    expect(retriedJob.id).toBe('job_daily_sync');
    expect(retriedJob.status).toBe('COMPLETED');
    expect(retriedJob.retry_count).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------
  // 2. Performance Anomaly Detection & Acknowledgment
  // -------------------------------------------------------------
  it('identifies performance anomalies with statistical deviation and supporting data', async () => {
    const anomalies = await api.getPerformanceAnomalies('cli_lumina_glow');
    expect(anomalies).toBeDefined();
    expect(anomalies.length).toBeGreaterThanOrEqual(2);

    for (const anom of anomalies) {
      expect(anom.client_id).toBe('cli_lumina_glow');
      expect(['CRITICAL', 'WARNING', 'INFO']).toContain(anom.severity);
      expect(anom.headline.length).toBeGreaterThan(10);
      expect(anom.explanation.length).toBeGreaterThan(20);
      expect(anom.current_value).toBeDefined();
      expect(anom.benchmark_value).toBeDefined();
      expect(anom.supporting_data).toBeDefined();
      expect(typeof anom.acknowledged).toBe('boolean');
    }
  });

  it('acknowledges an active performance anomaly and records timestamp', async () => {
    const ack = await api.acknowledgeAnomaly('anom_ctr_drop_01', 'cli_lumina_glow');
    expect(ack).toBeDefined();
    expect(ack.id).toBe('anom_ctr_drop_01');
    expect(ack.acknowledged).toBe(true);
    expect(ack.acknowledged_at).toBeTruthy();
  });

  // -------------------------------------------------------------
  // 3. Weekly Executive Reports with WoW and CSV Export
  // -------------------------------------------------------------
  it('generates a weekly performance report with WoW KPI comparisons, top creatives, and 5 recommendations', async () => {
    const report = await api.generatePerformanceReport('cli_lumina_glow');
    expect(report).toBeDefined();
    expect(report.client_id).toBe('cli_lumina_glow');
    expect(report.status).toBe('GENERATED');

    // KPI current vs previous vs WoW change
    const kpi = report.kpi_summary;
    expect(kpi.current_period).toBeDefined();
    expect(kpi.previous_period).toBeDefined();
    expect(kpi.wow_change_pct).toBeDefined();
    expect(kpi.current_period.spend).toBeGreaterThan(0);
    expect(kpi.current_period.roas).toBeGreaterThan(0);

    // Top performing creatives
    expect(report.top_performing_creatives.length).toBeGreaterThanOrEqual(3);
    for (const c of report.top_performing_creatives) {
      expect(c.name).toBeTruthy();
      expect(c.roas).toBeGreaterThan(0);
      expect(c.spend).toBeGreaterThan(0);
    }

    // Exactly 5 prioritized recommendations
    expect(report.prioritized_recommendations.length).toBe(5);
    const priorities = report.prioritized_recommendations.map(r => r.priority);
    expect(priorities).toEqual([1, 2, 3, 4, 5]);

    // Download URL exists
    expect(report.csv_download_url).toBeTruthy();
  });

  it('downloads CSV report formatted with RFC-4180 compliance and proper metric headers', async () => {
    const csvContent = await api.downloadReportCsv('rep_weekly_2026_w41', 'cli_lumina_glow');
    expect(csvContent).toBeDefined();
    expect(csvContent).toContain('Metric');
    expect(csvContent).toContain('Current Period');
    expect(csvContent).toContain('Previous Period');
    expect(csvContent).toContain('Spend');
    expect(csvContent).toContain('ROAS');
    expect(csvContent).toContain('CPA');
  });

  // -------------------------------------------------------------
  // 4. Notification Center & Creative Workflows
  // -------------------------------------------------------------
  it('retrieves system notifications across creative workflows, approvals, and reports', async () => {
    const notifs = await api.getNotifications('cli_lumina_glow');
    expect(notifs).toBeDefined();
    expect(notifs.length).toBeGreaterThanOrEqual(4);

    const types = notifs.map(n => n.notification_type);
    expect(types).toContain('REEL_APPROVAL_REQUIRED');
    expect(types).toContain('CAMPAIGN_APPROVAL_PENDING');
    expect(types).toContain('PUBLICATION_SUCCESS');
    expect(types).toContain('ANOMALY_DETECTED');

    for (const n of notifs) {
      expect(n.title).toBeTruthy();
      expect(n.message).toBeTruthy();
      expect(n.action_url).toBeTruthy();
      expect(typeof n.read).toBe('boolean');
    }
  });

  it('marks a single notification as read', async () => {
    const updated = await api.markNotificationRead('notif_reel_01', 'cli_lumina_glow');
    expect(updated).toBeDefined();
    expect(updated.id).toBe('notif_reel_01');
    expect(updated.read).toBe(true);
    expect(updated.read_at).toBeTruthy();
  });

  it('marks all client notifications as read in bulk', async () => {
    const res = await api.markAllNotificationsRead('cli_lumina_glow');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.updated_count).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------
  // 5. Approval Policies & Safety Guardrails
  // -------------------------------------------------------------
  it('validates that autonomous actions are permitted without human approval', async () => {
    const res = await api.validateAction({
      action_type: 'GENERATE_RECOMMENDATIONS',
      client_id: 'cli_lumina_glow',
      has_human_approval: false
    });
    expect(res.allowed).toBe(true);
    expect(res.requires_human_approval).toBe(false);
  });

  it('validates that restricted mutations require human approval record', async () => {
    const resBlocked = await api.validateAction({
      action_type: 'ACTIVATE_CAMPAIGN',
      client_id: 'cli_lumina_glow',
      has_human_approval: false
    });
    expect(resBlocked.allowed).toBe(false);
    expect(resBlocked.requires_human_approval).toBe(true);

    const resAllowed = await api.validateAction({
      action_type: 'ACTIVATE_CAMPAIGN',
      client_id: 'cli_lumina_glow',
      has_human_approval: true,
      approval_record_id: 'appr_valid_record_01',
      requested_daily_budget: 1000
    });
    expect(resAllowed.allowed).toBe(true);
  });

  it('strictly blocks actions that violate client server-side daily budget limits', async () => {
    const resOverBudget = await api.validateAction({
      action_type: 'SCALE_BUDGET',
      client_id: 'cli_lumina_glow',
      has_human_approval: true,
      approval_record_id: 'appr_valid_record_01',
      requested_daily_budget: 5000 // monthly budget $25,000 -> max daily $1,666.67
    });
    expect(resOverBudget.allowed).toBe(false);
    expect(resOverBudget.budget_limit_exceeded).toBe(true);
  });

  it('rejects executions with expired approval records', async () => {
    const resExpired = await api.validateAction({
      action_type: 'ACTIVATE_CAMPAIGN',
      client_id: 'cli_lumina_glow',
      has_human_approval: true,
      approval_record_id: 'appr_expired_record_99'
    });
    expect(resExpired.allowed).toBe(false);
    expect(resExpired.approval_expired).toBe(true);
  });
});
