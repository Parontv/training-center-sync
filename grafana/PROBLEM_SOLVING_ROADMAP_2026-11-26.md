# Grafana D1 Completion Roadmap — Problem-solving blocks (26 Nov 2026)

## Objective
Make the original Garmin Stats dashboard (62 panels, 143 targets) render verified Garmin data from Cloudflare D1 through the read-only Worker API and Grafana Infinity. Preserve panel IDs/layout. No guessed mappings.

## Block 0 — Establish repeatable evidence (foundation)
**Problem:** Candidate field suggestions are not evidence; private ledger is unavailable in branch fetch and live UI cannot be tested here.
**Approach:** Build a sanitized evidence bundle with field paths, numeric/string type, sample count, coverage date range, representative aggregates (min/max/median/count, carefully limited), and dataset name. Avoid raw personal samples. Store artifacts locally/private, never commit bearer token or raw records.
**Acceptance:** Every candidate metric has a traceable evidence row and gaps are explicit. Reproducible read-only audit can rerun.

## Block 1 — Field mapping and metric semantics
**Approach:** Match each original target to exact D1 dataset/path; confirm meaning, units, timezone/date key, aggregation, null handling, data density, and source measurement. Check cumulative versus delta metrics and seconds versus minutes. Use source query semantics as specification, not candidate score.
**Acceptance:** Mapping ledger fields: panelId:targetIndex, source reference, D1 dataset/path, unit, aggregation, date/time interpretation, coverage, evidence reference, status VERIFIED/UNVERIFIED. Promote only evidence-backed targets.

## Block 2 — Query/API contract for Infinity
**Problem:** API routes exist and static safety tests pass; live runtime/format/performance not verified.
**Approach:** Define three stable response shapes: (a) scalar/table rows, (b) time-series rows {time,value,metric}, (c) activity rows. Use explicit query allowlists and bounded ranges/limits. Add endpoint response examples and parser tests. Prefer narrow metric-specific queries to expensive generic JSON-tree scanning. Add caching only if measured necessary.
**Acceptance:** Tests cover authorized/unauthorized, invalid ranges, empty results, maximum range/limit, consistent types, timezone, and Grafana-compatible JSON.

## Block 3 — Infinity connectivity proof
**Approach:** A minimal test dashboard with one table, one time-series and one stat panel. Verify datasource UID, secure auth configuration, URL, JSON parser/root selector, time-picker interpolation, refresh, error display. Do not put secrets in dashboard JSON.
**Acceptance:** User-visible live results in Grafana and repeatable instructions/config, no secret committed.

## Block 4 — Core daily metrics conversion
**Priority:** Steps, resting HR, SpO2, sleep duration, sleep score, sleep phases, stress duration, calories/intensity, body battery where daily data exists.
**Approach:** Convert targets in batches. For each mapping, compare API values to D1 aggregate and independently calculate a small check; test dashboard range behavior and units. Generate from verified ledger.
**Acceptance:** Each converted target renders and is reconciled against D1 for a chosen date/range; targets marked VERIFIED only after evidence.

## Block 5 — Activity metrics
**Approach:** Activity list/detail, distance, duration, pace/speed, elevation, calories, HR statistics, cadence, sport/type, timestamps and activity identifiers. Define activity query API and field mapping, avoid mixing activity records and daily totals.
**Acceptance:** At least representative running, walking and cycling (if present) correctly displayed; activity detail and aggregate panels verified.

## Block 6 — Intraday metrics
**Approach:** Handle time series with correct timestamp/timezone, sampling density, range limiting and aggregation/downsampling. Prioritize HR, steps, stress, Body Battery, respiration, sleep stages and HRV by availability.
**Acceptance:** A representative series per dataset renders with valid time-picker behavior, gaps/nulls and aggregation validated.

## Block 7 — Advanced/legacy query shapes
**Approach:** Explicitly translate remaining raw InfluxQL and complex visualization types (heatmap, histogram, GPS/map, cumulative/moving average). Treat each as a separate implementation/test pattern; don't substitute averages for distributions.
**Acceptance:** Query equivalence documented and each advanced panel tested against source intent.

## Block 8 — Fidelity and release
**Approach:** Panel-by-panel comparison of all 62 source panels; preserve IDs, titles, units, thresholds, transforms, legends, layout and repeatable date behavior. Record supported, partially supported, unsupported. Backup before import.
**Acceptance:** 143 targets accounted for, every panel classified, all supported panels render, no secrets, CI passes, and final import/publish reviewed.

## Execution order and exit gates
- Work in small batches, but do not add scaffolding without delivering actual data flow.
- The first vertical slice must prove: D1 field -> read-only API -> Infinity -> visible panel -> independently reconciled value.
- Reuse that slice to convert other metrics.
- Live Grafana authentication/session or explicit deployment authorization is an external gate; continue repository and synthetic work around it.
- No Worker deployment, D1 mutation, sync/backfill/cron change, dashboard publish/import, or PR merge without explicit authorization.

## Immediate batch
Start with Block 0/1 on high-priority daily metrics, then create the minimal Infinity proof (Block 3) as soon as live UI access is available. The audit should identify the smallest metrics batch with complete coverage and correct semantics, not simply the most candidate matches.
