# Block 7 — Live Grafana end-to-end verification

**Status: PREPARATION COMPLETE; live verification blocked by direct Grafana UI/session access.**

## Checklist prepared
- Infinity datasource UID `training-center-d1` and plugin version.
- Secure bearer-header configuration (no secrets in JSON).
- Test /dashboard-data and /dashboard-metrics authenticated requests.
- Query date/time-range interpolation and server-side bounds.
- Empty dataset, invalid date, unauthorized and HTTP error behavior.
- Infinity JSON parser/root selectors, columns, data types.
- Panel transformations, units, thresholds, maps/heatmaps.
- Mobile rendering and dashboard refresh.
- Compare progressive dashboard with original panel-by-panel.

## Preconditions
1. Authenticated live D1 field audit report available.
2. Infinity datasource access configured securely in Grafana.
3. User's Grafana browser/session available for testing.

No live Grafana import, publishing, datasource secret, Worker deployment, D1 writes or sync changes were performed.
