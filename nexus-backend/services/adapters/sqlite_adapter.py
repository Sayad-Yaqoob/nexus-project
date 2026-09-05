import json
import random
from typing import Optional, List, Dict, Any
from sqlalchemy import select

from services.adapters.base import (
    DataAdapter, User, ExpertProfile, Offering, UserContext
)
from database.connection import AsyncSessionLocal
from database.models import (
    User as DBUser,
    ExpertProfile as DBExpertProfile,
    Offering as DBOffering,
    NexusSession as DBNexusSession
)

class SQLiteDataAdapter(DataAdapter):
    """
    Clean SQLite DataAdapter implementation for NEXUS backend.
    Interacts with local SQLite database via SQLAlchemy async sessions.
    """

    async def get_user(self, uid: str) -> Optional[User]:
        async with AsyncSessionLocal() as session:
            try:
                if uid.isdigit():
                    user = await session.get(DBUser, int(uid))
                else:
                    res = await session.execute(select(DBUser).filter_by(email=uid))
                    user = res.scalars().first()
                    if not user:
                        res = await session.execute(select(DBUser).filter_by(public_handle=uid))
                        user = res.scalars().first()

                if user:
                    return User(
                        id=user.id,
                        email=user.email,
                        full_name=user.full_name,
                        role=user.role,
                        public_handle=user.public_handle,
                        currency=user.currency or "USD"
                    )
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_user error: {e}")
        return None

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        return await self.get_user(str(user_id))

    async def get_random_user(self) -> Optional[User]:
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(select(DBUser))
                users = res.scalars().all()
                if users:
                    u = random.choice(users)
                    return User(
                        id=u.id,
                        email=u.email,
                        full_name=u.full_name,
                        role=u.role,
                        public_handle=u.public_handle,
                        currency=u.currency or "USD"
                    )
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_random_user error: {e}")
        return None

    async def get_user_context(self, user_id: int) -> Optional[UserContext]:
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        is_expert = (user.role == "expert")
        is_client = (user.role == "client")
        expert_profile = None
        offerings = []

        if is_expert:
            expert_profile = await self.get_expert_profile(str(user_id))
            if expert_profile:
                offerings = expert_profile.offerings

        return UserContext(
            user=user,
            role=user.role,
            is_expert=is_expert,
            is_client=is_client,
            expert_profile=expert_profile,
            offerings=offerings
        )

    async def get_expert_profile(self, uid: str) -> Optional[ExpertProfile]:
        async with AsyncSessionLocal() as session:
            try:
                u_id = int(uid) if uid.isdigit() else None
                if u_id:
                    res = await session.execute(select(DBExpertProfile).filter_by(user_id=u_id))
                    profile = res.scalars().first()
                    if not profile:
                        profile = await session.get(DBExpertProfile, u_id)
                else:
                    profile = None

                if profile:
                    u = await session.get(DBUser, profile.user_id)
                    off_res = await session.execute(select(DBOffering).filter_by(expert_id=profile.id))
                    db_offerings = off_res.scalars().all()
                    
                    tags = [t.strip() for t in profile.expertise_tags.split(",")] if profile.expertise_tags else []

                    return ExpertProfile(
                        id=profile.id,
                        user_id=profile.user_id,
                        full_name=u.full_name if u else "Expert",
                        public_handle=u.public_handle if u else f"expert_{profile.id}",
                        professional_headline=profile.professional_headline or "Expert Specialist",
                        bio=profile.bio or "",
                        category=profile.category or "General",
                        expertise_tags=tags,
                        is_verified=profile.is_verified,
                        timezone=profile.timezone or "UTC",
                        currency=profile.currency or "USD",
                        offerings=[
                            Offering(
                                id=o.id,
                                title=o.title,
                                offer_type=o.offer_type,
                                price=float(o.price),
                                duration=o.duration,
                                description=o.description,
                                file_required=o.file_required
                            ) for o in db_offerings
                        ]
                    )
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_expert_profile error: {e}")
        return None

    async def save_expert_profile(self, uid: str, profile: ExpertProfile) -> ExpertProfile:
        async with AsyncSessionLocal() as session:
            try:
                u_id = int(uid) if uid.isdigit() else 1
                res = await session.execute(select(DBExpertProfile).filter_by(user_id=u_id))
                db_prof = res.scalars().first()

                tags_str = ", ".join(profile.expertise_tags) if isinstance(profile.expertise_tags, list) else profile.expertise_tags

                if db_prof:
                    db_prof.professional_headline = profile.professional_headline
                    db_prof.bio = profile.bio
                    db_prof.category = profile.category
                    db_prof.expertise_tags = tags_str
                else:
                    db_prof = DBExpertProfile(
                        user_id=u_id,
                        professional_headline=profile.professional_headline,
                        bio=profile.bio,
                        category=profile.category,
                        expertise_tags=tags_str,
                        is_verified=True
                    )
                    session.add(db_prof)
                
                await session.commit()
                await session.refresh(db_prof)
                profile.id = db_prof.id
                return profile
            except Exception as e:
                print(f"[SQLiteDataAdapter] save_expert_profile error: {e}")
                return profile

    async def list_experts(self, filters: Optional[Dict[str, Any]] = None) -> List[ExpertProfile]:
        experts = []
        async with AsyncSessionLocal() as session:
            try:
                query = select(DBExpertProfile)
                if filters and filters.get("category"):
                    query = query.filter(DBExpertProfile.category.ilike(f"%{filters['category']}%"))
                
                res = await session.execute(query)
                db_profiles = res.scalars().all()

                for db_p in db_profiles:
                    u = await session.get(DBUser, db_p.user_id)
                    off_res = await session.execute(select(DBOffering).filter_by(expert_id=db_p.id))
                    db_offerings = off_res.scalars().all()
                    tags = [t.strip() for t in db_p.expertise_tags.split(",")] if db_p.expertise_tags else []

                    experts.append(ExpertProfile(
                        id=db_p.id,
                        user_id=db_p.user_id,
                        full_name=u.full_name if u else f"Expert #{db_p.id}",
                        public_handle=u.public_handle if u else f"expert_{db_p.id}",
                        professional_headline=db_p.professional_headline or "Specialist",
                        bio=db_p.bio or "",
                        category=db_p.category or "General",
                        expertise_tags=tags,
                        is_verified=db_p.is_verified,
                        timezone=db_p.timezone or "UTC",
                        currency=db_p.currency or "USD",
                        offerings=[
                            Offering(
                                id=o.id,
                                title=o.title,
                                offer_type=o.offer_type,
                                price=float(o.price),
                                duration=o.duration,
                                description=o.description,
                                file_required=o.file_required
                            ) for o in db_offerings
                        ]
                    ))
            except Exception as e:
                print(f"[SQLiteDataAdapter] list_experts error: {e}")

        return experts

    async def save_offering(self, expert_id: str, offering: Offering) -> str:
        async with AsyncSessionLocal() as session:
            exp_id = int(expert_id)
            profile = await session.get(DBExpertProfile, exp_id)
            if profile is None:
                raise ValueError("Expert profile not found.")
            db_off = DBOffering(
                expert_id=exp_id,
                title=offering.title,
                offer_type=offering.offer_type,
                price=offering.price,
                duration=offering.duration,
                description=offering.description,
                file_required=offering.file_required
            )
            session.add(db_off)
            await session.commit()
            await session.refresh(db_off)
            return str(db_off.id)

    # --- Session Persistence ---

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(select(DBNexusSession).filter_by(session_id=session_id))
                s = res.scalars().first()
                if s:
                    return {
                        "id": s.id,
                        "session_id": s.session_id,
                        "user_id": s.user_id,
                        "conversation_history": json.loads(s.conversation_history or "[]"),
                        "state_json": json.loads(s.state_json or "{}"),
                        "status": s.status,
                        "created_at": s.created_at.isoformat() if s.created_at else None,
                        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                    }
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_session error: {e}")
        return None

    async def save_session(self, session_id: str, user_id: int, conversation_history: List[Dict], state: Dict) -> None:
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(select(DBNexusSession).filter_by(session_id=session_id))
                s = res.scalars().first()
                history_json = json.dumps(conversation_history)
                st_json = json.dumps(state)

                if s:
                    s.conversation_history = history_json
                    s.state_json = st_json
                else:
                    s = DBNexusSession(
                        session_id=session_id,
                        user_id=user_id,
                        conversation_history=history_json,
                        state_json=st_json,
                        status="active"
                    )
                    session.add(s)

                await session.commit()
            except Exception as e:
                print(f"[SQLiteDataAdapter] save_session error: {e}")
