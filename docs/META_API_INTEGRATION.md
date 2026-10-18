# Meta Marketing & Instagram Graph API Integration Guide

## 1. Supported Endpoints & Graph API Version
MetaPilot AI utilizes Meta Graph API **v19.0+**.

### Key API Endpoints
- **Ad Library Creative Archive**:
  `GET https://graph.facebook.com/v19.0/ads_archive`
  - Parameters: `search_terms`, `ad_reached_countries=['US']`, `ad_type=ALL`
  - Ingests competitor headlines, primary copy, video duration, and snapshot URLs.
- **Campaign Draft Creation**:
  `POST https://graph.facebook.com/v19.0/{ad_account_id}/campaigns`
  - Enterprise rule: Status is hardcoded to `status="PAUSED"`.
- **Account Performance Insights**:
  `GET https://graph.facebook.com/v19.0/{ad_account_id}/insights`
  - Fields: `spend`, `impressions`, `clicks`, `cpc`, `ctr`, `actions`, `purchase_roas`
  - Date preset: `last_14d`
- **Instagram Reels Publishing Container Pipeline**:
  - Step 1: Create Container
    `POST https://graph.facebook.com/v19.0/{ig_user_id}/media`
    `media_type=REELS`, `video_url={url}`, `caption={caption}`, `share_to_feed=true`
  - Step 2: Publish Container
    `POST https://graph.facebook.com/v19.0/{ig_user_id}/media_publish`
    `creation_id={container_id}`

## 2. Meta Permissions & System User Token Setup
To transition from Demo Mode to Connected Mode:
1. Log into [Meta for Developers](https://developers.facebook.com/).
2. Create or select a Business App.
3. Add the **Marketing API** product.
4. Under Business Settings -> System Users, generate a System User Token with:
   - `ads_management`
   - `ads_read`
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
5. Copy the Token into `backend/.env` under `META_ACCESS_TOKEN`.
6. Set `EXECUTION_MODE=connected`.
