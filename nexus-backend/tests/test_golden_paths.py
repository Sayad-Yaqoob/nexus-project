import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_golden_path_a_expert_offer_creation_and_confirmation():
    # 1. Login as expert
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Expert natural language request
    msg = "I need to create a 1:1 session for $500. I will be offering marketing strategies and other related things. Total time will be 1 hour."
    chat_resp = client.post("/api/v1/agent/chat", headers=headers, json={"message": msg})
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    
    assert data["response_type"] == "action_preview"
    assert data["requires_confirmation"] is True
    assert data["draft"] is not None
    assert data["draft"]["price"] == 500.0
    assert data["draft"]["offer_type"] == "1:1 Session"
    assert "Marketing" in data["draft"]["title"]
    
    sess_id = data["session_id"]

    # 3. Explicit confirmation
    confirm_resp = client.post(
        "/api/v1/agent/chat",
        headers=headers,
        json={"message": "confirm", "session_id": sess_id}
    )
    assert confirm_resp.status_code == 200
    c_data = confirm_resp.json()
    assert c_data["response_type"] == "action_success"
    assert c_data["requires_confirmation"] is False
    assert c_data["action_result"]["id"] is not None

    # 4. Verify record in My Offers endpoint
    off_resp = client.get("/api/v1/offerings", headers=headers)
    assert off_resp.status_code == 200
    user_offerings = off_resp.json()
    assert len(user_offerings) > 0
    created_off = [o for o in user_offerings if o["price"] == 500.0]
    assert len(created_off) > 0

def test_golden_path_a_offer_editing():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request price edit
    edit_req = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Change my marketing session to $600"})
    assert edit_req.status_code == 200
    data = edit_req.json()
    assert data["response_type"] == "action_preview"
    assert data["draft"]["price"] == 600.0
    sess_id = data["session_id"]

    # Confirm edit
    confirm_req = client.post("/api/v1/agent/chat", headers=headers, json={"message": "confirm", "session_id": sess_id})
    assert confirm_req.status_code == 200
    assert confirm_req.json()["response_type"] == "action_success"

def test_golden_path_b_client_semantic_search_and_booking():
    # 1. Login as client
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "client"})
    assert auth_resp.status_code == 200
    client_token = auth_resp.json()["access_token"]
    client_id = auth_resp.json()["user"]["id"]
    client_headers = {"Authorization": f"Bearer {client_token}"}

    # 2. Client search request
    search_msg = "I need an expert for our marketing team to help us launch the new product related to authors"
    chat_resp = client.post("/api/v1/agent/chat", headers=client_headers, json={"message": search_msg})
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    
    assert data["response_type"] == "search_results"
    assert "response_data" in data
    matches = data["response_data"]["matches"]
    assert len(matches) > 0

    top_match = matches[0]
    expert_user_id = top_match["user_id"]
    offering_id = top_match["top_offering"]["id"] if top_match.get("top_offering") else None

    # 3. Create demo booking
    book_resp = client.post(
        "/api/v1/bookings",
        headers=client_headers,
        json={"expert_user_id": expert_user_id, "offering_id": offering_id, "notes": "Demo product launch consultation"}
    )
    assert book_resp.status_code == 200
    b_data = book_resp.json()["booking"]
    assert b_data["status"] == "confirmed"
    assert b_data["payment_status"] == "Demo / Simulated"

    # 4. Verify client sees booking in My Bookings
    c_bookings = client.get("/api/v1/bookings", headers=client_headers).json()
    assert any(b["id"] == b_data["id"] for b in c_bookings)

    # 5. Login as expert & verify expert sees booking in Incoming Bookings
    exp_auth = client.post("/api/v1/auth/mimic", json={"role": "expert", "user_id": expert_user_id})
    exp_token = exp_auth.json()["access_token"]
    exp_headers = {"Authorization": f"Bearer {exp_token}"}

    e_bookings = client.get("/api/v1/bookings", headers=exp_headers).json()
    assert any(b["id"] == b_data["id"] for b in e_bookings)

    # 6. Verify expert earnings query
    earnings_resp = client.get("/api/v1/earnings", headers=exp_headers)
    assert earnings_resp.status_code == 200
    earn_data = earnings_resp.json()
    assert earn_data["total_sales_count"] >= 1
    assert earn_data["expert_net_earnings"] > 0

