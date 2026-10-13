# SentinelX — Digital Risk Protection (Social & App Monitoring)
## Presentation & Pitch Slide Deck (Kampus.VC Challenge)

---

### Slide 1: Title & Executive Summary
* **Platform Name:** SentinelX
* **Tagline:** One Platform. Five Sectors. Smarter Digital Protection.
* **Challenge:** Digital Risk Protection – Social & App Monitoring
* **Team:** Full-Stack Applied AI & Cybersecurity Engineering
* **Mission:** Protecting organizations against lookalike profiles, fake customer care, cloned storefronts, and rogue mobile applications across 5 core industry sectors.

---

### Slide 2: The Core Problem & Innovation
* **The Problem:**
  * Attackers rapidly deploy lookalike social handles and clone APKs on third-party stores to steal user credentials and financial data.
  * Existing tools generate massive alert fatigue because they flag the brand's own regional or marketing accounts.
* **Our Core Innovation:**
  * **Brand Identity Fingerprinting:** Defines ground truth (official handles, package IDs, domains).
  * **Tier 1 Exclusion Gatekeeper:** Automatic 0.0 risk score for verified official assets (zero false positives).
  * **Tier 2 Multi-Signal Engine:** RapidFuzz token matching + publisher mismatch verification + sector threat keywords + embedded ML model (`fake_detection_model.pkl`).

---

### Slide 3: System Architecture & Data Flow
* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Recharts (Fully responsive from 320px to 1440px+).
* **Backend:** FastAPI (Python 3.12) + SQLAlchemy ORM 2.0 + SQLite (`sentinelx.db`).
* **AI / ML Pipeline:** scikit-learn Pipeline with `TfidfVectorizer` + `OneHotEncoder` + `LogisticRegression` loaded via `joblib`.
* **Data Sources:** Multi-channel simulated ingestion (Social feeds, APK Pure / Google Play stores, Certificate Transparency).

---

### Slide 4: Feature Breakdown — Social & App Monitoring
* **Social Media Monitoring (30% Criteria):**
  * Detects brand impersonation, fake support accounts, and deceptive bios across Twitter/X, Instagram, Telegram, LinkedIn.
  * Real-time `🤖 FAKE (XX%)` AI prediction badges.
  * Official accounts excluded automatically.
* **App Store Monitoring (30% Criteria):**
  * Detects unapproved mobile apps and third-party mirrors.
  * **Publisher Mismatch Detection:** Compares developer name against legal registered entity.
  * Mimicked package ID analysis (`com.apexloans.instantcash`).
  * Official APK packages excluded automatically.

---

### Slide 5: Bonus Credit — Look-Alike Name Detection
* **Character Swaps & Leetspeak:** Handles homoglyphs (`0` $\leftrightarrow$ `o`, `@` $\leftrightarrow$ `a`, `1` $\leftrightarrow$ `l`).
* **Spacing Changes & Punctuation:** Normalizes whitespace and delimiters (`apex-bank` vs `apexbank`).
* **Token Containment:** RapidFuzz `token_set_ratio` isolates brand stems even when padded with extra words like `support`, `care`, `official`.
* **Over-flagging Prevention:** Verified official assets bypass scoring via ground-truth exclusion.

---

### Slide 6: Live Product Showcase & Metrics
* **100% Working Prototype:** Live on `http://localhost:5173` with backend on `http://127.0.0.1:8000`.
* **15/15 Automated Integration Tests Passing:** Verifies official asset exclusions, scoring formulas, and ML predictions.
* **Full Case Management:** Investigation queue, transparent evidence tree, case notes, auto-whitelisting, and RFC-compliant CSV report exports.
