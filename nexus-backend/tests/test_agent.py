import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_unauthenticated_agent_chat_fails():
    response = client.post("/api/v1/agent/chat", json={"message": "Hello"})
    assert response.status_code == 401

def test_authenticated_agent_chat_succeeds():
    # Login as client
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "client"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Send message to agent
    chat_resp = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "I need help finding an AI research expert"}
    )
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert "response" in data
    assert "session_id" in data
    assert data["role"] == "client"
    assert len(data["response"]) > 0
    assert "suggested_actions" in data

def test_client_context_cannot_elevate_agent_permissions():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "client"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Perspective and capabilities originate in the browser and are advisory.
    # They must not allow a client account to create seller offerings.
    chat_resp = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={
            "message": "Create a 1:1 session for $500",
            "agent_context": {"perspective": "expert", "capabilities": ["client", "expert"]},
        },
    )

    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert data["role"] == "client"
    assert data["response_type"] == "error"

def test_multiturn_agent_session():
    # Login as expert
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First turn
    turn1 = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "How can I set up my consulting offerings?"}
    )
    assert turn1.status_code == 200
    sess_id = turn1.json()["session_id"]

    # Second turn with session_id
    turn2 = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "What price do you suggest for a 60 min session?", "session_id": sess_id}
    )
    assert turn2.status_code == 200
    assert turn2.json()["session_id"] == sess_id
    assert len(turn2.json()["conversation_history"]) >= 4

def test_expert_availability_is_profile_workflow_not_onboarding():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    preview = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "Set Weekly Availability Hours (Mon-Fri, 9 AM - 5 PM)"},
    )
    assert preview.status_code == 200
    preview_data = preview.json()
    assert preview_data["intent"] == "expert_availability_set"
    assert preview_data["response_type"] == "action_preview"
    assert preview_data["draft"]["weekly_hours"]["days"] == [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    ]
    assert preview_data["draft"]["weekly_hours"]["start"] == "9 AM"
    assert preview_data["draft"]["weekly_hours"]["end"] == "5 PM"

    saved = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "Confirm Availability", "session_id": preview_data["session_id"]},
    )
    assert saved.status_code == 200
    saved_data = saved.json()
    assert saved_data["response_type"] == "action_success"
    assert saved_data["action_result"]["weekly_hours"]["days"] == preview_data["draft"]["weekly_hours"]["days"]
