# MetaPilot AI - Complete REST API Specification

## 1. Overview & Conventions
- **Base URL**: `/api/v1`
- **Protocol**: HTTPS / JSON
- **Authentication**: Bearer JWT (`Authorization: Bearer <access_token>`)
- **Multi-Tenancy**: Tenant context is resolved from the JWT and checked against the resource's `organization_id` or `client_id`.
- **Response Format**: RFC 7807 compliant error responses; standardized JSON objects for success payloads.

### Standard Error Response Format
```json
{
  "detail": "Error description",
  "error_code": "TENANT_ACCESS_DENIED",
  "status_code": 403,
  "timestamp": "2026-10-17T12:00:00Z"
}
```

---

## 2. Authentication & Profile (`/api/v1/auth`)

### `POST /auth/login`
Authenticates a user and returns an access token and tenant memberships.
- **Request Body**:
  ```json
  {
    "email": "owner@apex-growth.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "usr_demo_agency_lead",
      "email": "owner@apex-growth.com",
      "full_name": "Marcus Vance",
      "role": "owner",
      "organization_id": "org_apex_growth"
    }
  }
  ```

### `POST /auth/signup`
Creates a new agency account, owner user, and default client workspace.
- **Request Body**:
  ```json
  {
    "email": "newlead@agency.com",
    "password": "SecurePassword123!",
    "full_name": "Sarah Connor",
    "organization_name": "Cyberdyne Media"
  }
  ```
- **Response (201 Created)**: Returns access token and user structure.

### `GET /auth/me`
Retrieves current authenticated session details.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: User profile, active organization, and client workspaces.

### `POST /auth/logout`
Explicitly terminates session and records audit event.

---

## 3. Organizations & Multi-Tenancy (`/api/v1/organizations`)

### `GET /organizations/{org_id}`
Retrieves organization profile and billing tier. Requires membership in `org_id`.

### `PATCH /organizations/{org_id}`
Updates organization settings. Requires `owner` or `admin` role.

### `GET /organizations/{org_id}/members`
Lists all users and their assigned roles within the organization.

### `POST /organizations/{org_id}/members/invite`
Invites a new team member with an assigned role (`admin`, `member`, `viewer`).

### `PATCH /organizations/{org_id}/members/{user_id}`
Updates a team member's role.

### `DELETE /organizations/{org_id}/members/{user_id}`
Removes a team member from the organization.

---

## 4. Client Workspaces & Meta Connections (`/api/v1/clients`)

### `GET /clients`
Lists all client brand workspaces belonging to the caller's organization.

### `POST /clients`
Provisions a new client workspace.
- **Request Body**:
  ```json
  {
    "name": "Lumina Skin Co.",
    "industry": "DTC Skincare & Beauty",
    "meta_ad_account_id": "act_4829104820",
    "monthly_budget_usd": 25000.0,
    "target_roas_goal": 3.5,
    "organization_id": "org_apex_growth"
  }
  ```

### `GET /clients/{client_id}`
Retrieves details for a single client workspace. Enforces tenant boundary.

### `PATCH /clients/{client_id}`
Updates workspace parameters (monthly budget, ROAS goal, name).

### `GET /clients/{client_id}/meta-connection`
Retrieves connection status and masked access token (`EAAC••••••••9820`). Raw secret is never returned.

### `POST /clients/{client_id}/meta-connection`
Encrypts and stores Meta Marketing API credentials for the workspace.
- **Request Body**:
  ```json
  {
    "ad_account_id": "act_4829104820",
    "instagram_account_id": "17841400000000001",
    "access_token": "EAACEdEose0cBA..."
  }
  ```

### `DELETE /clients/{client_id}/meta-connection`
Revokes and clears stored Meta credentials for the client workspace.

---

## 5. Competitor Intelligence (`/api/v1/competitors`)

### `GET /competitors`
Lists tracked competitors and verified public Meta Ad Library observations for a client.
- **Query Parameters**: `client_id` (required).

### `POST /competitors`
Adds a competitor brand to track.

