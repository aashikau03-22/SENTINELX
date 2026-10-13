# SentinelX — Multi-Sector Digital Risk Protection Platform

> **Tagline:** One Platform. Five Sectors. Smarter Digital Protection.

SentinelX is an enterprise-grade cybersecurity web platform designed to identify, correlate, and triage digital brand threats across five critical industry sectors:
1. **Banking & FinTech** (bank impersonation, predatory loan apps, payment clones)
2. **E-commerce & Online Shopping** (cloned storefronts, counterfeit merchants, flash sale bait)
3. **Education & Universities** (fake admission desks, scholarship scams, student app clones)
4. **Telecom & Mobile Networks** (fake support accounts, unauthorized recharge apps, SIM swap lures)
5. **Government Digital Services** (fake citizen welfare portals, yojana schemes, document phishers)
6. **Custom Sector Builder** (dynamically add new sectors such as Healthcare or Aviation without code changes)

Built with a unified, config-driven detection engine, persistent SQLite database, explainable heuristic scoring, and a modern responsive React interface.

---

## Architecture Summary

* **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router, Lucide React, Recharts, Axios.
* **Backend:** Python 3.12+, FastAPI, Uvicorn, SQLAlchemy ORM 2.0, Pydantic V2, RapidFuzz, scikit-learn, Pillow.
* **Database:** SQLite (local persistent `sentinelx.db` with auto-table generation and idempotent demo seeding).
* **Test Suite:** pytest with 13 comprehensive unit/integration tests.

---

## Windows Quick-Start Guide (Step-by-Step)

### Prerequisites

* **Python 3.12+** installed on Windows.
* **Node.js v20+** and npm installed on Windows.
* Git / PowerShell / Command Prompt.

---

### Method A: One-Click Convenience Startup (Recommended)

From the project root directory (`sentinelx`):

**Option 1: Windows Batch File**
Double-click `run_sentinelx.bat` or run:
```cmd
run_sentinelx.bat
```

**Option 2: PowerShell Script**
```powershell
.\start_sentinelx.ps1
```

Both services will open in dedicated windows and launch automatically!

---

### Method B: Manual Step-by-Step Terminal Setup

#### Step 1: Clone or Navigate to Project
```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\sentinelx
```

#### Step 2: Set Up Backend Virtual Environment
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

#### Step 3: Install Backend Dependencies
```powershell
.\venv\Scripts\pip.exe install -r requirements.txt
```

#### Step 4: Start the FastAPI Backend
```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the SQLite database and auto-seeds the 5 demonstration sectors upon startup!
* API Endpoint: **`http://127.0.0.1:8000`**
* Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**

#### Step 5: Set Up Frontend (In a New Terminal)
```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\sentinelx\frontend
npm.cmd install
```

#### Step 6: Start React Development Server
```powershell
npm.cmd run dev
```
Open your browser at: **`http://localhost:5173`**

---

### Step 7: Running Backend Tests

In the `backend` directory with the virtual environment activated:
```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\sentinelx\backend
.\venv\Scripts\pytest.exe -v
```

**Test Coverage (13 Passing Tests):**
* `test_health_check` — Verifies API health and versioning.
* `test_sectors_list_and_stats` — Validates all 5 default sectors and metric aggregations.
* `test_custom_sector_creation` — Tests custom sector registration and rule assignment.
* `test_brands_crud` & `test_create_brand` — CRUD operations and identity assets.
* `test_official_social_asset_exclusion` — **MANDATORY**: Exact official handle match excluded (Risk 0.0, Low severity).
* `test_official_app_asset_exclusion` — **MANDATORY**: Exact official package ID match excluded (Risk 0.0, Low severity).
* `test_suspicious_social_detection` — RapidFuzz fuzzy match and sector keywords detection.
* `test_publisher_mismatch_app_detection` — Detection of rogue APK with developer deviation.
* `test_idempotent_seeding` — Verifies seed process can be run repeatedly without duplicating records.
* `test_investigation_status_update` — Status transition and audit trail recording.
* `test_findings_csv_export` — CSV download formatting and headers.
* `test_threat_graph_endpoint` — Validates graph node entities and evidence-backed edges.

---

### Step 8: Building Frontend for Production

In the `frontend` directory:
```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\sentinelx\frontend
npm.cmd run build
```
Generates an optimized, minified production build in `frontend/dist/`.

---

## Key Features & Product Design

### 1. Mandatory False-Positive Control & Official Asset Exclusion
Before computing risk scores, every candidate is compared against the brand's verified **Identity Fingerprint**:
* Exact match with official social handles or URLs -> Marked **Official / Excluded**, Risk 0.0, Severity Low.
* Exact match with registered application package IDs -> Marked **Official / Excluded**, Risk 0.0, Severity Low.
* Match against analyst-approved whitelists -> Excluded.
* Excluded records are stored with full rationale and filtered out of actionable threat tallies.

### 2. Explainable Heuristic Risk Scoring
Risk scores are **heuristic indicators**, not black-box predictions:
* **Name Similarity (35%)**: RapidFuzz ratio, token sort, and containment.
* **Developer / Publisher Verification (25%)**: Legal publisher match vs deviation.
* **Package Identifier Mimicry (20%)**: Trademark embedding in rogue package IDs.
* **Sector Threat Bait (20%)**: Deceptive keywords ("instant loan", "refund helpline", "subsidy grant").
* **Severity Bands**: Low (0-34), Medium (35-59), High (60-79), Critical (80-100).
* Missing metadata is marked as unknown and never penalized.

### 3. Interactive Threat Intelligence Graph
Connects protected brands, rogue profiles, mobile APKs, developers, and hosting domains with clickable evidence links.

### 4. Custom Sector Builder
Administrators can register new industry verticals (e.g., Healthcare, Aviation) with custom detection rules and checklists. New sectors dynamically integrate into all monitoring pages and APIs without writing new code.

---

## Troubleshooting Guide

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `npm : File cannot be loaded because running scripts is disabled` | PowerShell ExecutionPolicy blocks `.ps1` | Use `npm.cmd` instead of `npm`, or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`. |
| Port 8000 already in use | Another service is using port 8000 | Run on port 8001: `uvicorn app.main:app --port 8001` and update `frontend/.env` `VITE_API_URL`. |
| CORS Network Error in Frontend | Backend is offline or origin not whitelisted | Ensure FastAPI is running on `http://127.0.0.1:8000`. Check `app/core/config.py` CORS origins. |
| Database schema changes | Schema updated | SQLite file `sentinelx.db` can be removed to auto-reseed fresh tables on startup. |

---

## Production Limitations & Security Disclosure

1. **Demonstration Mode:** All initial candidates and brand threats in the default dataset are synthetic and for demonstration purposes. SentinelX does not claim unauthorized live surveillance without commercial API credentials.
2. **External Data Connectors:** Live ingestion from Twitter/X API v2, Meta Graph, or Google Play Scrapers requires enterprise API keys and rate limit provisioning.
3. **Takedown Escalation:** SentinelX generates evidence dossiers and CSV packages; it does not trigger automatic destructive takedowns without human analyst sign-off.
