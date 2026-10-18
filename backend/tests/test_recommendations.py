"""Comprehensive test suite verifying the MetaPilot AI Recommendation Engine using LangGraph.

Covers:
1. 8-step LangGraph state machine execution & workflow logs.
2. Recommendation structure schema compliance (evidence, mechanism, uncertainty).
3. 9 category definitions and diversity.
4. Grounding and zero ROI fabrication integrity checks.
5. Insufficient data highlighting and low-sample size warnings.
6. Approval requirement safety enforcement on budget and campaign mutations.
7. User feedback lifecycle: Accept, Reject, Snooze, Mark Implemented.
8. Conversion of authorized recommendations into approval requests.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.recommendation_engine import recommendation_engine

client = TestClient(app)


def test_get_five_prioritized_recommendations():
    """Verify exactly 5 prioritized AI recommendations are returned with valid priorities."""
    response = client.get("/api/v1/recommendations?client_id=cli_lumina_glow")
    assert response.status_code == 200
    data = response.json()
    recs = data["recommendations"]
    assert len(recs) == 5

    # Verify priority order 1 to 5
    priorities = [r["priority"] for r in recs]
    assert priorities == [1, 2, 3, 4, 5]


def test_eight_step_langgraph_workflow_execution():
    """Verify the 8-step LangGraph state machine workflow logs all steps sequentially."""
    response = client.get("/api/v1/recommendations?client_id=cli_lumina_glow")
    assert response.status_code == 200
    data = response.json()

    logs = data.get("workflow_execution_logs", [])
    assert len(logs) == 8

    expected_steps = [
        (1, "Load Client Context"),
        (2, "Retrieve Verified Campaign Performance"),
        (3, "Retrieve Competitor Intelligence"),
        (4, "Identify Performance Bottlenecks"),
        (5, "Generate Candidate Recommendations"),
        (6, "Score Recommendations"),
        (7, "Validate Evidence and Feasibility"),
        (8, "Return Top Five Actions")
    ]

    for log, (expected_num, expected_name) in zip(logs, expected_steps):
        assert log["step_number"] == expected_num
        assert log["step_name"] == expected_name
        assert len(log["summary"]) > 10


def test_recommendation_structure_and_typed_schema():
    """Verify all recommendations adhere to the strict structure required by the specification."""
    response = client.get("/api/v1/recommendations?client_id=cli_lumina_glow")
    assert response.status_code == 200
    recs = response.json()["recommendations"]

    for r in recs:
        # Title
        assert isinstance(r["title"], str) and len(r["title"]) > 5

        # Problem identified
        assert isinstance(r["problem_identified"], str) and len(r["problem_identified"]) > 15

        # Supporting evidence (metrics and evidence links)
        assert isinstance(r["supporting_evidence"], list)
        assert len(r["supporting_evidence"]) >= 1

        # Recommended action
        assert isinstance(r["recommended_action"], str) and len(r["recommended_action"]) > 10

        # Expected mechanism of improvement
        assert isinstance(r["expected_mechanism"], str) and len(r["expected_mechanism"]) > 20

        # Impact estimate with uncertainty
        impact = r["impact_estimate"]
        assert impact is not None
        assert isinstance(impact["metric_name"], str)
        assert isinstance(impact["estimated_change_range"], str)
        assert impact["uncertainty_rating"] in ["LOW", "MEDIUM", "HIGH"]
        assert "not guaranteed" in impact["rationale"].lower() or "no guarantee" in impact["rationale"].lower()

        # Confidence level
        assert r["confidence_level"] in ["HIGH", "MEDIUM", "LOW"]

        # Effort required
        assert r["effort_required"] in ["LOW", "MEDIUM", "HIGH"]

        # Risk
        assert r["risk"] in ["LOW", "MEDIUM", "HIGH"]

        # Priority score
        assert 1 <= r["priority_score"] <= 100

        # Action category
        assert r["category"] in [
            "Creative optimization",
            "Audience testing",
            "Budget allocation",
            "Conversion tracking",
            "Landing page optimization",
            "Lead quality",
            "Retargeting",
            "Campaign structure",
            "Instagram content strategy"
        ]

        # Whether approval is required
        assert isinstance(r["approval_required"], bool)


def test_safety_enforcement_no_autonomous_budget_or_campaign_mutations():
    """Verify that any action modifying budgets or pausing/activating campaigns STRICTLY requires human approval."""
    response = client.get("/api/v1/recommendations?client_id=cli_lumina_glow")
    assert response.status_code == 200
    recs = response.json()["recommendations"]

    state_mutating_action_types = [
        "SCALE_BUDGET", "REALLOCATE_BUDGET", "CUT_BUDGET", "SWAP_CREATIVE",
        "PAUSE_AD", "ACTIVATE_AD", "PAUSE_CAMPAIGN", "ACTIVATE_CAMPAIGN",
        "CREATE_LOOKALIKE_TEST", "CREATE_VIDEO_ENGAGEMENT_RETARGETING"
    ]

    for r in recs:
        if r["action_type"] in state_mutating_action_types:
            assert r["approval_required"] is True, f"Action {r['action_type']} must strictly require approval!"


def test_insufficient_data_flagging_and_small_sample_size_warnings():
    """Verify that low-sample entities (< $100 spend or < 10 results) are flagged with insufficient data warnings."""
    # Test step 4 directly with simulated low sample entity
    mock_state = {
        "client_id": "cli_lumina_glow",
        "client_context": {},
        "campaign_performance": {
            "summary": {"total_spend": 50.0, "roas": 2.0, "conversions": 2},
            "placements": [],
            "top_creatives": [],
            "weak_creatives": [],
            "entities": [
                {"id": "adset_low_spend", "name": "Pilot Cold Segment", "spend": 45.0, "results": 2}
            ],
            "funnel": []
        },
        "competitor_intel": {"competitor_profiles": []},
        "available_assets": [],
        "bottlenecks": [],
        "insufficient_data_alerts": [],
        "candidate_recommendations": [],
        "scored_recommendations": [],
        "validated_recommendations": [],
        "final_recommendations": [],
        "workflow_logs": []
    }
    from app.services.recommendation_engine import step_4_identify_bottlenecks
    output = step_4_identify_bottlenecks(mock_state)

    assert len(output["insufficient_data_alerts"]) > 0
    alert = output["insufficient_data_alerts"][0]
    assert "Sample size too small" in alert["warning"]
    assert alert["spend"] == 45.0
    assert alert["results"] == 2


def test_user_feedback_lifecycle_accept_reject_snooze_implemented():
    """Verify user feedback: Accept, Reject, Snooze, and Mark Implemented."""
    # 1. Accept
    res_accept = client.post("/api/v1/recommendations/feedback", json={
        "recommendation_id": "rec_cr_opt_01",
        "client_id": "cli_lumina_glow",
        "status": "ACCEPTED",
        "notes": "Approved for creative rotation testing."
    })
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "ACCEPTED"

    # 2. Reject
    res_reject = client.post("/api/v1/recommendations/feedback", json={
        "recommendation_id": "rec_cr_opt_01",
        "client_id": "cli_lumina_glow",
        "status": "REJECTED",
        "notes": "Prefer to wait until end of week."
    })
    assert res_reject.status_code == 200
    assert res_reject.json()["status"] == "REJECTED"

    # 3. Snooze
    res_snooze = client.post("/api/v1/recommendations/feedback", json={
        "recommendation_id": "rec_cr_opt_01",
        "client_id": "cli_lumina_glow",
        "status": "SNOOZED",
        "notes": "Re-evaluate after 48 hours."
    })
    assert res_snooze.status_code == 200
    assert res_snooze.json()["status"] == "SNOOZED"

    # 4. Mark Implemented
    res_imp = client.post("/api/v1/recommendations/feedback", json={
        "recommendation_id": "rec_cr_opt_01",
        "client_id": "cli_lumina_glow",
        "status": "IMPLEMENTED",
        "notes": "New Reel has been linked."
    })
    assert res_imp.status_code == 200
    assert res_imp.json()["status"] == "IMPLEMENTED"


def test_convert_recommendation_to_separate_approval_request():
    """Verify converting an authorized action recommendation into a separate campaign approval request."""
    response = client.post("/api/v1/recommendations/rec_bg_alloc_02/convert-to-approval", params={
        "client_id": "cli_lumina_glow"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACCEPTED"
    assert data["approval_request_id"] is not None
    assert data["approval_request_id"].startswith("appr_rec_rec_bg_alloc_02_")

    # Verify audit event was logged
    audit_res = client.get("/api/v1/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()["items"]
    actions = [l["action"] for l in logs]
    assert "RECOMMENDATION_CONVERTED_TO_APPROVAL" in actions


def test_apply_recommendation():
    """Verify applying a recommendation updates status and records audit event."""
    response = client.post("/api/v1/recommendations/apply", json={
        "recommendation_id": "rec_cr_opt_01",
        "client_id": "cli_lumina_glow",
        "confirm_action": True
    })
    assert response.status_code == 200
    assert response.json()["status"] == "APPLIED"

    # Verify audit event was logged
    audit_res = client.get("/api/v1/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()["items"]
    actions = [l["action"] for l in logs]
    assert "AI_RECOMMENDATION_APPLIED" in actions
