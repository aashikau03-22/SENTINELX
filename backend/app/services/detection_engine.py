from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import (
    Brand, OfficialSocialAsset, OfficialAppAsset, ApprovedAsset,
    SocialCandidate, AppCandidate, Finding, FindingEvidence, Sector, SectorRule
)
from app.services.normalizer import (
    normalize_text, normalize_handle, normalize_url, normalize_package_id, extract_domain
)
from app.services.similarity import (
    calculate_name_similarity, calculate_handle_similarity, calculate_description_similarity
)
from app.services.scoring import EvidenceSignal, calculate_heuristic_risk
from app.services.ml_model_service import predict_fake_detection

SECTOR_KEYWORDS = {
    "banking": ["loan", "instant cash", "kyc", "refund", "card pin", "customer care", "helpline", "account verify", "support"],
    "ecommerce": ["mega sale", "90% off", "free gift", "voucher", "order dispute", "claim prize", "discount store", "support"],
    "education": ["admission", "scholarship", "hall ticket", "fee payment", "result portal", "counselling", "enroll now"],
    "telecom": ["recharge offer", "sim swap", "5g activation", "esim", "port sim", "bonus data", "customer service"],
    "government": ["yojana", "scheme portal", "subsidy", "citizen grant", "direct benefit", "pension apply", "official service"]
}

def check_official_social_exclusion(candidate: SocialCandidate, brand: Brand, db: Session) -> Tuple[bool, Optional[str]]:
    """
    Checks if candidate is an official verified asset or an analyst-approved asset.
    Returns (is_excluded, reason).
    """
    cand_h = normalize_handle(candidate.handle)
    cand_url = normalize_url(candidate.profile_url)

    # 1. Check official brand social assets
    for official in brand.social_assets:
        off_h = normalize_handle(official.handle)
        off_url = normalize_url(official.profile_url)

        if cand_h and cand_h == off_h:
            return True, f"Excluded: Exact match with official verified handle @{official.handle} on {official.platform}."
        if cand_url and cand_url == off_url:
            return True, f"Excluded: Exact match with official registered profile URL ({official.profile_url})."

    # 2. Check analyst-approved assets (whitelists)
    for approved in brand.approved_assets:
        if approved.asset_type == "social":
            app_id = normalize_handle(approved.identifier)
            if cand_h == app_id or cand_url == normalize_url(approved.identifier):
                return True, f"Excluded: Listed on approved asset whitelist by {approved.approved_by} ('{approved.reason}')."

    return False, None

def check_official_app_exclusion(candidate: AppCandidate, brand: Brand, db: Session) -> Tuple[bool, Optional[str]]:
    """
    Checks if app candidate is an official brand application or analyst-approved application.
    Returns (is_excluded, reason).
    """
    cand_pkg = normalize_package_id(candidate.package_id)
    cand_url = normalize_url(candidate.app_url)

    # 1. Check official brand app assets
    for official in brand.app_assets:
        off_pkg = normalize_package_id(official.package_id)
        off_url = normalize_url(official.app_url)

        if cand_pkg and cand_pkg == off_pkg:
            return True, f"Excluded: Exact match with official registered package ID ({official.package_id}) on {official.store}."
        if cand_url and cand_url == off_url:
            return True, f"Excluded: Exact match with official app store listing URL ({official.app_url})."

    # 2. Check approved assets
    for approved in brand.approved_assets:
        if approved.asset_type == "app":
            app_id = normalize_package_id(approved.identifier)
            if cand_pkg == app_id or cand_url == normalize_url(approved.identifier):
                return True, f"Excluded: Listed on approved app whitelist by {approved.approved_by} ('{approved.reason}')."

    return False, None

