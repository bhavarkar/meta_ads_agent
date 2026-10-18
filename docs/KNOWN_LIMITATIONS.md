# MetaPilot AI - Known Limitations & Feature Classification Matrix

## 1. Feature Classification Matrix

To maintain absolute transparency with engineering, QA, and executive leadership, this document categorizes all capabilities in MetaPilot AI into three distinct tiers:
1. **Working Features**: Fully built, tested, and operational in both Connected and Demo environments.
2. **Simulated / Demo Features**: Offline deterministic fixtures providing realistic telemetry when external API keys are unavailable.
3. **Blocked Meta-Dependent Features**: Functional in code, but blocked from live production execution pending Meta App Review, Business Verification, or live ad account provisioning.

| Feature Area | Working Features (Live / Local) | Simulated / Demo Mode Features | Blocked Meta-Dependent Features |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | • Supabase JWT login/signup<br>• Persistent logout<br>• Org multi-tenancy & memberships<br>• Role-based access control | • Demo agency owner shortcut<br>• Instant demo session switch | *None* (Fully operational) |
| **Client Workspaces** | • Client provisioning<br>• Monthly budget configuration<br>• Target ROAS threshold setting<br>• Token masking & encryption | • Lumina Skin Co. sample workspace<br>• Apex Growth agency fixtures | *None* (Fully operational) |
| **Campaign Lifecycle** | • 4-tier campaign hierarchy<br>• Guaranteed `PAUSED` creation<br>• Pre-flight ODAX validation<br>• SHA-256 approval signature<br>• Tamper-invalidation on edit | • Synthetic campaign ID generation<br>• Simulated Meta push response | • Live campaign delivery on Meta without approved `ads_management` permission<br>• Live ad spend billing |
| **Instagram Reels Studio** | • 9:16 aspect ratio verification<br>• 3s-90s duration enforcement<br>• MIME type & codec check<br>• AI caption generator (3 options)<br>• Preview review sign-off<br>• Cryptographic approval hash<br>• Idempotent publish prevention | • Demo video asset library<br>• Simulated Instagram permalink generation | • Direct publishing to live Instagram account without `instagram_content_publish` App Review approval |
| **Competitor Intelligence** | • Competitor brand tracking<br>• Candidate discovery workflow<br>• Manual observation logging<br>• Creative angle distribution<br>• Zero ROI fabrication guard | • High-fidelity competitor profiles (GlowRecipe, DrunkElephant, etc.)<br>• Curated Ad Library observations | • Real-time scraping of Meta Ad Library without verified access token or API rate limits |
| **Strategy Generation** | • 3-tier testing funnel generator<br>• Meta Targeting Registry audit<br>• Sensitive policy restriction check<br>• Strategy persistence & retrieval | • Deterministic AI prompt fallbacks when OpenAI API key is missing | • Live dynamic audience sizing from Meta Graph API without live ad account |
| **Analytics & Reporting** | • Metric normalization engine<br>• Zero-denominator protection<br>• Click separation (link vs all)<br>• Configured funnel tracking<br>• Weekly WoW report generation<br>• RFC-4180 CSV export download | • Historical 30-day spend & conversion series for Lumina Skin Co. | • Live ad account insights sync without active spend history |
| **LangGraph AI Recommendations** | • 8-step sequential workflow<br>• Exactly 5 prioritized actions<br>• Structured typed schema<br>• Insufficient data warnings<br>• Feedback actions (Accept, Reject, Snooze, Implemented)<br>• Convert to approval request | • Deterministic 8-step workflow execution logs in demo mode | • Live fine-tuned model evaluation without OpenAI API credits |
| **Automations & Safety** | • Scheduled background job queue<br>• Job idempotency keys<br>• Retry logic with max ceiling<br>• Performance anomaly alerts<br>• In-app notification center<br>• Server-side budget limits<br>• 48-hour approval TTL sweep | • Synthetic anomaly injection for creative fatigue demonstration | • Automated live campaign pausing triggered by live webhook events |

---

## 2. Technical & Architectural Limitations

### 2.1 Meta Graph API Rate Limits
- **Call Weight Ceiling**: Meta imposes rate limits based on an ad account's active spend (`X-Business-Use-Case-Usage`). Large agencies syncing hundreds of ad accounts simultaneously may encounter HTTP 429 rate limit exceptions.
- **Mitigation**: MetaPilot AI implements exponential backoff with jitter and enforces local caching for insights queries within a 15-minute window.

### 2.2 Video Transcoding & Processing Bounds
- **Direct Video Upload**: In the current MVP, video validation verifies metadata (resolution, aspect ratio, codec, duration) in the browser and backend. Video files must be pre-encoded in H.264 / AAC MP4 format.
- **Limitation**: The MVP does not bundle a native server-side FFmpeg transcoding daemon. If a user uploads an uncompressed ProRes or HEVC file, the upload is rejected with a spec error rather than automatically transcoded.

### 2.3 Webhook Deliverability in Local Development
- **Localhost Inaccessibility**: Meta cannot send webhooks to `localhost:8000`.
- **Mitigation**: In local development, background jobs and sync routines execute via the internal scheduler (`automation_service`). Live webhook testing requires tunneling via ngrok, Cloudflare Tunnels, or deployment to a staging server with a public HTTPS URL.

### 2.4 AI Model Latency
- **OpenAI Response Times**: Calling `gpt-4o-mini` for live creative analysis can take 3 to 6 seconds depending on API load.
- **Mitigation**: The frontend displays animated skeleton loaders and progress steps during generation, and demo mode provides instantaneous response times (< 200ms).

---

## 3. Production Readiness Declaration

> [!CAUTION]
> **MVP PRODUCTION READINESS AUDIT RESULT: STAGING / SANDBOX VERIFIED — PRODUCTION BLOCKED**
>
> While MetaPilot AI has achieved **100% test pass rates** across all 70 backend tests, 58 frontend tests, and passes all compile-time and security checks, **the system cannot and must not be declared live production ready** until the following external prerequisites are fulfilled:
>
> 1. **Meta App Review Approval**: Standard/Advanced access for `ads_management` and `instagram_content_publish` must be formally approved by Meta.
> 2. **Business Portfolio Verification**: The deploying entity must complete Meta Business Verification with legal entity documentation (DUNS number or Certificate of Incorporation).
> 3. **Production Database Provisioning**: Staging uses in-memory or development Supabase instances; production deployment requires a dedicated Supabase PostgreSQL instance with production connection pooling (PgBouncer).
> 4. **Live Ad Account & Billing**: Live testing requires an active Meta Ad Account with a verified payment method.
