# Training Center Grafana

Read-only Grafana dashboard for the existing Cloudflare D1 archive.

## Architecture

Grafana Cloud (Free) -> Infinity data source -> authenticated Cloudflare Worker API -> existing D1 database.

- D1 remains the source of truth.
- No Garmin re-import, no second database, no writes from Grafana.
- The Worker and Garmin sync schedule are not changed by this dashboard scaffold.
- The Infinity data source is preinstalled on Grafana Cloud. It can query JSON REST APIs and supports Bearer authentication.

## First dashboard endpoint

The initial dashboard uses:

`GET https://training-center-sync.listaconcerti.workers.dev/dashboard-data`

This endpoint already exists in the Worker and returns aggregate counts, dataset coverage, recent activities, recent daily records, steps and data-quality summaries.

Important limitation: this is an initial overview, not yet a complete historical analytics layer. The endpoint currently returns up to 500 recent activities, 100 recent daily records and 500 step records. Historical time-series panels require dedicated date-filtered, read-only Worker endpoints before they can be considered complete.

## Grafana Cloud setup

1. Create a Grafana Cloud Free stack: https://grafana.com/auth/sign-up/create-user
2. Open **Connections -> Data sources -> Add new data source -> Infinity**.
3. Set the data source name to `Training Center D1` and UID to `training-center-d1`.
4. Set the base URL to `https://training-center-sync.listaconcerti.workers.dev`.
5. Configure a custom HTTP header:
   - Header name: `Authorization`
   - Header value: `Bearer <SYNC_BEARER_TOKEN>`
   - Store the value in Grafana's secure/secret field. Never place it in dashboard JSON, panel queries, Git, or chat.
6. Save & test. The API endpoint used by the dashboard is `/dashboard-data`.
7. Import `dashboards/training-center-overview.json`.

The Infinity plugin must execute URL queries through its backend parser where available, so the Bearer token is not exposed in browser-side query configuration.

## Security

- Keep the Grafana stack private; do not enable public dashboards or anonymous access.
- Use a dedicated Grafana login and MFA.
- Never publish the Worker token in a dashboard, URL, variable, annotation, or Git file.
- This dashboard is read-only. Do not add D1 write endpoints or sync/backfill actions to Grafana.

## Next implementation stages

1. Validate the first overview against the live Worker.
2. Add bounded historical endpoints for activities and selected daily Garmin datasets (steps, HR, sleep, HRV, Body Battery, stress, weight, VO2 Max).
3. Build historical time-series panels with explicit missing-data handling.
4. Add training load/readiness panels only where the source data actually exists; distinguish Garmin-provided values from derived values.
5. Add activity drill-down and data-quality panels.

