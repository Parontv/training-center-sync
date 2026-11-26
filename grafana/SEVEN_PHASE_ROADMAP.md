# Garmin Grafana: seven-phase completion roadmap

Branch: `feat/grafana-automated-builder` (PR #10 draft)

## Phase 1 — Baseline and source dashboard inventory
Status: COMPLETE (static/source inventory).
- Original Garmin Stats: 62 panels, 143 targets, stable target identity panelId:targetIndex.
- Original query semantics retained in inventory.
- Reference source dashboard preserved; no panel IDs reset.

## Phase 2 — Read-only schema discovery and data evidence
Status: DISCOVERY COMPLETE; D1 load controls applied; field-level verification incomplete.
- Authenticated GitHub Actions discovery succeeded; sanitized artifact produced.
- Raw audit cleanup policy maintained.
- Discovery is manual/monthly; sanitized snapshot refresh is manual/weekly to reduce D1 pressure.
- Retry/backoff and concurrency serialization added.

## Phase 3 — Candidate field mapping and evidence ledger
Status: PARTIAL.
- 143 target inventory and heuristic suggestions exist.
- Added CORE_METRIC_EVIDENCE_CATALOG.json and CORE_PANEL_MAPPING_REVIEW.json.
- All candidates remain unverified; no mapping is promoted based on heuristics alone.
- CI guardrails added; latest execution pending.

## Phase 4 — Read-only metrics API and conversion engine
Status: STATIC/SYNTHETIC COMPLETE; live semantics and units unverified.
- Contract routes and conversion generator scaffold exist.
- Generator only wires complete verified mappings.
- Synthetic validation passed in earlier workflow runs.
- Production Worker deployment and real query results remain external gates.

## Phase 5 — Original Garmin Stats progressive conversion
Status: STRUCTURAL COMPLETE; partial wiring remains inert.
- Original 62 panel IDs retained.
- Earlier 5-target scaffold is not live verified.
- No unsafe mappings are promoted.

## Phase 6 — Thematic dashboard assets
Status: ASSET/STATIC CONTRACT COMPLETE; rendering unverified.
- Master, overview and activity/archive assets preserved.
- Infinity datasource UID is `training-center-d1`.
- Secure authentication and live panel rendering remain external gates.

## Phase 7 — End-to-end Grafana verification and release
Status: BLOCKED ON LIVE UI/DEPLOYMENT VERIFICATION.
- Requires secure Infinity datasource verification, API query test, dashboard rendering, time picker/units/data validation and comparison against the source dashboard.
- Publishing, deployment, D1 mutation, sync/backfill/cron changes and PR merge remain gated.

## Working rule
Complete each phase with tests and fixes before moving to the next. Continue autonomously through repository/static work. Pause only for an external gate that cannot be performed safely from the current access context.
