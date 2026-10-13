from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.models import (
    Sector, SectorRule, Brand, OfficialSocialAsset, OfficialAppAsset,
    ApprovedAsset, SocialCandidate, AppCandidate, Finding, FindingEvidence,
    DataSource, ThreatRelationship, Analyst, ReviewNote, ReviewHistory
)
from app.services.detection_engine import analyze_social_candidate, analyze_app_candidate

def utc_now():
    return datetime.now(timezone.utc)

def seed_database(db: Session, force_reset: bool = False):
    """
    Seeds all 5 sectors, rules, brands, official assets, approved whitelists,
    candidates, findings, evidence, threat graph relationships, and data sources.
    Idempotent: Does not create duplicates if already seeded.
    """
    # 1. Analysts
    analysts_data = [
        {"username": "sarah.chen", "full_name": "Sarah Chen", "role": "Lead Brand Defense Analyst", "email": "sarah.chen@sentinelx.internal"},
        {"username": "marcus.vance", "full_name": "Marcus Vance", "role": "Senior Threat Intelligence Specialist", "email": "marcus.vance@sentinelx.internal"},
        {"username": "elena.rostova", "full_name": "Elena Rostova", "role": "SOC Risk Investigator", "email": "elena.rostova@sentinelx.internal"}
    ]
    for ad in analysts_data:
        existing = db.query(Analyst).filter(Analyst.username == ad["username"]).first()
        if not existing:
            db.add(Analyst(**ad))
    db.flush()

    # 2. Data Sources
    sources_data = [
        {"name": "Synthetic Social Threat Stream", "source_type": "synthetic_demo", "status": "Active (Demo)", "is_live": False, "records_count": 48, "notes": "Generates synthetic social profile candidate feed for testing and evaluation."},
        {"name": "Synthetic Mobile App Repository", "source_type": "synthetic_demo", "status": "Active (Demo)", "is_live": False, "records_count": 32, "notes": "Simulated app store catalogue scraper emitting candidate packages."},
        {"name": "External Social Media API Connector", "source_type": "api_connector", "status": "Standby (Awaiting Auth)", "is_live": False, "records_count": 0, "notes": "Production connector for Twitter/X, Meta Graph, Telegram Bot API. Requires enterprise API keys."},
        {"name": "Google Play Scraper Connector", "source_type": "api_connector", "status": "Standby (Awaiting Auth)", "is_live": False, "records_count": 0, "notes": "Production connector for Google Play Store Developer API & Scraper worker."},
        {"name": "Apple App Store Search Connector", "source_type": "api_connector", "status": "Standby (Awaiting Auth)", "is_live": False, "records_count": 0, "notes": "Enterprise connector for iTunes Search API and StoreKit feeds."}
    ]
    for sd in sources_data:
        existing = db.query(DataSource).filter(DataSource.name == sd["name"]).first()
        if not existing:
            db.add(DataSource(**sd, last_sync=utc_now()))
    db.flush()

    # 3. Five Sectors & Detection Rules
    sectors_config = [
        {
            "id": "banking",
            "name": "Banking & FinTech",
            "description": "Protection against fraudulent retail banking portals, predatory loan application clones, and deceptive customer care profiles.",
            "icon": "Landmark",
            "threat_categories": [
                "Bank Impersonation",
                "Fake Loan Apps",
                "Payment App Clones",
                "Fake Support Profiles",
                "Credential Phishing Landing Pages"
            ],
            "recommended_checklist": [
                "Verify developer certificate against registered banking legal entity.",
                "Review candidate profile bio for unauthorized WhatsApp/Telegram customer care links.",
                "Cross-examine APK signing fingerprint with official banking release pipeline.",
                "Issue takedown notice to hosting domain registrar and Google Play Trust & Safety team."
            ],
            "rules": [
                {"rule_name": "Lookalike Bank Brand Names", "rule_code": "BANK_NAME_LOOKALIKE", "description": "Fuzzy token match against registered bank trademark and abbreviations.", "weight": 1.2, "threshold": 0.75},
                {"rule_name": "Suspicious Customer Support Bait", "rule_code": "BANK_SUPPORT_KEYWORDS", "description": "Detects 'customer care', 'toll-free', 'refund helpline', 'KYC update' in profiles.", "weight": 1.4, "threshold": 0.65},
                {"rule_name": "Instant Loan Clones", "rule_code": "BANK_LOAN_CLONES", "description": "Flags unauthorized mobile apps offering instant collateral-free credit claiming brand affiliation.", "weight": 1.3, "threshold": 0.70},
                {"rule_name": "Publisher Entity Mismatch", "rule_code": "BANK_PUBLISHER_MISMATCH", "description": "Triggers alert if developer name deviates from authorized banking group.", "weight": 1.5, "threshold": 0.80}
            ]
        },
        {
            "id": "ecommerce",
            "name": "E-commerce & Online Shopping",
            "description": "Defense against clone storefronts, unauthorized reseller apps, fake flash-sale handles, and counterfeit merchandise distributors.",
            "icon": "ShoppingCart",
            "threat_categories": [
                "Fake Shopping Brands",
                "Cloned Store Pages",
                "Suspicious Shopping Apps",
                "Misleading Offer Pages",
                "Counterfeit Product Channels"
            ],
            "recommended_checklist": [
                "Verify domain registration date against major seasonal sales campaigns.",
                "Inspect payment gateway endpoints embedded in candidate app APK.",
                "Examine logo assets using perceptual hashing against official brand kit.",
                "Submit DMCA takedown request to content distribution network (CDN)."
            ],
            "rules": [
                {"rule_name": "Retailer Brand Homoglyphs", "rule_code": "ECOM_HOMOGLYPH_MATCH", "description": "Catches Unicode lookalikes and typo-squatted store names.", "weight": 1.1, "threshold": 0.70},
                {"rule_name": "Flash Sale & Huge Discount Bait", "rule_code": "ECOM_DISCOUNT_BAIT", "description": "Detects '90% off', 'clearance warehouse', 'free gifts' paired with brand name.", "weight": 1.3, "threshold": 0.65},
                {"rule_name": "Unofficial Store Catalog Apps", "rule_code": "ECOM_UNOFFICIAL_CATALOG", "description": "Flags APKs embedding retail product photos without merchant authorization.", "weight": 1.2, "threshold": 0.75}
            ]
        },
        {
            "id": "education",
            "name": "Education & Universities",
            "description": "Safeguarding academic institutions against fraudulent admission portals, fake scholarship scams, and fee-payment clone identities.",
            "icon": "GraduationCap",
            "threat_categories": [
                "Fake Admission Pages",
                "Scholarship Impersonation",
                "University App Clones",
                "Fraudulent Fee-Payment Identities",
                "Fake Degree Verification Hubs"
            ],
            "recommended_checklist": [
                "Verify university domain extension (must match approved .edu / .ac.in namespaces).",
                "Check fee payment bank details against bursar office approved merchant accounts.",
                "Verify candidate admission helpline number against registrar directory.",
                "Alert enrolled student population through official campus bulletin."
            ],
            "rules": [
                {"rule_name": "University Name Typo Variations", "rule_code": "EDU_TYPO_LOOKALIKE", "description": "Matches college names with minor spelling tweaks or missing hyphens.", "weight": 1.1, "threshold": 0.75},
                {"rule_name": "Admission & Result Baiting", "rule_code": "EDU_ADMISSION_BAIT", "description": "Catches 'direct admission', 'cutoff marks', 'hall ticket download' lures.", "weight": 1.4, "threshold": 0.70},
                {"rule_name": "Unregistered Student Portal Apps", "rule_code": "EDU_UNAUTH_PORTAL_APP", "description": "Identifies unofficial campus companion apps scraping student logins.", "weight": 1.3, "threshold": 0.75}
            ]
        },
        {
            "id": "telecom",
            "name": "Telecom & Mobile Networks",
            "description": "Protection against fake carrier support handles, unauthorized recharge apps, fraudulent 5G upgrade lures, and SIM swap identity abuse.",
            "icon": "Radio",
            "threat_categories": [
                "Fake Customer Support",
                "Recharge App Impersonation",
                "SIM-Related Support Abuse",
                "5G Free Data Lures",
                "Tower Installation Advance Scams"
            ],
            "recommended_checklist": [
                "Check contact numbers against telecom regulator official customer care ranges.",
                "Review APK permissions for SMS interception (READ_SMS, RECEIVE_SMS).",
                "Submit network security alert to national CERT and anti-phishing alliance.",
                "Issue subscriber SMS advisory through official broadcast channels."
            ],
            "rules": [
                {"rule_name": "Telecom Operator Lookalikes", "rule_code": "TEL_NAME_SIMILARITY", "description": "Evaluates telecom brand name similarity across social and app platforms.", "weight": 1.2, "threshold": 0.75},
                {"rule_name": "Recharge & SIM Swap Keywords", "rule_code": "TEL_RECHARGE_KEYWORDS", "description": "Flags 'free recharge', '5G upgrade code', 'instant eSIM switch' handles.", "weight": 1.5, "threshold": 0.65},
                {"rule_name": "Unregistered Bill Pay Apps", "rule_code": "TEL_BILLPAY_MISMATCH", "description": "Detects third-party recharge apps mimicking operator payment screens.", "weight": 1.3, "threshold": 0.75}
            ]
        },
        {
            "id": "government",
            "name": "Government Digital Services",
            "description": "Defense for public sector services, national citizen portals, subsidy schemes, and digital governance identity trust.",
            "icon": "Building2",
            "threat_categories": [
                "Fake Welfare Scheme Pages",
                "Impersonated Department Accounts",
                "Suspicious Public-Service Apps",
                "Fraudulent Benefit Grant Portals",
                "Unofficial Identity Document Assistants"
            ],
            "recommended_checklist": [
                "Verify whether domain resolves to authorized government TLD (.gov / .nic / .mil).",
                "Inspect mobile app for unauthorized national emblem or coat of arms usage.",
                "Coordinate urgent emergency takedown with National Cyber Crime Reporting Portal.",
                "Issue official government press clarification warning citizens."
            ],
            "rules": [
                {"rule_name": "Department & Yojana Name Lookalikes", "rule_code": "GOV_SCHEME_LOOKALIKE", "description": "Detects close naming matches to official ministries and welfare programs.", "weight": 1.4, "threshold": 0.70},
                {"rule_name": "Direct Benefit Subsidy Lures", "rule_code": "GOV_SUBSIDY_BAIT", "description": "Flags handles offering 'instant cash subsidy', 'ration card approval'.", "weight": 1.5, "threshold": 0.60},
                {"rule_name": "Unofficial Identity Service Apps", "rule_code": "GOV_UNAUTH_CITIZEN_APP", "description": "Catches unauthorized apps requesting biometric or citizen ID uploads.", "weight": 1.6, "threshold": 0.70}
            ]
        }
    ]

    for sc in sectors_config:
        sector_id = sc["id"]
        sec = db.query(Sector).filter(Sector.id == sector_id).first()
        if not sec:
            sec = Sector(
                id=sector_id,
                name=sc["name"],
                description=sc["description"],
                icon=sc["icon"],
                threat_categories=sc["threat_categories"],
                recommended_checklist=sc["recommended_checklist"],
                is_custom=False,
                is_active=True
            )
            db.add(sec)
            db.flush()

        # Add rules
        for r in sc["rules"]:
            existing_rule = db.query(SectorRule).filter(
                SectorRule.sector_id == sector_id,
                SectorRule.rule_code == r["rule_code"]
            ).first()
            if not existing_rule:
                db.add(SectorRule(
                    sector_id=sector_id,
                    rule_name=r["rule_name"],
                    rule_code=r["rule_code"],
                    description=r["description"],
                    weight=r["weight"],
                    threshold=r["threshold"],
                    is_enabled=True
                ))
    db.flush()

    # 4. Fictional Protected Brands for Each Sector
    brands_data = [
        # Banking
        {
            "name": "Apex Bank & Trust",
            "sector_id": "banking",
            "description": "Leading tier-1 digital bank offering premier wealth management, mobile retail banking, and commercial lending solutions.",
            "official_website": "https://www.apexbanktrust.com",
            "approved_domains": ["apexbanktrust.com", "apex-online.com", "apexinvest.com"],
            "official_developer": "Apex Financial Corporation Ltd.",
            "aliases": ["Apex Bank", "ApexTrust", "Apex Mobile Bank"],
            "keywords": ["banking", "transfer", "loan", "support", "kyc", "card"],
            "social": [
                {"platform": "Twitter", "handle": "ApexBankTrust", "profile_url": "https://twitter.com/ApexBankTrust", "is_primary": True},
                {"platform": "LinkedIn", "handle": "apex-bank-trust", "profile_url": "https://linkedin.com/company/apex-bank-trust", "is_primary": False}
            ],
            "apps": [
                {"app_name": "Apex Mobile Banking", "store": "Google Play", "package_id": "com.apexbank.mobile", "app_url": "https://play.google.com/store/apps/details?id=com.apexbank.mobile", "developer_name": "Apex Financial Corporation Ltd."},
                {"app_name": "Apex Mobile Banking", "store": "Apple App Store", "package_id": "com.apexbank.ios", "app_url": "https://apps.apple.com/app/apex-mobile-banking/id145293048", "developer_name": "Apex Financial Corporation Ltd."}
            ],
            "approved": [
                {"asset_type": "social", "identifier": "ApexCareHQ", "reason": "Authorized secondary emergency support Twitter handle.", "approved_by": "sarah.chen"}
            ]
        },
        # E-commerce
        {
            "name": "NovaCart Retail",
            "sector_id": "ecommerce",
            "description": "Global multi-vendor e-commerce marketplace delivering electronics, apparel, and fast consumer goods.",
            "official_website": "https://www.novacart.com",
            "approved_domains": ["novacart.com", "novacart-delivery.com", "novacartpay.com"],
            "official_developer": "NovaCart Global Technologies Inc.",
            "aliases": ["NovaCart", "NovaShop", "Nova Marketplace"],
            "keywords": ["shopping", "deals", "delivery", "orders", "sale", "discounts"],
            "social": [
                {"platform": "Instagram", "handle": "novacart_official", "profile_url": "https://instagram.com/novacart_official", "is_primary": True},
                {"platform": "Facebook", "handle": "NovaCartGlobal", "profile_url": "https://facebook.com/NovaCartGlobal", "is_primary": False}
            ],
            "apps": [
                {"app_name": "NovaCart Shopping App", "store": "Google Play", "package_id": "com.novacart.app", "app_url": "https://play.google.com/store/apps/details?id=com.novacart.app", "developer_name": "NovaCart Global Technologies Inc."}
            ],
            "approved": [
                {"asset_type": "social", "identifier": "novacart_deals_hub", "reason": "Approved official affiliate promo account.", "approved_by": "marcus.vance"}
            ]
        },
        # Education
        {
            "name": "Horizon State University",
            "sector_id": "education",
            "description": "Public research university offering undergraduate, postgraduate, and accredited distance learning degree programs.",
            "official_website": "https://www.horizonstate.edu",
            "approved_domains": ["horizonstate.edu", "horizon-admissions.edu", "horizonportal.edu"],
            "official_developer": "Horizon State University IT Services",
            "aliases": ["Horizon State", "HSU", "Horizon University"],
            "keywords": ["admission", "student", "scholarship", "exam", "fees", "portal"],
            "social": [
                {"platform": "Twitter", "handle": "HorizonStateUni", "profile_url": "https://twitter.com/HorizonStateUni", "is_primary": True},
                {"platform": "YouTube", "handle": "HorizonStateOfficial", "profile_url": "https://youtube.com/@HorizonStateOfficial", "is_primary": False}
            ],
            "apps": [
                {"app_name": "Horizon Student Portal", "store": "Google Play", "package_id": "edu.horizonstate.studentapp", "app_url": "https://play.google.com/store/apps/details?id=edu.horizonstate.studentapp", "developer_name": "Horizon State University IT Services"}
            ],
            "approved": []
        },
        # Telecom
        {
            "name": "Vortex Mobile & Fiber",
            "sector_id": "telecom",
            "description": "National telecommunications operator providing 5G mobile networks, broadband fiber, and enterprise cloud connectivity.",
            "official_website": "https://www.vortexmobile.com",
            "approved_domains": ["vortexmobile.com", "vortex-recharge.com", "vortexfiber.com"],
            "official_developer": "Vortex Telecom Group Ltd.",
            "aliases": ["Vortex Mobile", "Vortex Telecom", "Vortex 5G"],
            "keywords": ["recharge", "sim", "5g", "customer care", "broadband", "network"],
            "social": [
                {"platform": "Twitter", "handle": "VortexMobileCare", "profile_url": "https://twitter.com/VortexMobileCare", "is_primary": True},
                {"platform": "Facebook", "handle": "VortexMobileOfficial", "profile_url": "https://facebook.com/VortexMobileOfficial", "is_primary": False}
            ],
            "apps": [
                {"app_name": "My Vortex SelfCare & Recharge", "store": "Google Play", "package_id": "com.vortex.selfcare", "app_url": "https://play.google.com/store/apps/details?id=com.vortex.selfcare", "developer_name": "Vortex Telecom Group Ltd."}
            ],
            "approved": []
        },
        # Government
        {
            "name": "Aadara Citizen Services",
            "sector_id": "government",
            "description": "Unified national digital platform for citizen identity verification, public welfare schemes, and direct benefit transfers.",
            "official_website": "https://www.aadara.gov.in",
            "approved_domains": ["aadara.gov.in", "services.aadara.gov.in", "benefits.aadara.gov.in"],
            "official_developer": "National Digital Governance Agency",
            "aliases": ["Aadara Portal", "Aadara Services", "Aadara National"],
            "keywords": ["yojana", "scheme", "subsidy", "citizen", "identity", "pension"],
            "social": [
                {"platform": "Twitter", "handle": "AadaraGovOfficial", "profile_url": "https://twitter.com/AadaraGovOfficial", "is_primary": True}
            ],
            "apps": [
                {"app_name": "Aadara Citizen Mobile", "store": "Google Play", "package_id": "in.gov.aadara.citizen", "app_url": "https://play.google.com/store/apps/details?id=in.gov.aadara.citizen", "developer_name": "National Digital Governance Agency"}
            ],
            "approved": []
        }
    ]

    brand_map = {}
    for bd in brands_data:
        b_name = bd["name"]
        brand = db.query(Brand).filter(Brand.name == b_name).first()
        if not brand:
            brand = Brand(
                name=b_name,
                sector_id=bd["sector_id"],
                description=bd["description"],
                official_website=bd["official_website"],
                approved_domains=bd["approved_domains"],
                official_developer=bd["official_developer"],
                aliases=bd["aliases"],
                keywords=bd["keywords"],
                monitoring_status="active"
            )
            db.add(brand)
            db.flush()

            # Add official social assets
            for sa in bd.get("social", []):
                db.add(OfficialSocialAsset(
                    brand_id=brand.id,
                    platform=sa["platform"],
                    handle=sa["handle"],
                    profile_url=sa["profile_url"],
                    is_primary=sa["is_primary"]
                ))

            # Add official app assets
            for aa in bd.get("apps", []):
                db.add(OfficialAppAsset(
                    brand_id=brand.id,
                    app_name=aa["app_name"],
                    store=aa["store"],
                    package_id=aa["package_id"],
                    app_url=aa["app_url"],
                    developer_name=aa["developer_name"]
                ))

            # Add approved assets
            for app_asset in bd.get("approved", []):
                db.add(ApprovedAsset(
                    brand_id=brand.id,
                    asset_type=app_asset["asset_type"],
                    identifier=app_asset["identifier"],
                    reason=app_asset["reason"],
                    approved_by=app_asset["approved_by"]
                ))
            db.flush()

        brand_map[brand.sector_id] = brand
    db.commit()

    # 5. Synthetic Candidates (Social & App) for all 5 sectors
    # Includes:
    # - Legitimate official accounts/apps (to verify Exclusion mechanism)
    # - High-risk lookalike impersonators
    # - Fake customer care bait
    # - Cloned apps with publisher mismatch
    # - Predatory loan apps
    # - Candidates with missing metadata
    # - Similar-name false positives

    # Banking candidates
    b_brand = brand_map["banking"]
    social_candidates_data = [
        # Sector: Banking
        # Candidate 1: Exact official social account (Must be EXCLUDED)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "platform": "Twitter",
            "display_name": "Apex Bank & Trust Official", "handle": "ApexBankTrust",
            "profile_url": "https://twitter.com/ApexBankTrust",
            "description": "Official verified account of Apex Bank & Trust. Member FDIC. Never share your PIN or OTP.",
            "source_type": "demo"
        },
        # Candidate 2: Analyst approved whitelist handle (Must be EXCLUDED)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "platform": "Twitter",
            "display_name": "Apex Care Headquarters", "handle": "ApexCareHQ",
            "profile_url": "https://twitter.com/ApexCareHQ",
            "description": "Authorized emergency response desk for Apex customers.",
            "source_type": "demo"
        },
        # Candidate 3: Malicious Fake Customer Care (Critical / High)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "platform": "Twitter",
            "display_name": "Apex Bank Customer Care 24x7 Help", "handle": "apexbank_24x7care",
            "profile_url": "https://twitter.com/apexbank_24x7care",
            "description": "Official 24/7 Helpline for Apex Bank users. Instant refund, KYC update, transaction issue. WhatsApp us: +91-98888-00000.",
            "source_type": "demo"
        },
        # Candidate 4: Lookalike typo profile (High)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "platform": "Telegram",
            "display_name": "ApexBank Official Loan Desk", "handle": "apexbank_official_loans",
            "profile_url": "https://t.me/apexbank_official_loans",
            "description": "Get instant personal loan from Apex Bank in 5 minutes without documentation. DM admin.",
            "source_type": "demo"
        },
        # Candidate 5: Benign similar name / False positive candidate (Low/Medium)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "platform": "Twitter",
            "display_name": "Apex Mountain Biking Gear", "handle": "apexmountainbikes",
            "profile_url": "https://twitter.com/apexmountainbikes",
            "description": "Custom mountain bikes, outdoor adventure gear, and trail repair tips.",
            "source_type": "demo"
        },
        # Sector: E-commerce
        # Candidate 6: Whitelisted affiliate (Must be EXCLUDED)
        {
            "brand_id": brand_map["ecommerce"].id, "sector_id": "ecommerce", "platform": "Twitter",
            "display_name": "NovaCart Deals Hub", "handle": "novacart_deals_hub",
            "profile_url": "https://twitter.com/novacart_deals_hub",
            "description": "Curated daily deals from verified NovaCart merchants.",
            "source_type": "demo"
        },
        # Candidate 7: Fake 90% Sale Page (High)
        {
            "brand_id": brand_map["ecommerce"].id, "sector_id": "ecommerce", "platform": "Instagram",
            "display_name": "NovaCart Clearance Outlet", "handle": "novacart_outlet_sale",
            "profile_url": "https://instagram.com/novacart_outlet_sale",
            "description": "NovaCart 90% clearance sale! iPhone 15 & designer luxury bags at massive discounts. Order via DM now.",
            "source_type": "demo"
        },
        # Sector: Education
        # Candidate 8: Fake Admission Desk (High)
        {
            "brand_id": brand_map["education"].id, "sector_id": "education", "platform": "Facebook",
            "display_name": "Horizon State University Admission Cell", "handle": "HorizonStateAdmissions2026",
            "profile_url": "https://facebook.com/HorizonStateAdmissions2026",
            "description": "Direct management quota admissions for Horizon State University 2026 batch. Pay seat booking fee via UPI to secure seat.",
            "source_type": "demo"
        },
        # Sector: Telecom
        # Candidate 9: Fake 5G recharge scam (High)
        {
            "brand_id": brand_map["telecom"].id, "sector_id": "telecom", "platform": "Twitter",
            "display_name": "Vortex Mobile 5G Free Recharge", "handle": "vortex_free_5g",
            "profile_url": "https://twitter.com/vortex_free_5g",
            "description": "Celebrating 100 Million subscribers! Claim 1 year free unlimited 5G data from Vortex. Click bit.ly/vortex-5g-bonus to activate.",
            "source_type": "demo"
        },
        # Sector: Government
        # Candidate 10: Fake subsidy scheme (Critical)
        {
            "brand_id": brand_map["government"].id, "sector_id": "government", "platform": "Telegram",
            "display_name": "Aadara Direct Benefit Scheme 2026", "handle": "aadara_yojana_portal",
            "profile_url": "https://t.me/aadara_yojana_portal",
            "description": "Government citizen grant of Rs 50,000 for all Aadara portal card holders. Submit your biometric Aadhaar number immediately.",
            "source_type": "demo"
        }
    ]

    for sc_data in social_candidates_data:
        existing = db.query(SocialCandidate).filter(
            SocialCandidate.handle == sc_data["handle"],
            SocialCandidate.platform == sc_data["platform"]
        ).first()
        if not existing:
            cand = SocialCandidate(
                platform=sc_data["platform"],
                display_name=sc_data["display_name"],
                handle=sc_data["handle"],
                profile_url=sc_data["profile_url"],
                description=sc_data["description"],
                brand_id=sc_data["brand_id"],
                sector_id=sc_data["sector_id"],
                source_type=sc_data["source_type"],
                first_seen=utc_now() - timedelta(days=3),
                last_seen=utc_now()
            )
            db.add(cand)
            db.flush()
            # Run detection analysis immediately
            brand = db.query(Brand).filter(Brand.id == sc_data["brand_id"]).first()
            analyze_social_candidate(cand, brand, db)

    # Mobile App Candidates
    app_candidates_data = [
        # Banking App 1: Official App (Must be EXCLUDED)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "app_name": "Apex Mobile Banking",
            "store": "Google Play", "package_id": "com.apexbank.mobile",
            "app_url": "https://play.google.com/store/apps/details?id=com.apexbank.mobile",
            "developer_name": "Apex Financial Corporation Ltd.",
            "description": "Secure mobile banking from Apex Financial Corporation Ltd.",
            "source_type": "demo"
        },
        # Banking App 2: Fake Predatory Loan App with publisher mismatch (Critical)
        {
            "brand_id": b_brand.id, "sector_id": "banking", "app_name": "Apex Fast Loan - Instant Cash",
            "store": "Third-Party APK Mirror", "package_id": "com.apexloans.instantcash.android",
            "app_url": "https://apk-mirror-store.xyz/app/apex-fast-loan",
            "developer_name": "Quick Rupee Capital Studio",
            "description": "Get instant loans up to 500,000 using your Apex Bank credentials. Fast approval with low interest.",
            "source_type": "demo"
        },
        # E-commerce App 3: Cloned store app (High)
        {
            "brand_id": brand_map["ecommerce"].id, "sector_id": "ecommerce", "app_name": "NovaCart Mobile Shopping Store",
            "store": "Google Play", "package_id": "com.novacart.shopping.deals",
            "app_url": "https://play.google.com/store/apps/details?id=com.novacart.shopping.deals",
            "developer_name": "Global Shopping Apps LLC",
            "description": "Browse all NovaCart deals, discounts, and flash sales in one easy shopping app.",
            "source_type": "demo"
        },
        # Education App 4: Fake fee payment portal (High)
        {
            "brand_id": brand_map["education"].id, "sector_id": "education", "app_name": "Horizon University Fee & Exam Portal",
            "store": "Google Play", "package_id": "org.horizonstate.feeportal",
            "app_url": "https://play.google.com/store/apps/details?id=org.horizonstate.feeportal",
            "developer_name": "Campus Edu Solutions Pvt Ltd",
            "description": "Pay semester exam fees and download hall tickets for Horizon State University.",
            "source_type": "demo"
        },
        # Telecom App 5: Fake recharge app (High)
        {
            "brand_id": brand_map["telecom"].id, "sector_id": "telecom", "app_name": "Vortex Quick Recharge & 5G Data",
            "store": "GetJar / Third-Party", "package_id": "com.vortex.recharge.freeplan",
            "app_url": "https://getjar.com/app/vortex-quick-recharge",
            "developer_name": "Mobile Recharge Developers",
            "description": "Fast recharge app for Vortex Mobile subscribers. Claim free cashback and 5G vouchers.",
            "source_type": "demo"
        },
        # Government App 6: Fake citizen document assistant (Critical)
        {
            "brand_id": brand_map["government"].id, "sector_id": "government", "app_name": "Aadara Portal - Digital Scheme Assistant",
            "store": "APK Pure", "package_id": "com.aadara.citizen.yojana.app",
            "app_url": "https://apkpure.com/aadara-portal-scheme",
            "developer_name": "Digital Bharat App Tech",
            "description": "Apply for all Aadara citizen welfare schemes and pensions online directly from your smartphone.",
            "source_type": "demo"
        }
    ]

    for ac_data in app_candidates_data:
        existing = db.query(AppCandidate).filter(
            AppCandidate.package_id == ac_data["package_id"],
            AppCandidate.store == ac_data["store"]
        ).first()
        if not existing:
            cand = AppCandidate(
                app_name=ac_data["app_name"],
                store=ac_data["store"],
                package_id=ac_data["package_id"],
                app_url=ac_data["app_url"],
                developer_name=ac_data["developer_name"],
                description=ac_data["description"],
                brand_id=ac_data["brand_id"],
                sector_id=ac_data["sector_id"],
                source_type=ac_data["source_type"],
                first_seen=utc_now() - timedelta(days=2),
                last_seen=utc_now()
            )
            db.add(cand)
            db.flush()
            brand = db.query(Brand).filter(Brand.id == ac_data["brand_id"]).first()
            analyze_app_candidate(cand, brand, db)

    db.commit()

    # 6. Pre-populate Some Case Notes & Review Statuses for Realism
    # Find the critical predatory loan finding
    predatory_loan_finding = db.query(Finding).filter(
        Finding.threat_category == "Predatory / Fake Loan Application"
    ).first()
    if predatory_loan_finding and not predatory_loan_finding.notes:
        predatory_loan_finding.status = "Needs Review"
        predatory_loan_finding.assigned_analyst = "sarah.chen"
        db.add(ReviewNote(
            finding_id=predatory_loan_finding.id,
            author="sarah.chen",
            content="Discovered predatory APK distributing on third-party mirror. Package contains unauthorized loan terms and requests SMS read permissions. Initiated brand abuse ticket #DRP-9021."
        ))
        db.add(ReviewHistory(
            finding_id=predatory_loan_finding.id,
            previous_status="New",
            new_status="Needs Review",
            analyst="sarah.chen",
            notes="Assigned case for forensic APK decompilation and takedown notice."
        ))

    fake_support_finding = db.query(Finding).filter(
        Finding.threat_category == "Fake Customer Support Impersonation"
    ).first()
    if fake_support_finding and not fake_support_finding.notes:
        fake_support_finding.status = "Confirmed Impersonation"
        fake_support_finding.assigned_analyst = "marcus.vance"
        db.add(ReviewNote(
            finding_id=fake_support_finding.id,
            author="marcus.vance",
            content="Confirmed active fraud campaign. Account is actively soliciting customer account numbers in public replies. Takedown requested via Twitter/X Trust & Safety portal."
        ))
        db.add(ReviewHistory(
            finding_id=fake_support_finding.id,
            previous_status="New",
            new_status="Confirmed Impersonation",
            analyst="marcus.vance",
            notes="Evidence package exported and submitted to platform legal team."
        ))

    # 7. Threat Intelligence Graph Relationships (cross-entity correlation)
    # E.g. connect Apex Bank to Fake Support handle and Predatory loan app with explicit evidence!
    existing_rels = db.query(ThreatRelationship).count()
    if existing_rels == 0:
        relationships = [
            {
                "source_entity_type": "brand",
                "source_entity_id": f"brand_{b_brand.id}",
                "source_label": b_brand.name,
                "target_entity_type": "social",
                "target_entity_id": "social_fake_support",
                "target_label": "@apexbank_24x7care (Twitter)",
                "relationship_type": "IMPERSONATION_TARGET",
                "evidence_summary": "High-risk customer care handle mimicked bank name and solicited user credentials.",
                "confidence_score": 0.88,
                "sector_id": "banking"
            },
            {
                "source_entity_type": "brand",
                "source_entity_id": f"brand_{b_brand.id}",
                "source_label": b_brand.name,
                "target_entity_type": "app",
                "target_entity_id": "app_fake_loan",
                "target_label": "Apex Fast Loan - Instant Cash",
                "relationship_type": "UNAUTHORIZED_CLONE",
                "evidence_summary": "Predatory loan app mimicking Apex Bank trademark with mismatched publisher 'Quick Rupee Capital Studio'.",
                "confidence_score": 0.94,
                "sector_id": "banking"
            },
            {
                "source_entity_type": "app",
                "source_entity_id": "app_fake_loan",
                "source_label": "Apex Fast Loan - Instant Cash",
                "target_entity_type": "domain",
                "target_entity_id": "domain_apk_mirror",
                "target_label": "apk-mirror-store.xyz",
                "relationship_type": "HOSTED_ON_UNVERIFIED_DOMAIN",
                "evidence_summary": "Distributed via unverified APK mirror outside approved Google Play / Apple app stores.",
                "confidence_score": 0.85,
                "sector_id": "banking"
            },
            {
                "source_entity_type": "brand",
                "source_entity_id": f"brand_{brand_map['ecommerce'].id}",
                "source_label": brand_map['ecommerce'].name,
                "target_entity_type": "social",
                "target_entity_id": "social_novacart_outlet",
                "target_label": "@novacart_outlet_sale (Instagram)",
                "relationship_type": "IMPERSONATION_TARGET",
                "evidence_summary": "Fraudulent clearance sale handle offering 90% discount bait using official logos.",
                "confidence_score": 0.82,
                "sector_id": "ecommerce"
            },
            {
                "source_entity_type": "brand",
                "source_entity_id": f"brand_{brand_map['government'].id}",
                "source_label": brand_map['government'].name,
                "target_entity_type": "social",
                "target_entity_id": "social_aadara_yojana",
                "target_label": "@aadara_yojana_portal (Telegram)",
                "relationship_type": "CRITICAL_FRAUD_SCHEME",
                "evidence_summary": "Phishing citizen grants and soliciting biometric identification on Telegram channel.",
                "confidence_score": 0.96,
                "sector_id": "government"
            }
        ]
        for rel in relationships:
            db.add(ThreatRelationship(**rel, is_synthetic=True))

    db.commit()
    print("Database seeding completed successfully.")
