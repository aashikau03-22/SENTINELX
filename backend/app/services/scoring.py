from typing import List, Dict, Any, Tuple

class EvidenceSignal:
    def __init__(self, name: str, score: float, raw_weight: float, explanation: str, metadata: Dict[str, Any] = None):
        self.name = name
        self.score = max(0.0, min(100.0, score))  # bound 0-100
        self.raw_weight = raw_weight
        self.explanation = explanation
        self.metadata = metadata or {}

def calculate_heuristic_risk(
    signals: List[EvidenceSignal],
    missing_evidence: List[str] = None
) -> Tuple[float, str, List[Dict[str, Any]], List[str]]:
    """
    Computes normalized heuristic risk score across available signals.
    Does not penalize missing signals (normalizes by sum of present weights).
    Returns (final_score, severity, evaluated_signals, recommended_steps).
    """
    if not signals:
        return 0.0, "Low", [], ["Insufficient evidence gathered. Collect profile handle or package metadata."]

    total_weight = sum(s.raw_weight for s in signals)
    if total_weight <= 0:
        return 0.0, "Low", [], ["No weighted signals available."]

    weighted_sum = sum(s.score * s.raw_weight for s in signals)
    final_score = weighted_sum / total_weight
    final_score = round(max(0.0, min(100.0, final_score)), 1)

    # Determine severity band
    if final_score >= 80.0:
        severity = "Critical"
    elif final_score >= 60.0:
        severity = "High"
    elif final_score >= 35.0:
        severity = "Medium"
    else:
        severity = "Low"

    # Evaluated signals with effective weights
    evaluated_signals = []
    for s in signals:
        effective_weight_pct = round((s.raw_weight / total_weight) * 100, 1)
        evaluated_signals.append({
            "signal_name": s.name,
            "score": s.score,
            "weight": effective_weight_pct,
            "explanation": s.explanation,
            "metadata": s.metadata
        })

    # Recommended investigation steps based on severity and signals
    recommended_steps = []
    if severity in ["Critical", "High"]:
        recommended_steps.append("Verify registrant details and creation date via WHOIS or platform transparency tools.")
        recommended_steps.append("Issue advisory to security operations and prepare takedown evidence package.")
    if any("Publisher Mismatch" in s.name for s in signals):
        recommended_steps.append("Cross-reference developer email and signing certificate on app stores.")
    if any("Keyword" in s.name for s in signals):
        recommended_steps.append("Check if unauthorized customer support phone numbers or payment links are posted.")
    if missing_evidence:
        for m in missing_evidence:
            recommended_steps.append(f"Acquire missing signal: {m} for deeper corroboration.")
    if not recommended_steps:
        recommended_steps.append("Log observation in monthly brand monitoring report; no urgent escalation required.")

    return final_score, severity, evaluated_signals, recommended_steps
