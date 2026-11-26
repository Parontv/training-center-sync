# Block 1 — Definitive reference inventory

**Date:** 26 November 2026  
**Branch:** `feat/grafana-automated-builder`  
**Source:** `grafana/dashboards/garmin-original-clone.json` and semantic/query audit assets.

## Inventory outcome

- Source dashboard: Garmin Stats, UID `feiibsx498gsgb`.
- Panels catalogued: **62**.
- Targets catalogued: **143**.
- Every panel ID unique.
- Every target is identified deterministically using `panelId + targetIndex` (stable key, e.g. `21:0`). Legacy ref letters are supplementary.
- No missing legacy refs were detected in the source inventory.
- Query details retained as reference metadata: measurement, field, alias, query type/text, operations, select and groupBy structures where present.
- Panel layout/type metadata retained for all 62 panels.

## Complexity triage (targets)

| Class | Count | Meaning |
|---|---:|---|
| A | 71 | Scalar/daily-aggregate candidates |
| B | 20 | Transform/semantic review candidates |
| C | 52 | Intraday, spatial or complex candidates |
| D | 0 | No target rows in this target-level tally |

This is **conversion complexity triage**, not a verified D1 data mapping. Rows/text panels with no targets are still represented in the panel inventory and are not target rows.

## Tests performed

The generated inventory was re-read from the repository and checked programmatically:

- [x] Exactly 62 panel records.
- [x] Exactly 143 target records.
- [x] 62 unique panel IDs.
- [x] 143 unique stable keys.
- [x] Every stable key matches panel ID + target index.
- [x] Classification counts sum to 143.
- [x] All target classifications are valid (A/B/C/D).
- [x] Each target contains a query-reference metadata object.

**Result: all inventory structural checks passed.**

A regression test was added: `grafana/test-reference-master-inventory.mjs`. The catalog workflow was updated to run it. GitHub workflow evidence for these newest commits was not yet returned by the available run-query wrapper at the time of closure; the previously observed catalog/analytics and conversion-audit runs were successful. This pending CI visibility is recorded separately from the executed inventory structural checks.

## Files added/updated

- `grafana/REFERENCE_MASTER_INVENTORY.json` — full panel and target inventory.
- `grafana/test-reference-master-inventory.mjs` — regression test.
- `.github/workflows/grafana-catalog.yml` — runs the new inventory regression test.
- `grafana/BLOCK1_INVENTORY_REPORT.md` — this closure report.

## Limitations

- Source InfluxDB queries are not executable against D1/Worker and were not copied into any production API.
- Live schema, field paths, unit semantics, data coverage and panel renderability remain outside this inventory block and are handled in subsequent blocks.
- No production data, sync, Worker, schedules or live Grafana publishing changed.

**Status: COMPLETE.** Inventory and regression checks are complete. Proceed to Block 2 data bridge/schema audit.
