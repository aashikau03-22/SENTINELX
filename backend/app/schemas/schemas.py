from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Base Models ---
class BaseSchema(BaseModel):
    model_config = {"from_attributes": True}

# --- Sector Schemas ---
class SectorRuleBase(BaseSchema):
    rule_name: str
    rule_code: str
    description: str
    weight: float = 1.0
    threshold: float = 0.7
    is_enabled: bool = True

class SectorRuleResponse(SectorRuleBase):
    id: int
    sector_id: str
    created_at: datetime

class SectorRuleUpdate(BaseSchema):
    weight: Optional[float] = None
    threshold: Optional[float] = None
    is_enabled: Optional[bool] = None

class SectorBase(BaseSchema):
    id: str
    name: str
    description: str
    icon: str = "Shield"
    threat_categories: List[str] = []
    recommended_checklist: List[str] = []
    is_active: bool = True

class SectorCreate(SectorBase):
    initial_rules: Optional[List[SectorRuleBase]] = None

class SectorUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    threat_categories: Optional[List[str]] = None
    recommended_checklist: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SectorResponse(SectorBase):
    is_custom: bool
    created_at: datetime
    updated_at: datetime
    rules: List[SectorRuleResponse] = []

class SectorWithStatsResponse(SectorResponse):
    brands_count: int = 0
    findings_count: int = 0
    high_critical_count: int = 0
    social_candidates_count: int = 0
    app_candidates_count: int = 0

# --- Official Asset Schemas ---
class OfficialSocialAssetCreate(BaseSchema):
    platform: str
    handle: str
    profile_url: str
    is_primary: bool = True

class OfficialSocialAssetResponse(OfficialSocialAssetCreate):
    id: int
    brand_id: int
    created_at: datetime

class OfficialAppAssetCreate(BaseSchema):
    app_name: str
    store: str
    package_id: str
    app_url: str
    developer_name: str

class OfficialAppAssetResponse(OfficialAppAssetCreate):
    id: int
    brand_id: int
    created_at: datetime

class ApprovedAssetCreate(BaseSchema):
    brand_id: int
    asset_type: str  # "social", "app", "domain"
    identifier: str
    reason: str
    approved_by: Optional[str] = "analyst"

class ApprovedAssetResponse(ApprovedAssetCreate):
    id: int
    created_at: datetime

# --- Brand Schemas ---
class BrandBase(BaseSchema):
    name: str
    sector_id: str
    description: Optional[str] = ""
    official_website: str
    approved_domains: List[str] = []
    logo_url: Optional[str] = None
    official_developer: Optional[str] = ""
    aliases: List[str] = []
    keywords: List[str] = []
    monitoring_status: str = "active"

class BrandCreate(BrandBase):
    social_assets: Optional[List[OfficialSocialAssetCreate]] = []
    app_assets: Optional[List[OfficialAppAssetCreate]] = []

class BrandUpdate(BaseSchema):
    name: Optional[str] = None
    sector_id: Optional[str] = None
    description: Optional[str] = None
    official_website: Optional[str] = None
    approved_domains: Optional[List[str]] = None
    logo_url: Optional[str] = None
    official_developer: Optional[str] = None
    aliases: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    monitoring_status: Optional[str] = None

class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: datetime
    social_assets: List[OfficialSocialAssetResponse] = []
    app_assets: List[OfficialAppAssetResponse] = []
    approved_assets: List[ApprovedAssetResponse] = []
    findings_count: Optional[int] = 0

# --- Candidates ---
class SocialCandidateCreate(BaseSchema):
    platform: str
    display_name: str
    handle: str
    profile_url: str
    description: Optional[str] = ""
    image_url: Optional[str] = None
    brand_id: Optional[int] = None
    sector_id: str
    source_type: str = "manual"

class SocialCandidateResponse(SocialCandidateCreate):
    id: int
    first_seen: datetime
    last_seen: datetime
    created_at: datetime

class AppCandidateCreate(BaseSchema):
    app_name: str
    store: str
    app_url: str
    package_id: str
    developer_name: str
    description: Optional[str] = ""
    icon_url: Optional[str] = None
    brand_id: Optional[int] = None
    sector_id: str
    source_type: str = "manual"

