# Block 3 — Worker API / Grafana Infinity contract audit

**Status: CONTRACT REVIEW COMPLETE; live Grafana connectivity/rendering remains unverified.**

## Existing read-only routes reviewed
- `/dashboard-schema`: authenticated schema discovery.
- `/dashboard-field-values`: raw value inspection for exact paths.
- `/dashboard-field-coverage`: coverage metadata for exact paths.
- `/dashboard-metrics`: date-bounded numeric aggregation by dataset/path.
- `/dashboard-record-dates`, `/dashboard-records`, `/dashboard-data`: existing date/record/activity access (documented elsewhere in the branch).

## Contract observations
- Authentication: bearer token in request header, never dashboard JSON or query URL.
- Data sources: only allowlisted `daily_records` and `garmin_records`.
- Dataset and field-path input lengths are bounded.
- Dates use shared strict calendar-date validation and ordering checks.
- Aggregation allowlist: avg/min/max/sum. SQL aggregate identifier is derived only from validated choice.
- Numeric metric response is daily grouped JSON: date, value, sample count; output includes read-only flag, coverage metadata and an explicit unknown unit (`unit:null`).
- Limits are capped and parameterized; raw field inspection is capped at 5,000 rows, numeric metrics at 2,000 daily points.
- Coverage response reports scope, field presence and type breakdown.
- Static route review found no INSERT/UPDATE/DELETE operations in the reviewed handlers.

## Known limitations / next fixes, if justified by live testing
1. Metric endpoint groups by `record_date`; intraday streams/activity-detail array semantics need separate data-shaping routes or dedicated adapters, not this generic daily endpoint.
2. `unit:null` and generic aggregation deliberately prevent false assumptions but require a verified mapping ledger before production panels.
3. No server-side request for a Grafana time picker can be proven from static review alone; `from/to` bounds are supported, but Infinity query configuration must send them correctly.
4. Schema scanning via `json_tree` is read-only but potentially expensive; do not invoke repeatedly or during backfill without a bounded operational test.
5. The current API is read-only and no deployment was performed.

**Contract review: COMPLETE.** Endpoint contract and static safeguards are documented. Live schema/data and Infinity rendering tests are the remaining validation stage.
