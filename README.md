# 🚀 MetaPilot AI — Enterprise Meta Ads Intelligence & Automation Platform

[![CI Backend](https://img.shields.io/badge/Pytest-70%20Passed-success?style=flat-square&logo=pytest)](file:///docs/TESTING_GUIDE.md)
[![CI Frontend](https://img.shields.io/badge/Vitest-58%20Passed-success?style=flat-square&logo=vitest)](file:///docs/TESTING_GUIDE.md)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?style=flat-square&logo=python)](file:///backend)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688?style=flat-square&logo=fastapi)](file:///backend)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](file:///frontend)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2%2B-3178C6?style=flat-square&logo=typescript)](file:///frontend)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4%2B-38B2AC?style=flat-square&logo=tailwind-css)](file:///frontend)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**MetaPilot AI** is a production-grade, enterprise-ready Meta Ads intelligence, strategy orchestration, and automation platform designed for performance marketers, DTC brands, and marketing agencies.

It merges **AI Agents (LLMs + LangGraph)** with the **official Meta Marketing API (v19.0+)** and **Instagram Graph API**, wrapped inside strict safety guardrails, cryptographic approval workflows, and Supabase multi-tenant Row-Level Security (RLS).

---

## 🌟 Key Capabilities & Agents

### 1. 🔍 Competitor Intelligence Agent
- **Creative Scraping & Analysis**: Ingests public ads from Meta Ad Library with active longevity tracking.
- **Hook & Angle Extraction**: Automatically extracts opening hooks (Problem/Agitation, Pattern Interrupt, Social Proof, Curiosity Gap) and emotional triggers.
- **Fatigue & Longevity Scoring**: Analyzes creative longevity to compute winning creative scores (1–100).
- **Competitor Benchmarking**: Identifies offer architectures, primary text patterns, and CTA buttons.

### 2. 🧠 Strategy Orchestration Agent
- **Full-Funnel Campaign Architect**: Formulates bespoke TOFU (Top of Funnel Prospecting), MOFU (Middle of Funnel Consideration), and BOFU (Bottom of Funnel Retargeting) campaign structures.
- **Audience Targeting Registry**: Automatically pairs strategies with granular interest categories, Lookalike (LAL) seeds, and demographic brackets.
- **Creative Brief & Copy Generation**: Formulates headlines, primary text variants, visual concept storyboards, and CTA recommendations.

### 3. 🛡️ Campaign Management & Safety Protocol
- **Strictly PAUSED Inception**: Every ad campaign is generated in `PAUSED` status. Autonomous activation without human confirmation is strictly blocked.
- **Cryptographic Server-Validated Approval Gate**:
  - Activating a campaign requires `POST /api/v1/campaigns/approve` with explicit budget confirmation.
  - Generates and verifies an HMAC-SHA256 signature for every spend authorization.
  - Requests missing or tampering with signatures are rejected with HTTP 400.
- **Spend Cap & Velocity Safeguards**: Enforces daily budget ceiling validations prior to live publishing.

### 4. 🎬 Instagram Reels Studio Agent
- **Aspect Ratio Validation**: Validates vertical `9:16` aspect ratio requirement before media ingestion.
- **Duration Enforcer**: Strictly enforces durations between **3.0s and 90.0s**.
- **Visual Review Verification**: Requires human creative sign-off before publishing can be unlocked.
- **Publishing Pipeline**: Direct publishing to Instagram Business profiles via Instagram Graph API containers.
- **Content Calendar & Scheduling**: Plan and schedule Reels with visual calendar previews.

### 5. 💡 Self-Healing Recommendation Engine
- **Ranked Opportunities**: Generates 5 prioritized, data-backed optimization recommendations.
- **ROAS Impact Projections**: Projects tangible ROAS lift and revenue upside for each action.
- **Creative Fatigue Diagnoses**: Detects frequency creep (>3.5) and rising CPAs, recommending fresh angle rotations.
- **1-Click Execution & Approval Conversion**: Convert any recommendation directly into a staged approval request.

### 6. ⚙️ Automations & Rule Engine
- **Autonomous vs Restricted Actions**: Automated bid adjustments within safe thresholds; restricted actions (budget increases >20%, pausing top-funnel ads) route through human approval.
- **Runaway CPA Auto-Pause**: Automatically flags or pauses ad sets experiencing abnormal CPA spikes.
- **Notification & Alert Hub**: Real-time actionable alerts with unread tracking and bulk resolution.

### 7. 🏢 Multi-Tenant Agency Architecture
- **Supabase PostgreSQL RLS**: Hard tenant isolation with strict Row-Level Security policies.
- **Client & Organization Switcher**: Seamlessly switch between brands, ad accounts, and workspaces without cross-tenant leakage.
- **Audit Log Trail**: Complete tamper-evident log capturing user, timestamp, IP, action, and payload diffs.

### 8. 🔄 Transparent Dual-Mode Architecture
- **Demo Mode (Default)**: Fully operational offline or preview mode backed by realistic synthetic data. Every card and telemetry widget is clearly marked with a *"DEMO MODE"* badge.
- **Connected Mode**: Plug in your Meta Access Token and Supabase credentials to manage live ad accounts and publish real ads and Reels.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MetaPilot AI Web App                            │
│           (React 18 + TypeScript + Vite + Tailwind CSS)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JWT + Org ID)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Engine (Python 3.11)                │
├───────────────────┬───────────────────┬────────────────────────────────┤
│  API Routers      │  AI Agents        │  Safety & Guardrails           │
│  - /competitors   │  - CompetitorAI   │  - HMAC Approval Signer        │
│  - /strategies    │  - StrategyAI     │  - Spend Cap Enforcer          │
│  - /campaigns     │  - Recommender    │  - 9:16 Duration Validator     │
│  - /reels         │  - Automation     │  - Audit Logger                │
│  - /analytics     │                   │  - Daily Spend Velocity Check  │
└─────────┬─────────┴─────────┬─────────┴────────────────┬───────────────┘
          │                   │                          │
          ▼                   ▼                          ▼
┌──────────────────┐ ┌──────────────────┐      ┌─────────────────────────┐
│  Supabase PG DB  │ │ OpenAI Models    │      │ Official Meta APIs      │
│  - Multi-Tenant  │ │ (GPT-4o / Mini)  │      │ - Marketing API v19.0+  │
│  - RLS Policies  │ │ - Structured     │      │ - Ad Library Graph API  │
│  - Audit Logs    │ │   JSON Schemas   │      │ - Instagram Graph API   │
└──────────────────┘ └──────────────────┘      └─────────────────────────┘
```

---

## 📂 Repository Structure

```
.
├── backend/                         # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/                  # REST API Endpoints
│   │   │   ├── analytics.py         # Performance telemetry & placement breakdowns
│   │   │   ├── audit_logs.py        # Compliance audit trail
│   │   │   ├── auth.py              # JWT authentication & session management
│   │   │   ├── automations.py       # Automated rules & notification alerts
│   │   │   ├── campaigns.py         # Campaign lifecycle (PAUSED -> Approved -> Active)
│   │   │   ├── clients.py           # Client profile & spend cap management
│   │   │   ├── competitors.py       # Competitor intelligence & hook extractor
│   │   │   ├── health.py            # Health check & execution mode status
│   │   │   ├── organizations.py     # Multi-tenant organization & team management
│   │   │   ├── recommendations.py   # Prioritized AI recommendations
│   │   │   ├── reels.py             # Instagram Reels Studio (9:16, 3s-90s)
│   │   │   └── strategies.py        # LangGraph strategy generator
│   │   ├── core/                    # Core Security, HMAC, Encryption, Audit
│   │   ├── schemas/                 # Pydantic v2 data models & validation
│   │   ├── services/                # Business logic, AI Agents, Meta client, Demo provider
│   │   ├── config.py                # Environment configuration & validation
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/                       # Pytest test suite (70 tests)
│   ├── Dockerfile                   # Production Docker container
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Backend environment variable template
├── frontend/                        # React 18 SPA Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI, modals, layouts, navigation
│   │   │   ├── campaigns/           # CreateCampaignModal & campaign cards
│   │   │   ├── clients/             # ClientSettingsModal
│   │   │   ├── layout/              # Sidebar, Topbar, ClientSwitcher, ModeBadge, Notifications
│   │   │   ├── reels/               # UploadReelModal & video previewers
│   │   │   └── ui/                  # Button, Badge, Card, Modal primitives
│   │   ├── context/                 # AuthContext, ClientContext, ThemeContext
│   │   ├── pages/                   # 10 comprehensive platform views
│   │   │   ├── AnalyticsPage.tsx        # ROAS, CPA, CPC, CTR & placement breakdown
│   │   │   ├── AuditLogsPage.tsx        # Compliance and change logs
│   │   │   ├── AutomationsPage.tsx      # Autonomous rules & approval queue
│   │   │   ├── CampaignsPage.tsx        # Campaign state machine & approval gate
│   │   │   ├── ClientsPage.tsx          # Brand profiles & budget thresholds
│   │   │   ├── CompetitorIntelPage.tsx  # Ad spy & hook library
│   │   │   ├── DashboardPage.tsx        # Executive summary & quick actions
│   │   │   ├── LoginPage.tsx            # Secure user login
│   │   │   ├── RecommendationsPage.tsx  # 5 Prioritized opportunities with 1-click apply
│   │   │   ├── ReelsStudioPage.tsx      # 9:16 Video creator & publisher
│   │   │   ├── ResetPasswordPage.tsx    # Password recovery
│   │   │   ├── SettingsPage.tsx         # Account & platform preferences
│   │   │   ├── SignupPage.tsx           # Agency user onboarding
│   │   │   ├── StrategyGeneratorPage.tsx# Full-funnel campaign builder
│   │   │   └── TeamManagementPage.tsx   # Workspace team & RBAC
│   │   ├── services/                # API client with seamless fallback demo data
│   │   ├── tests/                   # Vitest unit & integration tests (58 tests)
│   │   └── types/                   # TypeScript interfaces
│   ├── Dockerfile                   # Frontend container
│   ├── package.json                 # Node dependencies
│   ├── tailwind.config.js           # Theme styling tokens
│   ├── vite.config.ts               # Vite build & proxy settings
│   └── .env.example                 # Frontend environment template
├── supabase/                        # Database Architecture
│   ├── migrations/                  # PostgreSQL schema, RLS policies, indexes
│   │   ├── 20261017000001_initial_schema.sql
│   │   ├── 20261017000002_rls_and_audit.sql
│   │   └── 20261017000003_auth_orgs_and_workspaces.sql
│   └── seed.sql                     # Seed tenants, clients, demo records
├── docs/                            # In-Depth Documentation
│   ├── API.md                       # Complete REST API specification
│   ├── ARCHITECTURE.md              # Technical design & state machine
│   ├── DEPLOYMENT.md                # Cloud Run, Vercel & Docker guide
│   ├── KNOWN_LIMITATIONS.md         # API quotas, bounds & limits
│   ├── META_API_INTEGRATION.md      # Meta Graph API technical details
│   ├── META_SETUP.md                # App creation & access token setup
│   ├── SECURITY.md                  # Security, HMAC & encryption policies
│   ├── SECURITY_AND_RLS.md          # Row-Level Security deep-dive
│   ├── TEST_PLAN.md                 # Test matrix & verification strategy
│   └── TESTING_GUIDE.md             # Running automated test suites
├── docker-compose.yml               # Local multi-service orchestration
└── README.md                        # Documentation overview
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: v20 or higher & `npm`
- **Git**

---

### Option A: Local Development (Windows / macOS / Linux)

#### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite (70 tests)
python -m pytest -v

# Start FastAPI dev server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API endpoints become available at:
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

#### 2. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend
cd frontend

# Install node packages
npm install

# Run frontend test suite (58 tests)
npm test -- --run

# Start Vite dev server
npm run dev
```
Open your browser to:
👉 **`http://localhost:5173`**

---

### Option B: Docker Compose
Run both backend and frontend in isolated containers:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Default |
|:---|:---|:---|
| `APP_ENV` | Application environment (`development` / `production`) | `development` |
| `EXECUTION_MODE` | Operating mode (`demo` / `connected`) | `demo` |
| `PORT` | API server port | `8000` |
| `SUPABASE_URL` | Supabase project URL | `https://demo-placeholder.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `demo-anon-key-placeholder` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `demo-service-role-key-placeholder` |
| `SUPABASE_JWT_SECRET` | Secret used to sign/verify JWT tokens | `demo-jwt-secret-for-local-testing` |
| `META_APP_ID` | Meta Developer App ID | `demo_meta_app_id` |
| `META_APP_SECRET` | Meta Developer App Secret | `demo_meta_app_secret` |
| `META_ACCESS_TOKEN` | System User Long-Lived User Access Token | `demo_meta_access_token` |
| `META_AD_ACCOUNT_ID` | Default Ad Account ID (`act_...`) | `act_demo9876543210` |
| `META_INSTAGRAM_ACCOUNT_ID` | Connected Instagram Business Account ID | `17841400000000000` |
| `OPENAI_API_KEY` | OpenAI API Key for Strategy & Ad Copy | `sk-demo-openai-key` |
| `OPENAI_MODEL` | Model identifier | `gpt-4o-mini` |
| `REQUIRE_EXPLICIT_APPROVAL` | Enforce cryptographic spend approval | `true` |
| `DEFAULT_CAMPAIGN_STATUS` | Initial status for generated campaigns | `PAUSED` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|:---|:---|:---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://demo-placeholder.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `demo-anon-key-placeholder` |
| `VITE_APP_MODE` | Frontend UI mode (`demo` / `connected`) | `demo` |

---

## 🧪 Comprehensive Automated Testing

The platform includes **128 automated unit, component, integration, and security tests**:

```
TOTAL TESTS: 128 PASSED
├── Backend (Pytest): 70 passed in ~4.7s
│   ├── test_analytics.py                (9 tests)
│   ├── test_auth.py                     (5 tests)
│   ├── test_automations.py              (11 tests)
│   ├── test_campaign_management.py      (7 tests)
│   ├── test_campaigns.py                (3 tests)
│   ├── test_competitor_intel.py         (7 tests)
│   ├── test_health.py                   (3 tests)
│   ├── test_recommendations.py          (8 tests)
│   ├── test_reels.py                    (7 tests)
│   ├── test_strategy_intelligence.py    (6 tests)
│   └── test_tenant_isolation.py         (4 tests)
└── Frontend (Vitest): 58 passed in ~2.5s
    ├── analytics.test.tsx               (6 tests)
    ├── app.test.tsx                     (2 tests)
    ├── auth_and_org.test.tsx            (6 tests)
    ├── automations.test.tsx             (14 tests)
    ├── campaign_management.test.tsx     (6 tests)
    ├── competitor_intel.test.tsx        (6 tests)
    ├── recommendation_engine.test.tsx   (6 tests)
    ├── reels_studio.test.tsx            (6 tests)
    └── strategy_intelligence.test.tsx   (6 tests)
```

Run test suites at any time:
```bash
# Backend tests
cd backend && python -m pytest -v

# Frontend tests
cd frontend && npm test -- --run
```

---

## 🔒 Security & Safety Best Practices

1. **Safety-First Ad Creation**: No ad is ever launched in an active state automatically. The pipeline explicitly enforces `PAUSED` status at creation time.
2. **HMAC Cryptographic Validation**: Live activation requires a server-signed HMAC-SHA256 signature validating the approving user, ad account, and spend ceiling.
3. **No Client Secret Leakage**: All Meta tokens, app secrets, and OpenAI keys remain strictly server-side in memory or encrypted environment variables.
4. **Row-Level Security (RLS)**: Enforced directly at the PostgreSQL level via `auth.uid()` and client/organization foreign key checks.
5. **Zero Data Hallucination**: The system cleanly demarcates synthetic demo telemetry and live Meta Marketing API responses with explicit execution mode banners.

---

## 📖 In-Depth Documentation Links

- 📐 [System Architecture & State Machine](docs/ARCHITECTURE.md)
- 🔌 [Complete REST API Specification](docs/API.md)
- 🔗 [Meta Graph API Integration Guide](docs/META_API_INTEGRATION.md)
- ⚙️ [Meta Developer App & Token Setup](docs/META_SETUP.md)
- 🛡️ [Security & Row-Level Security Deep Dive](docs/SECURITY.md)
- 🧪 [Automated Test Matrix & Plan](docs/TEST_PLAN.md)
- 🚢 [Production Deployment Guide](docs/DEPLOYMENT.md)
- ⚠️ [Known API Limits & Quotas](docs/KNOWN_LIMITATIONS.md)

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
