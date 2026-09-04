import os
import json
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.adapters.base import DataAdapter, User, ExpertProfile, Offering
from database.connection import AsyncSessionLocal
from database.models import User as DBUser, ExpertProfile as DBExpertProfile, Offering as DBOffering

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False


class FirestoreAdapter(DataAdapter):
    """
    Portable DataAdapter implementation.
    Uses Firestore when initialized via Firebase Admin SDK.
    Falls back gracefully to local SQLite store when running in standalone mode or without Firebase creds.
    """

    def __init__(self, use_firestore_if_available: bool = True):
        self._db = None
        self._is_firestore = False

        if use_firestore_if_available and FIREBASE_AVAILABLE:
            try:
                # Check if default app is initialized or service account exists
                if not firebase_admin._apps:
                    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
                    if cred_path and os.path.exists(cred_path):
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                    else:
                        project_id = os.environ.get("FIREBASE_PROJECT_ID")
                        if project_id:
                            firebase_admin.initialize_app(options={"projectId": project_id})

                if firebase_admin._apps:
                    self._db = firestore.client()
                    self._is_firestore = True
                    print("[FirestoreAdapter] Initialized with Firebase Firestore.")
            except Exception as e:
                print(f"[FirestoreAdapter] Firestore initialisation warning: {e}. Falling back to SQLite/DB adapter.")

        if not self._is_firestore:
            print("[FirestoreAdapter] Running in SQLite fallback mode.")

    async def get_user(self, uid: str) -> Optional[User]:
        if self._is_firestore and self._db:
            try:
                doc = self._db.collection("users").document(str(uid)).get()
                if doc.exists:
                    data = doc.to_dict()
                    return User(
                        id=data.get("uid", uid),
                        email=data.get("email", ""),
                        full_name=data.get("full_name", data.get("name", "User")),
                        role=data.get("role", "client"),
                        public_handle=data.get("public_handle", data.get("handle"))
                    )
            except Exception as e:
                print(f"Firestore get_user error: {e}")

        # Fallback to local DB
        async with AsyncSessionLocal() as session:
            try:
                u_id = int(uid) if uid.isdigit() else None
                if u_id:
                    user = await session.get(DBUser, u_id)
                else:
                    res = await session.execute(select(DBUser).filter_by(email=uid))
                    user = res.scalars().first()

                if user:
                    return User(
                        id=user.id,
                        email=user.email,
                        full_name=user.full_name,
                        role=user.role,
                        public_handle=user.public_handle
                    )
            except Exception as e:
                print(f"DB get_user error: {e}")
        return None

    async def get_expert_profile(self, uid: str) -> Optional[ExpertProfile]:
        if self._is_firestore and self._db:
            try:
                doc = self._db.collection("expert_profiles").document(str(uid)).get()
                if doc.exists:
                    data = doc.to_dict()
                    return ExpertProfile(**data)
                # Search by user_id
                query = self._db.collection("expert_profiles").where("user_id", "==", str(uid)).limit(1).stream()
                for qdoc in query:
                    return ExpertProfile(**qdoc.to_dict())
            except Exception as e:
                print(f"Firestore get_expert_profile error: {e}")

        # Fallback to local DB
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
                    offerings = off_res.scalars().all()
                    
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
                        confidence_score=0.95,
                        offerings=[
                            Offering(
                                id=o.id,
                                title=o.title,
                                offer_type=o.offer_type,
                                price=float(o.price),
                                duration=o.duration,
                                description=o.description,
                                file_required=o.file_required
                            ) for o in offerings
                        ]
                    )
            except Exception as e:
                print(f"DB get_expert_profile error: {e}")
        return None

    async def save_expert_profile(self, uid: str, profile: ExpertProfile) -> ExpertProfile:
        if self._is_firestore and self._db:
            try:
                doc_ref = self._db.collection("expert_profiles").document(str(profile.id or uid))
                data = profile.model_dump()
                doc_ref.set(data, merge=True)
                print(f"✅ Published profile to Firestore for UID: {uid}")
                return profile
            except Exception as e:
                print(f"Firestore save_expert_profile error: {e}")

        # Fallback to local DB
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
                print(f"DB save_expert_profile error: {e}")
                return profile

    async def list_experts(self, filters: Optional[Dict[str, Any]] = None) -> List[ExpertProfile]:
        experts = []

        if self._is_firestore and self._db:
            try:
                ref = self._db.collection("expert_profiles")
                if filters and "category" in filters:
                    ref = ref.where("category", "==", filters["category"])
                docs = ref.stream()
                for doc in docs:
                    experts.append(ExpertProfile(**doc.to_dict()))
                if experts:
                    return experts
            except Exception as e:
                print(f"Firestore list_experts error: {e}")

        # Fallback to local DB
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
                    offerings = off_res.scalars().all()
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
                        confidence_score=0.9,
                        offerings=[
                            Offering(
                                id=o.id,
                                title=o.title,
                                offer_type=o.offer_type,
                                price=float(o.price),
                                duration=o.duration,
                                description=o.description,
                                file_required=o.file_required
                            ) for o in offerings
                        ]
                    ))
            except Exception as e:
                print(f"DB list_experts error: {e}")

        return experts

    async def save_offering(self, expert_id: str, offering: Offering) -> str:
        if self._is_firestore and self._db:
            try:
                ref = self._db.collection("expert_profiles").document(expert_id).collection("offerings").document()
                off_data = offering.model_dump()
                off_data["id"] = ref.id
                ref.set(off_data)
                return ref.id
            except Exception as e:
                print(f"Firestore save_offering error: {e}")

        # Local DB fallback
        async with AsyncSessionLocal() as session:
            try:
                exp_id = int(expert_id) if expert_id.isdigit() else 1
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
            except Exception as e:
                print(f"DB save_offering error: {e}")
                return "1"
