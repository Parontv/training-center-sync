# Grafana visual build roadmap

This roadmap is intentionally schema-aware: real panels are built only after the live audit confirms the field paths and coverage. It avoids guessed JSON paths or units.

## Dashboard organization (reuse current dashboards)
- **Master**: four record counters, dataset coverage, recent activity table and data-quality indicators.
- **Activity**: activity volume, distance, duration, pace/speed, HR, elevation, activity-type distribution, weekly/monthly summaries. Each panel must use verified activity-detail fields.
- **Recovery**: sleep duration/score/stages, HRV and baseline, resting HR, stress, respiration, SpO2. Separate panels when units or coverage differ.
- **Body**: weight trend, rolling average and body-composition metrics where validated.
- **Training**: training load/status/readiness and recovery indicators only when semantics and field coverage are verified.

## Visual conventions
- Time-series panels: daily records, explicit unit, date range and aggregation.
- Stat panels: latest value, delta only if the calculation is valid and data coverage adequate.
- Tables: show date, metric, and source dataset; no inferred units.
- Coverage: show missingness and date span beside key metrics.
- Missing or sparse fields: panel reports unavailable/sparse data rather than drawing misleading zeros.

## Audit-to-panel pipeline
1. Use the authenticated read-only schema audit to produce private field inventory.
2. Analyze field paths, types, record counts, date coverage and missingness.
3. User-reviewed shortlist of fields and units.
4. Add allowlisted API queries with bounded date and row limits.
5. Build panels in existing dashboard assets with stable UIDs/panel IDs.
6. Test JSON and API response shape; verify in Grafana UI.
7. Publishing/deployment only after explicit authorization.

## Current blocker
The live schema audit and datasource authentication have not yet been verified. Therefore this roadmap is a design plan, not a claim that the metrics exist or that charts are live.


## Validation update (25 November 2026)
- Latest branch commit `62c637b8e0f9a57404be6a6412a59ed137e85a6c` passed GitHub Actions validation (run 45680367109).
- All checks completed successfully: Worker syntax, strict dates, dataset manifest, analyzer and fixtures, read-only endpoint safeguards, catalog generation/JSON, existing dashboard integrity, audit helper safeguards, browser audit safeguards, reference inventory.
- This is static/fixture validation only. It does **not** verify live D1 field coverage, Grafana Infinity authentication, or real dashboard rendering.
- Next gate remains the authenticated live schema audit. No deployment, merge, publishing, D1 mutation, or sync/backfill changes were made.