### `POST /competitors/discover`
Discovers candidate competitors based on vertical and keywords. Marks candidates as `UNVERIFIED`.

### `POST /competitors/{competitor_id}/verify`
Manually verifies or rejects an AI-discovered competitor candidate.

### `POST /competitors/observations`
Logs a public Meta Ad Library ad observation with opening hook, offer type, and copy angle.

### `POST /competitors/analyze`
Executes the competitor intelligence pipeline, returning active creative velocity and creative angle distributions. Zero ROI fabrication guaranteed.

---

## 6. Campaign Strategy Generation (`/api/v1/strategies`)

### `POST /strategies/generate`
Generates a structured 3-tier testing strategy (TOFU Broad/Advantage+, MOFU Retargeting, BOFU Lookalike).
- **Request Body**:
  ```json
  {
    "client_id": "cli_lumina_glow",
    "campaign_name": "Q4 Ceramide Growth Engine",
    "primary_objective": "OUTCOME_SALES",
    "monthly_budget": 25000.0,
    "target_roas": 3.5,
    "product_focus": "Barrier Repair Serum"
  }
  ```

### `POST /strategies/validate-targeting`
Validates interest keywords against the Meta Targeting Registry. Rejects sensitive health/political categories.

### `POST /strategies/save`
Persists an approved strategy into the database.

---

## 7. Campaign Lifecycle & Approval Safety (`/api/v1/campaigns`)

### `POST /campaigns`
Creates a 4-tier campaign draft. **Guaranteed to initialize in `PAUSED` status**.
- **Request Body**:
  ```json
  {
    "client_id": "cli_lumina_glow",
    "name": "LUMINA_CONV_BARRIER_Q4",
    "objective": "OUTCOME_SALES",
    "daily_budget_usd": 150.0,
    "ad_sets": [ ... ],
    "creatives": [ ... ]
  }
  ```
- **Response**: Returns draft with `status: "PAUSED"`, `is_approved: false`, `approval_required: true`.

### `PUT /campaigns/{campaign_id}`
Modifies an existing draft. **Security Guard**: If modified post-approval, the approval signature is invalidated, and the campaign requires re-approval.

### `POST /campaigns/approve`
Explicit human sign-off approving a campaign draft.
- **Request Body**:
  ```json
  {
    "campaign_id": "camp_lumina_01",
    "reason": "Q4 Media plan confirmed by Director",
    "confirm_budget_spend": true
  }
  ```
- **Response**: Generates canonical SHA-256 `approval_signature` binding the payload and budget.

### `POST /campaigns/{campaign_id}/activate`
Activates a campaign on Meta Ads. **Strictly blocked if unapproved or expired**.

### `POST /campaigns/{campaign_id}/pause`
Transitions an active campaign to `PAUSED`.

### `POST /campaigns/{campaign_id}/push-to-meta`
Idempotently publishes the 4-tier hierarchy to the Meta Marketing API.

---

## 8. Instagram Reels Studio (`/api/v1/reels`)

### `POST /reels/upload`
Uploads a video asset. Validates MIME type (`video/mp4`, `video/quicktime`), 9:16 vertical ratio, 3s-90s duration, and file size (< 100MB). Rejects competitor creatives without rights.

### `POST /reels/validate-specs`
Validates video specifications prior to upload.

### `POST /reels/verify-preview`
Confirms preview review by media buyer, transitioning Reel from `DRAFT` to `READY`.

### `POST /reels/generate-captions`
Generates 3 tailored caption options with hooks, niche hashtags, and CTA variations.

### `PATCH /reels/{reel_id}/caption`
Updates caption. **Security Guard**: Revokes approval if modified post-approval.

### `POST /reels/{reel_id}/request-approval`
Transitions Reel from `READY` to `APPROVAL_PENDING`.

### `POST /reels/{reel_id}/approve`
Signs off Reel for publishing, generating an `approval_binding_hash`.

### `POST /reels/{reel_id}/schedule`
Adds Reel to the content calendar with a target publishing timestamp.

