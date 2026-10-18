import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"
AUTH_TOKEN = "demo-token-metapilot-preview"

def request(method, path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
        "X-Organization-Id": "org_apex_growth"
    }
    if headers:
        req_headers.update(headers)
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_content)
        except Exception:
            err_json = {"raw": err_content}
        return e.code, err_json

def run_simulation():
    print("==================================================")
    print("METAPILOT AI — COMPREHENSIVE END-TO-END VERIFICATION")
    print("==================================================")
    
    results = {}

    # 1. Health check
    status, body = request("GET", "/health", headers={})
    print(f"[1] Health Check: HTTP {status} -> mode={body.get('execution_mode')}")
    assert status == 200
    results["health"] = body

    # 2. Auth me
    status, body = request("GET", "/auth/me")
    print(f"[2] Auth /me: HTTP {status} -> user={body.get('email') or body.get('user', {}).get('email')}")
    assert status == 200
    results["auth"] = body

    # 3. Create client workspace: BrightSmile Dental Clinic
    dental_client_payload = {
        "name": "BrightSmile Dental Clinic",
        "industry": "Healthcare & Dental Care",
        "meta_ad_account_id": "act_8830192831",
        "instagram_handle": "@brightsmile_dental",
        "monthly_budget_usd": 15000.0,
        "target_roas_goal": 4.2,
        "is_active": True
    }
    status, dental_client = request("POST", "/clients", dental_client_payload)
    print(f"[3] Create Client Workspace: HTTP {status} -> id={dental_client.get('id')}, name={dental_client.get('name')}")
    assert status in (200, 201)
    client_id = dental_client.get("id")
    results["client"] = dental_client

    # 4. Add 5 Fictional Competitor Profiles
    competitors = [
        {"brand_name": "Apex Dental Spa", "website": "https://apexdentalspa.example.com", "industry": "Cosmetic Dentistry", "geographic_market": "Metro Area", "notes": "High-end veneers and Invisalign"},
        {"brand_name": "Metro Smile Studio", "website": "https://metrosmilestudio.example.com", "industry": "General & Cosmetic Dentistry", "geographic_market": "Downtown", "notes": "Same-day dental implants"},
        {"brand_name": "Radiant Family Dentistry", "website": "https://radiantfamilydentistry.example.com", "industry": "Family Dentistry", "geographic_market": "Suburbs", "notes": "Pediatric and family preventative care"},
        {"brand_name": "PureAlign Orthodontics", "website": "https://purealignortho.example.com", "industry": "Clear Aligners", "geographic_market": "National Direct", "notes": "Teeth straightening with virtual checkups"},
        {"brand_name": "GentleCare Dental Group", "website": "https://gentlecaredental.example.com", "industry": "Emergency & Restorative Dentistry", "geographic_market": "Regional", "notes": "Sedation and emergency dental treatments"}
    ]
    added_competitors = []
    for c in competitors:
        c_payload = {**c, "client_id": client_id}
        status, comp_resp = request("POST", "/competitors", c_payload)
        assert status in (200, 201)
        added_competitors.append(comp_resp)
        print(f"    - Added Competitor: {comp_resp.get('brand_name')} (ID: {comp_resp.get('id')})")
    print(f"[4] Added 5 Competitor Profiles: Success ({len(added_competitors)} added)")
    results["competitors"] = added_competitors

    # 5. Record Competitor Observations
    obs_payload = {
        "client_id": client_id,
        "competitor_name": "Apex Dental Spa",
        "headline": "Transform Your Smile in 2 Visits with Porcelain Veneers",
        "primary_text": "Tired of hiding your smile? Get free digital smile previews this month.",
        "call_to_action": "Book Consultation",
        "media_type": "video",
        "media_url": "https://assets.metapilot.internal/ads/competitor_dental_01.mp4",
        "hook_type": "pain_point",
        "creative_score": 91
    }
    status, obs_resp = request("POST", "/competitors/observations", obs_payload)
    print(f"[5] Record Competitor Observation: HTTP {status} -> ID={obs_resp.get('id')}")
    assert status in (200, 201)
    results["observation"] = obs_resp

    # 6. Generate Competitor Intelligence
    intel_payload = {
        "client_id": client_id,
        "industry": "Cosmetic Dentistry",
        "competitor_ids": [c["id"] for c in added_competitors]
    }
    status, intel_resp = request("POST", "/competitors/analyze", intel_payload)
    print(f"[6] Generate Competitor Intelligence: HTTP {status} -> angles_count={len(intel_resp.get('winning_angles', []))}, hooks={len(intel_resp.get('top_hooks', []))}")
    assert status in (200, 201)
    results["intel"] = intel_resp

    # 7. Generate Keywords and Advertising Hooks
    strat_req_payload = {
        "client_id": client_id,
        "industry": "Healthcare & Dental Care",
        "location": "Metro Area, United States",
        "budget_type": "monthly",
        "budget_amount": 15000.0,
        "product_service": "New Patient Special: $99 Comprehensive Exam, 3D X-Rays & Professional Cleaning + $500 Off Invisalign",
        "customer_profile": "Local adults 25-54 seeking dental care or smile aesthetics",
        "campaign_objective": "OUTCOME_LEADS",
        "destination_type": "WEBSITE",
        "destination_url": "https://brightsmile.example.com/special",
        "competitor_research_results": [
            intel_resp.get('top_hooks', ['Transform Your Smile in 2 Visits'])[0].get('text', 'Transform Your Smile')
            if intel_resp.get('top_hooks') and isinstance(intel_resp.get('top_hooks')[0], dict)
            else "Transform Your Smile in 2 Visits"
        ]
    }
    status, strat_resp = request("POST", "/strategies/generate-comprehensive", strat_req_payload)
    print(f"[7] Generate Comprehensive Strategy & Hooks: HTTP {status}")
    assert status in (200, 201)
    strategies_dict = strat_resp.get("strategies", {})
    strategies = list(strategies_dict.values())
    print(f"    - Generated {len(strategies)} Campaign Strategies:")
    for i, s in enumerate(strategies):
        print(f"      Strategy #{i+1} [{s.get('tier')}]: {s.get('name')} - {s.get('tagline')}")
    
    kw_intel = strat_resp.get("keyword_intelligence", {})
    print(f"    - Extracted {len(kw_intel.get('advertising_hooks', []))} Advertising Hooks & {len(kw_intel.get('research_keywords', []))} Keywords")
    results["strategies"] = strategies
    results["keyword_intelligence"] = kw_intel

    # 8. Select Strategy & Create Campaign Draft
    selected_strategy = strategies[0]
    campaign_draft_payload = {
        "client_id": client_id,
        "name": f"Dental New Patient Acquisition — {selected_strategy.get('name')}",
        "objective": "OUTCOME_LEADS",
        "daily_budget": selected_strategy.get("budget_allocation", {}).get("daily_budget_usd", 100.0),
        "target_audience": "Local adults 25-54 within 15 miles",
        "ad_sets": [
            {
                "name": "Broad Geofenced Adults 25-54",
                "optimization_goal": "LEAD_GENERATION",
                "daily_budget": selected_strategy.get("suggested_daily_budget", 100.0),
                "targeting": {"age_min": 25, "age_max": 54, "geo_locations": {"cities": ["Downtown"]}},
                "ads": [
                    {
                        "name": "Pain Point Hook Video Ad",
                        "creative_headline": "Smile With Absolute Confidence",
                        "primary_text": "Claim our $99 New Patient Consultation & 3D Imaging special today.",
                        "call_to_action": "SIGN_UP"
                    }
                ]
            }
        ]
    }
    status, campaign_draft = request("POST", "/campaigns", campaign_draft_payload)
    print(f"[8] Create Campaign Draft: HTTP {status} -> ID={campaign_draft.get('id')}")
    assert status in (200, 201)
    results["campaign_draft"] = campaign_draft

    # 9. Verify Campaign Draft Remains PAUSED
    campaign_id = campaign_draft.get("id")
    status_field = campaign_draft.get("status")
    print(f"[9] Verify Campaign Draft Status: '{status_field}' (Strictly PAUSED: {status_field == 'PAUSED'})")
    assert status_field == "PAUSED", f"Draft status must be PAUSED but got {status_field}"

    # 10. Test Activation Control Without Approval (Safety Guardrail)
    status, err_resp = request("POST", f"/campaigns/{campaign_id}/activate")
    print(f"[10] Attempt Activation Without Prior Approval: HTTP {status} (Expected 400 rejection)")
    assert status == 400, f"Expected 400 when activating unapproved campaign, got {status}"

    # 11. Request & Grant Approval for Campaign
    appr_req_status, _ = request("POST", f"/campaigns/{campaign_id}/request-approval")
    appr_status, appr_resp = request("POST", "/campaigns/approve", {
        "campaign_id": campaign_id,
        "reason": "Approved for testing dental clinic acquisition strategy",
        "confirm_budget_spend": True,
        "action_type": "CAMPAIGN_CREATION_APPROVAL"
    })
    print(f"[11] Approve Campaign Draft: HTTP {appr_status} -> approval_hash={appr_resp.get('approval_signature', '')[:16]}...")
    assert appr_status in (200, 201)

    # 12. Upload Sample Reel (9:16 Aspect Ratio, 15 seconds)
    reel_payload = {
        "client_id": client_id,
        "title": "Before & After Dental Transformation in 60 Days",
        "video_url": "https://assets.metapilot.internal/reels/dental_smile_makeover.mp4",
        "aspect_ratio": "9:16",
        "duration_seconds": 15.0,
        "target_hook": "Look what happened when she fixed her chipped front tooth",
        "music_attribution": "Original Audio - BrightSmile Clinic"
    }
    status, reel_resp = request("POST", "/reels/upload", reel_payload)
    print(f"[12] Upload Sample Reel: HTTP {status} -> Reel ID={reel_resp.get('id')}, Aspect Ratio={reel_resp.get('aspect_ratio')}, Duration={reel_resp.get('duration_seconds')}s")
    assert status in (200, 201)
    reel_id = reel_resp.get("id")
    results["reel"] = reel_resp

    # 13. Generate 3 Caption Suggestions
    caption_payload = {
        "reel_id": reel_id,
        "client_id": client_id,
        "context_description": "Porcelain veneer transformation showcasing a radiant smile improvement"
    }
    status, captions_resp = request("POST", "/reels/generate-captions", caption_payload)
    print(f"[13] Generate 3 Caption Suggestions: HTTP {status}")
    assert status in (200, 201)
    captions = captions_resp.get("captions", [])
    print(f"    - Generated {len(captions)} Captions:")
    for i, c in enumerate(captions):
        print(f"      Caption #{i+1} [{c.get('tone')}]: {c.get('text')[:60]}...")
    results["captions"] = captions

    # 14. Approve Reel & Simulate Publishing
    status, _ = request("POST", "/reels/verify-preview", {
        "reel_id": reel_id,
        "aspect_ratio_valid": True,
        "duration_seconds": 15.0,
        "preview_reviewed_by_user": True
    })
    status, approved_reel = request("POST", f"/reels/{reel_id}/approve")
    print(f"[14a] Approve Reel: HTTP {status} -> status={approved_reel.get('status')}")
    assert status in (200, 201)

    status, published_reel = request("POST", "/reels/publish", {
        "reel_id": reel_id,
        "confirm_publish_live": True,
        "idempotency_key": f"idem_{reel_id}"
    })
    print(f"[14b] Simulate Reel Publishing: HTTP {status} -> status={published_reel.get('status')}, media_id={published_reel.get('instagram_ig_id')}")
    assert status in (200, 201)

    # 15. View Simulated Advertising Performance
    status, analytics_resp = request("GET", f"/analytics?client_id={client_id}&level=account&date_preset=last_7d")
    print(f"[15] View Advertising Performance: HTTP {status} -> Spend=${analytics_resp.get('metrics', {}).get('spend_usd')}, ROAS={analytics_resp.get('metrics', {}).get('roas')}x, CTR={analytics_resp.get('metrics', {}).get('ctr_percent')}%")
    assert status == 200
    results["analytics"] = analytics_resp

    # 16. Generate 5 Prioritized AI Recommendations
    status, recs_resp = request("GET", f"/recommendations?client_id={client_id}")
    print(f"[16] Generate 5 Prioritized AI Recommendations: HTTP {status}")
    assert status == 200
    recommendations = recs_resp.get("items", [])
    print(f"    - Received {len(recommendations)} Recommendations:")
    for i, r in enumerate(recommendations[:5]):
        print(f"      Rec #{i+1} [{r.get('priority')}]: {r.get('title')} (Projected ROAS Lift: +{r.get('projected_roas_lift')}x)")
    results["recommendations"] = recommendations

    # 17. Export Client Performance Report
    status, report_resp = request("POST", "/automations/reports/generate", {"client_id": client_id})
    print(f"[17a] Generate Performance Report: HTTP {status} -> Report ID={report_resp.get('id')}")
    assert status in (200, 201)
    report_id = report_resp.get("id")

    status, csv_content = request("GET", f"/automations/reports/{report_id}/csv?client_id={client_id}")
    print(f"[17b] Export Client Report CSV: HTTP {status} -> {len(str(csv_content))} bytes received")
    assert status == 200

    print("==================================================")
    print("ALL 17 END-TO-END DEMO SIMULATION STEPS COMPLETED!")
    print("==================================================")
    return True

if __name__ == "__main__":
    success = run_simulation()
    if not success:
        sys.exit(1)
