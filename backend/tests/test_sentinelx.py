import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models.models import (
    Sector, Brand, OfficialSocialAsset, OfficialAppAsset, ApprovedAsset,
    SocialCandidate, AppCandidate, Finding
)
from app.services.normalizer import normalize_text, normalize_handle, normalize_package_id, extract_domain
from app.services.similarity import calculate_name_similarity, calculate_description_similarity
from app.services.scoring import EvidenceSignal, calculate_heuristic_risk
from app.services.detection_engine import (
    analyze_social_candidate, analyze_app_candidate,
    check_official_social_exclusion, check_official_app_exclusion
)
from app.seed.seed_data import seed_database

# Create isolated test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_sentinelx.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    return TestClient(app)

# 1. Health Endpoint Test
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SentinelX"

# 2. Sector CRUD & Retrieval Test
def test_sectors_list_and_stats(client):
    response = client.get("/api/sectors")
    assert response.status_code == 200
    sectors = response.json()
    assert len(sectors) >= 5
    ids = [s["id"] for s in sectors]
    assert "banking" in ids
    assert "ecommerce" in ids
    assert "education" in ids
    assert "telecom" in ids
    assert "government" in ids

def test_custom_sector_creation(client):
    payload = {
        "id": "healthcare_digital",
        "name": "Digital Healthcare & Hospitals",
        "description": "Protection against counterfeit pharmacy portals and fake telemedicine apps.",
        "icon": "HeartPulse",
        "threat_categories": ["Counterfeit Pharmacy", "Fake Doctor Handles"],
        "recommended_checklist": ["Verify medical license registry"],
        "is_active": True
    }
    response = client.post("/api/sectors", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Digital Healthcare & Hospitals"
    assert data["is_custom"] is True

# 3. Brand CRUD & Identity Fingerprint Test
def test_brands_crud(client):
    response = client.get("/api/brands?sector_id=banking")
    assert response.status_code == 200
    brands = response.json()
    assert len(brands) >= 1
    apex = brands[0]
    assert "Apex" in apex["name"]
    assert len(apex["social_assets"]) >= 1
    assert len(apex["app_assets"]) >= 1

def test_create_brand(client):
    payload = {
        "name": "Zenith Global Pay",
        "sector_id": "banking",
        "description": "International borderless payment provider.",
        "official_website": "https://www.zenithpay.com",
        "approved_domains": ["zenithpay.com"],
        "official_developer": "Zenith Global Inc",
        "aliases": ["ZenithPay"],
        "keywords": ["payment", "remittance"],
        "social_assets": [
            {"platform": "Twitter", "handle": "ZenithPayHQ", "profile_url": "https://twitter.com/ZenithPayHQ", "is_primary": True}
        ],
        "app_assets": [
            {"app_name": "Zenith Wallet", "store": "Google Play", "package_id": "com.zenith.wallet", "app_url": "https://play.google.com/store/apps/details?id=com.zenith.wallet", "developer_name": "Zenith Global Inc"}
        ]
    }
    response = client.post("/api/brands", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Zenith Global Pay"
    assert len(data["social_assets"]) == 1

# 4. Mandatory Official Asset Exclusion Tests
def test_official_social_asset_exclusion():
    db = TestingSessionLocal()
    brand = db.query(Brand).filter(Brand.sector_id == "banking").first()
    official_handle = brand.social_assets[0].handle

    cand = SocialCandidate(
        platform=brand.social_assets[0].platform,
        display_name="Apex Bank Official Verified",
        handle=official_handle,
        profile_url=brand.social_assets[0].profile_url,
        sector_id="banking",
        brand_id=brand.id,
        source_type="demo"
    )
    db.add(cand)
    db.flush()

    finding = analyze_social_candidate(cand, brand, db)
    assert finding.is_official_excluded is True
    assert finding.risk_score == 0.0
    assert finding.severity == "Low"
    assert finding.status == "Resolved"
    assert "Excluded:" in finding.exclusion_reason
    db.close()

def test_official_app_asset_exclusion():
    db = TestingSessionLocal()
    brand = db.query(Brand).filter(Brand.sector_id == "banking").first()
    official_pkg = brand.app_assets[0].package_id

    cand = AppCandidate(
        app_name=brand.app_assets[0].app_name,
        store=brand.app_assets[0].store,
        package_id=official_pkg,
        app_url=brand.app_assets[0].app_url,
        developer_name=brand.official_developer,
        sector_id="banking",
        brand_id=brand.id,
        source_type="demo"
    )
    db.add(cand)
    db.flush()

    finding = analyze_app_candidate(cand, brand, db)
    assert finding.is_official_excluded is True
    assert finding.risk_score == 0.0
    assert finding.severity == "Low"
    assert finding.status == "Resolved"
    assert "Excluded:" in finding.exclusion_reason
    db.close()

# 5. Lookalike & Suspicious Candidate Detection
def test_suspicious_social_detection():
    db = TestingSessionLocal()
    brand = db.query(Brand).filter(Brand.sector_id == "banking").first()

    cand = SocialCandidate(
        platform="Twitter",
        display_name="Apex Bank Helpdesk 247 Refund",
        handle="apexbank_help247",
        profile_url="https://twitter.com/apexbank_help247",
        description="Official Apex Bank customer support desk for instant KYC and refunds. Call +1-800-FAKE.",
        sector_id="banking",
        brand_id=brand.id,
        source_type="demo"
    )
    db.add(cand)
    db.flush()

    finding = analyze_social_candidate(cand, brand, db)
    assert finding.is_official_excluded is False
    assert finding.risk_score >= 60.0
    assert finding.severity in ["High", "Critical"]
    assert len(finding.evidence) >= 3
    db.close()

def test_publisher_mismatch_app_detection():
    db = TestingSessionLocal()
    brand = db.query(Brand).filter(Brand.sector_id == "banking").first()

    cand = AppCandidate(
        app_name="Apex Quick Personal Cash Loan",
        store="Third-Party Mirror",
        package_id="com.apexloans.instantcash",
        app_url="https://fake-mirror.com/app/apex-loan",
        developer_name="Rogue Software Syndicate",
        description="Instant collateral free loan for Apex Bank account holders.",
        sector_id="banking",
        brand_id=brand.id,
        source_type="demo"
    )
    db.add(cand)
    db.flush()

    finding = analyze_app_candidate(cand, brand, db)
    assert finding.is_official_excluded is False
    assert finding.risk_score >= 50.0
    assert finding.severity in ["Medium", "High", "Critical"]
    # Check that developer mismatch was flagged
    pub_ev = [e for e in finding.evidence if "Developer" in e.signal_name or "Publisher" in e.signal_name]
    assert len(pub_ev) > 0
    assert pub_ev[0].score >= 80.0
    db.close()

# 6. Idempotent Demo Seeding Test
def test_idempotent_seeding():
    db = TestingSessionLocal()
    brands_before = db.query(Brand).count()
    sectors_before = db.query(Sector).count()

    # Call seed_database a second time
    seed_database(db)

    brands_after = db.query(Brand).count()
    sectors_after = db.query(Sector).count()

    assert brands_before == brands_after
    assert sectors_before == sectors_after
    db.close()

# 7. Investigation Workflow & Review Status Persistence
def test_investigation_status_update(client):
    db = TestingSessionLocal()
    finding = db.query(Finding).filter(Finding.is_official_excluded == False).first()
    f_id = finding.id
    db.close()

    update_payload = {
        "status": "Confirmed Impersonation",
        "analyst": "sarah.chen",
        "notes": "Verified fraudulent domain hosted on bulletproof server."
    }
    response = client.patch(f"/api/findings/{f_id}/status", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Confirmed Impersonation"
    assert data["assigned_analyst"] == "sarah.chen"
    assert len(data["notes"]) >= 1

# 8. CSV Export Test
def test_findings_csv_export(client):
    response = client.get("/api/findings/export.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "Finding ID" in content
    assert "Candidate Type" in content
    assert "Risk Score" in content

# 9. Threat Graph Assembly Test
def test_threat_graph_endpoint(client):
    response = client.get("/api/threat-graph?sector_id=banking")
    assert response.status_code == 200
    graph = response.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) >= 2
    assert len(graph["edges"]) >= 1

# 10. ML Fake Detection Model & Prediction Endpoint Tests
def test_ml_fake_detection_endpoint_fake(client):
    payload = {
        "text": "Your account has been blocked. Enter your card details to activate free service immediately.",
        "sector": "banking"
    }
    response = client.post("/api/detection/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "is_fake" in data
    assert "confidence" in data
    assert "fake_probability" in data
    assert "genuine_probability" in data
    assert data["prediction"] in ["fake", "genuine"]
    assert data["model_loaded"] is True
    assert data["sector_used"] == "banking"

def test_ml_fake_detection_endpoint_genuine(client):
    payload = {
        "text": "Your monthly account statement has been generated and sent to your registered address.",
        "sector": "banking"
    }
    response = client.post("/api/detection/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "genuine"
    assert data["is_fake"] is False
    assert data["genuine_probability"] > 0.5
