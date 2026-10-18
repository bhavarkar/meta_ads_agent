# MetaPilot AI - Meta Developer Setup & API Integration Guide

## 1. Overview
MetaPilot AI integrates with the official **Meta Marketing API** and **Instagram Graph API (v21.0)**.
To enable live campaign management, insights synchronization, and Instagram Reels publishing, your organization must configure a registered Meta Developer App within an authorized Meta Business Portfolio (formerly Business Manager).

---

## 2. Meta Business Portfolio & App Configuration

### 2.1 Create a Business App
1. Log in to [developers.facebook.com](https://developers.facebook.com/).
2. Navigate to **My Apps** > **Create App**.
3. Select **Other** as the use case > click **Next**.
4. Select **Business** as the App Type.
5. Provide:
   - **App Display Name**: `MetaPilot AI Marketing OS`
   - **App Contact Email**: Your agency administrative email.
   - **Business Portfolio**: Select your verified agency Business Portfolio.
6. Click **Create App**.

### 2.2 Add Required Products
Within the Meta App Dashboard, add the following products:
- **Marketing API**: Enables ad account querying, campaign drafting, and insights.
- **Instagram Graph API**: Enables media upload, container management, and Reels publishing.
- **Facebook Login for Business**: Enables multi-tenant client token onboarding.
- **Webhooks**: Receives asynchronous ad review, lead, and container status notifications.

---

## 3. Required Scopes & Permission Matrix

For the application to operate in **Connected Mode**, the following permissions are required:

| Permission / Scope | API Surface | Usage in MetaPilot AI | App Review Required? |
| :--- | :--- | :--- | :--- |
| `ads_management` | Marketing API | Create campaign drafts, ad sets, ads, update status | **Yes** (Standard / Advanced) |
| `ads_read` | Marketing API | Retrieve performance insights, ad creatives, spend | **Yes** (Standard / Advanced) |
| `business_management` | Graph API | Read client ad accounts and asset associations | **Yes** (Standard / Advanced) |
| `instagram_basic` | IG Graph API | Verify linked Instagram Professional Account ID | **Yes** (Standard / Advanced) |
| `instagram_content_publish` | IG Graph API | Publish approved 9:16 vertical video Reels | **Yes** (Standard / Advanced) |
| `pages_read_engagement` | Pages API | Read Instagram page bindings and verify identity | **Yes** (Standard / Advanced) |
| `pages_show_list` | Pages API | Enumerate pages managed by the client business | **Yes** (Standard / Advanced) |

> [!NOTE]
> During development, any user listed as an **Administrator**, **Developer**, or **Tester** in your Meta App has automatic access to these permissions without completing Meta App Review.

---

## 4. Authentication Strategy: System User vs. User OAuth

### 4.1 System User Access Token (Recommended for Agency Engines)
For server-side agency automation where MetaPilot AI acts as the primary agency operator:
1. Open **Meta Business Settings** (`business.facebook.com/settings`).
2. Go to **Users** > **System Users**.
3. Click **Add**, assign name `MetaPilot Engine`, and choose the **Admin** role.
4. Click **Assign Assets** and grant access to target Ad Accounts and Instagram Accounts.
5. Click **Generate New Token**:
   - Select your registered Meta App.
   - Check all 7 scopes listed in Section 3.
   - Set Token Expiration to **Never** (System User permanent token).
6. Copy the token into your backend environment:
   ```env
   META_ACCESS_TOKEN=EAACEdEose0cBA...
   ```

### 4.2 User OAuth (Client Self-Service Onboarding)
For multi-tenant SaaS deployment where brand clients connect their own accounts via the MetaPilot UI:
- MetaPilot directs the user to Meta's OAuth 2.0 dialog:
  ```
  https://www.facebook.com/v21.0/dialog/oauth?
    client_id={META_APP_ID}&
    redirect_uri={CALLBACK_URL}&
    scope=ads_management,ads_read,instagram_content_publish,pages_show_list
  ```
- Exchange the short-lived code for a 60-day long-lived User Token via `oauth/access_token`.

---

## 5. Official ODAX Objective Mappings

Meta deprecated legacy campaign objectives (`CONVERSIONS`, `LINK_CLICKS`) in favor of Outcome-Driven Ad Experiences (ODAX). MetaPilot AI strictly enforces these official objectives:

| MetaPilot Objective | Official Meta ODAX Enum | Primary Optimization Goal |
| :--- | :--- | :--- |
| **Sales** | `OUTCOME_SALES` | `OFFSITE_CONVERSIONS` (Purchases) |
| **Leads** | `OUTCOME_LEADS` | `LEAD_GENERATION` (Instant Forms / CRM) |
| **Engagement** | `OUTCOME_ENGAGEMENT` | `POST_ENGAGEMENT` / `VIDEO_VIEWS` |
| **Traffic** | `OUTCOME_TRAFFIC` | `LANDING_PAGE_VIEWS` / `LINK_CLICKS` |
| **Awareness** | `OUTCOME_AWARENESS` | `REACH` / `AD_RECALL_LIFT` |
| **App Promotion** | `OUTCOME_APP_PROMOTION` | `APP_INSTALLS` |

---

## 6. Instagram Reels Publishing Setup

To publish Reels via MetaPilot AI:
1. **Instagram Account Eligibility**:
   - Account must be an **Instagram Business** or **Creator** account. Personal accounts cannot publish via API.
   - The Instagram account must be connected to a Facebook Page managed in Business Settings.
2. **Two-Step Container Publishing Workflow**:
   - **Step 1: Create Container**:
     ```http
     POST https://graph.facebook.com/v21.0/{ig_user_id}/media
     media_type=REELS
     video_url={PUBLIC_HTTPS_VIDEO_URL}
     caption={APPROVED_CAPTION_AND_HASHTAGS}
     ```
   - **Step 2: Check Container Status**:
     ```http
     GET https://graph.facebook.com/v21.0/{creation_id}?fields=status_code
     ```
     Poll until `status_code` returns `FINISHED` (or handle webhook).
   - **Step 3: Publish Container**:
     ```http
     POST https://graph.facebook.com/v21.0/{ig_user_id}/media_publish
     creation_id={creation_id}
     ```

---

## 7. Webhook Configuration

MetaPilot AI includes an asynchronous webhook listener to process Meta state changes:
1. Navigate to **App Dashboard** > **Webhooks**.
2. Select **Instagram** or **Ad Account**.
3. Set **Callback URL**: `https://api.yourdomain.com/api/v1/webhooks/meta`
4. Set **Verify Token**: Configured via `META_WEBHOOK_VERIFY_TOKEN`.
5. Subscribe to:
   - `ad_account`: Anomaly and ad approval status changes.
   - `instagram`: Reels container encoding completion.

---

## 8. Sandboxing & Test Environments

For pre-production QA without touching live capital:
1. **Meta Test Ad Accounts**:
   - In Business Settings, navigate to **Ad Accounts** > **Add** > **Create a Test Ad Account**.
   - Test accounts support full campaign hierarchy creation (`PAUSED` or `ACTIVE`) without charging credit cards.
2. **Instagram Sandbox**:
   - Add test Instagram accounts as **Instagram Testers** under App Roles.
3. **MetaPilot AI Demo Mode**:
   - If `EXECUTION_MODE=demo`, all external Meta requests are short-circuited to high-fidelity synthetic fixtures with zero risk of live mutations.
