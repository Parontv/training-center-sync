# Garmin Stats → Training Center D1: audit-led roadmap

Updated: 2026-11-26
Branch: feat/grafana-automated-builder (PR #10)

## Objective (single source of truth)
Reproduce the existing Garmin Stats Grafana dashboard from the repository/reference JSON as faithfully as possible, preserving its 62 panels, IDs, layout, visualizations, transformations and intended query semantics, but replace the legacy InfluxDB data path with the user's Garmin archive in Cloudflare D1 (storico_garmin), accessed read-only through the Training Center Worker and Grafana Infinity. This is a clone/conversion project, not a new parallel dashboard project.

## Audit findings
- Source/reference asset: grafana/dashboards/garmin-original-clone.json; reference dashboard UID feiibsx498gsgb.
- Inventory: 62 panels, 143 targets; stable target identity panelId:targetIndex.
- Source queries are legacy Influx semantics and are not directly executable against D1.
- D1 schema metadata has been successfully obtained and sanitized, covering 19 datasets, but schema presence/coverage is not semantic proof.
- Field candidate/evidence catalog and review ledger exist; candidate mappings remain unverified.
- Read-only endpoint scaffolds and tests exist for field values, coverage and aggregates; deployment/live behavior not yet verified.
- Five activity panels are wired structurally in a progressive asset, but this is not a verified Grafana live render and currently lacks proper server-side time filtering.
- Existing Master/Overview/Activity dashboards are auxiliary. They must not replace the faithful 62-panel clone.
- Infinity datasource UID in assets: training-center-d1. Grafana live UI validation remains external.
- All four latest observed GitHub validation workflows for commit 4164475185f2530cf91df5bcb63b195e2e74f355 succeeded. No merge/deployment/publishing was performed.

## Roadmap — sequential, phase-gated, no skipping

### Phase 0 — Audit baseline and plan (COMPLETE)
Inventory assets, source semantics, Worker endpoints, datasets, risks, external gates, and CI. Preserve the source dashboard. Deliver audit report and roadmap.

### Phase 1 — Source fidelity and target normalization (NEXT)
- Verify the full source panel JSON and target inventory against the semantic/query audit.
- Establish deterministic mapping of every target by panelId + targetIndex (never assume ref letters).
- Preserve panel layout, visualization type, options, transformations, units, thresholds, legends, annotations and variables where relevant.
- Produce a source-query semantics ledger: original query/measurement/field/grouping/time behavior, transformations, target type, complexity and intended data shape.
- Test structural fidelity (62 panels, 143 targets) and detect unsupported/hidden features.
Exit: fidelity inventory passes; no panel/target silently lost.

### Phase 2 — D1 dataset/field/time coverage evidence
- Use sanitized schema snapshot and controlled authenticated read-only audits.
- Identify exact source dataset, JSON field path, types, date/timestamp semantics, row cardinality, coverage, missingness and query cost for each target.
- Prioritize CORE daily scalar metrics, then multi-series daily, intraday, and activity/GPS streams.
- Do not mark heuristic matches VERIFIED.
Exit: evidence ledger records proof and remaining unknowns per target.

### Phase 3 — Read-only API and data-shape engineering
- Audit actual Worker endpoint implementation and test contracts.
- Implement/adjust bounded read-only endpoints only where existing API shapes cannot serve a target.
- Ensure date/time picker support server-side, pagination/bounds, auth, source/dataset allowlists and efficient D1 query paths.
- Develop purpose-specific response shapes for scalar series, multi-series, intraday, sleep/activity and GPS where needed.
- Keep production Worker deployment outside this branch gate.
Exit: endpoint unit/synthetic tests and documented query shapes pass.

### Phase 4 — CORE conversion engine and first real panel batch
- Convert targets with complete evidence: field, aggregation, units, time semantics and response shape.
- Generate Infinity queries deterministically from ledger; fail closed when evidence incomplete.
- Start with daily scalar panels (steps, RHR, sleep duration/score, weight, VO2 max, intensity, etc. only where evidence supports them).
- Preserve original panel IDs/layout/options and compare generated JSON.
Exit: batch tests and source-to-D1 semantic checks pass; no placeholder data presented as real.

### Phase 5 — Daily multi-series and activity summary panels
- Stress, Body Battery, sleep stages, activity summaries, weekly/monthly panels.
- Validate transformations, nulls, timezone and date behavior.
Exit: each wired target has evidence and tests.

### Phase 6 — Intraday and specialized visualizations
- Heart rate, stress, respiration, steps timeline, sleep movement/regularity and histograms/heatmaps.
- Verify timestamp granularity, timezone, interpolation/aggregation and Infinity compatibility.
Exit: synthetic/live-query tests and visual data-shape validation.

### Phase 7 — Activity streams, GPS and advanced panels
- Activity detail streams, track maps, HR/pace/cadence/altitude and GPS heatmap.
- Create bounded purpose-built endpoints if needed; preserve panel visual features.
Exit: each complex panel individually validated; unsupported panels documented, never silently faked.

### Phase 8 — Full dashboard build, UI verification and release
- Build the faithful converted clone from the original source.
- Import/test in Grafana using securely configured Infinity datasource.
- Validate time range, units, transformations, data freshness, mobile, all panel groups and side-by-side reference fidelity.
- CI, release checklist and evidence.
Exit: end-to-end verification and user-approved deployment/publishing/merge.

## Execution rules
- Work sequentially: audit → phase implementation → tests → fix failures → close phase → next phase.
- Continue autonomously through repository-accessible work; pause only for genuine external gates (Grafana UI session, secure datasource configuration, deployment/publishing approval).
- Never alter Garmin sync/backfill/cron or D1 data/schema as part of dashboard work.
- No secrets/raw personal audit samples in repository.
- Never declare a field verified on heuristics or field existence alone.
- Keep PR #10 draft; no merge, production deployment or publishing without explicit approval.

## Current status
Phase 0 COMPLETE. Phase 1 is next. Phase 8 is the target release gate.
