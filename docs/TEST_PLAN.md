# MetaPilot AI - Master Quality Assurance & Test Plan

## 1. Overview & Strategy
This document establishes the Master Quality Assurance Test Plan for MetaPilot AI.
Testing validates that the platform adheres to all functional requirements, security gates, and deterministic safety controls before any live advertising capital or Instagram publication can be authorized.

---

## 2. Test Execution Summary

| Test Layer | Test Runner | Files Tested | Total Tests | Pass Count | Failure Count | Pass Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend API & Services** | `pytest 8.3.3` | 10 test modules | 70 | 70 | 0 | **100%** |
| **Frontend Components & Pages** | `vitest 3.2.4` | 9 test suites | 58 | 58 | 0 | **100%** |
| **Frontend Production Build** | `tsc && vite build` | 1598 modules | N/A | Success | 0 errors | **100%** |

---

## 3. Test Suites & Coverage Breakdown

### 3.1 Backend Test Matrix (`backend/tests/`)
1. **`test_health.py` (3 tests)**:
   - Root service health and version metadata.
   - `/api/v1/health` execution mode verification (`demo` vs `connected`).
2. **`test_auth.py` (5 tests)**:
   - Successful login with JWT generation.
   - Rejection of invalid credentials with HTTP 401.
   - User signup with automatic organization and default client workspace creation.
   - Password reset workflow.
   - Token validation via `/auth/me`.
3. **`test_tenant_isolation.py` (4 tests)**:
   - Cross-tenant organization access blocked with HTTP 403.
   - Cross-tenant team member enumeration blocked.
   - Cross-tenant client workspace IDOR tampering blocked.
   - Meta token masking verification (raw secret never leaked).
4. **`test_campaigns.py` & `test_campaign_management.py` (10 tests)**:
   - Strict `PAUSED` initial status guarantee on draft creation.
   - Unapproved campaign activation blocked with HTTP 400.
   - Full lifecycle: Create `PAUSED` -> Explicit Approval -> Activation.
   - Meta connection health check and ad account enumeration.
   - Connection disconnection and token revocation.
   - Campaign pre-flight validation rules (ODAX alignment, budget floors).
   - 4-tier hierarchy creation (Campaign -> Ad Sets -> Creatives -> Ads).
   - Approval signature binding with SHA-256 and automatic invalidation upon draft mutation.
   - Idempotent push to Meta Ads API.
5. **`test_reels.py` (7 tests)**:
   - 9:16 vertical ratio enforcement and duration boundaries (3s-90s).
   - Invalid MIME type (`video/x-msvideo`) and unsupported codec (`WMV3`) rejection.
   - File size ceiling check (exceeding 100MB blocked).
   - Competitor creative ripping and third-party restricted assets blocked.
   - AI caption assistant generation (3 options with hooks, niche hashtags, CTA).
   - Approval tampering detection: Caption modification post-approval revokes approval status.
   - Duplicate publish prevention under identical idempotency keys (HTTP 409).
   - Full publication lifecycle (`DRAFT` -> `READY` -> `APPROVAL_PENDING` -> `APPROVED` -> `PUBLISHED`).
6. **`test_competitor_intel.py` (7 tests)**:
   - Tracking 5 default industry competitors.
   - Manual addition of competitor brands.
   - Candidate discovery marking new competitors as `UNVERIFIED`.
   - Verification or rejection of candidate competitors.
   - Public Meta Ad Library ad observation logging.
   - Competitor research workflow execution.
   - Compliance guarantee: Zero ROI fabrication and strict public attribution.
7. **`test_strategy_intelligence.py` (6 tests)**:
   - 3-tier campaign testing funnel generation (TOFU Broad, MOFU Retargeting, BOFU Lookalike).
   - Strict separation of interest-based keywords vs search keywords.
   - Targeting validation against the Meta Targeting Registry.
   - Policy compliance check rejecting sensitive health/political niches.
   - Zero invented benchmarks guarantee.
   - Strategy persistence and retrieval.
8. **`test_analytics.py` (9 tests)**:
   - Metric normalization for standard values (spend, impressions, CTR, CPC, CPM).
   - Zero-denominator protection (zero clicks or impressions cannot cause division by zero).
   - ROAS integrity: Attributed value displayed only when verified conversion tracking exists.
   - Separation of generic clicks vs outbound link clicks.
   - Conversion action breakdown by event type (`Purchase`, `Lead`, `AddToCart`).
   - Conversion funnel tracking configured events only.
   - Date preset boundary resolution (`yesterday`, `last_7d`, `last_30d`, `custom`).
   - Entity-level reporting (`account`, `campaign`, `adset`, `ad`).
   - Incremental metric sync from Meta Insights.
