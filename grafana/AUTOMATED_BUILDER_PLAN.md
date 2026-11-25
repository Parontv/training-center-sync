# Automated Grafana Builder: Training Center

## Goal
Extend the existing Garmin dashboards and read-only Cloudflare D1 API without copying data, introducing a second database, or requiring manual panel-by-panel editing.

## Findings
- Repository already contains an open PR #8 with initial Grafana JSON dashboards and Infinity datasource setup guidance; it is an unfinished scaffold, not a full historical analytics dashboard.
- The Worker already has authenticated read-only discovery endpoints including `/dashboard-schema`, `/dashboard-data`, `/analytics-capabilities`, and `/analytics-view-status`. It can inspect JSON fields in D1.
- D1 remains the source of truth; preserve read-only dashboard access.
- Infinity is a suitable Grafana datasource for JSON REST APIs and supports backend parsing and Bearer authentication.
- Grafana exposes dashboard HTTP APIs suitable for programmatic create/update. This enables automation if an authorized Grafana service-account token and stack URL are available.
- No Grafana-specific connector/action or credentials were exposed in the connected tools inspected in this session. GitHub access is confirmed, including repository admin/push permissions; Grafana access must be verified separately rather than assumed.

## Proposed implementation (phased, non-destructive)
1. **Inventory:** read-only catalog of D1 tables/views, field paths, types, coverage and date range; use existing schema endpoints and installed analytics views.
2. **Data contracts:** create explicit API endpoints for panel-friendly time-series and aggregates, with pagination/date limits and missing-data handling. Avoid dumping huge JSON payloads into panels.
3. **Dashboard generator:** maintain a small declarative manifest describing panel purpose, API endpoint, fields, units, visualization, grouping and transformation; generate classic Grafana dashboard JSON from it. Preserve existing UIDs and panels where possible.
4. **Validation:** lint JSON, verify each panel's data contract and test query shapes against API samples; check panel IDs, layout, datasource UID, time field and units.
5. **Publishing:** use Grafana dashboard HTTP API to upsert dashboards by UID. Require Grafana URL and scoped service-account token via GitHub Actions secrets; never store credentials in source, dashboard JSON or Worker/D1.
6. **Rollback:** version dashboards in Git; publish changes only from a branch/approved workflow initially, with backups of current dashboard JSON before API updates.

## Security and constraints
- No D1 mutations or Garmin sync changes in dashboard generation.
- Keep API token in Grafana datasource secure configuration and dashboard publishing token in CI secrets.
- No local server, VPS, InfluxDB or paid browser automation.
- Prefer Grafana Cloud API over UI automation.
- Initial publishing should be dry-run/export first; live overwrite only after UID and stack verification.

## Research references
- Grafana dashboard HTTP API: https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/dashboard/
- Grafana HTTP API overview: https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/
- Grafana provisioning / dashboards as code: https://grafana.com/docs/grafana/latest/administration/provisioning/
- Infinity datasource docs: https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/
- Infinity configuration and authentication: https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/configure/

## Immediate next step
Inspect the live Grafana stack and its existing Training/Garmin dashboards through an authorized API connection. If no token/connector is available, obtain only the minimum one-time authorization needed. Then build and validate the generator and expand the dashboards incrementally.