### `POST /reels/publish`
Publishes the Reel to Instagram via official Media Container API.
- **Request Body**:
  ```json
  {
    "reel_id": "reel_lumina_101",
    "confirm_publish_live": true,
    "idempotency_key": "idem_reel_101_v1"
  }
  ```
- Returns `status: "PUBLISHED"` and Instagram permalink. Duplicate attempts under same idempotency key return HTTP 409.

### `GET /reels/compare`
Compares multiple candidate Reels side-by-side.

---

## 9. Official Meta Analytics & Normalization (`/api/v1/analytics`)

### `GET /analytics/metrics`
Retrieves normalized advertising metrics from official Meta Insights endpoints.
- **Query Parameters**:
  - `client_id` (required)
  - `level`: `account` | `campaign` | `adset` | `ad`
  - `date_preset`: `yesterday` | `last_7d` | `last_30d` | `custom`
  - `start_date`, `end_date`: Required if `date_preset=custom`
- **Response**: Normalized spend, impressions, reach, link clicks, CTR, CPC, CPM, frequency, conversions, and attributed ROAS.

### `POST /analytics/sync`
Triggers an incremental sync from the Meta Marketing API for the client's ad account.

---

## 10. AI Marketing Recommendations (`/api/v1/recommendations`)

### `GET /recommendations`
Runs the 8-step LangGraph recommendation state machine and returns exactly 5 prioritized actions.
- **Query Parameters**: `client_id` (required).
- **Response**: Contains `recommendations` array (1 to 5 ranking) and `workflow_execution_logs`.

### `POST /recommendations/feedback`
Records client feedback on a recommendation.
- **Status Options**: `ACCEPTED`, `REJECTED`, `SNOOZED`, `IMPLEMENTED`.

### `POST /recommendations/{id}/convert-to-approval`
Converts an accepted recommendation into a formal campaign approval request.

### `POST /recommendations/apply`
Applies an approved recommendation, updating campaign configuration and recording an immutable audit event.

---

## 11. Automations & Reporting Hub (`/api/v1/automations`)

### `GET /automations/jobs`
Lists registered server-side background jobs (`DAILY_METRIC_SYNC`, `PERFORMANCE_ANOMALY_DETECTION`, `WEEKLY_PERFORMANCE_REPORT`, etc.).

### `POST /automations/jobs/run`
Triggers immediate execution of a background job. Requires an `idempotency_key`.

### `POST /automations/jobs/{job_id}/retry`
Retries a failed background job up to its configured max retries.

### `GET /automations/anomalies`
Lists performance anomalies (creative fatigue, sudden CPM spikes).

### `POST /automations/anomalies/{id}/acknowledge`
Marks an anomaly alert as reviewed and acknowledged by the media team.

### `GET /automations/reports`
Lists historical client performance reports.

### `POST /automations/reports/generate`
Generates a weekly executive summary report with week-over-week (WoW) comparisons and 5 prioritized recommendations.

### `GET /automations/reports/{id}/csv`
Downloads the executive performance report formatted as RFC-4180 compliant CSV.

### `GET /automations/notifications`
Retrieves real-time system notification stream for approvals, reports, and sync status.

### `POST /automations/notifications/{id}/read`
Marks an individual notification as read.

### `POST /automations/notifications/mark-all-read`
Marks all notifications as read for a client workspace.

### `POST /automations/validate-action`
Validates an automated action against approval and budget policies:
- Checks if action is safe (e.g. analysis, draft creation) or restricted.
- Verifies approval record presence and non-expiration (< 48h TTL).
- Enforces server-side daily budget ceilings.

---

## 12. Audit Trail (`/api/v1/audit-logs`)

### `GET /audit-logs`
Retrieves paginated, immutable audit trail of system events:
- Campaign creation, modification, approval, and activation.
- Reel upload, approval, and publication.
- Meta credential modifications and revocations.
- Budget policy violations blocked.
- AI recommendations converted and applied.
