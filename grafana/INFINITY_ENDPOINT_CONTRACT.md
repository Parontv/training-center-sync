# Grafana Infinity integration contract (Cloudflare Worker / D1)

Status: implementation contract and testable query examples. Live endpoint deployment, live field paths, units, and Grafana render tests remain unverified.

## Architecture

- Grafana Infinity datasource: HTTP/JSON.
- API: Cloudflare Worker `training-center-sync`.
- Archive: D1 `storico_garmin`.
- Auth: `SYNC_BEARER_TOKEN` as a datasource HTTP header; never place it in dashboard JSON, query URLs, or commits.
- No InfluxDB and no TinyFish.

## Existing endpoint: `GET /dashboard-metrics`

This endpoint is already implemented on branch `feat/grafana-automated-builder`. It is read-only and returns a JSON series shape suitable for Infinity's JSON parser:

```
{
  "ok": true,
  "readOnly": true,
  "metric": "dataset-name",
  "field_path": "$.fieldName",
  "source": "daily_records",
  "aggregation": "avg",
  "count": 2,
  "points": [
    {"date":"2026-01-01","value":12.5,"samples":1},
    {"date":"2026-01-02","value":13.0,"samples":2}
  ]
}
```

The exact response depends on actual D1 data; this example is illustrative only.

### Request parameters

- `source`: `daily_records` or `garmin_records`
- `dataset`: required dataset name
- `field_path`: required exact SQLite JSON `json_tree.fullkey` path
- `aggregation`: `avg`, `min`, `max`, or `sum`
- `from`, `to`: optional ISO date bounds
- `limit`: optional, capped by the Worker

Authentication is `Authorization: Bearer <SYNC_BEARER_TOKEN>`. Endpoint returns 401 if authentication is absent or incorrect. Invalid parameters return 400. Aggregation is generic and does not infer units or metric semantics.

## Infinity datasource configuration checklist

1. Install/use Grafana Infinity datasource plugin (JSON/HTTP mode).
2. Configure datasource URL to the Worker origin only, not to a specific endpoint.
3. Set datasource HTTP header `Authorization` to `Bearer <token>` using Grafana's secure datasource configuration where supported. Do not put secrets in dashboard variables or panel URLs.
4. Confirm the datasource can reach the Worker, then test a protected endpoint. Never export the secret with the dashboard.
5. Use Infinity's JSON parser against `/dashboard-metrics`; root selector `points`, columns `date` (string), `value` (number), `samples` (number).
6. In a panel, use date as time field only after confirming Grafana/Infinity parsing and timezone handling. Convert date-only records to a consistent timestamp convention, or use a categorical X axis where the panel requires it.
7. Do not call a panel query verified until live field path, unit, data coverage, API response, and visual rendering have all been checked.

## Example query URL (illustrative; field paths and dataset must be verified)

```
/dashboard-metrics?source=daily_records&dataset=steps&field_path=%24.totalSteps&aggregation=sum&limit=366
```

Do not assume the example path exists: use the live schema audit to choose the exact JSON fullkey. The `steps` dataset and the path in this example are placeholders for validation.

## Read-only verification checklist

- `/health`: unprotected D1 connectivity only; must not be used to test protected metric data.
- `/dashboard-schema`: schema audit; authenticated, read-only. Capture privately and inspect field paths/coverage.
- `/dashboard-metrics`: authenticated, read-only scalar aggregate.
- Validate that the response contains points and the selected date range.
- Confirm units and semantics against source data and original dashboard query before panel conversion.
- Test Infinity response parsing and compare a converted panel against the original.
- Keep the original 62-panel dashboard unchanged as the visual reference until conversion tests pass.

## Conversion gate

A panel/target is considered `QUERY_READY` only if all of the following are evidence-backed:
- exact source dataset and JSON path,
- correct aggregation semantics,
- unit and timezone/date interpretation,
- source record coverage,
- Infinity response parsing,
- rendering and comparison with the original.

Otherwise mark it `UNVERIFIED` and do not fabricate a query.
