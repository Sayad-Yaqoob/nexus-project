import json
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from database.connection import AsyncSessionLocal
from database.models import User, ExpertProfile, Offering
from agents.shared.types import ExpertDraft, AmbiguityCheck, PreviewCard, OfferingDraft
from agents.shared.llm_client import llm_client
from agents.shared.embedding import embedding_manager
from services.file_handler import file_handler
from agents.expert.prompts import EXPERT_EXTRACT_SYSTEM_PROMPT, EXPERT_AMBIGUITY_SYSTEM_PROMPT

async def node_ingest(state: Dict[str, Any]) -> Dict[str, Any]:
    """1. INGEST: Validate input and normalize text."""
    raw_desc = state.get("raw_description", "").strip()
    user_id = state.get("user_id", 1)
    
    return {
        **state,
        "user_id": user_id,
        "raw_description": raw_desc,
        "status": "ingested"
    }

async def node_load_ctx(state: Dict[str, Any]) -> Dict[str, Any]:
    """2. LOAD_CTX: Check if expert already exists in database."""
    user_id = state.get("user_id")
    existing_profile_dict = None
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ExpertProfile).filter_by(user_id=user_id)
        )
        profile = result.scalars().first()
        
        if profile:
            off_res = await session.execute(
                select(Offering).filter_by(expert_id=profile.id)
            )
            offerings = off_res.scalars().all()
            
            existing_profile_dict = {
                "headline": profile.professional_headline,
                "bio": profile.bio,
                "category": profile.category,
                "tags": profile.expertise_tags,
                "offerings": [{"title": o.title, "type": o.offer_type, "price": float(o.price)} for o in offerings]
            }

    return {
        **state,
        "existing_profile": existing_profile_dict,
        "status": "context_loaded"
    }

async def node_extract(state: Dict[str, Any]) -> Dict[str, Any]:
    """3. EXTRACT: Call Groq LLM to extract structured ExpertDraft."""
    raw_desc = state["raw_description"]
    existing_ctx = state.get("existing_profile")
    
    prompt = f"Expert Self Description:\n{raw_desc}"
    if existing_ctx:
        prompt += f"\n\nExisting Profile Context to Update:\n{json.dumps(existing_ctx, indent=2)}"

    draft: ExpertDraft = await llm_client.generate_structured_output(
        prompt=prompt,
        system_prompt=EXPERT_EXTRACT_SYSTEM_PROMPT,
        response_model=ExpertDraft,
        use_premium_model=False
    )

    return {
        **state,
        "draft": draft.model_dump(),
        "status": "extracted"
    }

async def node_ambiguity_detect(state: Dict[str, Any]) -> Dict[str, Any]:
    """4. AMBIGUITY_DETECT: Check completeness and confidence of draft."""
    draft_dict = state["draft"]
    
    prompt = f"ExpertDraft JSON to Evaluate:\n{json.dumps(draft_dict, indent=2)}"
    
    check: AmbiguityCheck = await llm_client.generate_structured_output(
        prompt=prompt,
        system_prompt=EXPERT_AMBIGUITY_SYSTEM_PROMPT,
        response_model=AmbiguityCheck,
        use_premium_model=False
    )

    return {
        **state,
        "confidence_score": check.confidence_score,
        "missing_fields": check.missing_fields,
        "questions": check.clarification_questions,
        "status": "ambiguity_checked"
    }

async def node_ask_questions(state: Dict[str, Any]) -> Dict[str, Any]:
    """5a. ASK_QUESTIONS: Low confidence branch."""
    return {
        **state,
        "status": "questions_asked"
    }

