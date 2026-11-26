# Block 3 — Read-only Worker API audit (2026-11-26)

## Status: CODE-SIDE SAFETY GATE CLOSED; runtime remains unverified

### Routes audited
- `/dashboard-schema`
- `/dashboard-field-values`
- `/dashboard-field-coverage`
- `/dashboard-metrics`
- `/dashboard-record-dates`
- `/dashboard-data`

### Safeguards inspected
- Bearer authorization on protected read-only routes.
- GET method restrictions where applicable.
- Allowlisted data sources.
- Bound dataset/path input lengths.
- Strict calendar-date validation and ordered range checks.
- Validated aggregation allowlist.
- Numeric limits clamped and bounded.
- SQL bind parameters used for dataset/path/range/limit values.
- Read-only route inspection and regression checks for prohibited DML/DDL.
- `/dashboard-data` no longer invokes schema initialization.

### Synthetic/static test coverage
Existing test suite includes endpoint contract checks, field endpoint safeguards, strict date validation, read-only dashboard-data regression, conversion fidelity and evidence gates. The latest CI pass for this code-side baseline remains synthetic/static evidence; it is not proof of live Grafana parser behavior or Worker/D1 performance.

### Known runtime risks
- Generic JSON-tree aggregate queries can be expensive; D1 overload was observed during schema discovery. Full scans are serialized and controlled.
- Time range semantics and metric units remain unverified for individual fields.
- Grafana Infinity query parsing, datasource authentication/header and visual rendering cannot be verified from repository-only access.
- No live production deployment is performed as part of this block.

### Block 3 exit
- [x] Route and auth safeguards inspected.
- [x] Input/date/aggregation/limit safeguards inspected.
- [x] Static regression tests exist and CI is passing on the branch baseline.
- [ ] Live deployed endpoint test and Grafana Infinity parser/rendering remain external gates.

No deployment, D1 mutation, sync/backfill or cron modification was made.
