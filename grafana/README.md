# Grafana automation

This branch is a safe scaffold for dashboards as code against the Training Center read-only Worker API.

## Existing dashboard assets (must be reused)
PR #8 in this repository already contains the initial dashboard assets:
- `grafana/dashboards/training-center-master.json` — Garmin Master overview
- `grafana/dashboards/training-center-overview.json` — Garmin Overview
- setup guidance for Grafana Cloud + Infinity

Those assets have been carried forward into PR #10 with their UIDs and panel IDs preserved. **Do not replace them with a parallel dashboard or reset their UIDs/panel IDs.** PR #10's generated `training-center-d1-catalog.json` is an interim schema/catalog helper, not the target user dashboard.

## Current state
- `datasets.json`: candidate Garmin metric catalogue; actual CORE inclusion must be verified against live D1 coverage.
- `build-dashboards.mjs`: creates a catalog helper dashboard from the manifest.
- `test-datasets.mjs`: sanity checks manifest and generated helper JSON.
- CI validates the manifest, analyzer safeguards, endpoints' static safeguards and generated JSON.
- `METRICS_API_CONTRACT.md`: contract notes for read-only metric endpoints.

## Live schema audit from the existing `/run` page\n\nAfter this branch is deployed (deployment is not done by this PR), open `/run` in the browser that already stores the bearer token and press **Audit schema Grafana**. It makes an authenticated read-only GET to `/dashboard-schema` and downloads a private JSON audit. No token copy/paste is required in the terminal. Keep the downloaded report private.\n\n## Generate
```bash
node grafana/test-datasets.mjs
node grafana/build-dashboards.mjs
```

## Next integration steps
1. Reconcile/import the PR #8 dashboard JSON into this branch (preserving UIDs and panel IDs).
2. Audit live D1 schema/coverage with authenticated read-only `/dashboard-schema`.
3. Map verified field paths to normalized endpoints; avoid assumptions about units or semantics.
4. Add real time-series panels to the existing Master dashboard, with dedicated detail dashboards only where justified.
5. Test Infinity backend query behavior and verify dashboard JSON.
6. Publishing remains disabled until the Grafana stack and scoped API token are explicitly verified.

## Limitations and safety
The catalog helper is not a live metrics dashboard. Live schema audit requires the Worker bearer token; no authenticated live audit was performed by this development session. No deployment, publishing, D1 mutation, or Garmin sync change is authorized here.
