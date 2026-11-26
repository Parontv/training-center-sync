# Phase 0 — audit baseline (2026-11-26)

## Goal
Faithfully convert the existing reference Garmin Stats dashboard (repository `arpanghosh8453/garmin-grafana`) to use the Training Center Garmin archive in D1 `storico_garmin`, through the read-only Worker API and Grafana Infinity. The source dashboard is the template; the goal is not to substitute a new dashboard.

## Audited source and assets
- Reference JSON clone: `grafana/dashboards/garmin-original-clone.json`.
- Reference dashboard UID: `feiibsx498gsgb`.
- Panel/target totals: 62 panels, 143 query targets.
- Stable target key: panelId + targetIndex.
- Source query inventories and semantic audit assets exist in `grafana/dashboards/`.
- Full fidelity is to preserve panel IDs/layout/options/transformations while adapting query semantics and data shape.

## Architecture target
Garmin archive in Cloudflare D1 `storico_garmin` → protected read-only Worker API → Grafana Infinity datasource UID `training-center-d1`. No InfluxDB or duplicate database.

## Current implementation audit
- Authenticated sanitized schema metadata is available for 19 datasets; metadata proves field presence/coverage only, not semantic equivalence or units.
- CORE evidence catalog and panel review candidate ledger are present but remain unverified.
- API scaffolds exist for field values, field coverage and numeric aggregates; static/synthetic contracts exist. Production endpoint behavior is not live-verified.
- Progressive clone asset has only a small subset wired; its activity data is not server-filtered by dashboard time range.
- Thematic dashboards are auxiliary and cannot substitute for the 62-panel reference clone.
- Grafana UI verification is still an external gate.

## Risks/critical issues to address
1. Influx query semantics require explicit conversion; copying query strings is not possible.
2. Mapping must be deterministic and tied to panelId:targetIndex; never infer refs or field meanings.
3. Time picker must be implemented server-side for endpoints/data shapes that support time-series.
4. Daily summary data cannot reproduce intraday panels without suitable time-series data.
5. Activity/GPS panels need stream/detail data and may require specialized endpoints.
6. D1 query cost/load must be bounded; avoid overlapping full schema scans.
7. CI green means static/synthetic validation, not live dashboard rendering.

## Phase 0 exit criteria
- Source/reference identified and 62/143 inventory established: passed.
- Architecture and no-mutation constraints documented: passed.
- External gates documented: passed.
- Roadmap rebuilt around sequential phase closures: passed.

## Phase 1 begins
Source fidelity and target normalization: compare reference JSON/query inventories, preserve metadata and deterministic target identity, then validate structural fidelity before field mapping.

## Safety
No production Worker deployment, D1 mutation, sync/backfill/cron changes, Grafana publishing or PR merge.
