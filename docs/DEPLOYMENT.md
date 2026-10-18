# MetaPilot AI - Production & Staging Deployment Guide

## 1. Target Architecture Overview

```mermaid
graph TD
    User([End User Browser]) -->|HTTPS / WSS| CDN[Vercel / Cloudflare Pages / Static Edge]
    CDN --> Frontend[React 18 SPA Assets]
    User -->|API Requests: /api/v1/*| LB[Cloud Load Balancer / Reverse Proxy]
    LB --> Backend[FastAPI Backend Container / Cloud Run]
    Backend -->|PostgreSQL Wire (Port 5432 / 6543)| Supabase[(Supabase PostgreSQL 15)]
    Backend -.->|Graph API v21.0| Meta[Meta Graph API]
    Backend -.->|REST API| OpenAI[OpenAI API]
```

---

## 2. Environment Variables Configuration

### 2.1 Backend Environment (`backend/.env`)
```bash
# Application Runtime
APP_ENV=production
APP_NAME="MetaPilot AI Engine"
PORT=8000
DEBUG=false

# Runtime Mode: 'demo' for offline simulation, 'connected' for live APIs
EXECUTION_MODE=connected

# Supabase PostgreSQL & Auth
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # NEVER expose to client
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-min-32-chars

# Meta Marketing & Instagram Graph API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_ACCESS_TOKEN=your-meta-system-user-token
META_AD_ACCOUNT_ID=act_1234567890
META_INSTAGRAM_ACCOUNT_ID=17841400000000000
META_WEBHOOK_VERIFY_TOKEN=your-random-webhook-secret

# OpenAI Engine
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Security Policy Guardrails
REQUIRE_EXPLICIT_APPROVAL=true
DEFAULT_CAMPAIGN_STATUS=PAUSED
ALLOWED_ORIGINS=https://app.metapilot.ai,https://metapilot-ai.vercel.app
```

### 2.2 Frontend Environment (`frontend/.env`)
```bash
VITE_API_BASE_URL=https://api.metapilot.ai/api/v1
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_APP_MODE=connected
```

---

## 3. Database Migration Deployment

Supabase schema definitions and RLS policies are located in `supabase/migrations/`:
- `20261017000001_initial_schema.sql` (Core tables, campaigns, audit logs)
- `20261017000002_reels_and_analytics.sql` (Reels pipeline and normalized metrics)
- `20261017000003_auth_orgs_and_workspaces.sql` (Multi-tenant orgs and RBAC)

### Applying Migrations via Supabase CLI
```powershell
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login and link to your remote Supabase project
supabase login
supabase link --project-ref your-project-id

# 3. Push migrations
supabase db push
```

---

## 4. Exact Windows PowerShell Commands

### 4.1 Running the Backend Locally
Open a PowerShell terminal in the workspace root:
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install production dependencies
pip install -r requirements.txt

# Start FastAPI development server with auto-reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend will be accessible at: `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`).*

### 4.2 Running the Frontend Locally
Open a second PowerShell terminal in the workspace root:
```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will be accessible at: `http://localhost:5173`.*

### 4.3 Running the Complete Test Suite
```powershell
# 1. Run all Backend Pytest Suites (70 tests)
cd backend
python -m pytest -v

# 2. Run all Frontend Vitest Suites (58 tests)
cd ..\frontend
npm test -- --run

# 3. Run Production Frontend Build
npm run build
```

---

## 5. Containerized Deployment (Docker / Docker Compose)

A production-ready `Dockerfile` and `docker-compose.yml` are provided in the workspace root.

### Building & Running with Docker Compose
```powershell
# Build and start all services in detached mode
docker-compose up -d --build

# Inspect service logs
docker-compose logs -f backend
```

---

## 6. Pre-Flight Production Launch Checklist

Before flipping `EXECUTION_MODE=connected` in a live environment, verify each item:
- [ ] Root `.gitignore` is committed and no `.env` files are tracked in Git.
- [ ] Supabase `service_role` key is stored exclusively in backend environment variables.
- [ ] Supabase RLS is enabled and active on all production tables.
- [ ] Meta Business Portfolio is verified with Meta.
- [ ] Meta App permissions (`ads_management`, `instagram_content_publish`) have passed App Review.
- [ ] Webhook HTTPS endpoint is configured with a valid SSL certificate.
- [ ] Initial campaign status is verified to be `DEFAULT_CAMPAIGN_STATUS=PAUSED`.
- [ ] Client monthly budget ceiling limits are established in workspace settings.
- [ ] Test campaign was created and verified to remain in `PAUSED` state until explicitly approved.
