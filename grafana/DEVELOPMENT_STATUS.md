# Grafana development status

Updated 25 November 2026.

## Execution checkpoint
- **Block 0 — baseline recovery: DONE.** User screenshot confirms live Grafana access, an activity table and FC average/max-per-activity chart. Preserve these panels.
- **Block 1 — repository/CI stabilization: IN PROGRESS.** Static dashboard selector contract test added and wired into CI. Latest CI confirmation is unavailable.
- **Reference replication target: IDENTIFIED.** Inspected the public arpanghosh8453/garmin-grafana main dashboard JSON and inventoried 62 panels. Added grafana/REFERENCE_PANEL_CATALOG.md with grouped replication priorities and translation rules. Reference panels use InfluxDB; queries cannot be transplanted directly to our D1/Worker backend, but visual concepts and panel types can be adapted.
- Continue autonomous work on independent tasks. Live schema and Grafana UI validation are distinct pending dependencies.

## Live UI evidence
- Existing Grafana instance accessible; screenshot shows activity table and FC chart rendered.
- This does not verify all PR dashboards or historical metrics.

## Branch / repo
- PR #10 remains open; no merge performed.
- Branch: feat/grafana-automated-builder.
- Master and Overview JSON assets, UIDs and panel IDs preserved.
- Branch includes candidate manifest, catalog helper, analyzer/audit helpers, read-only metric/coverage/field endpoints, static tests and roadmap.
- CI status latest: unconfirmed.
- Reference adaptation inventory commit: 1e310f466ce11af1b215ead8e42c6cfd4f628d32.

## Protected boundary
- No production Worker/D1, sync/backfill, schedule changes or live publishing.
- Do not invent schema paths, units or metric semantics.
- Deployment/publishing requires explicit authorization.

## Latest checkpoint — read-only contract groundwork
- Inspected Worker source routes: `/dashboard-schema`, `/dashboard-field-values`, `/dashboard-field-coverage`, `/dashboard-metrics`, `/dashboard-record-dates`, and `/dashboard-data`; all shown handlers gate with `SYNC_BEARER_TOKEN` and read from D1. Field values/audit can contain private Garmin information and must stay private.
- Added `grafana/READ_ONLY_METRICS_CONTRACT.md` documenting endpoints, field promotion rules, Infinity datasource verification requirements and protected boundary.
- Added `grafana/test-readonly-endpoint-contract.mjs` static route/gate and dashboard credential-safety check; wired into CI. Test execution/CI result remains unverified.
- Live schema and coverage cannot be inspected in this chat without authenticated access to the Worker or a private audit export; no raw personal data was requested or committed.

## Automation-first operating direction
- Minimize recurring user actions. Avoid asking the user to export/copy/paste audit JSON, token values, or screenshots except for unavoidable one-time credential/UI setup or genuine blockers.
- Preferred design: one-time Grafana Infinity datasource configuration with securely stored Worker bearer credential; then dashboards generated from verified schema/metric catalogue and updates via GitHub Actions.
- Investigate whether a safe sanitized schema/catalog endpoint can reduce even the one-time audit workflow. Never expose raw samples or private Garmin data publicly; never remove auth to simplify.
- Prefer a generated dashboard artifact and validation workflow over hand-building panels. Treat Grafana publishing as separate approval-bound action.

## Automated schema-discovery checkpoint
- Added a GitHub Actions workflow (`garmin-schema-discovery.yml`) triggered manually or monthly. It uses the repository secret `SYNC_BEARER_TOKEN`, fetches `/dashboard-schema` read-only, runs the analyzer, uploads only sanitized candidate metadata, and deletes the raw audit file.
- Added a privacy/trigger guard test and wired it into catalog CI. Execution remains pending CI evidence.
- This removes recurring audit copy/paste; the one-time dependency is adding the Worker bearer credential as a GitHub Actions repository secret. No token is transferred through chat.

## Dashboard/API contract checkpoint
- Added a static contract test to verify both preserved Master/Overview dashboards target expected Worker read-only routes and their selectors match the `/dashboard-data` response roots.
- Wired the test into the catalog CI workflow. This protects existing panels from contract drift while keeping live UI validation distinct.

## Next actions
1. Prioritize matching reference panels to available archive fields.
2. Validate field paths/types/units/date coverage through private schema audit or alternative evidence.
3. Implement Master/activity panel adaptations from confirmed mappings.
4. Build Recovery/Sleep, Body and long-term trends with verified mappings.
5. GPS/activity detail charts require valid activity-detail records and remain candidates until evidence exists.
6. Verify datasource authentication, refresh and mobile rendering in Grafana UI.

## Blocker policy
Repository work continues despite UI/schema blockers. Use code, existing dashboard evidence, exports and fixtures; isolate blocked checks; request only the smallest user intervention. Never claim UI verification or CI passing without evidence.


## Panel implementation planning checkpoint — 25 November 2026
- Added a deterministic, metadata-only panel implementation plan generator from the dataset manifest and reference panel inventory.
- It groups future work into Master, Activity, Recovery, Body and Training workstreams and explicitly keeps all metric mappings UNVERIFIED until field paths, units, date semantics and coverage are confirmed.
- This avoids generating misleading metric panels from guessed Garmin fields; the plan is an automation scaffold, not a live dashboard or schema evidence.


## CI regression repair — 25 November 2026
- CI run 262 showed all prior catalog, dashboard contract, endpoint safety and inventory checks passing; the panel-plan test alone failed.
- Reworked the panel-plan test to run the generator in a temporary directory using PANEL_PLAN_OUTPUT, preventing test side effects and checking the generated plan explicitly.
- A previous analyzer fixture failure was also repaired; run 262 confirmed that fixture and the remaining checks passed through step 19.
- The updated panel-plan test is awaiting CI confirmation.


## Panel-plan CI debugging — 25 November 2026
- The isolated test still failed: the generator was emitting a literal backslash-n after the JSON rather than a newline, invalidating JSON parsing.
- Fixed the generator output terminator to emit a real newline; the test now runs generator output in a temporary path.
- CI verification for this latest commit is pending.
