# Read-only metric query guide

All protected endpoints require `Authorization: Bearer <SYNC_BEARER_TOKEN>`. Keep this header in Grafana datasource secure settings; never in panel JSON or URL parameters.

## Historical numeric metrics

`GET /dashboard-metrics` accepts:
- `source`: `daily_records` or `garmin_records`
- `dataset`: exact dataset name
- `field_path`: exact JSON fullkey (must be validated against schema/coverage)
- `aggregation`: avg, min, max or sum
- `from` / `to`: optional ISO dates (inclusive)
- `limit`: 1–2000 (default 366)

Example (placeholder field path, not a validated Garmin metric):
`/dashboard-metrics?source=garmin_records&dataset=<dataset>&field_path=<validated-fullkey>&aggregation=avg&from=2026-01-01&to=2026-11-25&limit=366`

Response points are date/value/samples. The endpoint currently returns `unit:null` and a warning that numeric aggregation is generic. Do not label units or metric meaning until field coverage and schema are validated.

## Record inspection
- `/dashboard-record-dates?dataset=<dataset>`: read-only available-date coverage.
- `/dashboard-records?dataset=<dataset>&date=YYYY-MM-DD&limit=...`: read-only raw records for one date (limit capped at 200).

## Dashboard design constraints
- `/dashboard-data` is a recent-snapshot endpoint with capped result arrays; dashboard time picker does not filter the API response.
- Use `/dashboard-metrics` for time-range trend panels only after validating exact dataset and field path.
- Do not use raw JSON field paths guessed from Garmin terminology.
- No credentials, private data, deployment, D1 mutation, or Grafana publishing are part of this guide.
