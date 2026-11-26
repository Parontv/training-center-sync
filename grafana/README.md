# Grafana automation

This branch is a safe scaffold for dashboards as code against the Training Center read-only Worker API.

## Existing dashboard assets (must be reused)
PR #8 in this repository already contains the initial dashboard assets:
- `grafana/dashboards/training-center-master.json` — Garmin Master overview
- `grafana/dashboards/training-center-overview.json` — Garmin Overview
- `grafana/dashboards/training-center-activity.json` — Activity/archive dashboard focused on the known `/dashboard-data` activity fields
- setup guidance for Grafana Cloud + Infinity

Those assets have been carried forward into PR #10 with their UIDs and panel IDs preserved. **Do not replace them with a parallel dashboard or reset their UIDs/panel IDs.** PR #10's generated `training-center-d1-catalog.json` is an interim schema/catalog helper, not the target user dashboard.

## Grafana Infinity datasource authentication

The Worker dashboard API requires a Bearer token, including `/dashboard-data`. Configure the Infinity datasource UID `training-center-d1` with the Worker base URL and an Authorization header (`Bearer <SYNC_BEARER_TOKEN>`) in datasource secure/custom HTTP headers as supported by the installed Infinity version. Do not put the token into dashboard JSON, panel URLs, exported dashboards, screenshots, or commits. Verify the header works with a simple query before importing panels. If the Grafana instance cannot securely store this header, do not expose the dashboard endpoint or deploy dashboards publicly.

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
1. Configure and verify the authenticated Infinity datasource before expecting panels to return data.
2. The authenticated read-only `/dashboard-schema` discovery has now been successfully run via GitHub Actions; review the sanitized artifact and use it to validate mapping candidates.
3. Map verified field paths to normalized endpoints; avoid assumptions about units or semantics.
4. Add real time-series panels to the existing Master dashboard, with dedicated detail dashboards only where justified.
5. Test Infinity backend query behavior and verify dashboard JSON.
6. Publishing remains disabled until the Grafana stack and scoped API token are explicitly verified.

## Limitations and safety
The catalog helper is not a live metrics dashboard. An authenticated live schema discovery has succeeded via GitHub Actions; sanitized metadata was generated and the private raw audit deleted. Metric semantics, units and mapping validity remain unverified. No deployment, publishing, D1 mutation, or Garmin sync change is authorized here.


## Fast path: first visible dashboard (manual Grafana step)

This is the shortest path to a live dashboard, without deploying or changing D1:

1. In Grafana Cloud, open **Connections → Data sources → Infinity** (or the existing `training-center-d1` datasource).
2. Confirm datasource UID is exactly `training-center-d1`. If it already exists, edit it rather than creating another.
3. Set the base URL to `https://training-center-sync.listaconcerti.workers.dev` if the datasource supports a base URL. The dashboard panels currently use the full read-only `/dashboard-data` URL.
4. Configure the HTTP Authorization header as a **secure/custom header**: name `Authorization`, value `Bearer <SYNC_BEARER_TOKEN>`. Store it in the datasource's secure configuration, never in panel URLs or dashboard JSON.
5. Use datasource **Save & test**. A successful connection alone is not sufficient; confirm an Infinity query returns JSON from the Worker.
6. Import `training-center-master.json` and `training-center-overview.json` from this repository branch, or open the dashboard import flow and paste the JSON content. Keep the datasource UID mapping at `training-center-d1`.
7. Set the dashboard refresh to 5 minutes and check the counters and tables. If a panel is empty, inspect the Infinity query response and selector before changing any dataset fields.

**Stop if secure token storage is unavailable.** Do not put the token into dashboard JSON, screenshots, URLs, browser bookmarks, or commits.


## Activity dashboard asset

`training-center-activity.json` is a focused dashboard built only from the selectors already used in the existing `/dashboard-data` panel contract: archive counts, activities, dataset coverage and activity-quality summaries. It is an asset awaiting secure datasource authentication and UI validation; do not treat it as live-verified.
