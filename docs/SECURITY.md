# MetaPilot AI - Security & Compliance Architecture

## 1. Security Philosophy & Principles
MetaPilot AI enforces an **uncompromising zero-trust security architecture** designed to operate safely inside multi-tenant agency environments with real advertising capital at stake.

The system is governed by three foundational tenets:
1. **Never Trust Autonomous AI for State Mutation**: AI agents analyze, recommend, and draft. Only authorized humans can approve live capital expenditure or public broadcast.
2. **Deterministic Pre-Flight Barriers**: Dangerous states (such as active campaign creation without approval) are blocked by compile-time schemas, database constraints, and cryptographic signatures.
3. **Strict Multi-Tenant Isolation**: No tenant can ever view, modify, or infer another organization's records, credentials, or advertising strategies.

---

## 2. Seven Mandatory Security Gates Verification

| Gate | Requirement | Architecture Enforcement Mechanism | Test Verification |
| :--- | :--- | :--- | :--- |
| **Gate 1** | **No secrets committed to Git** | Root `.gitignore` explicitly excludes all `.env*` files, PEM keys, certificates, and build artifacts. Only `.env.example` templates with generic placeholders are checked in. | Verified by repository audit & root `.gitignore` rules. |
| **Gate 2** | **No unrestricted service-role key access** | Supabase `service_role` key is strictly restricted to server-side backend processes. It is never transmitted in API responses or bundled into the frontend Vite client. | Codebase grep confirms zero frontend source code exposure. |
| **Gate 3** | **No cross-tenant data exposure** | PostgreSQL Row-Level Security (RLS) policies scoped by `auth.uid()` and `organization_id`. FastAPI dependencies (`require_org_member`, `verify_client_access`) reject cross-tenant IDOR tampering with HTTP 403. | `test_tenant_isolation.py` (100% pass across org and client boundaries). |
| **Gate 4** | **No AI-directed unauthorized publishing** | LangGraph recommendation engine and automation daemon tag all state-mutating actions (`ACTIVATE_CAMPAIGN`, `PUBLISH_REEL`, `SCALE_BUDGET`) with `approval_required: True`. Autonomous execution is blocked by `validate_action` middleware. | `test_recommendations.py` & `test_automations.py` verify autonomous mutation rejection. |
| **Gate 5** | **No activation without explicit verified approval** | All newly created campaigns strictly initialize in `PAUSED` status. Activations require an explicit approval record signed with a canonical SHA-256 payload hash. Any modification to a draft invalidates its approval signature immediately. | `test_campaigns.py`, `test_reels.py`, and `test_campaign_management.py`. |
| **Gate 6** | **No guessed Meta endpoint parameters** | All campaign objectives map to official Meta ODAX enums (`OUTCOME_SALES`, `OUTCOME_LEADS`, etc.). Targeting interests are validated against the `MetaTargetingRegistry` before payload submission. | `test_strategy_intelligence.py` confirms rejection of invalid or sensitive parameters. |
| **Gate 7** | **No unsupported competitor-performance claims** | Competitor intelligence queries only public Meta Ad Library observations (opening hooks, copy angles, creative formats). Private metrics (competitor ROAS, spend, CPA) are never fabricated or estimated without verified telemetry. | `test_competitor_intel.py` confirms zero ROI fabrication guarantees. |

---

## 3. Cryptographic Approval Signatures & Tamper Resistance

### 3.1 The Canonical Payload Hash
When an authorized human reviews and approves a campaign draft or Instagram Reel, the backend computes a canonical SHA-256 digest binding the exact payload contents:

```python
def compute_campaign_payload_hash(campaign: dict) -> str:
    canonical_data = {
        "client_id": campaign.get("client_id"),
        "name": campaign.get("name"),
        "objective": campaign.get("objective"),
        "daily_budget_usd": float(campaign.get("daily_budget_usd", 0.0)),
        "ad_sets": campaign.get("ad_sets", []),
        "creatives": campaign.get("creatives", [])
    }
    serialized = json.dumps(canonical_data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
```

### 3.2 Invalidation on Mutation
If any user or background process attempts to update an approved campaign draft via `PUT /campaigns/{id}` or modify a Reel's caption via `PATCH /reels/{id}/caption`:
1. The new payload's hash is recomputed.
2. If `new_hash != approved_payload_hash`, the backend immediately:
   - Sets `is_approved = False`
   - Sets `status = "READY"` (for Reels) or `status = "PAUSED"` (for campaigns)
   - Nullifies `approval_signature`
   - Flags `needs_reapproval = True`
   - Emits a `SECURITY_APPROVAL_INVALIDATED` audit log event.

---

## 4. Token Masking & Secret Protection

### 4.1 In Transit and at Rest
- Meta Access Tokens are accepted exclusively over TLS 1.3 / HTTPS.
- In responses from `GET /clients/{id}/meta-connection`, tokens are masked:
  ```json
  {
    "token_masked": "EAAC••••••••9820",
    "has_token": true
  }
  ```
- The raw secret string is never returned in cleartext to the client or written to audit log trails.

### 4.2 Webhook Verification
All inbound Meta webhooks are authenticated via HMAC-SHA256 signature verification matching `X-Hub-Signature-256` against `META_APP_SECRET`.

---

## 5. Supabase Row-Level Security (RLS) Matrix

Every production table in Supabase enforces Row-Level Security:

| Table | Policy Name | Permitted Actions | Policy Rule |
| :--- | :--- | :--- | :--- |
| `organizations` | `org_member_read` | `SELECT` | User must have an active membership in the organization. |
| `organizations` | `org_admin_write` | `UPDATE` | User role must be `owner` or `admin`. |
| `clients` | `client_tenant_isolation` | `ALL` | `organization_id` must match user's active organization membership. |
| `campaigns` | `campaign_tenant_isolation` | `ALL` | `client_id` belongs to an organization where user is a verified member. |
| `reels` | `reels_tenant_isolation` | `ALL` | Scoped to caller's client workspace. |
| `audit_logs` | `audit_tenant_read` | `SELECT` | Members can view audit logs for their organization; writes are restricted to server-side service role. |

---

## 6. Audit Trail Immutability

MetaPilot AI maintains an append-only audit log recording every security-critical event:
- `CAMPAIGN_CREATED`: Recorded with initial `PAUSED` status.
- `CAMPAIGN_APPROVED`: Captures approving user ID, timestamp, and SHA-256 signature.
- `CAMPAIGN_ACTIVATED`: Captures user triggering live push to Meta.
- `APPROVAL_TAMPER_INVALIDATED`: Emitted when an approved draft is modified post-signoff.
- `BUDGET_LIMIT_VIOLATION_BLOCKED`: Logs attempts to scale budgets beyond client limits.
- `CROSS_TENANT_ACCESS_DENIED`: Logs any blocked IDOR or URL tampering attempts.
