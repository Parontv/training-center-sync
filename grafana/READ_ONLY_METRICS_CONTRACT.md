# Grafana read-only data contract and live schema workflow

This contract describes the existing read-only Worker routes inspected on branch `feat/grafana-automated-builder`. It is not evidence that specific fields or dataset coverage have been verified.

## Routes and purpose
All routes below require `Authorization: Bearer <SYNC_BEARER_TOKEN>`; never place the token in dashboard JSON, URL query parameters, commits, logs, or screenshots.

- `GET /dashboard-data`: bounded dashboard overview payload (counts, dataset counts/date ranges, activity summary, recent daily rows, step records, quality summaries).
- `GET /dashboard-schema`: field paths/types/occurrences and record coverage metadata for garmin_records and daily_records. The response includes example values; keep the export private.
- `GET /dashboard-field-coverage?source=...&dataset=...&field_path=...`: read-only coverage and date scope for one field.
- `GET /dashboard-field-values?source=...&dataset=...&field_path=...`: bounded raw value rows for field review. Private data; do not publish sample output.
- `GET /dashboard-metrics?source=...&dataset=...&field_path=...&aggregation=avg|sum|min|max&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=...`: generic numeric aggregation. Response unit is currently null and meaning is not inferred. Only use after manual semantic/unit review.
- `GET /dashboard-record-dates?dataset=...`: date distribution for a Garmin dataset.
- `GET /dashboard-records?dataset=...`: bounded raw records; use only for private audit, never panel output.
- `GET /dashboard-activity?activityId=...`: activity and detail payload inspection, bounded to one activity.
- `GET /dashboard-audit`: recent sync-run audit. Not a metric source.

## Schema discovery and metric promotion
For every candidate field, record: source table, dataset, field_path, JSON type, occurrence count, distinct records/dates with field, date span, unit, semantic definition, aggregation, status, and review evidence.

Status:
- VERIFIED: type, unit, meaning, date semantics, coverage and aggregation checked.
- CANDIDATE: field exists but semantic/coverage review incomplete.
- SPARSE: field exists but coverage insufficient for a useful chart.
- UNAVAILABLE: absent from archive.
- BLOCKED: evidence cannot currently be obtained.

Do not treat generic numeric aggregation as a valid metric until the meaning and unit are verified. Do not use samples as dashboard data.

## Grafana Infinity datasource
Preferred initial pattern: Infinity datasource JSON URL query against the Worker read-only endpoints, using secure datasource-level authentication (bearer token managed in Grafana datasource configuration, not dashboard JSON). Verify plugin behavior in the actual Grafana UI before declaring validated.

For a generic numeric series, query `/dashboard-metrics` with fixed verified dataset/field path and date bounds. Select JSON root `points`, fields `date` and `value`; verify Infinity parser, time-field conversion, numeric field mapping, URL parameter handling and time range. Avoid templating arbitrary dataset/field paths until allowlisting is enforced.

## Safety / release boundary
This is documentation and design only. No Worker/D1 writes, deploy, sync schedule/backfill changes or Grafana publication. Any generated dashboard JSON is a local/repository artifact until explicit publishing approval.
