import json
from typing import Dict, Any, List, Optional
from sqlalchemy import select, or_
from database.connection import AsyncSessionLocal
from database.models import User, ExpertProfile, Offering, ClientSession, Match
from agents.shared.types import RequirementBrief, Top3Matches, MatchResult, OfferingDraft
from agents.shared.llm_client import llm_client
from agents.shared.embedding import embedding_manager
from agents.client.prompts import CLIENT_EXTRACT_SYSTEM_PROMPT, CLIENT_RANK_SYSTEM_PROMPT

async def node_client_ingest(state: Dict[str, Any]) -> Dict[str, Any]:
    """1. INGEST: Store conversation turn and load session history."""
    session_id = state.get("session_id")
    raw_problem = state.get("raw_problem", "").strip()
    user_id = state.get("user_id")

    history = []
    
    async with AsyncSessionLocal() as session:
        client_session = None
        if session_id:
            client_session = await session.get(ClientSession, session_id)
            
        if not client_session:
            client_session = ClientSession(
                user_id=user_id,
                conversation_history="[]",
                status="active"
            )
            session.add(client_session)
            await session.commit()
            await session.refresh(client_session)
            session_id = client_session.id
            
        if client_session.conversation_history:
            history = json.loads(client_session.conversation_history)
            
        history.append({"role": "user", "content": raw_problem})
        client_session.conversation_history = json.dumps(history)
        await session.commit()

    return {
        **state,
        "session_id": session_id,
        "raw_problem": raw_problem,
        "history": history,
        "status": "ingested"
    }

async def node_client_extract(state: Dict[str, Any]) -> Dict[str, Any]:
    """2. EXTRACT: Call LLM to extract structured RequirementBrief."""
    history = state.get("history", [])
    conv_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in history])

    brief: RequirementBrief = await llm_client.generate_structured_output(
        prompt=f"Client Conversation History:\n{conv_text}",
        system_prompt=CLIENT_EXTRACT_SYSTEM_PROMPT,
        response_model=RequirementBrief,
        use_premium_model=False
    )

    return {
        **state,
        "brief": brief.model_dump(),
        "confidence_score": brief.confidence_score,
        "questions": brief.clarification_questions,
        "status": "extracted"
    }

async def node_client_ambiguity_detect(state: Dict[str, Any]) -> Dict[str, Any]:
    """3. AMBIGUITY_DETECT: Check if brief confidence is sufficient."""
    confidence = state.get("confidence_score", 1.0)
    return {
        **state,
        "status": "ambiguity_checked" if confidence >= 0.7 else "questions_asked"
    }

async def node_client_ask_questions(state: Dict[str, Any]) -> Dict[str, Any]:
    """3a. ASK_QUESTIONS: Return clarification questions to user."""
    return {
        **state,
        "status": "questions_asked"
    }

async def node_client_category_filter(state: Dict[str, Any]) -> Dict[str, Any]:
    """4. CATEGORY_FILTER: Fast SQL filter by category."""
    brief_dict = state["brief"]
    category = brief_dict.get("category", "")

    candidate_ids = []

    async with AsyncSessionLocal() as session:
        query = select(ExpertProfile.id)
        if category:
            # Flexible matching or exact category
            query = query.filter(
                or_(
                    ExpertProfile.category.ilike(f"%{category}%"),
                    ExpertProfile.expertise_tags.ilike(f"%{category}%")
                )
            )
        result = await session.execute(query)
        candidate_ids = [row[0] for row in result.all()]
        
        # Fallback to all if category filter returned fewer than 3 candidates
        if len(candidate_ids) < 3:
            all_res = await session.execute(select(ExpertProfile.id))
            candidate_ids = [row[0] for row in all_res.all()]

    return {
        **state,
        "candidate_expert_ids": candidate_ids,
        "status": "category_filtered"
    }

