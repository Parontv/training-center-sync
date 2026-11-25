# Garmin Grafana completion roadmap (A/B/C/D/F)

## Scope and safety
Work is performed on `feat/grafana-automated-builder`. Existing dashboards and UIDs are preserved. Read-only data access only; no Garmin sync, D1 schema/data mutation, deployment, or Grafana publishing.

## Phase A — audit
- Source-of-truth inventory: existing dashboard JSON, manifest, builder, Worker routes, and contract.
- Existing Worker API: `/dashboard-schema`, `/dashboard-field-values`, `/dashboard-field-coverage`, `/dashboard-metrics`; all require authenticated access and live deployment verification.
- The existing `/dashboard-data` endpoint is summary/catalog, not a complete historical metrics API.
- Live D1 field coverage is pending an authenticated private schema audit.

## Phase B — mapping
- Candidate catalogue is in `datasets.json`.
- `mapping-inventory.json` records desired metric families, expected source, and validation status.
- `analyze-live-schema.mjs` accepts a private schema audit JSON file and emits candidate mappings based on exact field-path matches and conservative heuristics. Candidates are NOT considered verified until coverage, types, units, date range and semantics are checked.

## Phase C — API
Read-only endpoints exist in source for raw values, numeric aggregates, and field coverage. Static safety checks validate authentication gates, allowlisted sources, date validation, bounded query limits and read-only statements. Live endpoint behavior remains unverified because deployment and credentials are outside this audit.

## Phase D — dashboard generation
Existing master, overview and activity dashboards are retained. Builder scaffolding generates catalogue helpers only; metric panels require verified mappings. This intentionally prevents dashboards from displaying invented metrics.

## Phase F — delivery/operations
- CI/static checks and deterministic generation.
- Setup and security documentation.
- Import/publish and live Grafana UI validation remain manual until Grafana instance/datasource access is available.
- Publishing and deployment are deliberately not performed by this audit.

## Current blocker
A private authenticated `/dashboard-schema` audit report must be downloaded through the Worker UI and supplied to the schema analyzer. Do not commit this report because it may contain personal Garmin samples.