def analyze_social_candidate(candidate: SocialCandidate, brand: Brand, db: Session) -> Finding:
    """Analyzes a social media candidate against the target brand and produces an explainable Finding."""
    # Check official exclusion first
    is_excluded, exclusion_reason = check_official_social_exclusion(candidate, brand, db)

    if is_excluded:
        finding = Finding(
            candidate_type="social",
            social_candidate_id=candidate.id,
            brand_id=brand.id,
            sector_id=brand.sector_id,
            risk_score=0.0,
            severity="Low",
            status="Resolved",
            is_official_excluded=True,
            exclusion_reason=exclusion_reason,
            threat_category="Official Verified Asset",
            recommended_steps=["No action needed: Verified legitimate official account."],
            assigned_analyst="Auto-Verification Engine"
        )
        db.add(finding)
        db.flush()
        
        # Add exclusion evidence
        ev = FindingEvidence(
            finding_id=finding.id,
            signal_name="Official Asset Verification",
            score=0.0,
            weight=100.0,
            explanation=exclusion_reason,
            evidence_metadata={"status": "OFFICIAL_EXCLUDED"}
        )
        db.add(ev)
        db.commit()
        db.refresh(finding)
        return finding

    # Evaluate heuristic signals
    signals: List[EvidenceSignal] = []
    missing_evidence: List[str] = []

    # Signal 1: Name Similarity (35% raw weight)
    name_score, name_exp = calculate_name_similarity(candidate.display_name, brand.name, brand.aliases)
    signals.append(EvidenceSignal("Name Similarity", name_score, 0.35, name_exp, {"display_name": candidate.display_name}))

    # Signal 2: Handle Similarity (15% raw weight)
    primary_official_handle = brand.social_assets[0].handle if brand.social_assets else brand.name
    handle_score, handle_exp = calculate_handle_similarity(candidate.handle, primary_official_handle)
    signals.append(EvidenceSignal("Handle Pattern Similarity", handle_score, 0.15, handle_exp, {"handle": candidate.handle}))

    # Signal 3: Description Similarity (15% raw weight)
    if candidate.description and brand.description:
        desc_score, desc_exp = calculate_description_similarity(candidate.description, brand.description)
        signals.append(EvidenceSignal("Profile Description Analysis", desc_score, 0.15, desc_exp))
    else:
        missing_evidence.append("Profile bio / description text")

    # Signal 4: Sector-Specific Keywords (20% raw weight)
    sector_kw = SECTOR_KEYWORDS.get(brand.sector_id, [])
    found_kw = []
    combined_text = (candidate.display_name + " " + (candidate.description or "")).lower()
    for kw in sector_kw:
        if kw in combined_text:
            found_kw.append(kw)
    if found_kw:
        kw_score = min(95.0, 40.0 + len(found_kw) * 20.0)
        kw_exp = f"Detected high-risk sector keywords in profile: {', '.join(found_kw)}."
        signals.append(EvidenceSignal("Sector Threat Keywords", kw_score, 0.20, kw_exp, {"keywords": found_kw}))
    else:
        signals.append(EvidenceSignal("Sector Threat Keywords", 10.0, 0.20, "No high-risk sector-specific bait keywords detected in profile."))

    # Signal 5: Machine Learning NLP Fake Detection Model (fake_detection_model.pkl)
    try:
        candidate_text = f"{candidate.display_name} {candidate.description or ''}"
        ml_res = predict_fake_detection(candidate_text, brand.sector_id)
        # Convert fake probability (0.0 - 1.0) to risk scale 0 - 100
        ml_score = ml_res["fake_probability"] * 100.0
        ml_label = "Fake/Deceptive" if ml_res["is_fake"] else "Genuine"
        ml_exp = f"ML Fake Detection Model predicted '{ml_label}' (Fake Prob: {ml_res['fake_probability']:.1%}, Confidence: {ml_res['confidence']:.1%}) for sector '{ml_res['sector_used']}'."
        signals.append(EvidenceSignal("ML Fake Detection Classifier", ml_score, 0.20, ml_exp, ml_res))
    except Exception as e:
        missing_evidence.append(f"ML Classifier evaluation error: {str(e)}")

    # Evaluate risk score
    risk_score, severity, evaluated_signals, recommended_steps = calculate_heuristic_risk(signals, missing_evidence)

    # Determine threat category
    threat_category = "Suspected Lookalike Profile"
    if "support" in candidate.display_name.lower() or "helpline" in candidate.display_name.lower() or "care" in candidate.display_name.lower():
        threat_category = "Fake Customer Support Impersonation"
    elif "loan" in candidate.display_name.lower():
        threat_category = "Fraudulent Loan / Financial Scheme"

    # Create finding
    finding = Finding(
        candidate_type="social",
        social_candidate_id=candidate.id,
        brand_id=brand.id,
        sector_id=brand.sector_id,
        risk_score=risk_score,
        severity=severity,
        status="New" if risk_score >= 35.0 else "Needs Review",
        is_official_excluded=False,
        exclusion_reason=None,
        threat_category=threat_category,
        recommended_steps=recommended_steps,
        assigned_analyst=None
    )
    db.add(finding)
    db.flush()

    # Save evidence
    for es in evaluated_signals:
        ev = FindingEvidence(
            finding_id=finding.id,
            signal_name=es["signal_name"],
            score=es["score"],
            weight=es["weight"],
            explanation=es["explanation"],
            evidence_metadata=es.get("metadata", {})
        )
        db.add(ev)

    db.commit()
    db.refresh(finding)
    return finding

