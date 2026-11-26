# Block 2 — D1 schema and field audit

**Status: PARTIALLY COMPLETE; live evidence blocked by authenticated read-only audit step.**

## Static verification completed
- Inspected Worker route implementation for `/dashboard-schema`, `/dashboard-field-values`, and `/dashboard-field-coverage`.
- Schema endpoint reads JSON leaf nodes from `garmin_records` and `daily_records`, groups by dataset/path/type, reports occurrence counts and bounded examples.
- Field-value endpoint is bounded (limit capped at 5,000), parameterized for dataset/path/date, and source tables are allowlisted.
- Coverage endpoint reports dataset date scope and field presence counts; it explicitly warns that distinct dates are not distinct rows.
- Auth gate uses `SYNC_BEARER_TOKEN`; schema/field endpoint requests are GET and read-only.
- Reviewed the local schema-fetch helper: requires token via environment variable, no token logging, writes a private artifact ignored by git.
- Reviewed the run-page audit flow: uses stored token in the browser, downloads a report, bypasses cache, does not log token. The helper safety checks exist.
- Initialized a 13-dataset candidate catalog and a 143-target validation ledger. No field is marked VERIFIED without live evidence.

## Status ledger
- Verified live fields: **0** (not a claim that the D1 has zero fields; live schema report not yet obtained)
- Candidate targets: **143**
- Datasets in candidate catalogue: **13**
- Exact paths, unit semantics, data ranges and sparsity: awaiting live audit payload.

## Files
- `grafana/LIVE_SCHEMA_CATALOG.json`
- `grafana/FIELD_VALIDATION_LEDGER.json`
- `grafana/test-live-schema-catalog.mjs`

## CI
Added structural ledger regression test to catalog workflow. GitHub run visibility for this new commit remains pending through the current run-query tool.

## Blocker
The live schema endpoint requires the user's secret bearer token, which must not be requested, copied, or committed in chat. The authenticated audit is already wired into the Worker run-page workflow. The user must execute the audit using the existing `training-center-sync` run page, download the report, and attach/upload that private JSON artifact to this project. That is the only live-evidence dependency; work on API contract and conversion architecture continues independently.

No Worker/D1 writes, deployments, sync changes, or production settings were performed.