class AppCandidateResponse(AppCandidateCreate):
    id: int
    first_seen: datetime
    last_seen: datetime
    created_at: datetime

# --- Findings & Evidence ---
class FindingEvidenceResponse(BaseSchema):
    id: int
    signal_name: str
    score: float
    weight: float
    explanation: str
    evidence_metadata: Dict[str, Any] = {}
    created_at: datetime

class ReviewNoteCreate(BaseSchema):
    author: str
    content: str

class ReviewNoteResponse(ReviewNoteCreate):
    id: int
    finding_id: int
    created_at: datetime

class ReviewHistoryResponse(BaseSchema):
    id: int
    finding_id: int
    previous_status: str
    new_status: str
    analyst: str
    notes: Optional[str] = ""
    created_at: datetime

class FindingResponse(BaseSchema):
    id: int
    candidate_type: str
    social_candidate_id: Optional[int] = None
    app_candidate_id: Optional[int] = None
    brand_id: int
    sector_id: str
    risk_score: float
    severity: str
    status: str
    is_official_excluded: bool
    exclusion_reason: Optional[str] = None
    threat_category: str
    recommended_steps: List[str] = []
    assigned_analyst: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    brand_name: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_url: Optional[str] = None
    candidate_platform_or_store: Optional[str] = None

class FindingDetailResponse(FindingResponse):
    evidence: List[FindingEvidenceResponse] = []
    notes: List[ReviewNoteResponse] = []
    history: List[ReviewHistoryResponse] = []
    social_candidate: Optional[SocialCandidateResponse] = None
    app_candidate: Optional[AppCandidateResponse] = None

class FindingStatusUpdate(BaseSchema):
    status: str  # New, Needs Review, Confirmed Impersonation, False Positive, Resolved
    analyst: str
    notes: Optional[str] = ""
    add_to_approved_assets: Optional[bool] = False  # auto-whitelist if false positive

# --- Dashboard & Analytics ---
class DashboardSummaryResponse(BaseSchema):
    protected_brands: int
    candidates_analysed: int
    potential_threats: int
    high_critical_findings: int
    awaiting_review: int
    resolved_findings: int
    total_findings: int
    official_excluded_count: int

class ThreatTrendItem(BaseSchema):
    date: str
    social_threats: int
    app_threats: int
    total_findings: int

class SectorStatItem(BaseSchema):
    sector_id: str
    sector_name: str
    icon: str
    brand_count: int
    findings_count: int
    high_critical_count: int
    awaiting_review_count: int
    resolved_count: int

# --- Threat Graph Schemas ---
class GraphNode(BaseSchema):
    id: str
    label: str
    type: str  # "brand", "social", "app", "publisher", "domain"
    severity: Optional[str] = None
    risk_score: Optional[float] = None
    sector_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

class GraphEdge(BaseSchema):
    id: str
    source: str
    target: str
    relationship: str
    evidence: str
    confidence: float = 0.8

class GraphResponse(BaseSchema):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Data Sources & Demo ---
class DataSourceResponse(BaseSchema):
    id: int
    name: str
    source_type: str
    status: str
    is_live: bool
    last_sync: Optional[datetime] = None
    records_count: int
    notes: Optional[str] = ""
    created_at: datetime

# --- Analyst ---
class AnalystResponse(BaseSchema):
    id: int
    username: str
    full_name: str
    role: str
    email: str
    created_at: datetime

# --- ML Fake Detection Model Schemas ---
class FakeDetectionRequest(BaseSchema):
    text: str = Field(..., description="Content, profile bio, app description, or message to analyze")
    sector: str = Field("banking", description="Target industry sector (e.g., banking, ecommerce, telecom, government_digital_services)")

class FakeDetectionResponse(BaseSchema):
    prediction: str = Field(..., description="'fake' or 'genuine'")
    is_fake: bool
    confidence: float
    fake_probability: float
    genuine_probability: float
    sector_used: str
    model_loaded: bool
