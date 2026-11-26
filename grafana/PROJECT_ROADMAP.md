# Training Center / Garmin Grafana — End-to-End Autonomous Build Roadmap

Updated 25 November 2026.

## Project goal
Deliver a reliable, mobile-friendly Garmin analytics experience in Grafana using the existing Training Center sync, D1 archive (`storico_garmin`), Worker and live Grafana dashboard. Preserve existing working assets and integrations. Avoid manual copy/paste by using repeatable code, tests, generated dashboard artifacts and narrow user checkpoints.

## Operating rule: block-based execution
- Work in numbered blocks with explicit acceptance criteria.
- Each block has independent sub-tasks. Complete every unblocked sub-task before reporting a blocker.
- A blocked sub-task does not pause unrelated work or the whole project.
- Use fallback ladders: repo/code → existing dashboard evidence → exports/fixtures → safe candidate scaffolding → smallest user action.
- Ask the user only for interventions that cannot be performed through available tools. Avoid recurring confirmation requests.
- Keep a persistent status ledger with DONE / IN PROGRESS / BLOCKED / CANDIDATE, evidence, next action and dependency.
- Do not falsely claim UI verification, live schema coverage, CI passing, deployment or data correctness.
- Never modify production Worker, D1 data, Garmin sync/backfill, schedules or publish dashboards without explicit authorization.

## Block 0 — Project recovery and baseline (DONE / ongoing reconciliation)
**Purpose:** recover the work already done and establish a baseline.
- Preserve existing Grafana dashboard `garmin dashboard` and its working activity table and FC average/max chart (confirmed by user's screenshot).
- Preserve repository assets `training-center-master.json` and `training-center-overview.json`, UIDs and panel IDs.
- Inventory repository, PR #10, datasource, existing endpoints, panel queries, scripts and test coverage.
- Record the discrepancy between live dashboard and repository assets.
**Acceptance:** baseline and gaps documented; existing working panels not overwritten.

## Block 1 — Repository and CI stabilization
- Audit the PR branch structure and scripts.
- Run static validations and dashboard JSON tests.
- Investigate and fix CI failures, including analyzer fixture regression.
- Ensure generated files are deterministic and tests include safe fixtures.
- Add/update checks that detect accidental UID/panel ID changes and insecure token placement.
**Acceptance:** repeatable checks are documented and CI status is truthfully recorded.

## Block 2 — Data source and secure connectivity
- Inspect current Infinity datasource configuration and existing query pattern.
- Confirm supported secure bearer authentication configuration without exposing credentials.
- Establish a simple read-only connectivity check and a bounded response test.
- Document how to troubleshoot datasource/auth/URL errors.
- If UI access is unavailable, create safe diagnostics and isolate only the UI verification task.
**Acceptance:** authenticated read-only query behavior is confirmed in UI or specifically marked as the sole verification blocker.

## Block 3 — Archive and schema discovery
- Obtain the live schema audit if possible.
- Use existing Worker routes, repository code, available exports and query results as alternate evidence.
- Inventory dataset, field path, type, date span, coverage, unit, aggregation meaning and data caveats.
- Classify each field as VERIFIED, CANDIDATE, SPARSE or UNAVAILABLE.
- Prioritize activities, daily records, sleep, HRV, resting HR, weight, steps, stress, training load.
**Acceptance:** field mapping ledger with evidence and no invented field paths or units.

## Block 4 — Read-only API foundation
- Review current `/dashboard-data` and branch-only metrics/coverage/field endpoints.
- Ensure allowlisted sources/datasets/fields, strict date validation, parameterized SQL, bounded queries, safe errors and read-only access.
- Build API tests and representative fixtures.
- Do not deploy without explicit authorization.
**Acceptance:** endpoints tested in branch with documented contract; deployment remains a separate approval.

## Block 5 — Master dashboard
- Reconcile and reuse existing dashboard.
- Archive counters and dataset/record coverage.
- Recent activities and recent daily records.
- Data quality, freshness and missingness.
- Refresh behavior and phone layout.
**Acceptance:** master panels built using verified API/query sources; UI render separately verified.

## Block 6 — Activity dashboard
- Activity list/table, activity type, date.
- Duration, distance, pace/speed, elevation, HR average/max, and other supported fields.
- Date range, trend and summaries only where definitions are confirmed.
- Reuse the working live activity table and FC chart.
**Acceptance:** useful activity overview and drill-down without overwriting existing working panels.

## Block 7 — Recovery and sleep
- Sleep duration, stages and score when present.
- HRV and baseline when data/semantics confirmed.
- Resting HR, stress, respiration and SpO2 where supported.
- Sparse or unavailable metrics clearly marked; no misleading zeros.
**Acceptance:** verified recovery panels with units and coverage.

## Block 8 — Body and weight
- Weight series and rolling average.
- Body composition only where verified.
- Explicit unit and gaps.
**Acceptance:** trend panels based on verified fields.

## Block 9 — Training and readiness
- Training load, status, recovery/readiness and relevant activity aggregates.
- Validate semantics before use.
- Avoid deriving readiness from unvalidated proxies.
**Acceptance:** training indicators only where data definitions are defensible.

## Block 10 — UX, navigation and mobile
- Dashboard naming and navigation.
- Consistent panel titles, labels, units, tooltips, date range and refresh.
- Responsive/mobile layout and reduced clutter.
- Separate overview from detail dashboards as appropriate.
**Acceptance:** coherent, usable experience on phone.

## Block 11 — End-to-end verification
- Validate datasource auth, API responses, panel queries, empty/error behavior, refresh and time ranges.
- Test each dashboard in UI.
- Check for credential leakage in dashboard JSON, logs, screenshots and repository.
- Capture verification evidence and defects.
**Acceptance:** checklist complete; any remaining issue is explicitly isolated.

## Block 12 — Release and maintenance
- Final dashboard JSON and repository docs.
- Release checklist, backup and rollback instructions.
- Deployment/publishing only after explicit user authorization.
- Maintain sync/backfill as a separate protected subsystem.
- Define future maintenance checks for broken queries, stale data and dashboard compatibility.
**Acceptance:** reproducible release package and maintenance guide; no unauthorized production changes.

## Block ledger and reporting
For each block, maintain:
- status (DONE / IN PROGRESS / BLOCKED / CANDIDATE)
- subtasks completed
- evidence / test results
- dependency and fallback attempted
- next autonomous action

## Definition of project completion
- Existing integration and live working panels preserved.
- Master, Activity, Recovery, Body and Training views completed to the extent supported by verified data.
- Read-only secure connectivity validated.
- Tests and UI verification documented.
- Mobile UX usable.
- Build and maintenance are reproducible.
- Production deployment/publication occurs only after explicit authorization.
