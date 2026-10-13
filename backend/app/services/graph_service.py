from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Brand, Finding, ThreatRelationship, SocialCandidate, AppCandidate
from app.schemas.schemas import GraphNode, GraphEdge, GraphResponse
from app.services.normalizer import extract_domain

def build_threat_graph(
    db: Session,
    sector_id: Optional[str] = None,
    brand_id: Optional[int] = None,
    severity: Optional[str] = None
) -> GraphResponse:
    """Constructs the interactive Threat Intelligence Graph with verified evidence edges."""
    nodes_dict: Dict[str, GraphNode] = {}
    edges_list: List[GraphEdge] = []

    # 1. Fetch Brands
    brand_query = db.query(Brand)
    if sector_id:
        brand_query = brand_query.filter(Brand.sector_id == sector_id)
    if brand_id:
        brand_query = brand_query.filter(Brand.id == brand_id)
    brands = brand_query.all()

    for b in brands:
        b_node_id = f"brand_{b.id}"
        nodes_dict[b_node_id] = GraphNode(
            id=b_node_id,
            label=b.name,
            type="brand",
            sector_id=b.sector_id,
            metadata={
                "website": b.official_website,
                "sector": b.sector_id,
                "status": b.monitoring_status,
                "developer": b.official_developer
            }
        )

        # Official domain node
        if b.official_website:
            domain = extract_domain(b.official_website)
            dom_node_id = f"domain_{domain}"
            if dom_node_id not in nodes_dict:
                nodes_dict[dom_node_id] = GraphNode(
                    id=dom_node_id,
                    label=domain,
                    type="domain",
                    sector_id=b.sector_id,
                    metadata={"is_approved": True, "brand": b.name}
                )
            edges_list.append(GraphEdge(
                id=f"edge_dom_{b.id}_{domain}",
                source=b_node_id,
                target=dom_node_id,
                relationship="OFFICIAL_DOMAIN",
                evidence=f"Registered and approved official domain for {b.name}.",
                confidence=1.0
            ))

        # Official developer node
        if b.official_developer:
            pub_node_id = f"pub_{b.official_developer.lower().replace(' ', '_')}"
            if pub_node_id not in nodes_dict:
                nodes_dict[pub_node_id] = GraphNode(
                    id=pub_node_id,
                    label=b.official_developer,
                    type="publisher",
                    sector_id=b.sector_id,
                    metadata={"is_official": True, "brand": b.name}
                )
            edges_list.append(GraphEdge(
                id=f"edge_pub_{b.id}",
                source=b_node_id,
                target=pub_node_id,
                relationship="OFFICIAL_PUBLISHER",
                evidence=f"Authorized official mobile software publisher for {b.name}.",
                confidence=1.0
            ))

    # 2. Fetch Findings
    findings_query = db.query(Finding)
    if sector_id:
        findings_query = findings_query.filter(Finding.sector_id == sector_id)
    if brand_id:
        findings_query = findings_query.filter(Finding.brand_id == brand_id)
    if severity:
        findings_query = findings_query.filter(Finding.severity == severity)

    findings = findings_query.all()

    for f in findings:
        b_node_id = f"brand_{f.brand_id}"

        if f.candidate_type == "social" and f.social_candidate:
            sc = f.social_candidate
            cand_node_id = f"social_{sc.id}"
            nodes_dict[cand_node_id] = GraphNode(
                id=cand_node_id,
                label=f"@{sc.handle} ({sc.platform})",
                type="social",
                severity=f.severity,
                risk_score=f.risk_score,
                sector_id=f.sector_id,
                metadata={
                    "platform": sc.platform,
                    "handle": sc.handle,
                    "url": sc.profile_url,
                    "threat_category": f.threat_category,
                    "status": f.status,
                    "is_official": f.is_official_excluded
                }
            )

            rel_type = "VERIFIED_OFFICIAL_ACCOUNT" if f.is_official_excluded else "POTENTIAL_IMPERSONATION"
            ev_summary = f.exclusion_reason if f.is_official_excluded else f"Fuzzy profile similarity with risk score {f.risk_score}."
            edges_list.append(GraphEdge(
                id=f"edge_finding_{f.id}",
                source=cand_node_id,
                target=b_node_id,
                relationship=rel_type,
                evidence=ev_summary,
                confidence=round(f.risk_score / 100.0, 2) if not f.is_official_excluded else 1.0
            ))

        elif f.candidate_type == "app" and f.app_candidate:
            ac = f.app_candidate
            cand_node_id = f"app_{ac.id}"
            nodes_dict[cand_node_id] = GraphNode(
                id=cand_node_id,
                label=ac.app_name,
                type="app",
                severity=f.severity,
                risk_score=f.risk_score,
                sector_id=f.sector_id,
                metadata={
                    "store": ac.store,
                    "package_id": ac.package_id,
                    "developer": ac.developer_name,
                    "url": ac.app_url,
                    "threat_category": f.threat_category,
                    "status": f.status,
                    "is_official": f.is_official_excluded
                }
            )

            rel_type = "VERIFIED_OFFICIAL_APP" if f.is_official_excluded else "SUSPICIOUS_APP_CLONE"
            ev_summary = f.exclusion_reason if f.is_official_excluded else f"Application similarity score {f.risk_score} on {ac.store}."
            edges_list.append(GraphEdge(
                id=f"edge_finding_{f.id}",
                source=cand_node_id,
                target=b_node_id,
                relationship=rel_type,
                evidence=ev_summary,
                confidence=round(f.risk_score / 100.0, 2) if not f.is_official_excluded else 1.0
            ))

            # Connect app to its developer
            if ac.developer_name:
                dev_node_id = f"pub_{ac.developer_name.lower().replace(' ', '_')}"
                if dev_node_id not in nodes_dict:
                    nodes_dict[dev_node_id] = GraphNode(
                        id=dev_node_id,
                        label=ac.developer_name,
                        type="publisher",
                        sector_id=f.sector_id,
                        metadata={"is_official": f.is_official_excluded}
                    )
                edges_list.append(GraphEdge(
                    id=f"edge_dev_{ac.id}",
                    source=cand_node_id,
                    target=dev_node_id,
                    relationship="PUBLISHED_BY",
                    evidence=f"App store listed developer: '{ac.developer_name}'.",
                    confidence=1.0
                ))

    # 3. Fetch Stored Threat Relationships (e.g. cross-entity links such as shared telegram or domains)
    stored_rels = db.query(ThreatRelationship).all()
    for rel in stored_rels:
        # Only add if relevant to current filter
        s_id = rel.source_entity_id
        t_id = rel.target_entity_id
        
        # Ensure nodes exist
        if s_id not in nodes_dict:
            nodes_dict[s_id] = GraphNode(
                id=s_id,
                label=rel.source_label,
                type=rel.source_entity_type,
                sector_id=rel.sector_id,
                metadata={"synthetic": rel.is_synthetic}
            )
        if t_id not in nodes_dict:
            nodes_dict[t_id] = GraphNode(
                id=t_id,
                label=rel.target_label,
                type=rel.target_entity_type,
                sector_id=rel.sector_id,
                metadata={"synthetic": rel.is_synthetic}
            )
        
        edges_list.append(GraphEdge(
            id=f"stored_rel_{rel.id}",
            source=s_id,
            target=t_id,
            relationship=rel.relationship_type,
            evidence=rel.evidence_summary,
            confidence=rel.confidence_score
        ))

    return GraphResponse(
        nodes=list(nodes_dict.values()),
        edges=edges_list
    )
