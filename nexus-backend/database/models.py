from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, LargeBinary, Numeric, func
)
from sqlalchemy.orm import relationship
from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="client")  # expert, client, admin
    public_handle = Column(String(100), unique=True, nullable=False, index=True)
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    nexus_sessions = relationship("NexusSession", back_populates="user", cascade="all, delete-orphan")


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    professional_headline = Column(String(255), nullable=True)
    expertise_tags = Column(Text, nullable=True)  # Comma-separated
    category = Column(String(100), nullable=False, index=True)
    currency = Column(String(10), default="USD")
    linkedin_url = Column(String(255), nullable=True)
    x_url = Column(String(255), nullable=True)
    youtube_url = Column(String(255), nullable=True)
    whatsapp = Column(String(100), nullable=True)
    website_url = Column(String(255), nullable=True)
    weekly_hours_json = Column(Text, nullable=True)
    timezone = Column(String(100), default="UTC")
    session_duration_default = Column(Integer, default=60)
    buffer_between_sessions = Column(Integer, default=15)
    google_calendar_connected = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="expert_profile")
    offerings = relationship("Offering", back_populates="expert", cascade="all, delete-orphan")
    embedding = relationship("ExpertEmbedding", back_populates="expert", uselist=False, cascade="all, delete-orphan")


class Offering(Base):
    __tablename__ = "offerings"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    offer_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    duration = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    file_required = Column(Boolean, default=False)
    file_path = Column(String(500), nullable=True)
    file_placeholder_valid = Column(Boolean, default=False)
    active_listing = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    expert = relationship("ExpertProfile", back_populates="offerings")


class NexusSession(Base):
    """Persistent conversation session for the NEXUS agent."""
    __tablename__ = "nexus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_history = Column(Text, nullable=True, default="[]")  # JSON array of messages
    state_json = Column(Text, nullable=True, default="{}")  # Serialized agent state
    status = Column(String(50), default="active")  # active, completed, abandoned
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="nexus_sessions")


class ExpertEmbedding(Base):
    __tablename__ = "expert_embeddings"

    expert_id = Column(Integer, ForeignKey("expert_profiles.id"), primary_key=True)
    embedding = Column(LargeBinary, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    expert = relationship("ExpertProfile", back_populates="embedding")


# --- Future placeholder models (schema only, no business logic in Stage 1) ---

class Booking(Base):
    """Placeholder for future booking functionality."""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    client_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expert_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offering_id = Column(Integer, ForeignKey("offerings.id"), nullable=True)
    status = Column(String(50), default="pending")  # pending, confirmed, completed, cancelled
    scheduled_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Earning(Base):
    """Placeholder for future earnings tracking."""
    __tablename__ = "earnings"

    id = Column(Integer, primary_key=True, index=True)
    expert_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="pending")  # pending, paid, refunded
    created_at = Column(DateTime, server_default=func.now())


class Payout(Base):
    """Placeholder for future payout processing."""
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    expert_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    created_at = Column(DateTime, server_default=func.now())
