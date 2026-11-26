# Garmin-Grafana reference audit

Reference repository: https://github.com/arpanghosh8453/garmin-grafana

## Verified assets
- Main Garmin Stats dashboard: 62 panels, UID `feiibsx498gsgb`, JSON path `Grafana_Dashboard/Garmin-Grafana-Dashboard.json`.
- Strength dashboard: 22 panels, UID `garmin-strength-training`, JSON path `Grafana_Dashboard/Garmin-Strength-Training-Dashboard.json`.
- PostgreSQL-converted dashboard also exists, but it depends on the reference project's PostgreSQL schema and is not directly portable to Cloudflare D1.

## Adaptation strategy
Treat the 62-panel dashboard as the feature inventory and visual design reference, not as a direct import. Its InfluxQL queries, datasource, measurements and GPS streams are not compatible with our D1 API. Build equivalents only when our authenticated live schema/records prove the metric exists.

Priority families:
1. Activity overview/history: activity list, distance, duration, calories, average/max HR, sport.
2. Daily health trends: steps, resting HR, stress, weight, sleep score/stages, respiration, SpO2, HRV, Body Battery, VO2 max (only confirmed fields).
3. Activity drilldown: pace/speed, HR, altitude, cadence and GPS only if detailed stream records and API support are verified.
4. Strength dashboard: sets/reps/weight, workout volume, exercise labels, estimated 1RM and HR zones only if matching D1 records exist.

## Compatibility rules
- Preserve the existing Training Center dashboard UIDs and panel IDs; selectively adapt concepts, do not replace them wholesale.
- Keep Cloudflare D1 as the source of truth and Worker read-only APIs as the access layer.
- Do not import InfluxQL or PostgreSQL SQL into D1 endpoints.
- Keep units and derived calculations explicitly validated; no guessing from field names alone.
- The reference's 62 panels and 22 strength panels are inventory, not a promise that all data exists in our D1.

## Audit status
The public reference dashboard files were fetched and their panel counts/titles inspected. Live D1 field mapping is pending authenticated schema access. No deployment/publishing occurred.
