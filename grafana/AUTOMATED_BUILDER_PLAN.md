# Automated Grafana Builder: Training Center

## Goal
Extend and automate the **existing Garmin-Grafana dashboard work**, using the Cloudflare D1 archive `storico_garmin` as the only source of truth.

## Existing dashboard assets — mandatory reuse
PR #8 in this repository contains the initial read-only dashboard assets:
- `grafana/dashboards/training-center-master.json` (UID `training-center-master`)
- `grafana/dashboards/training-center-overview.json` (UID `training-center-overview`)
- Grafana Cloud/Infinity datasource setup guidance.

These assets have been reconciled into PR #10, preserving their UIDs and panel IDs. Do not create parallel user dashboards or overwrite existing UIDs/panel IDs. The `tc-d1-catalog` generated dashboard is a temporary schema/catalog helper only.

## Architecture and constraints
- Grafana Cloud -> Infinity backend parser -> authenticated, read-only Worker API -> existing D1 `storico_garmin`.
- D1 remains the source of truth. No copy/second database.
- Worker and Garmin sync schedule are production and remain untouched.
- No publishing or deployment until authorized credentials and stack are verified.

## Dataset scope
Inventory potentially useful data: activities and activity detail, daily wellness, sleep, HRV, resting HR, weight/body composition where present, stress, respiration, pulse ox, steps, intensity minutes, training load/status/readiness/recovery. Hydration is lower priority. Assign CORE, SECONDARY, EXPERIMENTAL or OMIT based on coverage, quality, actionability, visualizability, privacy and performance.

## Phases
1. **Dashboard reconciliation (completed):** PR #8 JSON is carried into PR #10, preserving UIDs/panel IDs; datasource UID consistency is checked.
2. **Live schema audit:** use authenticated read-only `/dashboard-schema` and keep audit artifacts private.
3. **Field verification:** review candidate field paths, date coverage, types, missingness and semantics; units must not be guessed.
4. **Read-only data contracts:** use bounded, parameterized, allowlisted endpoints; no user-supplied SQL; explicitly report missing data and coverage.
5. **Panels:** adapt the existing master dashboard first with verified panels. Use detail dashboards only when the master becomes unwieldy.
6. **Validation:** JSON lint, stable UID/panel IDs, Infinity backend behavior, data shape, time fields and units.
7. **Publishing:** dry-run/export first; upsert via Grafana API only after explicit authorization and scoped credentials.
8. **Rollback:** retain dashboard JSON versions and backups.

## PR #10 current capabilities
- Candidate dataset manifest and helper catalog generator.
- Read-only schema audit and heuristic analyzer (review aid, not ground truth).
- Branch-only `/dashboard-field-values` and `/dashboard-metrics` endpoint implementations, with static safeguard tests.
- CI validation.
- These endpoints are not deployed; no live dashboard publishing is enabled.

## Immediate work

1. CI and local static tests: pending verified execution; synthetic analyzer fixture tests are now included in CI.
2. Configure and verify secure Bearer authentication in the Grafana Infinity datasource.
3. Run the authenticated live schema audit from `/run` once the branch UI is deployed.
4. Review the private audit and verify fields, dates, types, units and coverage.
5. Build real panels against confirmed fields only.
6. Do not treat the generated catalog helper as the final dashboard.
