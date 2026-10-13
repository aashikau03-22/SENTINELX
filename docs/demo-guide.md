# SentinelX — Platform Demonstration Walkthrough Guide

Follow this guided tour to evaluate all core features of **SentinelX — Multi-Sector Digital Risk Protection Platform**.

---

## 1. Global Overview Dashboard (`http://localhost:5173/`)
1. Observe the top-level **KPI Cards** dynamically loaded from the database:
   * Protected Brands, Total Candidates Analysed, Potential Threat Findings, High/Critical Findings, Awaiting Review, Resolved Findings.
2. Review the **Five Prominent Sector Cards**:
   * Banking & FinTech (Bank impersonation, fake loan apps)
   * E-commerce & Online Shopping (Cloned store pages, fake deals)
   * Education & Universities (Fake admission desks, fee scams)
   * Telecom & Mobile Networks (SIM swap abuse, recharge clones)
   * Government Digital Services (Yojana grant phishing, unauthorized apps)
3. Click the **"Monitor Threats"** button on the **Banking & FinTech** card.

---

## 2. Sector Dashboard (`/sector/banking`)
1. Observe the domain-specific metrics, threat categories, and target brands.
2. Switch to the **Configurable Detection Rules** tab:
   * Toggle any rule on/off (e.g., `BANK_SUPPORT_KEYWORDS`).
   * Drag the threshold slider to adjust detection sensitivity.
3. Switch to the **Investigation Checklist** tab and check off standard triage steps.
4. Click **"Export Sector CSV"** to verify RFC-compliant CSV generation.

---

## 3. Brand Profile & Identity Fingerprint (`/brands`)
1. Click **"Brand Profiles"** in the sidebar.
2. Select **Apex Bank & Trust** and click **"Identity Dossier"**:
   * Observe registered verified domains (`apexbanktrust.com`).
   * View verified social handles (`@ApexBankTrust`).
   * View authorized mobile apps (`com.apexbank.mobile`).
3. Click **"Register New Brand"** to test live CRUD creation with validation.

---

## 4. False-Positive Control & Official Asset Exclusion Verification
1. Navigate to **Social Threat Monitor** (`/social-monitor`).
2. Search for `@ApexBankTrust`:
   * Notice that it is clearly flagged as **Official / Excluded** (Risk: 0.0, Severity: Low, Status: Resolved).
   * It is excluded from suspicious threat counts, proving false-positive elimination.
3. Observe suspicious profiles (e.g., `@apexbank_24x7care`):
   * Flagged as **Critical (86.8)** under **Fake Customer Support Impersonation**.

---

## 5. Mobile App Store Threat Monitor (`/app-monitor`)
1. View rogue applications detected across Google Play and third-party mirrors.
2. Notice `Apex Fast Loan - Instant Cash` (`com.apexloans.instantcash.android`):
   * Publisher Mismatch detected: Registered publisher is `Apex Financial Corporation Ltd.`, but candidate is published by `Quick Rupee Capital Studio`.
   * Click **"Analyze Mobile App"** to simulate and evaluate any custom APK package ID in real time.

---

## 6. Threat Intelligence Graph (`/threat-graph`)
1. Navigate to **Threat Intelligence Graph**.
2. Inspect the interactive network connecting:
   * Protected Brand (Apex Bank)
   * Rogue Social Profile (`@apexbank_24x7care`)
   * Predatory Loan App (`com.apexloans.instantcash`)
   * Unverified APK Mirror Domain (`apk-mirror-store.xyz`)
3. Click any node to open the **Entity Intelligence Dossier** and read the verified relationship evidence.

---

## 7. Investigation Queue & Case Dossier (`/investigations`)
1. Click **"Investigation Queue"**.
2. Click **"Open Dossier"** on any finding:
   * View the transparent score breakdown across all heuristic signals (Name Similarity, Developer Mismatch, Sector Keywords).
   * Update status from `New` to `Confirmed Impersonation`.
   * Add reviewer notes (e.g., `Submitted takedown request via registrar`).
   * View the real-time audit history log.

---

## 8. Custom Sector Builder (`/custom-sector`)
1. Navigate to **Custom Sector Builder**.
2. Fill in a new sector:
   * **Name:** Healthcare & Telemedicine
   * **Slug:** healthcare
   * **Threat Categories:** Counterfeit Pharmacy, Fake Doctor Handles
   * **Rules:** Lookalike Pharmacy Names
3. Click **"Create & Activate Sector"**:
   * The new sector immediately appears in the navigation sidebar, sector switcher, and metrics dashboard without writing new frontend code.