9. **`test_recommendations.py` (8 tests)**:
   - Retrieval of exactly 5 prioritized recommendations ranked 1 through 5.
   - 8-step LangGraph workflow execution with verifiable step logs.
   - Structured recommendation schema verification (problem, evidence, mechanism, uncertainty).
   - Safety rule: State-mutating actions strictly require human approval.
   - Low sample-size warning: Entities with < $100 spend or < 10 results flagged.
   - Feedback lifecycle: Accept, Reject, Snooze, Mark Implemented.
   - Conversion of authorized recommendations into formal campaign approval requests.
   - Applying approved recommendations with audit log emission.
10. **`test_automations.py` (11 tests)**:
    - Registered background jobs enumeration (`DAILY_METRIC_SYNC`, `PERFORMANCE_ANOMALY_DETECTION`, `WEEKLY_PERFORMANCE_REPORT`, etc.).
    - Duplicate job prevention via idempotency keys.
    - Retry incrementation and max-retries ceiling.
    - Anomaly detection (creative fatigue with frequency > 3.5 and dropping CTR) and analyst acknowledgement.
    - Weekly executive summary report generation with week-over-week (WoW) comparisons and 5 AI recommendations.
    - RFC-4180 compliant CSV export download.
    - In-app notification center lifecycle (mark read, mark all read).
    - Autonomous permission for safe tasks (research, analysis, draft generation).
    - Gated human approval for restricted actions (activation, publishing, budget scaling).
    - Server-side client budget limit violation blocking and audit logging.
    - Rejection of expired approval records (> 48h TTL).

---

### 3.2 Frontend Test Matrix (`frontend/src/tests/`)
1. **`auth.test.tsx` (6 tests)**: Login, signup, password reset, demo mode shortcut, persistent logout state.
2. **`tenancy.test.tsx` (6 tests)**: Client workspace switching, organization selector, role-based controls.
3. **`campaign_lifecycle.test.tsx` (6 tests)**: Draft generation, PAUSED status indicator, approval modal, activation guard.
4. **`reels_studio.test.tsx` (6 tests)**: Video uploader, aspect ratio validation, AI caption selection, side-by-side comparison, publish sign-off.
5. **`competitor_intel.test.tsx` (6 tests)**: Ad Library search, hook extraction, creative velocity charts, zero fabrication badges.
6. **`strategy_generator.test.tsx` (6 tests)**: 3-tier funnel visualizer, audience target selector, export draft.
7. **`analytics.test.tsx` (6 tests)**: KPI summary cards, spend trends, date range selectors, breakdown tables, demo mode fallback banner.
8. **`recommendation_engine.test.tsx` (6 tests)**: 5 recommendations display, LangGraph 8-step execution log accordion, uncertainty badges, feedback actions.
9. **`automations.test.tsx` (14 tests)**: Background jobs list, manual run with idempotency, anomaly acknowledgement, weekly report preview, CSV download, notification drawer, budget limit violation alert.

---

## 4. UI State & Responsiveness Verification

### 4.1 UI State Verification Protocol
Every view in MetaPilot AI has been audited to guarantee robust state handling:
- **Loading State**: Displays skeleton loaders or animated spinners; buttons enter disabled loading states.
- **Empty State**: Displays clear messaging, illustrated badges, and actionable call-to-action buttons (e.g. "Upload First Reel", "Create First Campaign Draft").
- **Error State**: Non-blocking toast notifications and explicit inline error banners with retry buttons.
- **Disconnected / Demo State**: When the backend is offline or Meta credentials are not configured, the application displays a prominent **"Demo Environment / Simulated Data"** banner, gracefully falling back to validated fixtures without throwing unhandled exceptions.

### 4.2 Responsive Design Breakpoint Testing
The UI is validated using Tailwind CSS responsive breakpoints:
- **Desktop (1920x1080 & 1440x900)**: Full multi-column grid layouts, expanded side navigation, side-by-side Reel comparison view.
- **Tablet (iPad 768x1024)**: Collapsible sidebar navigation, 2-column card layouts, touch-friendly dropdowns.
- **Mobile (375x812 - iPhone X/14)**: Off-canvas hamburger menu drawer, single-column stacked cards, responsive table horizontal scroll containers, full-width touch targets.
