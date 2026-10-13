# SentinelX — REST API Specification & Endpoint Directory

Default Base URL: `http://127.0.0.1:8000/api`  
Swagger UI Interactive Documentation: `http://127.0.0.1:8000/docs`

---

## 1. System Health & Diagnostics

### `GET /api/health`
Returns system status, version, and demo sandbox mode flag.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "SentinelX",
  "version": "1.0.0",
  "demo_mode": true
}
```

---

## 2. Sectors & Configuration

### `GET /api/sectors`
Returns all registered industry sectors with live aggregated metrics.

### `GET /api/sectors/{sector_id}`
Returns details for a specific sector including threat categories, rules, and checklist.

### `POST /api/sectors`
Custom Sector Builder: Registers a brand new sector with custom detection rules.

### `PATCH /api/sectors/{sector_id}/rules/{rule_id}`
Adjusts detection rule weight, sensitivity threshold, or toggles rule activation.

---

## 3. Brand Profiles & Identity Fingerprint

### `GET /api/brands`
Filters brands by `sector_id` and search keywords.

### `POST /api/brands`
Registers a brand profile with official domains, social handles, and mobile apps.

### `GET /api/brands/{brand_id}`
Returns full identity fingerprint, official registered assets, and whitelist items.

### `DELETE /api/brands/{brand_id}?force=true`
Deletes a brand profile. Enforces safety check if linked findings exist.

---

## 4. Detection Engine Endpoints

### `GET /api/social/candidates`
Query params: `sector_id`, `brand_id`, `platform`, `severity`, `status`, `search`, `limit`, `offset`.

### `POST /api/social/analyze`
Evaluates a social media profile candidate against the target brand. Executes official asset exclusion and RapidFuzz heuristic scoring.

### `GET /api/apps/candidates`
Query params: `sector_id`, `brand_id`, `store`, `severity`, `status`, `search`, `limit`, `offset`.

### `POST /api/apps/analyze`
Evaluates an app candidate against the target brand. Evaluates developer mismatch and mimicked package IDs.

---

## 5. Investigation Queue & CSV Exports

### `GET /api/findings`
Returns paginated findings list with candidate and brand metadata.

### `GET /api/findings/{finding_id}`
Returns full case dossier including individual signal breakdown, weights, and audit history.

### `PATCH /api/findings/{finding_id}/status`
Updates case status (`New`, `Needs Review`, `Confirmed Impersonation`, `False Positive`, `Resolved`).
If `add_to_approved_assets: true` on false positive, automatically whitelists the asset.

### `GET /api/findings/export.csv`
Returns RFC 4180 compliant CSV export file for filtered findings.

---

## 6. Threat Graph & Data Sources

### `GET /api/threat-graph`
Returns nodes and edges connecting brands, rogue profiles, clones, publishers, and domains.

### `GET /api/sources`
Returns statuses of ingest connectors.

### `POST /api/demo/seed`
Idempotent seed endpoint that populates demonstration data across all 5 sectors without duplicates.
