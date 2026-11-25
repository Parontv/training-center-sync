# Garmin Metrics API contract for Grafana

## Read-only principle
The Worker endpoints in this branch are read-only and are not deployed. The existing `/dashboard-data` endpoint currently provides summary/catalog data, not full historical analytics.

## Implemented in the branch: raw field values
`GET /dashboard-field-values?source=daily_records|garmin_records&dataset=<dataset>&field_path=<JSON fullkey>&from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&limit=<1-5000>`

- Bearer authentication via `SYNC_BEARER_TOKEN`.
- Source tables are allowlisted.
- Dataset, field path and date filters are bound parameters.
- Limit is bounded; invalid numeric limit values fall back safely.
- Returns scalar raw values, date/type and count.
- Does not infer units or semantics.

## Implemented in the branch: numeric time series
`GET /dashboard-metrics?source=daily_records|garmin_records&dataset=<dataset>&field_path=<JSON fullkey>&from=<date>&to=<date>&aggregation=avg|min|max|sum&limit=<bounded>`

- Bearer authentication and allowlisted sources.
- Parameterized dataset, field path and date filters.
- Numeric values only.
- Per-date aggregate and sample count.
- Unit intentionally null until verified.
- Bounded query and read-only SQL.

## Safety and interpretation
- These endpoints are not deployed.
- Never expose a user-supplied SQL query.
- The field path is a query parameter, not SQL.
- Do not assume field names imply correct units or meaning.
- Verify coverage, type, date range, missingness and semantics against private live schema audit data before dashboard panels use them.
- Keep live audit files private; they may contain personal Garmin data.

## Superseded proposal
The earlier metric-name/interval contract and example response in prior revisions were proposals only. They are not the implemented API shape.
