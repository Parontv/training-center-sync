# Grafana Fast Path

## Objective
Get a visible, working Garmin dashboard in Grafana Cloud from the existing Cloudflare Worker/D1 archive. Prioritize a working dashboard over expanding the builder/audit infrastructure.

## Keep
- Existing Garmin sync Worker and D1 archive (storico_garmin).
- Existing readonly /dashboard-data endpoint and Infinity datasource configuration.
- Existing candidate JSON and regression tests that protect working pieces.

## Stop expanding for now
- No new dashboard builder frameworks, inventories, catalogs, or audit layers unless they directly unblock a dashboard panel.
- Do not port the complete InfluxDB dashboard in one pass.
- Do not add more datasource abstraction.

## Short delivery sequence
1. Import the existing grafana/dashboards/training-center-overview.json as the first baseline, using the existing Infinity datasource UID training-center-d1.
2. Confirm the datasource is configured for backend parsing and the Worker bearer header is set securely.
3. Confirm the baseline panels render. Fix only concrete errors.
4. Add visually useful panels in small batches using fields confirmed by the Worker response: activity counts/recent activities and dataset coverage first.
5. Expand to activity-specific analytics (distance, duration, heart rate, elevation, GPS) only after the Worker exposes safe, queryable fields and the panel is tested.
6. Automate dashboard publication via Grafana API only after the baseline renders successfully; keep secrets out of repository and dashboard JSON.

## Definition of done for the baseline
- Dashboard imported and visible in Grafana Cloud.
- Datasource request succeeds without leaking the bearer token.
- At least activity count and recent activity table render.
- No sync/backfill mutations are triggered by dashboard requests.