def analyze_app_candidate(candidate: AppCandidate, brand: Brand, db: Session) -> Finding:
    """Analyzes a mobile app candidate against the target brand and produces an explainable Finding."""
    # Check official exclusion
    is_excluded, exclusion_reason = check_official_app_exclusion(candidate, brand, db)

    if is_excluded:
        finding = Finding(
            candidate_type="app",
            app_candidate_id=candidate.id,
            brand_id=brand.id,
            sector_id=brand.sector_id,
            risk_score=0.0,
            severity="Low",
            status="Resolved",
            is_official_excluded=True,
            exclusion_reason=exclusion_reason,
            threat_category="Official Verified Application",
            recommended_steps=["No action needed: Verified legitimate official brand application."],
            assigned_analyst="Auto-Verification Engine"
        )
        db.add(finding)
        db.flush()

        ev = FindingEvidence(
            finding_id=finding.id,
            signal_name="Official Application Verification",
            score=0.0,
            weight=100.0,
            explanation=exclusion_reason,
            evidence_metadata={"status": "OFFICIAL_APP_EXCLUDED"}
        )
        db.add(ev)
        db.commit()
        db.refresh(finding)
        return finding

    # Evaluate heuristic signals
    signals: List[EvidenceSignal] = []
    missing_evidence: List[str] = []

    # Signal 1: App Name Similarity (35% raw weight)
    name_score, name_exp = calculate_name_similarity(candidate.app_name, brand.name, brand.aliases)
    signals.append(EvidenceSignal("Application Name Similarity", name_score, 0.35, name_exp, {"app_name": candidate.app_name}))

    # Signal 2: Publisher / Developer Mismatch (25% raw weight)
    if brand.official_developer and candidate.developer_name:
        pub_sim, _ = calculate_name_similarity(candidate.developer_name, brand.official_developer)
        if pub_sim < 40.0:
            pub_score = 85.0
            pub_exp = f"Developer mismatch: Candidate publisher '{candidate.developer_name}' does not match official developer '{brand.official_developer}'."
        elif pub_sim > 85.0:
            pub_score = 15.0
            pub_exp = f"Publisher match: Developer '{candidate.developer_name}' matches registered official developer."
        else:
            pub_score = 50.0
            pub_exp = f"Publisher variation: Developer '{candidate.developer_name}' partially resembles official developer ({pub_sim:.1f}%)."
        signals.append(EvidenceSignal("Developer / Publisher Verification", pub_score, 0.25, pub_exp, {"developer": candidate.developer_name}))
    else:
        missing_evidence.append("Official registered developer comparison")

    # Signal 3: Package ID Pattern Analysis (20% raw weight)
    pkg = normalize_package_id(candidate.package_id)
    brand_slug = normalize_text(brand.name).replace(" ", "")
    if brand_slug in pkg:
        pkg_score = 75.0
        pkg_exp = f"Package identifier '{candidate.package_id}' embeds protected brand slug '{brand_slug}' without being in official registry."
    else:
        pkg_score = 25.0
        pkg_exp = f"Package ID '{candidate.package_id}' does not directly mimic registered brand prefix."
    signals.append(EvidenceSignal("Package ID Pattern Analysis", pkg_score, 0.20, pkg_exp, {"package_id": candidate.package_id}))

    # Signal 4: Description / Keyword Analysis (20% raw weight)
    if candidate.description:
        sector_kw = SECTOR_KEYWORDS.get(brand.sector_id, [])
        found_kw = [kw for kw in sector_kw if kw in candidate.description.lower()]
        if found_kw:
            desc_score = min(90.0, 45.0 + len(found_kw) * 15.0)
            desc_exp = f"App description contains targeted sector keywords: {', '.join(found_kw)}."
        else:
            desc_score = 20.0
            desc_exp = "No sector-specific deceptive keywords found in app store description."
        signals.append(EvidenceSignal("Store Description & Keyword Check", desc_score, 0.20, desc_exp, {"keywords": found_kw}))
    else:
        missing_evidence.append("App store full description text")

    # Signal 5: Machine Learning NLP Fake Detection Model (fake_detection_model.pkl)
    try:
        app_text = f"{candidate.app_name} {candidate.description or ''}"
        ml_res = predict_fake_detection(app_text, brand.sector_id)
        ml_score = ml_res["fake_probability"] * 100.0
        ml_label = "Fake/Deceptive" if ml_res["is_fake"] else "Genuine"
        ml_exp = f"ML Fake Detection Model predicted '{ml_label}' (Fake Prob: {ml_res['fake_probability']:.1%}, Confidence: {ml_res['confidence']:.1%}) for sector '{ml_res['sector_used']}'."
        signals.append(EvidenceSignal("ML Fake Detection Classifier", ml_score, 0.20, ml_exp, ml_res))
    except Exception as e:
        missing_evidence.append(f"ML Classifier evaluation error: {str(e)}")

    # Compute risk
    risk_score, severity, evaluated_signals, recommended_steps = calculate_heuristic_risk(signals, missing_evidence)

    threat_category = "Unauthorized Mobile Application"
    if "loan" in candidate.app_name.lower():
        threat_category = "Predatory / Fake Loan Application"
    elif "recharge" in candidate.app_name.lower():
        threat_category = "Fraudulent Recharge / Billing App"

    finding = Finding(
        candidate_type="app",
        app_candidate_id=candidate.id,
        brand_id=brand.id,
        sector_id=brand.sector_id,
        risk_score=risk_score,
        severity=severity,
        status="New" if risk_score >= 35.0 else "Needs Review",
        is_official_excluded=False,
        exclusion_reason=None,
        threat_category=threat_category,
        recommended_steps=recommended_steps,
        assigned_analyst=None
    )
    db.add(finding)
    db.flush()

    for es in evaluated_signals:
        ev = FindingEvidence(
            finding_id=finding.id,
            signal_name=es["signal_name"],
            score=es["score"],
            weight=es["weight"],
            explanation=es["explanation"],
            evidence_metadata=es.get("metadata", {})
        )
        db.add(ev)

    db.commit()
    db.refresh(finding)
    return finding
