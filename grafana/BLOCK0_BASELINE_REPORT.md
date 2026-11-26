# Block 0 — Baseline audit and freeze

**Audit date:** 26 November 2026  
**Repository:** `Parontv/training-center-sync`  
**Branch:** `feat/grafana-automated-builder`  
**PR:** #10 (open, draft; not merged)  
**Audit scope:** repository and CI state only. No production Worker/D1, Garmin sync, schedule, datasource, or live dashboard changes.

## Baseline verified

- Repository is private; user has admin/maintain/push permissions.
- PR #10 head SHA observed: `7eeb2ffad125f5664f70b9345a794aef312b8293`.
- PR #10 remains open and in draft state.
- The PR-triggered CI runs associated with this head were retrieved:
  - **Grafana dashboard catalog and analytics validation**, run #441, completed **success**.
  - **Garmin Grafana conversion audits**, run #106, completed **success**.
- Catalog/analytics run #441 completed its validate job. Steps passed include Worker syntax, calendar-date validation, dataset manifest, analyzer smoke and fixture tests, read-only safeguards, catalog generation and JSON validation, dashboard integrity/selectors, progressive-clone build/importability, response and read-only metrics contracts, audit-helper safety, schema-audit privacy, reference inventory and panel-plan validation.
- Conversion audit run #106 completed its audit job. Steps passed include synthetic regression tests, conversion integrity, panel-preservation audit, stable target inventory and guarded-manifest-builder smoke test.

## Reference dashboard and progressive clone

| Asset | Verified result |
|---|---|
| Original | `grafana/dashboards/garmin-original-clone.json` |
| Original title | Garmin Stats |
| Original UID | `feiibsx498gsgb` |
| Original panel count | 62 |
| Original targets | 143 |
| Original datasource target type | InfluxDB |
| Duplicate panel IDs | None found |
| Progressive asset | `grafana/dashboards/garmin-stats-d1-progressive.json` |
| Progressive title | Garmin Stats · D1 Progressive |
| Progressive UID | `garmin-stats-d1-progressive` |
| Progressive panels | 62 |
| Progressive targets currently wired | 5 |
| Progressive duplicate panel IDs | None found |

Panel ID lists were compared: the progressive clone preserves the same 62 panel IDs as the source. The source contains 143 targets; the progressive clone currently wires only 5 targets, intentionally leaving unverified mappings inert.

## Important repository findings

1. The original InfluxDB dashboard is a visual/functional reference; Influx query logic is not directly compatible with the D1/Worker stack.
2. The existing progressive clone preserves panel structure and layout but is not a full conversion.
3. Previously documented limitation remains: the current `/dashboard-data` endpoint is bounded recent data, and Grafana time picker does not server-side filter that response.
4. Authenticated live D1 schema, live Infinity datasource behavior, and actual Grafana rendering of PR assets remain unverified in this audit.
5. The reference mapping issue documented in the audit remains: source target identities need deterministic panel-ID plus target-index mapping rather than assumptions about letter refs.
6. The branch documentation contains an earlier latest-commit reference (`22c3...`) that is stale relative to the currently observed PR head SHA (`7eeb...`). This report records the current observed head.

## Safety boundary

No production Worker deployment, D1 writes, sync/backfill, cron changes, datasource secrets, or Grafana publishing/import was performed.

## Block 0 acceptance

- [x] Repository, PR and branch identified.
- [x] Current PR head observed.
- [x] Current PR-associated CI runs retrieved and successful.
- [x] Source and progressive dashboard structural comparison performed.
- [x] Existing IDs preserved; duplicate IDs absent.
- [x] Outstanding live-verification gaps recorded.
- [x] Protected production boundaries respected.

**Status: COMPLETE.** Ready to begin Block 1 (definitive 62-panel / 143-target reference inventory).
