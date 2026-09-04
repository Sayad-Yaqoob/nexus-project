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
