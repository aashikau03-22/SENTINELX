import csv
import io
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Sector, Brand, Finding, SocialCandidate, AppCandidate

def generate_findings_csv(
    db: Session,
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    candidate_type: Optional[str] = None
) -> str:
    """Exports findings as a formatted CSV string."""
    query = db.query(Finding)
    if sector_id:
        query = query.filter(Finding.sector_id == sector_id)
    if brand_id:
        query = query.filter(Finding.brand_id == brand_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if candidate_type:
        query = query.filter(Finding.candidate_type == candidate_type)

    findings = query.order_by(Finding.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Finding ID",
        "Candidate Type",
        "Sector",
        "Protected Brand",
        "Candidate Identifier",
        "Platform / Store",
        "Candidate URL",
        "Risk Score",
        "Severity",
        "Status",
        "Is Official Excluded",
        "Exclusion Reason",
        "Threat Category",
        "Assigned Analyst",
        "Created At (UTC)"
    ])

    for f in findings:
        b_name = f.brand.name if f.brand else "Unknown"
        cand_name = ""
        cand_source = ""
        cand_url = ""

        if f.candidate_type == "social" and f.social_candidate:
            cand_name = f"@{f.social_candidate.handle} ({f.social_candidate.display_name})"
            cand_source = f.social_candidate.platform
            cand_url = f.social_candidate.profile_url
        elif f.candidate_type == "app" and f.app_candidate:
            cand_name = f.app_candidate.app_name
            cand_source = f.app_candidate.store
            cand_url = f.app_candidate.app_url

        writer.writerow([
            f.id,
            f.candidate_type,
            f.sector_id,
            b_name,
            cand_name,
            cand_source,
            cand_url,
            f.risk_score,
            f.severity,
            f.status,
            "YES" if f.is_official_excluded else "NO",
            f.exclusion_reason or "N/A",
            f.threat_category,
            f.assigned_analyst or "Unassigned",
            f.created_at.strftime("%Y-%m-%d %H:%M:%S") if f.created_at else ""
        ])

    return output.getvalue()

def generate_sector_report(db: Session, sector_id: str) -> Dict[str, Any]:
    """Generates detailed sector security summary report."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        return {}

    brands = db.query(Brand).filter(Brand.sector_id == sector_id).all()
    findings = db.query(Finding).filter(Finding.sector_id == sector_id).all()

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    status_counts = {"New": 0, "Needs Review": 0, "Confirmed Impersonation": 0, "False Positive": 0, "Resolved": 0}
    category_counts: Dict[str, int] = {}
    official_excluded = 0

    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1
        status_counts[f.status] = status_counts.get(f.status, 0) + 1
        category_counts[f.threat_category] = category_counts.get(f.threat_category, 0) + 1
        if f.is_official_excluded:
            official_excluded += 1

    social_cands = db.query(SocialCandidate).filter(SocialCandidate.sector_id == sector_id).count()
    app_cands = db.query(AppCandidate).filter(AppCandidate.sector_id == sector_id).count()

    return {
        "sector": {
            "id": sector.id,
            "name": sector.name,
            "description": sector.description,
            "threat_categories": sector.threat_categories,
            "recommended_checklist": sector.recommended_checklist
        },
        "stats": {
            "total_brands": len(brands),
            "social_candidates_analyzed": social_cands,
            "app_candidates_analyzed": app_cands,
            "total_candidates": social_cands + app_cands,
            "total_findings": len(findings),
            "official_excluded": official_excluded,
            "actionable_threats": len(findings) - official_excluded,
            "severity_distribution": severity_counts,
            "status_distribution": status_counts,
            "category_distribution": category_counts
        },
        "brands": [{"id": b.id, "name": b.name, "website": b.official_website, "status": b.monitoring_status} for b in brands]
    }

def generate_brand_report(db: Session, brand_id: int) -> Dict[str, Any]:
    """Generates comprehensive brand digital asset protection report."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        return {}

    findings = db.query(Finding).filter(Finding.brand_id == brand_id).all()

    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    status_counts = {"New": 0, "Needs Review": 0, "Confirmed Impersonation": 0, "False Positive": 0, "Resolved": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1
        status_counts[f.status] = status_counts.get(f.status, 0) + 1

    return {
        "brand": {
            "id": brand.id,
            "name": brand.name,
            "sector_id": brand.sector_id,
            "official_website": brand.official_website,
            "approved_domains": brand.approved_domains,
            "official_developer": brand.official_developer,
            "aliases": brand.aliases,
            "keywords": brand.keywords,
            "social_assets_count": len(brand.social_assets),
            "app_assets_count": len(brand.app_assets),
            "approved_assets_count": len(brand.approved_assets),
            "monitoring_status": brand.monitoring_status
        },
        "identity_fingerprint": {
            "official_social_handles": [f"{s.platform}: @{s.handle}" for s in brand.social_assets],
            "official_package_ids": [f"{a.store}: {a.package_id}" for a in brand.app_assets],
            "approved_domains": brand.approved_domains,
            "approved_whitelist": [f"{w.asset_type}: {w.identifier} ({w.reason})" for w in brand.approved_assets]
        },
        "threat_summary": {
            "total_findings": len(findings),
            "severity_distribution": severity_counts,
            "status_distribution": status_counts
        }
    }