async def node_validate_files(state: Dict[str, Any]) -> Dict[str, Any]:
    """5b. VALIDATE_FILES: Enforce file rules on suggested offerings."""
    draft_dict = state["draft"]
    offerings = draft_dict.get("suggested_offerings", [])
    
    file_err = None
    needs_upload = False

    for off in offerings:
        off_type = off.get("offer_type", "1:1 Session")
        file_path = off.get("file_path")
        
        is_req = file_handler.is_file_required(off_type)
        off["file_required"] = is_req
        
        is_valid, err_msg = file_handler.validate_placeholder(off_type, file_path)
        off["file_placeholder_valid"] = is_valid
        
        if not is_valid:
            needs_upload = True
            file_err = err_msg

    return {
        **state,
        "draft": draft_dict,
        "needs_file_upload": needs_upload,
        "file_validation_error": file_err,
        "status": "files_validated"
    }

async def node_preview(state: Dict[str, Any]) -> Dict[str, Any]:
    """6. PREVIEW: Generate PreviewCard JSON for MindGigs UI."""
    user_id = state["user_id"]
    draft_dict = state["draft"]
    
    async with AsyncSessionLocal() as session:
        user = await session.get(User, user_id)
        user_name = user.full_name if user else "Expert Member"

    draft_id = str(uuid.uuid4())[:8]
    
    preview = PreviewCard(
        draft_id=draft_id,
        user_id=user_id,
        full_name=user_name,
        professional_headline=draft_dict["professional_headline"],
        bio=draft_dict["bio"],
        category=draft_dict["category"],
        expertise_tags=draft_dict.get("expertise_tags", []),
        offerings=[OfferingDraft(**o) for o in draft_dict.get("suggested_offerings", [])],
        is_verified=True,
        needs_file_upload=state.get("needs_file_upload", False),
        validation_error=state.get("file_validation_error")
    )

    return {
        **state,
        "preview_card": preview.model_dump(),
        "draft_id": draft_id,
        "status": "preview_ready"
    }

async def node_save_db(state: Dict[str, Any]) -> Dict[str, Any]:
    """7. SAVE_DB: Commit profile & offerings to SQLite and update FAISS index."""
    user_id = state["user_id"]
    draft_dict = state["draft"]
    
    async with AsyncSessionLocal() as session:
        # Update user role to expert
        user = await session.get(User, user_id)
        if user:
            user.role = "expert"

        # Check existing profile
        res = await session.execute(select(ExpertProfile).filter_by(user_id=user_id))
        profile = res.scalars().first()

        tags_str = ", ".join(draft_dict.get("expertise_tags", []))

        if not profile:
            profile = ExpertProfile(
                user_id=user_id,
                bio=draft_dict["bio"],
                professional_headline=draft_dict["professional_headline"],
                expertise_tags=tags_str,
                category=draft_dict["category"],
                weekly_hours_json=draft_dict.get("weekly_hours_json", '{"Mon-Fri": "9am-5pm"}'),
                timezone=draft_dict.get("timezone", "UTC"),
                session_duration_default=draft_dict.get("session_duration_default", 60),
                buffer_between_sessions=draft_dict.get("buffer_between_sessions", 15),
                is_verified=True
            )
            session.add(profile)
            await session.flush()
        else:
            profile.bio = draft_dict["bio"]
            profile.professional_headline = draft_dict["professional_headline"]
            profile.expertise_tags = tags_str
            profile.category = draft_dict["category"]
            profile.is_verified = True

        # Refresh offerings
        # Delete old offerings for clean sync
        old_offs = await session.execute(select(Offering).filter_by(expert_id=profile.id))
        for o in old_offs.scalars().all():
            await session.delete(o)

        for off in draft_dict.get("suggested_offerings", []):
            new_offering = Offering(
                expert_id=profile.id,
                offer_type=off.get("offer_type", "1:1 Session"),
                title=off.get("title", "Consultation"),
                price=off.get("price", 100.0),
                duration=off.get("duration", "60 min"),
                description=off.get("description", ""),
                file_required=off.get("file_required", False),
                file_path=off.get("file_path"),
                file_placeholder_valid=off.get("file_placeholder_valid", False),
                active_listing=True
            )
            session.add(new_offering)

        await session.commit()
        
        # Synchronize FAISS embeddings
        await embedding_manager.sync_database_embeddings(session)

    return {
        **state,
        "status": "saved"
    }
