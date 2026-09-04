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
    role = Column(String(50), nullable=False, default="client") # expert, client, admin
    public_handle = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    client_sessions = relationship("ClientSession", back_populates="user")


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    professional_headline = Column(String(255), nullable=True)
    expertise_tags = Column(Text, nullable=True) # Comma-separated or JSON list
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
    matches = relationship("Match", back_populates="expert")


class Offering(Base):
    __tablename__ = "offerings"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    offer_type = Column(String(50), nullable=False) # '1:1 Session', 'Subscription', 'Digital Product', 'Custom Offer', 'Book', 'Highlight'
    title = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    duration = Column(String(50), nullable=True) # e.g. "60 min"
    description = Column(Text, nullable=True)
    file_required = Column(Boolean, default=False)
    file_path = Column(String(500), nullable=True)
    file_placeholder_valid = Column(Boolean, default=False)
    active_listing = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    expert = relationship("ExpertProfile", back_populates="offerings")


class ClientSession(Base):
    __tablename__ = "client_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null for anonymous
    conversation_history = Column(Text, nullable=True, default="[]") # JSON string
    requirements_json = Column(Text, nullable=True) # Extracted JSON requirements
    status = Column(String(50), default="active") # active, completed, abandoned
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="client_sessions")
    matches = relationship("Match", back_populates="client_session", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    client_session_id = Column(Integer, ForeignKey("client_sessions.id"), nullable=False)
    expert_id = Column(Integer, ForeignKey("expert_profiles.id"), nullable=False)
    match_score = Column(Float, nullable=False) # 0.0 to 1.0
    reasoning = Column(Text, nullable=True)
    rank = Column(Integer, nullable=False) # 1, 2, 3
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    client_session = relationship("ClientSession", back_populates="matches")
    expert = relationship("ExpertProfile", back_populates="matches")


class ExpertEmbedding(Base):
    __tablename__ = "expert_embeddings"

    expert_id = Column(Integer, ForeignKey("expert_profiles.id"), primary_key=True)
    embedding = Column(LargeBinary, nullable=False) # Vector bytes
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    expert = relationship("ExpertProfile", back_populates="embedding")