def test_client_authorization_restrictions():
    # 1. Login as client
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "client"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Earnings endpoint must return 403 Forbidden for clients
    earn_resp = client.get("/api/v1/earnings", headers=headers)
    assert earn_resp.status_code == 403

    # 3. Update offering endpoint must return 403 Forbidden for clients
    put_resp = client.put("/api/v1/offerings/1", headers=headers, json={"price": 999.0})
    assert put_resp.status_code == 403

    # 4. Agent creation action must return polite error response for clients
    chat_resp = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Create a 1:1 session for $500"})
    assert chat_resp.status_code == 200
    data = chat_resp.json()
    assert data["response_type"] == "error"
    assert "reserved for Expert accounts" in data["response"]

def test_expert_retains_client_capabilities():
    # 1. Login as expert
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Expert performs client search
    search_resp = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Find an AI expert for RAG optimization"})
    assert search_resp.status_code == 200
    data = search_resp.json()
    assert data["response_type"] == "search_results"
    assert len(data["response_data"]["matches"]) > 0

    # 3. Expert books another expert
    target = data["response_data"]["matches"][0]
    book_resp = client.post(
        "/api/v1/bookings",
        headers=headers,
        json={"expert_user_id": target["user_id"], "notes": "Expert-to-expert consultation"}
    )
    assert book_resp.status_code == 200
    assert book_resp.json()["booking"]["status"] == "confirmed"

def test_state_contamination_regression():
    # 1. Login as expert
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create 1:1 session for $500
    r1 = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Create a 1:1 session for $500"})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["response_type"] == "action_preview"
    assert d1["draft"]["price"] == 500.0
    sess_id = d1["session_id"]

    # Step 2: Confirm action
    r2 = client.post("/api/v1/agent/chat", headers=headers, json={"message": "confirm", "session_id": sess_id})
    assert r2.status_code == 200
    assert r2.json()["response_type"] == "action_success"

    # Step 3: Ask to publish a book for $300 (must NOT reuse old 1:1 session draft)
    r3 = client.post("/api/v1/agent/chat", headers=headers, json={"message": "I need to publish my book for $300", "session_id": sess_id})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["response_type"] == "action_preview"
    assert d3["draft"]["offer_type"] == "Book"
    assert d3["draft"]["price"] == 300.0

    # Step 4: Ask to find an expert who can market/launch the book (must NOT return old creation draft)
    r4 = client.post("/api/v1/agent/chat", headers=headers, json={"message": "I need an expert who can help me market and launch my new book", "session_id": sess_id})
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["response_type"] == "search_results"
    assert "matches" in d4["response_data"]
    assert len(d4["response_data"]["matches"]) > 0

def test_subscription_semantic_resolution():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # "Create a subscription plan for clients for $25/month"
    r = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Create a subscription plan for clients for $25/month"})
    assert r.status_code == 200
    data = r.json()
    assert data["response_type"] == "action_preview"
    assert data["draft"]["offer_type"] == "Subscription"
    assert data["draft"]["price"] == 25.0

def test_book_semantic_resolution():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # "I want to sell my new book for $300"
    r = client.post("/api/v1/agent/chat", headers=headers, json={"message": "I want to sell my new book for $300"})
    assert r.status_code == 200
    data = r.json()
    assert data["response_type"] == "action_preview"
    assert data["draft"]["offer_type"] == "Book"
    assert data["draft"]["price"] == 300.0

def test_screen_context_resolution():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "expert"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # User is on /sell/books and says "Create another one for $250"
    agent_ctx = {
        "user": {"id": 1, "role": "expert"},
        "capabilities": ["client", "expert"],
        "perspective": "expert",
        "route": "/sell/books",
        "screen": "books_manager"
    }
    r = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Create another one for $250", "agent_context": agent_ctx})
    assert r.status_code == 200
    data = r.json()
    assert data["response_type"] == "action_preview"
    assert data["draft"]["offer_type"] == "Book"
    assert data["draft"]["price"] == 250.0

def test_navigation_action():
    auth_resp = client.post("/api/v1/auth/mimic", json={"role": "client"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/api/v1/agent/chat", headers=headers, json={"message": "Take me to my bookings"})
    assert r.status_code == 200
    data = r.json()
    assert data["response_type"] == "navigation"
    assert data["navigation"] is not None
    assert data["navigation"]["route"] == "/my-bookings"


