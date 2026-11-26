# Garmin Grafana build roadmap and unblock policy

Updated: 25 November 2026. This roadmap is for PR #10 / branch `feat/grafana-automated-builder`, and explicitly reuses the existing live Garmin dashboard and dashboard JSON assets.

## Goal
Finish a useful, mobile-friendly Garmin Grafana experience while preserving existing working panels and avoiding repeated user copy/paste or unnecessary interruptions.

## Ground truth
- User confirmed the Grafana Cloud instance opens and the existing `garmin dashboard` is accessible.
- A user screenshot confirms an activity table (`query giusta`) showing activity IDs/names and an FC average/max per activity chart render in the existing dashboard.
- Repository assets include Master and Overview dashboards, stable UIDs and panel IDs, candidate metric catalog, read-only API scaffolding, analyzer, tests and reference adaptation plan.
- The current repository checkpoint is not evidence that every PR dashboard is deployed or that historical metric fields/units are validated.
- No production Worker deployment, D1 writes, Garmin sync/backfill, schedule changes or dashboard publishing are authorized by this roadmap.

## Work lanes (parallel where possible)

### Lane 1 — Preserve and inventory existing live dashboard
1. Treat the live dashboard screenshot as a baseline, not a replacement target.
2. Inventory panel titles, queries, IDs, datasource, refresh setting and visual layout from available source/screenshot/UI.
3. Match existing live panels to the dashboard JSON and identify gaps.
4. Do not overwrite working queries/panels. Use stable IDs and UID where editing existing assets.

**Done when:** baseline inventory and a reconciliation list exist; working panels are preserved.

### Lane 2 — Repository / automation reliability
1. Review the PR branch, scripts, workflow, generated JSON and tests.
2. Repair code/tests/docs independently of live Grafana access.
3. Validate local static checks and JSON integrity when tools allow.
4. CI must be reported honestly; stale/pending/unknown is not pass.
5. Keep an automation-safe dashboard build workflow (generator, test, artifacts/checklist), avoiding manual panel JSON copy/paste.

**Done when:** repeatable generation/checks are documented and verified; no unknown CI status is labelled passing.

### Lane 3 — Data discovery and field verification
1. Prefer private schema audit, if accessible.
2. If unavailable, inspect existing Worker route code, existing query results/screenshots and any existing dataset exports available in the project/repository.
3. Produce a candidate-to-verified mapping with type, date coverage, aggregation, units, caveats and source.
4. Mark each field VERIFIED, CANDIDATE or BLOCKED; do not guess field paths or units.
5. Prioritize activity, sleep, HRV, resting HR, steps and weight.

**Done when:** the first panel set has verified mappings or explicitly labelled unavailable/candidate states.

### Lane 4 — Dashboard implementation
Build on the existing assets in this order:
1. Master / overview: key archive counters, activity recency, data quality/coverage.
2. Activity: date, type, duration, distance, HR, elevation and additional metrics only when verified.
3. Recovery: sleep, HRV, resting HR and stress; sparse metrics clearly marked.
4. Body: weight trend and validated composition metrics.
5. Training: load/readiness only if data semantics are confirmed.

Use clear units, date ranges, missingness and sparse-data indicators. Avoid misleading zeroes. Optimize layout for mobile.

**Done when:** panels use verified data, are readable on mobile and keep stable IDs.

### Lane 5 — Grafana verification
1. Verify datasource authentication and query behavior using the user's existing Grafana session.
2. Check each panel, time range, refresh, errors and mobile rendering.
3. If live UI verification cannot be performed remotely, use a short targeted screenshot request only for the specific screen under test; never ask the user to repeat steps that are already known.
4. Record UI verification separately from static code validation.

**Done when:** target panels render in Grafana with confirmed query/data behavior or clearly documented remaining UI checks.

## Blocker handling: never stop at the first obstacle
For any blocker, apply this ladder:
1. **Direct tool/repository path:** use GitHub source, branch files, scripts, tests, JSON validation, docs, and existing query code.
2. **Alternative evidence:** existing live panels, screenshots already provided, exports or query results; carefully label evidence.
3. **Isolate dependency:** mark only the dependent task BLOCKED and continue unrelated tasks.
4. **Fallback implementation:** generate a safe candidate, static structure, test or documentation artifact that does not require the missing access.
5. **User intervention:** request only the smallest specific action needed (prefer a single link/button and screenshot/file); no generic repeated requests.
6. **Resume:** immediately return to independent and newly unblocked tasks; do not wait for the user on unrelated work.

## Status labels and checkpoints
- DONE: validated with evidence.
- IN PROGRESS: active work.
- BLOCKED: specific dependency and fallback attempted.
- CANDIDATE: plausible mapping/design not yet live verified.

Maintain a checkpoint in `grafana/DEVELOPMENT_STATUS.md` after meaningful work. Include next autonomous action, exact blocker (if any), evidence, and avoid inflated claims.

## Definition of finished
- Existing working dashboard preserved.
- Master, Activity, Recovery and Body dashboards/sections implemented using verified fields.
- Secure datasource authentication confirmed.
- Panels render and refresh in Grafana.
- Mobile layout is usable.
- Tests and CI status are truthful.
- No production/backfill mutation without explicit authorization.
