# Security Architecture & Row-Level Security (RLS) Specification

## 1. Zero Trust Principles
- **No Secret Exposure in Frontend**: Meta App Secrets, System User tokens, and OpenAI keys are strictly stored on the backend server or container environment. The client only interacts with the FastAPI backend using JWT bearer tokens.
- **Supabase Authentication**: All API requests pass through `get_current_user` dependency which verifies the Supabase Auth JWT token, extracting `sub` (user_id) and `tenant_id`.
- **Database Row-Level Security**:
  Each table (`clients`, `campaign_drafts`, `reels`, `competitor_ads`, `audit_logs`) has RLS enabled with PostgreSQL policies matching `tenant_id = public.current_tenant_id()`.

## 2. Spend Protection & Explicit Server Approvals
1. **Initial Draft State**: Every campaign created via MetaPilot AI starts in `PAUSED` status. No automatic campaign activation is allowed.
2. **Explicit Approval Guardrail**:
   - The user must explicitly check the budget confirmation and supply a justification reason.
   - The server verifies user authority and generates an HMAC-SHA256 signature:
     `HMAC_SHA256(secret, "CAMPAIGN:{id}:{user_id}:{date}")`.
   - The campaign cannot be activated via `/campaigns/{id}/activate` unless `is_approved == True` and the signature matches.
3. **Instagram Reels Safety**:
   - Video duration is validated between 3.0s and 90.0s.
   - Aspect ratio must strictly be `9:16`.
   - Visual review confirmation must be executed before approval and publishing is unlocked.

## 3. Audit Logs
Every sensitive action writes an immutable event into `audit_logs` storing:
- `tenant_id`
- `actor_id` & `actor_email`
- `action` (e.g. `CAMPAIGN_EXPLICIT_APPROVAL_GRANTED`)
- `resource_type` & `resource_id`
- JSON details payload & client IP address
