# Grafana Cloud setup: live Garmin dashboards

This guide configures Grafana to read the existing Training Center Worker. It does not deploy the Worker or change D1, cron, or Garmin synchronization.

## 1. Configure the Infinity datasource

1. In Grafana, open **Connections → Data sources → Add data source**.
2. Select **Infinity** (plugin: `yesoreyeram-infinity-datasource`).
3. Set the datasource UID to **training-center-d1** if the UI permits; the dashboards reference this UID.
4. Configure the datasource as a backend-capable datasource (Infinity backend parser).
5. Add the Worker base URL: `https://training-center-sync.listaconcerti.workers.dev`.
6. Configure an HTTP custom header named `Authorization` with value `Bearer <SYNC_BEARER_TOKEN>`. Store this in the datasource's secure header/secret configuration, not in dashboard JSON or panel query URLs.
7. Save and test.

Do not share/export screenshots containing the bearer token.

## 2. Test a read-only endpoint

Before importing panels, create a temporary Infinity query:
- Query type: JSON
- Parser: Backend
- Source: URL
- URL: `https://training-center-sync.listaconcerti.workers.dev/dashboard-data`
- Root selector: `counts`

Expected fields include counts for activities, activity_details, daily_records and garmin_records. If the request returns 401/403, the datasource header isn't being sent correctly. If it returns an error, stop and diagnose rather than bypassing authentication.

## 3. Import the existing dashboards

Import, do not recreate:
- `grafana/dashboards/training-center-master.json` (UID `training-center-master`)
- `grafana/dashboards/training-center-overview.json` (UID `training-center-overview`)

Keep the existing UIDs and panel IDs. The generated `training-center-d1-catalog.json` is an interim catalog helper, not the main dashboard.

## 4. Verify panels

Confirm the count Stat panels and dataset/activity tables return data. Check the time picker and refresh interval. The current dashboards are an overview and bounded recent-data view, not full-history time series.

## 5. Next development phase

Historical charts require field verification and read-only date-filtered endpoints. The `/dashboard-metrics` and `/dashboard-field-values` endpoints on the Grafana branch are not deployed. Do not use them until the live schema audit is completed and deployment is explicitly approved.

## Safety
- No D1 direct connection.
- No sync/backfill operations.
- No Worker deployment in this guide.
- Never place tokens in dashboard JSON, panel URLs, commits, screenshots, or public links.
