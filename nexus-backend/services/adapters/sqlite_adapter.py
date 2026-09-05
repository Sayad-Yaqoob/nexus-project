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
    NexusSession as DBNexusSession,
    Booking as DBBooking,
    Earning as DBEarning
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

    async def get_offering(self, offering_id: int) -> Optional[Offering]:
        async with AsyncSessionLocal() as session:
            try:
                db_off = await session.get(DBOffering, int(offering_id))
                if db_off:
                    return Offering(
                        id=db_off.id,
                        title=db_off.title,
                        offer_type=db_off.offer_type,
                        price=float(db_off.price),
                        duration=db_off.duration,
                        description=db_off.description,
                        file_required=db_off.file_required
                    )
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_offering error: {e}")
        return None

    async def update_offering(self, offering_id: int, updates: Dict[str, Any]) -> Optional[Offering]:
        async with AsyncSessionLocal() as session:
            try:
                db_off = await session.get(DBOffering, int(offering_id))
                if not db_off:
                    return None
                if "title" in updates and updates["title"]:
                    db_off.title = updates["title"]
                if "price" in updates and updates["price"] is not None:
                    db_off.price = updates["price"]
                if "duration" in updates and updates["duration"]:
                    db_off.duration = updates["duration"]
                if "description" in updates and updates["description"]:
                    db_off.description = updates["description"]
                if "offer_type" in updates and updates["offer_type"]:
                    db_off.offer_type = updates["offer_type"]
                await session.commit()
                await session.refresh(db_off)
                return Offering(
                    id=db_off.id,
                    title=db_off.title,
                    offer_type=db_off.offer_type,
                    price=float(db_off.price),
                    duration=db_off.duration,
                    description=db_off.description,
                    file_required=db_off.file_required
                )
            except Exception as e:
                print(f"[SQLiteDataAdapter] update_offering error: {e}")
        return None

    async def delete_offering(self, offering_id: int) -> bool:
        async with AsyncSessionLocal() as session:
            try:
                db_off = await session.get(DBOffering, int(offering_id))
                if db_off:
                    await session.delete(db_off)
                    await session.commit()
                    return True
            except Exception as e:
                print(f"[SQLiteDataAdapter] delete_offering error: {e}")
        return False

    async def create_booking(
        self,
        client_id: int,
        expert_user_id: int,
        offering_id: Optional[int],
        scheduled_at: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        async with AsyncSessionLocal() as session:
            try:
                # Fetch client & expert user names
                client_user = await session.get(DBUser, int(client_id))
                expert_user = await session.get(DBUser, int(expert_user_id))
                
                offering_title = "Consulting Session"
                amount = 150.0
                if offering_id:
                    off = await session.get(DBOffering, int(offering_id))
                    if off:
                        offering_title = off.title
                        amount = float(off.price)

                import datetime
                sched_dt = datetime.datetime.now() + datetime.timedelta(days=1)
                if scheduled_at:
                    try:
                        sched_dt = datetime.datetime.fromisoformat(scheduled_at)
                    except Exception:
                        pass

                db_booking = DBBooking(
                    client_user_id=int(client_id),
                    expert_user_id=int(expert_user_id),
                    offering_id=int(offering_id) if offering_id else None,
                    status="confirmed",
                    scheduled_at=sched_dt,
                    notes=notes or f"Demo Booking for {offering_title}"
                )
                session.add(db_booking)
                await session.commit()
                await session.refresh(db_booking)

                # Record 70% expert earning
                expert_amount = round(amount * 0.70, 2)
                db_earning = DBEarning(
                    expert_user_id=int(expert_user_id),
                    booking_id=db_booking.id,
                    amount=expert_amount,
                    currency="USD",
                    status="paid"
                )
                session.add(db_earning)
                await session.commit()

                return {
                    "id": db_booking.id,
                    "client_id": client_id,
                    "client_name": client_user.full_name if client_user else f"Client #{client_id}",
                    "expert_id": expert_user_id,
                    "expert_name": expert_user.full_name if expert_user else f"Expert #{expert_user_id}",
                    "offering_id": offering_id,
                    "offering_title": offering_title,
                    "amount": amount,
                    "scheduled_at": sched_dt.strftime("%Y-%m-%d %H:%M"),
                    "status": "confirmed",
                    "payment_status": "Demo / Simulated",
                    "notes": db_booking.notes
                }
            except Exception as e:
                print(f"[SQLiteDataAdapter] create_booking error: {e}")
                raise e

    async def list_bookings(self, user_id: int, role: str) -> List[Dict[str, Any]]:
        async with AsyncSessionLocal() as session:
            bookings_list = []
            try:
                if role == "expert":
                    stmt = select(DBBooking).filter_by(expert_user_id=int(user_id))
                else:
                    stmt = select(DBBooking).filter_by(client_user_id=int(user_id))
                
                res = await session.execute(stmt)
                db_bookings = res.scalars().all()

                for b in db_bookings:
                    client_u = await session.get(DBUser, b.client_user_id)
                    expert_u = await session.get(DBUser, b.expert_user_id)
                    off_title = "Consulting Session"
                    price = 150.0
                    duration = "60 min"
                    if b.offering_id:
                        off = await session.get(DBOffering, b.offering_id)
                        if off:
                            off_title = off.title
                            price = float(off.price)
                            duration = off.duration or "60 min"

                    bookings_list.append({
                        "id": b.id,
                        "client_id": b.client_user_id,
                        "client_name": client_u.full_name if client_u else f"Client #{b.client_user_id}",
                        "expert_id": b.expert_user_id,
                        "expert_name": expert_u.full_name if expert_u else f"Expert #{b.expert_user_id}",
                        "offering_id": b.offering_id,
                        "offering_title": off_title,
                        "price": price,
                        "duration": duration,
                        "scheduled_at": b.scheduled_at.strftime("%Y-%m-%d %H:%M") if b.scheduled_at else "Upcoming",
                        "status": b.status or "confirmed",
                        "payment_status": "Demo / Simulated",
                        "created_at": b.created_at.strftime("%Y-%m-%d") if b.created_at else None
                    })
            except Exception as e:
                print(f"[SQLiteDataAdapter] list_bookings error: {e}")

            return bookings_list

    async def get_earnings(self, expert_user_id: int) -> Dict[str, Any]:
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(select(DBEarning).filter_by(expert_user_id=int(expert_user_id)))
                db_earnings = res.scalars().all()

                b_res = await session.execute(select(DBBooking).filter_by(expert_user_id=int(expert_user_id)))
                db_bookings = b_res.scalars().all()

                total_gross = 0.0
                recent_sales = []

                for b in db_bookings:
                    price = 150.0
                    off_title = "Consulting Session"
                    if b.offering_id:
                        off = await session.get(DBOffering, b.offering_id)
                        if off:
                            price = float(off.price)
                            off_title = off.title
                    total_gross += price

                    client_u = await session.get(DBUser, b.client_user_id)
                    recent_sales.append({
                        "booking_id": b.id,
                        "client_name": client_u.full_name if client_u else "Client",
                        "offering_title": off_title,
                        "gross_amount": price,
                        "expert_net": round(price * 0.70, 2),
                        "platform_fee": round(price * 0.30, 2),
                        "date": b.created_at.strftime("%Y-%m-%d") if b.created_at else "Recent"
                    })

                expert_net = round(total_gross * 0.70, 2)
                platform_fee = round(total_gross * 0.30, 2)

                return {
                    "total_sales_count": len(db_bookings),
                    "total_gross_revenue": total_gross,
                    "expert_net_earnings": expert_net,
                    "platform_fee_split": platform_fee,
                    "currency": "USD",
                    "payout_minimum": 50.0,
                    "payout_status": "Eligible for Payout" if expert_net >= 50.0 else "Below $50 Minimum",
                    "recent_sales": recent_sales
                }
            except Exception as e:
                print(f"[SQLiteDataAdapter] get_earnings error: {e}")
                return {
                    "total_sales_count": 0,
                    "total_gross_revenue": 0.0,
                    "expert_net_earnings": 0.0,
                    "platform_fee_split": 0.0,
                    "currency": "USD",
                    "payout_minimum": 50.0,
                    "payout_status": "No Earnings Yet",
                    "recent_sales": []
                }

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
