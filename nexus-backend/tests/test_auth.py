import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_mimic_auth_random():
    response = client.post("/api/v1/auth/mimic")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert "id" in data["user"]
    assert "role" in data["user"]

def test_mimic_auth_expert():
    response = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "expert"

def test_mimic_auth_client():
    response = client.post("/api/v1/auth/mimic", json={"role": "client"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "client"

def test_unauthenticated_me_fails():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_authenticated_me_succeeds():
    auth_resp = client.post("/api/v1/auth/mimic")
    token = auth_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == auth_resp.json()["user"]["id"]