async def node_client_semantic_match(state: Dict[str, Any]) -> Dict[str, Any]:
    """5. SEMANTIC_MATCH: Local sentence-transformer embedding + FAISS search."""
    brief_dict = state["brief"]
    candidate_ids = state.get("candidate_expert_ids", [])
    
    # Construct semantic text query from brief
    query_text = (
        f"Problem: {brief_dict.get('problem', '')}\n"
        f"Category: {brief_dict.get('category', '')}\n"
        f"Required Expertise: {', '.join(brief_dict.get('expertise_needed', []))}\n"
        f"Goals: {', '.join(brief_dict.get('goals', []))}"
    )

    query_vector = embedding_manager.encode(query_text)
    
    # Retrieve top 10 from FAISS index
    matched_tuples = embedding_manager.search_experts(
        query_embedding=query_vector,
        candidate_expert_ids=candidate_ids,
        top_k=10
    )

    top_10_expert_ids = [m[0] for m in matched_tuples]
    similarity_map = {m[0]: m[1] for m in matched_tuples}

    return {
        **state,
        "top_10_expert_ids": top_10_expert_ids,
        "similarity_map": similarity_map,
        "status": "semantically_matched"
    }

async def node_client_rank(state: Dict[str, Any]) -> Dict[str, Any]:
    """6. RANK: Premium LLM reasoning and top 3 ranking."""
    top_10_ids = state.get("top_10_expert_ids", [])
    brief_dict = state["brief"]
    similarity_map = state.get("similarity_map", {})

    candidates_info = []

    async with AsyncSessionLocal() as session:
        for eid in top_10_ids:
            prof = await session.get(ExpertProfile, eid)
            if not prof:
                continue
            user = await session.get(User, prof.user_id)
            off_res = await session.execute(select(Offering).filter_by(expert_id=prof.id))
            offerings = off_res.scalars().all()
            
            candidates_info.append({
                "expert_id": prof.id,
                "full_name": user.full_name if user else "Expert",
                "headline": prof.professional_headline,
                "category": prof.category,
                "bio": prof.bio,
                "tags": prof.expertise_tags,
                "vector_similarity": similarity_map.get(prof.id, 0.8),
                "offerings": [{"title": o.title, "type": o.offer_type, "price": float(o.price)} for o in offerings]
            })

    prompt = (
        f"Client RequirementBrief:\n{json.dumps(brief_dict, indent=2)}\n\n"
        f"Candidate Experts (Top 10):\n{json.dumps(candidates_info, indent=2)}"
    )

    top_3_result: Top3Matches = await llm_client.generate_structured_output(
        prompt=prompt,
        system_prompt=CLIENT_RANK_SYSTEM_PROMPT,
        response_model=Top3Matches,
        use_premium_model=True
    )

    return {
        **state,
        "top_3_matches": top_3_result.model_dump(),
        "status": "ranked"
    }

async def node_client_present(state: Dict[str, Any]) -> Dict[str, Any]:
    """7. PRESENT: Persist matches in DB and return response payload."""
    session_id = state.get("session_id")
    top_3_dict = state.get("top_3_matches", {})
    brief_dict = state.get("brief", {})

    async with AsyncSessionLocal() as session:
        client_session = await session.get(ClientSession, session_id)
        if client_session:
            client_session.requirements_json = json.dumps(brief_dict)
            client_session.status = "completed"

            # Clear any previous matches for this session
            old_matches = await session.execute(select(Match).filter_by(client_session_id=session_id))
            for m in old_matches.scalars().all():
                await session.delete(m)

            for item in top_3_dict.get("matches", []):
                new_match = Match(
                    client_session_id=session_id,
                    expert_id=item["expert_id"],
                    match_score=float(item.get("match_score", 90.0)) / 100.0,
                    reasoning=item.get("reasoning", ""),
                    rank=item.get("rank", 1)
                )
                session.add(new_match)

            await session.commit()

    return {
        **state,
        "status": "presented"
    }
