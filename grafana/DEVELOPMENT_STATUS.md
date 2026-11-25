# Grafana development status

Updated 25 November 2026.

## Execution checkpoint
- **Block 0 — baseline recovery: DONE.** User screenshot confirms live Grafana access, an activity table (`query giusta`) and FC average/max-per-activity chart. These live panels must be preserved.
- **Block 1 — repository/CI stabilization: IN PROGRESS.** Added a static dashboard-to-`/dashboard-data` selector contract test (`grafana/test-dashboard-data-contract.mjs`) and wired it into the CI workflow. CI has not yet confirmed this new test; report it as unverified until a run is inspected.
- Independent work will continue while live schema audit or Grafana UI verification is unavailable.

## Live Grafana UI evidence
- Existing Grafana instance is accessible and the existing `garmin dashboard` opens.
- The current dashboard visibly renders an activity table and FC average/max-per-activity chart.
- This does not establish that all PR dashboard assets are deployed, that historical metric endpoints are deployed, or that other panels render.
- Preserve the live dashboard and existing working queries/panels. Do not start from scratch or overwrite them with the PR scaffold.

## Branch / repository
- PR #10 remains open, draft and mergeable; no merge performed.
- Branch: `feat/grafana-automated-builder`.
- Existing Master and Overview dashboard JSON assets, UIDs and panel IDs are preserved.
- Branch contains candidate manifest, catalog helper generator, schema analyzer/audit helpers, read-only field/coverage/metrics endpoints and tests.
- New static selector contract test added to CI workflow; validation run is pending/unverified.
- Latest CI status cannot currently be confirmed; do not claim passing.

## Protected boundary
- No production Worker/D1, Garmin sync, backfill, schedules or live publishing changes.
- Do not invent schema paths, units or semantics.
- Deployment or publishing requires explicit authorization.

## Remaining work
1. Reconcile live activity table and FC chart with repository JSON; preserve working panels.
2. Verify datasource authentication/query behavior and dashboard IDs/queries.
3. Audit real schema, types, coverage, missingness and units.
4. Build validated panels: Master, Activity, Recovery, Body, Training.
5. Verify UI rendering, refresh and mobile layout.
6. Document release and maintenance procedures.

## Current limitation and unblock policy
Repository development can continue, but this session lacks authenticated Grafana UI control and a private live schema audit file. Work on independent code, tests, documentation and safe scaffolding; request only the smallest user action needed for the dependent UI/audit check, then resume.
