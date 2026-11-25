# Grafana development status

Updated 25 November 2026.

## Live Grafana UI evidence (user screenshot, 25 Nov)
- The user's existing Grafana instance is accessible and the existing `garmin dashboard` opens.
- The current dashboard visibly renders an activity table (panel titled `query giusta`, with activity IDs/names) and an FC average/max-per-activity chart.
- This is real UI evidence of at least two working panels and a live data connection. It does **not** establish that all dashboards in PR #10 are deployed, that their queries match, or that historical metric endpoints are deployed.
- Preserve this live dashboard and its existing query/panels. Do not start from scratch or overwrite it with the PR scaffold.

## Branch / repository status
- PR #10 remains open, draft and mergeable; no merge was performed.
- Branch: `feat/grafana-automated-builder`; latest known head: `9b1a73d518e8f0906ead4fdb58c67ae08ab19115`.
- Existing Master and Overview dashboard JSON assets remain preserved with stable UIDs and panel IDs.
- PR #10 contains a candidate dataset manifest, catalog helper generator, analyzer and private schema audit helpers, branch-only read-only field/coverage/metric endpoints, and tests.
- The branch-only historical metrics endpoints are not deployed.
- CI status is mixed/stale: an earlier static run passed, the analyzer newline defect was fixed in commit `335d75f`, and latest push-triggered validation cannot currently be confirmed. Do not claim latest CI passes.
- A Cloudflare preview build failure was reported for commit `e19dbce`; it is an older build notification and must not be assumed to represent the current branch head without checking logs.

## Confirmed development boundary
- No production Worker/D1, Garmin sync, backfill, schedules or live publishing changes have been made by this branch work.
- Do not invent schema paths, units or semantics.
- Do not deploy or publish without explicit authorization.

## Remaining work, prioritized
1. Reconcile the working live activity table and FC chart with the repository dashboard JSON so existing work is preserved.
2. Verify Grafana datasource authentication/query behavior and dashboard IDs/queries without replacing the live dashboard.
3. Use the authenticated private schema audit to confirm fields, types, date coverage, missingness and units.
4. Build validated historical panels in the existing Master dashboard first; add Recovery, Body and Activity views only when field mappings are confirmed.
5. Verify rendering and refresh in Grafana UI.

## Current access limitation
Repository development can continue, but this session has no authenticated Grafana UI control or private schema-audit file. The user can provide visual checks in the UI; never ask for or commit bearer tokens.
