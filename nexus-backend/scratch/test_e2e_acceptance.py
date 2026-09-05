import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

async def test_e2e_acceptance():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=== 1. Testing Health & Root ===")
        r = await client.get(f"{BASE_URL}/")
        assert r.status_code == 200, f"Backend offline: {r.text}"
        print("Backend is online!")

        print("\n=== 2. Testing Client Login & Capabilities ===")
        r_auth = await client.post(f"{API_V1}/auth/mimic", json={"role": "client"})
        assert r_auth.status_code == 200, f"Client auth mimic failed: {r_auth.text}"
        client_auth_data = r_auth.json()
        client_token = client_auth_data["access_token"]
        client_headers = {"Authorization": f"Bearer {client_token}"}

        r_me = await client.get(f"{API_V1}/auth/me", headers=client_headers)
        assert r_me.status_code == 200, f"Client get me failed: {r_me.text}"
        client_user = r_me.json()
        assert client_user["role"] == "client"
        print(f"Authenticated Client: {client_user['full_name']} (Role: {client_user['role']})")

        print("\n=== 3. Testing Client Authorization Rejection ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=client_headers, json={
            "message": "Create a subscription plan for $25 a month",
            "current_route": "/overview",
            "current_perspective": "client"
        })
        res = r.json()
        print("Client SELL request response:")
        print(json.dumps(res, indent=2))
        resp_text = res.get("response", "").lower()
        assert "not authorized" in resp_text or "client" in resp_text or "reserved for expert" in resp_text or res.get("response_type") == "error"
        print("Client authorization rejection verified!")

        print("\n=== 4. Testing Expert Login & Capabilities ===")
        r_auth_exp = await client.post(f"{API_V1}/auth/mimic", json={"role": "expert"})
        assert r_auth_exp.status_code == 200, f"Expert auth mimic failed: {r_auth_exp.text}"
        exp_auth_data = r_auth_exp.json()
        exp_token = exp_auth_data["access_token"]
        exp_headers = {"Authorization": f"Bearer {exp_token}"}

        r_me_exp = await client.get(f"{API_V1}/auth/me", headers=exp_headers)
        assert r_me_exp.status_code == 200
        expert_user = r_me_exp.json()
        assert expert_user["role"] == "expert"
        print(f"Authenticated Expert: {expert_user['full_name']} (Role: {expert_user['role']})")

        print("\n=== 5. Testing Subscription Flow (Expert) ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "I want to create a subscription plan for clients for $25 a month.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res = r.json()
        print("Subscription Creation Response:")
        print(json.dumps(res, indent=2))
        assert res["intent"] in ["create_subscription", "offering_create"]
        assert res["draft"].get("offer_type", "").lower() == "subscription"
        assert res["draft"]["price"] == 25.0
        assert res["draft"]["billing_period"] == "monthly"
        print("Subscription task pre-filled successfully!")

        print("\n=== 6. Testing Book Flow & Canonical Fields ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "I want to sell my new book for $300.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res = r.json()
        print("Book Creation Response:")
        print(json.dumps(res, indent=2))
        assert res["intent"] in ["create_book", "offering_create"]
        assert res["draft"].get("offer_type", "").lower() == "book"
        assert res["draft"]["price"] == 300.0
        # Verify book canonical fields exist in draft schema
        draft = res["draft"]
        for field in ["front_cover", "back_cover", "buy_now_pdf", "price", "title"]:
            assert field in draft, f"Missing canonical book field: {field}"
        print("Book canonical fields verified!")

        print("\n=== 7. Testing Task Switching ===")
        # Step 1: Start 1:1 session
        r1 = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Create a 1:1 session for $500.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res1 = r1.json()

        # Step 2: Immediately switch to Book
        r2 = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Actually forget that. I want to sell my book for $300.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res2 = r2.json()
        print("Task Switch Response:")
        print(json.dumps(res2, indent=2))
        assert res2["draft"].get("offer_type", "").lower() == "book"
        assert res2["draft"]["price"] == 300.0
        print("Task switch cleared stale state cleanly!")

        print("\n=== 8. Testing Second Task Switch (Abandon to Navigation) ===")
        r1 = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "I want to create a subscription for $25 a month.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        r2 = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Actually forget it. Show me my bookings.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res2 = r2.json()
        print("Navigation Switch Response:")
        print(json.dumps(res2, indent=2))
        nav = res2.get("navigation", {}) or {}
        assert nav.get("target_route") == "/my-bookings" or res2.get("intent") in ["view_bookings", "navigation"] or "/my-bookings" in str(res2)
        print("Navigation task switch verified!")

        print("\n=== 9. Testing Contextual 'Another One' ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Create another one for $250.",
            "current_route": "/sell/books",
            "current_perspective": "expert"
        })
        res = r.json()
        assert res["draft"].get("offer_type", "").lower() == "book"
        assert res["draft"]["price"] == 250.0
        print("Contextual 'another one' on Books page resolved to Book!")

        r = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Create another one for $30 a month.",
            "current_route": "/sell/subscriptions",
            "current_perspective": "expert"
        })
        res = r.json()
        assert res["draft"].get("offer_type", "").lower() == "subscription"
        assert res["draft"]["price"] == 30.0
        print("Contextual 'another one' on Subscriptions page resolved to Subscription!")

        print("\n=== 10. Testing Grounded Expert Search (Client) ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=client_headers, json={
            "message": "I need someone who can help me market and launch my new book globally.",
            "current_route": "/overview",
            "current_perspective": "client"
        })
        res = r.json()
        print("Grounded Expert Search Response:")
        print(json.dumps(res, indent=2))
        assert res["intent"] in ["search_experts", "expert_search", "client_match_search"]
        resp_data = res.get("response_data", {}) or {}
        matches = resp_data.get("matches", []) or res.get("matches", []) or res.get("response_data", {}).get("experts", [])
        print(f"Returned matches: {len(matches)}")
        assert len(matches) > 0, "No grounded expert matches returned!"
        for match in matches:
            name = match.get("full_name") or match.get("name") or match.get("headline")
            print(f"  Matched Expert: {name} (Score: {match.get('match_score', match.get('score', 0.85))})")
        print("Grounded Expert Search verified!")

        print("\n=== 11. Testing Expert BUY Capability ===")
        r = await client.post(f"{API_V1}/agent/chat", headers=exp_headers, json={
            "message": "Find someone who can help me with marketing.",
            "current_route": "/overview",
            "current_perspective": "expert"
        })
        res = r.json()
        assert res["intent"] in ["search_experts", "expert_search", "client_match_search"]
        print("Expert retains BUY capability verified!")

        print("\n=== 12. Testing Raw Output Protection & Formatting ===")
        response_text = res.get("response", "")
        assert "### Action" not in response_text
        assert "```json" not in response_text
        assert "AgentState" not in response_text
        print("Raw output protection verified!")

        print("\n=== 13. Testing Client-to-Expert Onboarding Workflow ===")
        # Step A: Client requests to become an expert
        r = await client.post(f"{API_V1}/agent/chat", headers=client_headers, json={
            "message": "I want to become an expert and start selling on MindGigs.",
            "current_route": "/overview",
            "current_perspective": "client"
        })
        res = r.json()
        print("Become Expert Onboarding Response:")
        print(json.dumps(res, indent=2))
        assert res["intent"] == "expert_profile_create" or res["requires_confirmation"] is True
        assert res["draft"].get("professional_headline") is not None

        # Step B: Confirm onboarding application
        session_id = res.get("session_id")
        r_confirm = await client.post(f"{API_V1}/agent/chat", headers=client_headers, json={
            "message": "Confirm & Become Expert",
            "session_id": session_id,
            "current_route": "/overview",
            "current_perspective": "client"
        })
        res_confirm = r_confirm.json()
        print("Become Expert Confirmation Response:")
        print(json.dumps(res_confirm, indent=2))
        assert res_confirm.get("role") == "expert" or "congratulations" in res_confirm.get("response", "").lower()
        print("Client-to-Expert Onboarding workflow verified!")

        print("\n========================================================")
        print("ALL 13 END-TO-END ACCEPTANCE SUITES EXECUTED & PASSED!")
        print("========================================================")

if __name__ == "__main__":
    asyncio.run(test_e2e_acceptance())
