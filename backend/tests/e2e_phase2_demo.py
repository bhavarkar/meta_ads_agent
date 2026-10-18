"""
MetaPilot AI - Phase 2 End-to-End Simulation Script
Simulates an agency onboarding a dental clinic client ('Apex Dental Studio').
Tests all 16 steps against the operational backend server (http://127.0.0.1:8000/api/v1).
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"
AUTH_HEADER = {"Authorization": "Bearer demo-token-metapilot-preview", "Content-Type": "application/json"}

def make_req(endpoint: str, method: str = "GET", payload: dict = None, is_csv: bool = False):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=AUTH_HEADER, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if is_csv:
                return resp.status, content.decode("utf-8")
            return resp.status, json.loads(content.decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def run_simulation():
    print("=" * 80)
    print("STARTING METAPILOT AI PHASE 2 END-TO-END DEMO SIMULATION")
    print("Client Profile: Apex Dental Studio (Healthcare & Aesthetic Dentistry)")
    print("=" * 80)

    # STEP 1: Create or select client workspace
    print("\n--- STEP 1: Creating Client Workspace 'Apex Dental Studio' ---")
    client_payload = {
        "name": "Apex Dental Studio",
        "industry": "Healthcare & Dental",
        "meta_ad_account_id": "act_dental_demo_101",
        "instagram_handle": "@apexdentalstudio",
        "monthly_budget_usd": 8000.00,
        "target_roas_goal": 3.50,
        "is_active": True
    }
    status, client = make_req("/clients", method="POST", payload=client_payload)
    assert status == 201, f"Failed step 1: {status} {client}"
    client_id = client["id"]
    print(f"[SUCCESS] Workspace Created. ID: {client_id}, Name: {client['name']}, Budget: ${client['monthly_budget_usd']}")

    # STEP 2: Add five fictional competitor profiles
    print("\n--- STEP 2: Adding 5 Fictional Competitor Profiles ---")
    competitors_data = [
        {"name": "Downtown Modern Dental", "website": "https://downtownmoderndental.example.com", "specialty": "General & Cosmetic"},
        {"name": "PureSmile Orthodontics", "website": "https://puresmileortho.example.com", "specialty": "Clear Aligners"},
        {"name": "Radiant Teeth Whitening Bar", "website": "https://radiantsmilebar.example.com", "specialty": "In-Office Whitening"},
        {"name": "GentleCare Family Dentistry", "website": "https://gentlecarefamily.example.com", "specialty": "Pediatric & Family"},
        {"name": "Elite Laser Dental Implants", "website": "https://elitelaserdental.example.com", "specialty": "Implants & Restorative"}
    ]
    created_competitors = []
    for c in competitors_data:
        comp_payload = {
            "client_id": client_id,
            "name": c["name"],
            "website": c["website"],
            "industry": "Healthcare & Dental",
            "geographic_market": "Metro Area",
            "facebook_page_id": f"page_{abs(hash(c['name'])) % 10000000}",
            "notes": f"Fictional competitor monitored for {c['specialty']}"
        }
        status, comp_resp = make_req("/competitors", method="POST", payload=comp_payload)
        assert status == 201, f"Failed to add competitor {c['name']}: {status} {comp_resp}"
        created_competitors.append(comp_resp)
        print(f"  [+] Added Competitor: {comp_resp['name']} (ID: {comp_resp['id']})")
    assert len(created_competitors) == 5
    print("[SUCCESS] All 5 fictional competitor profiles registered.")

    # STEP 3: Record example competitor observations
    print("\n--- STEP 3: Recording Example Competitor Observations ---")
    observation_payload = {
        "competitor_id": created_competitors[0]["id"],
        "advertiser_name": created_competitors[0]["name"],
        "headline": "Transform Your Smile in 6 Months with Invisible Aligners",
        "primary_text": "Tired of metal braces? Get our digital 3D smile scan and custom clear aligners for $150/mo. Limited new patient slots available this month!",
        "call_to_action": "BOOK_NOW",
        "format": "video_reel",
        "observation_date": "2026-10-17",
        "hook_type": "Problem-Agitation / Pain Point",
        "extracted_hook_text": "Tired of hiding your smile in photos?",
        "extracted_offer": "Free 3D Smile Scan + $500 Off Comprehensive Treatment",
        "is_hypothesis": False,
        "evidence_type": "ad_library_public"
    }
    status, obs_resp = make_req("/competitors/observations", method="POST", payload=observation_payload)
    assert status == 201, f"Failed step 3: {status} {obs_resp}"
    print(f"[SUCCESS] Recorded Observation: '{obs_resp['headline']}' | Hook: '{obs_resp['extracted_hook_text']}'")

    # STEP 4: Generate competitor intelligence
    print("\n--- STEP 4: Generating Competitor Intelligence Analysis ---")
    analysis_payload = {
        "client_id": client_id,
        "industry": "Healthcare & Dental",
        "primary_product": "Invisalign & Cosmetic Dentistry",
        "competitor_ids": [c["id"] for c in created_competitors]
    }
    status, report_resp = make_req("/competitors/analyze", method="POST", payload=analysis_payload)
    assert status == 200, f"Failed step 4: {status} {report_resp}"
    print(f"[SUCCESS] Generated Intelligence Report: '{report_resp['title']}'")
    print(f"  Executive Summary: {report_resp['executive_summary'][:120]}...")
    print(f"  Top Discovered Angles: {len(report_resp.get('top_angles', []))} angles identified.")

    # STEP 5: Generate relevant keywords and advertising hooks
    print("\n--- STEP 5: Validating Keywords & Extracting Advertising Hooks ---")
    target_terms = ["Dentistry", "Teeth whitening", "Orthodontics", "Invisalign", "Cosmetic dentistry"]
    status, targeting_resp = make_req("/strategies/validate-targeting", method="POST", payload={"keywords": target_terms})
    assert status == 200, f"Failed step 5: {status} {targeting_resp}"
    print(f"[SUCCESS] Validated {len(targeting_resp)} Meta targeting keywords:")
    for item in targeting_resp:
        print(f"  - Term: '{item['keyword']}' -> Meta ID: {item['meta_id']} | Type: {item['type']} | Audience: {item['estimated_audience_size']:,}")

    # STEP 6: Generate three campaign strategies
    print("\n--- STEP 6: Generating 3 Distinct Campaign Strategies (Conservative, Balanced, Experimental) ---")
    strategy_payload = {
        "client_id": client_id,
        "industry": "Healthcare & Dental",
        "product_service": "Cosmetic & Restorative Dentistry",
        "customer_profile": "Working professionals and families seeking premium dental care",
        "budget_amount": 8000.00,
        "campaign_objective": "OUTCOME_LEADS",
        "destination_type": "INSTANT_FORM",
        "geographic_targeting": ["Metro Area (25mi radius)"]
    }
    status, strat_resp = make_req("/strategies/generate-comprehensive", method="POST", payload=strategy_payload)
    assert status == 201, f"Failed step 6: {status} {strat_resp}"
    print(f"[SUCCESS] Generated Strategy Set: ID {strat_resp['id']}")
    tiers = strat_resp["strategies"]
    print(f"  1. Conservative Strategy: '{tiers['conservative']['name']}' | Split: {tiers['conservative']['budget_split']}")
    print(f"  2. Balanced Strategy:     '{tiers['balanced']['name']}' | Split: {tiers['balanced']['budget_split']}")
    print(f"  3. Experimental Strategy: '{tiers['experimental']['name']}' | Split: {tiers['experimental']['budget_split']}")

    # STEP 7: Select a strategy
    print("\n--- STEP 7: Selecting Balanced Full-Funnel Growth Strategy ---")
    save_payload = {
        "client_id": client_id,
        "selected_tier": "balanced",
        "notes": "Selected for balanced dental patient lead acquisition with local awareness"
    }
    status, saved_strat = make_req("/strategies/save", method="POST", payload=save_payload)
    assert status == 201, f"Failed step 7: {status} {saved_strat}"
    print(f"[SUCCESS] Strategy Saved. Record ID: {saved_strat['id']} | Tier: {saved_strat['selected_tier']}")

    # STEP 8: Create a campaign draft
    print("\n--- STEP 8: Creating Campaign Draft from Selected Strategy ---")
    campaign_payload = {
        "client_id": client_id,
        "name": "Apex Dental - Q4 Smile Transformation Leads",
        "objective": "OUTCOME_LEADS",
        "budget_level": "CAMPAIGN",
        "daily_budget_usd": 250.00,
        "special_ad_category": "NONE",
        "ad_sets": [
            {
                "id": "adset_apex_01",
                "name": "Local Invisalign Seekers 25-54",
                "optimization_goal": "LEAD_GENERATION",
                "billing_event": "IMPRESSIONS",
                "destination_type": "INSTANT_FORM",
                "status": "PAUSED"
            }
        ],
        "creatives": [
            {
                "id": "cr_apex_01",
                "headline": "Book Your Free 3D Digital Smile Scan Today",
                "primary_text": "Experience compassionate, state-of-the-art dental care at Apex Dental Studio. Zero-interest monthly payment plans available.",
                "destination_url": "https://apexdentalstudio.example.com/smile-consult",
                "media_url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800",
                "call_to_action": "APPLY_NOW"
            }
        ]
    }
    status, camp_resp = make_req("/campaigns", method="POST", payload=campaign_payload)
    assert status == 201, f"Failed step 8: {status} {camp_resp}"
    camp_id = camp_resp["id"]
    print(f"[SUCCESS] Campaign Draft Created: {camp_resp['name']} (ID: {camp_id})")

    # STEP 9: Verify the draft remains PAUSED
    print("\n--- STEP 9: Verifying Mandatory Safety Constraint (Draft STRICTLY PAUSED) ---")
    assert camp_resp["status"] == "PAUSED", f"SECURITY BREACH: Campaign status is {camp_resp['status']}, expected PAUSED"
    assert camp_resp["is_approved"] is False, "SECURITY BREACH: Campaign marked approved without explicit sign-off"
    assert camp_resp["approval_required"] is True, "SECURITY BREACH: Approval requirement bypassed"
    print(f"[CONFIRMED] Campaign status: '{camp_resp['status']}'")
    print(f"[CONFIRMED] is_approved: {camp_resp['is_approved']}")
    print(f"[CONFIRMED] approval_required: {camp_resp['approval_required']}")
    print(f"[CONFIRMED] Ad Sets status: {[s['status'] for s in camp_resp['ad_sets']]}")
    print("[SUCCESS] Campaign draft strictly PAUSED with zero budget exposure.")

    # STEP 10: Upload a sample Reel
    print("\n--- STEP 10: Uploading Sample Instagram Reel Asset (9:16 Vertical, 15.0s) ---")
    reel_payload = {
        "client_id": client_id,
        "title": "Dr. Vance Explains Smile Makeovers in 60 Seconds",
        "video_url": "https://assets.metapilot.internal/samples/apex_dental_reel_01.mp4",
        "caption": "Ever wondered how painless modern cosmetic dentistry really is? Tap to see how our digital 3D scans work! ✨🦷",
        "hashtags": ["#DentalHealth", "#CosmeticDentistry", "#SmileMakeover", "#InvisalignJourney"],
        "duration_seconds": 15.0,
        "aspect_ratio": "9:16",
        "video_codec": "H.264",
        "audio_codec": "AAC",
        "rights_ownership": "OWNED",
        "preview_verified": True
    }
    status, reel_resp = make_req("/reels/upload", method="POST", payload=reel_payload)
    assert status == 201, f"Failed step 10: {status} {reel_resp}"
    reel_id = reel_resp["id"]
    print(f"[SUCCESS] Reel Uploaded: ID {reel_id} | Status: {reel_resp['status']} | Ratio: {reel_resp['aspect_ratio']}")

    # STEP 11: Generate three caption suggestions
    print("\n--- STEP 11: Generating 3 AI Caption Variations (Hook, Story, Direct CTA) ---")
    caption_payload = {
        "reel_id": reel_id,
        "video_theme": "Modern painless digital smile scans and cosmetic dentistry",
        "target_audience": "Adults considering clear aligners or teeth whitening",
        "call_to_action": "Book your complimentary consultation today",
        "brand_voice": "Friendly, expert, reassuring, and premium"
    }
    status, caption_resp = make_req("/reels/generate-captions", method="POST", payload=caption_payload)
    assert status == 200, f"Failed step 11: {status} {caption_resp}"
    assert len(caption_resp["options"]) == 3, f"Expected 3 options, got {len(caption_resp['options'])}"
    print(f"[SUCCESS] Generated 3 Caption Options:")
    for opt in caption_resp["options"]:
        print(f"  - [{opt['style'].upper()}]: '{opt['caption'][:80]}...' | Angle: {opt['hook_angle']}")

    # STEP 12: Approve a Reel
    print("\n--- STEP 12: Executing Server-Validated Cryptographic Approval of Reel ---")
    # Verify preview first
    status, prev_resp = make_req(f"/reels/{reel_id}/verify-preview", method="POST")
    assert status == 200, f"Failed preview verify: {status} {prev_resp}"
    
    status, approve_resp = make_req(f"/reels/{reel_id}/approve", method="POST")
    assert status == 200, f"Failed step 12: {status} {approve_resp}"
    assert approve_resp["is_approved"] is True
    assert approve_resp["status"] in ("APPROVED", "APPROVED_FOR_PUBLISHING")
    print(f"[SUCCESS] Reel Approved: Status '{approve_resp['status']}' | Approval Binding Hash: {approve_resp.get('approval_binding_hash', 'N/A')[:24]}...")

    # STEP 13: Simulate publishing
    print("\n--- STEP 13: Simulating Instagram Graph API Publishing Pipeline ---")
    publish_payload = {
        "reel_id": reel_id,
        "target_instagram_account_id": "17841400000000001",
        "confirm_publish_live": True,
        "publish_mode": "NOW"
    }
    status, pub_resp = make_req("/reels/publish", method="POST", payload=publish_payload)
    assert status == 200, f"Failed step 13: {status} {pub_resp}"
    assert pub_resp["status"] == "PUBLISHED"
    print(f"[SUCCESS] Simulated Publishing Finished! Permalink: {pub_resp.get('permalink')} | Container ID: {pub_resp.get('ig_container_id')}")

    # STEP 14: View simulated advertising performance
    print("\n--- STEP 14: Viewing Simulated Advertising Telemetry & Insights ---")
    status, analytics_resp = make_req(f"/analytics?client_id={client_id}&date_preset=last_30d")
    assert status == 200, f"Failed step 14: {status} {analytics_resp}"
    summary = analytics_resp["summary"]
    print(f"[SUCCESS] Retrieved Performance Telemetry:")
    print(f"  Total Spend:   ${summary['spend']:,.2f}")
    print(f"  Impressions:   {summary['impressions']:,}")
    print(f"  Clicks:        {summary['clicks']:,} (CTR: {summary['ctr']:.2f}%)")
    print(f"  Blended ROAS:  {summary['roas']:.2f}x (Target Goal: 3.50x)")
    print(f"  CPA:           ${summary['cpa']:.2f}")

    # STEP 15: Generate five recommendations
    print("\n--- STEP 15: Running 8-Step LangGraph Recommendation Engine (5 Prioritized Actions) ---")
    status, recs_resp = make_req(f"/recommendations?client_id={client_id}")
    assert status == 200, f"Failed step 15: {status} {recs_resp}"
    recommendations = recs_resp["recommendations"]
    assert len(recommendations) == 5, f"Expected 5 recommendations, got {len(recommendations)}"
    print(f"[SUCCESS] 5 Prioritized Recommendations Generated (Total Projected ROAS Lift: +{recs_resp['total_projected_roas_lift']:.2f}x):")
    for r in recommendations:
        print(f"  #{r['priority_rank']} [{r['urgency']}]: {r['title']} (Projected Lift: +{r['projected_roas_lift']}x, Effort: {r['effort']})")

    # STEP 16: Export a client report
    print("\n--- STEP 16: Generating Executive Report & Downloading RFC-4180 CSV ---")
    gen_report_payload = {
        "client_id": client_id,
        "date_preset": "last_7d",
        "include_anomalies": True,
        "include_recommendations": True
    }
    status, report_meta = make_req("/automations/reports/generate", method="POST", payload=gen_report_payload)
    assert status == 200, f"Failed step 16 generate: {status} {report_meta}"
    report_id = report_meta["report_id"]
    print(f"[SUCCESS] Executive Report Created: ID {report_id} | Title: '{report_meta['report_title']}'")
    
    # Download CSV
    status, csv_content = make_req(f"/automations/reports/{report_id}/csv?client_id={client_id}", is_csv=True)
    assert status == 200, f"Failed step 16 csv download: {status}"
    lines = csv_content.strip().split("\n")
    print(f"[SUCCESS] CSV Export Downloaded ({len(lines)} lines, {len(csv_content)} bytes). Header sample:")
    for l in lines[:4]:
        print(f"  >> {l}")

    print("\n" + "=" * 80)
    print("ALL 16 PHASES OF THE END-TO-END DEMO COMPLETED SUCCESSFULLY WITH ZERO DEFECTS!")
    print("=" * 80)

if __name__ == "__main__":
    run_simulation()
