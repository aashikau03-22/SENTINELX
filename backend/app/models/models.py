from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Sector(Base):
    __tablename__ = "sectors"

    id = Column(String(50), primary_key=True, index=True)  # e.g. "banking", "ecommerce", etc.
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    icon = Column(String(50), default="Shield")
    threat_categories = Column(JSON, default=list)  # list of strings
    recommended_checklist = Column(JSON, default=list)  # list of strings
    is_custom = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    rules = relationship("SectorRule", back_populates="sector", cascade="all, delete-orphan")
    brands = relationship("Brand", back_populates="sector", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="sector")


class SectorRule(Base):
    __tablename__ = "sector_rules"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_code = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    weight = Column(Float, default=1.0)
    threshold = Column(Float, default=0.7)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    sector = relationship("Sector", back_populates="rules")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id", ondelete="RESTRICT"), nullable=False, index=True)
    description = Column(Text, default="")
    official_website = Column(String(255), nullable=False)
    approved_domains = Column(JSON, default=list)  # ["apexbank.com", "apex-online.com"]
    logo_url = Column(String(500), nullable=True)
    official_developer = Column(String(100), default="")
    aliases = Column(JSON, default=list)  # ["Apex", "Apex Fin", "Apex Global"]
    keywords = Column(JSON, default=list)  # ["banking", "transfer", "loan", "support"]
    monitoring_status = Column(String(20), default="active")  # active, paused
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    sector = relationship("Sector", back_populates="brands")
    social_assets = relationship("OfficialSocialAsset", back_populates="brand", cascade="all, delete-orphan")
    app_assets = relationship("OfficialAppAsset", back_populates="brand", cascade="all, delete-orphan")
    approved_assets = relationship("ApprovedAsset", back_populates="brand", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="brand")


class OfficialSocialAsset(Base):
    __tablename__ = "official_social_assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False)  # twitter, facebook, instagram, linkedin, telegram, etc.
    handle = Column(String(100), nullable=False, index=True)  # @apexbank
    profile_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="social_assets")


class OfficialAppAsset(Base):
    __tablename__ = "official_app_assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    app_name = Column(String(150), nullable=False)
    store = Column(String(50), nullable=False)  # Google Play, Apple App Store
    package_id = Column(String(150), nullable=False, index=True)  # com.apexbank.mobile
    app_url = Column(String(500), nullable=False)
    developer_name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="app_assets")


class ApprovedAsset(Base):
    """Analyst-approved legitimate alternative accounts/apps or explicit false positive exclusions"""
    __tablename__ = "approved_assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)  # "social", "app", "domain"
    identifier = Column(String(255), nullable=False, index=True)  # handle, url, package_id, domain
    reason = Column(Text, nullable=False)
    approved_by = Column(String(100), default="analyst")
    created_at = Column(DateTime, default=utc_now)

    brand = relationship("Brand", back_populates="approved_assets")


class SocialCandidate(Base):
    __tablename__ = "social_candidates"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), nullable=False)
    display_name = Column(String(150), nullable=False)
    handle = Column(String(100), nullable=False, index=True)
    profile_url = Column(String(500), nullable=False)
    description = Column(Text, default="")
    image_url = Column(String(500), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), default="demo")  # demo, manual, external
    first_seen = Column(DateTime, default=utc_now)
    last_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    findings = relationship("Finding", back_populates="social_candidate")


class AppCandidate(Base):
    __tablename__ = "app_candidates"

    id = Column(Integer, primary_key=True, index=True)
    app_name = Column(String(150), nullable=False)
    store = Column(String(50), nullable=False)
    app_url = Column(String(500), nullable=False)
    package_id = Column(String(150), nullable=False, index=True)
    developer_name = Column(String(150), nullable=False)
    description = Column(Text, default="")
    icon_url = Column(String(500), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), default="demo")  # demo, manual, external
    first_seen = Column(DateTime, default=utc_now)
    last_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    findings = relationship("Finding", back_populates="app_candidate")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    candidate_type = Column(String(20), nullable=False)  # "social" or "app"
    social_candidate_id = Column(Integer, ForeignKey("social_candidates.id", ondelete="CASCADE"), nullable=True, index=True)
    app_candidate_id = Column(Integer, ForeignKey("app_candidates.id", ondelete="CASCADE"), nullable=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id", ondelete="CASCADE"), nullable=False, index=True)
    
    risk_score = Column(Float, nullable=False, default=0.0)  # 0 to 100
    severity = Column(String(20), nullable=False, default="Low")  # Low, Medium, High, Critical
    status = Column(String(50), nullable=False, default="New")  # New, Needs Review, Confirmed Impersonation, False Positive, Resolved
    
    is_official_excluded = Column(Boolean, default=False)
    exclusion_reason = Column(Text, nullable=True)
    
    threat_category = Column(String(100), default="Brand Impersonation")
    recommended_steps = Column(JSON, default=list)
    assigned_analyst = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    brand = relationship("Brand", back_populates="findings")
    sector = relationship("Sector", back_populates="findings")
    social_candidate = relationship("SocialCandidate", back_populates="findings")
    app_candidate = relationship("AppCandidate", back_populates="findings")
    evidence = relationship("FindingEvidence", back_populates="finding", cascade="all, delete-orphan")
    notes = relationship("ReviewNote", back_populates="finding", cascade="all, delete-orphan")
    history = relationship("ReviewHistory", back_populates="finding", cascade="all, delete-orphan")


class FindingEvidence(Base):
    __tablename__ = "finding_evidence"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_name = Column(String(100), nullable=False)  # "Name Similarity", "Publisher Mismatch", etc.
    score = Column(Float, nullable=False)  # 0 to 100
    weight = Column(Float, nullable=False, default=1.0)
    explanation = Column(Text, nullable=False)
    evidence_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    finding = relationship("Finding", back_populates="evidence")


class ReviewNote(Base):
    __tablename__ = "review_notes"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    author = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    finding = relationship("Finding", back_populates="notes")


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    analyst = Column(String(100), nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

    finding = relationship("Finding", back_populates="history")


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    source_type = Column(String(50), nullable=False)  # synthetic_demo, simulated_feed, api_connector
    status = Column(String(50), nullable=False)  # Active (Demo), Standby, Connected, Configured
    is_live = Column(Boolean, default=False)
    last_sync = Column(DateTime, nullable=True)
    records_count = Column(Integer, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class ThreatRelationship(Base):
    """Nodes & Edges for Threat Intelligence Graph"""
    __tablename__ = "threat_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_entity_type = Column(String(50), nullable=False)  # brand, social, app, publisher, domain
    source_entity_id = Column(String(100), nullable=False)
    source_label = Column(String(150), nullable=False)
    target_entity_type = Column(String(50), nullable=False)
    target_entity_id = Column(String(100), nullable=False)
    target_label = Column(String(150), nullable=False)
    relationship_type = Column(String(100), nullable=False)  # SIMILAR_IDENTITY, PUBLISHER_MISMATCH, SHARED_DOMAIN, etc.
    evidence_summary = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.8)
    is_synthetic = Column(Boolean, default=True)
    sector_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)


class Analyst(Base):
    __tablename__ = "analysts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(100), default="SOC Analyst")
    email = Column(String(150), unique=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
