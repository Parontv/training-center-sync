# Grafana development status

Updated 25 November 2026.

## Execution checkpoint
- **Block 0 — baseline recovery: DONE.** User screenshot evidence confirms live Grafana access, an activity table and FC average/max-per-activity chart. Preserve these panels.
- **Block 1 — repository/CI stabilization: VERIFIED for commit fd...** Run 282 completed successfully with all 20 steps. Subsequent contract-test and Activity dashboard commits are awaiting workflow evidence.
- **Reference replication target: IDENTIFIED.** Inspected public garmin-grafana main dashboard JSON and inventoried 62 panels. `grafana/REFERENCE_PANEL_CATALOG.md` records replication priorities. InfluxDB queries require adaptation to D1/Worker.

## Live UI evidence
- Existing Grafana instance accessible; prior screenshot shows activity table and FC chart rendered.
- This does not verify PR dashboard assets, Infinity authentication, or historical metrics.

## Branch / repo
- PR #10 open, no merge performed.
- Branch: feat/grafana-automated-builder.
- Master, Overview and Activity assets preserved and structurally checked.
- Latest commit: `22c3b280aeeb1a036942cf926726c0fa5199c7ba`.
- Run 282 (commit `fdc323f5a37b92baace3476b8b84e65f2a1e8d68`) verified successful; later commits need CI confirmation.

## Data limitations currently confirmed from Worker source
- `/dashboard-data` returns up to 500 recent activities, 100 recent daily-record entries and up to 500 step records.
- Grafana's dashboard time picker is not server-side filtering for this response. Activity dashboard JSON documents this limitation.
- The protected read-only `/dashboard-activity?activityId=` endpoint exists for individual activity details.
- Do not claim full historical trend coverage from the current overview API.

## Protected boundary
- No production Worker/D1, sync/backfill, schedule changes, or live Grafana publishing.
- No guessed field paths, units or metric semantics.
- Publishing/deployment requires explicit authorization.

## Automation-first direction
- Keep private data private; never commit raw audit files or token values.
- CI schema discovery is designed to use the private `SYNC_BEARER_TOKEN` secret and publish only sanitized candidate metadata. It still requires repository secret configuration and a successful workflow execution.
- Prefer validated dashboard artifacts and automated tests over manual Grafana panel editing.

## Next actions
1. Verify latest CI after the recent selector-contract updates.
2. Live-check datasource authentication and Infinity query behavior in Grafana.
3. Use authenticated schema/coverage evidence to prioritize genuine historical panels.
4. Add date-filtered read-only APIs only where they can be connected to Grafana's query time semantics and safely tested.
5. Adapt reference dashboard panels gradually, starting with verified activity/archive data.

## Blockers
- Live authenticated schema and Infinity UI validation require private credentials/configuration not available in this session.
- Repository work continues around those dependencies; no live validation is claimed.
