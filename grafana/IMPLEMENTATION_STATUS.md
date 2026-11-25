# Garmin Stats clone conversion status

Updated: 2026-11-25

## Scope and immutable reference
- Source dashboard: `grafana/dashboards/garmin-original-clone.json`
- Original panels: 62
- Original query targets: 143
- Conversion target: Grafana Infinity datasource -> authenticated Cloudflare Worker read-only API -> D1 `storico_garmin`.
- Explicitly excluded: InfluxDB, TinyFish.
- Preserve original panel IDs, titles, panel types, positions, options, thresholds, transforms, and visual layout wherever possible.

## Repository implementation commits
- Infinity endpoint contract: `grafana/INFINITY_ENDPOINT_CONTRACT.md`
- Target conversion queue: `grafana/dashboards/garmin-infinity-conversion-queue.json`
- Integrity checker: `grafana/scripts/audit-conversion-integrity.py`

## Verified in repository source
- Worker has authenticated `/dashboard-metrics` endpoint with date bounds, dataset, exact JSON leaf path, generic numeric aggregation, and read-only response.
- Worker has authenticated `/dashboard-schema` endpoint for schema discovery.
- D1 binding is named `DB` and configured for `storico_garmin`.
- The endpoints are implemented on the branch, but live deployment and live response are not verified.

## Hard external validation gate
To safely map the original 143 queries, the live field-path audit and actual Grafana Infinity datasource testing are needed. The branch checklist documents the audit path. This gate is not a reason to stop repository-side implementation, but it is required before query semantics and panel visuals can be declared complete.

## Status
- Source dashboard audit: COMPLETE (source structure catalogued).
- Semantic target audit: COMPLETE (original Influx query targets catalogued).
- Infinity API contract: DOCUMENTED.
- Target conversion queue: GENERATED; every target is UNVERIFIED.
- Integrity checker: ADDED; execution in a repository checkout remains to be run.
- Live D1 schema validation: BLOCKED pending authenticated live audit.
- Infinity datasource test: BLOCKED pending Grafana access/configuration.
- Final visual comparison: BLOCKED pending datasource and queries.
- Production deployment: NOT AUTHORIZED and not attempted.

## Next work
1. Build and test the Infinity JSON query templates against verified schema paths.
2. Convert daily aggregate panels first, retaining original panel metadata.
3. Work through intraday streams, then activity details/GPS.
4. Test the dashboard import and visual comparison in Grafana.

## Additional implementation artifacts (2026-11-25)
- `grafana/dashboards/garmin-infinity-panel-phases.json`: ordered conversion phase plan grouped by panel family.
- `grafana/dashboards/garmin-infinity-field-mapping-template.json`: 143-target explicit mapping template, all mappings unverified by default; includes guardrails against converting unverified paths.
- No live Grafana/Worker testing was performed in this session.

## Guarded manifest builder
- Added `grafana/scripts/build-verified-query-manifest.py`: emits a query manifest only for explicitly verified mappings with concrete dataset, field path, source dataset, and supported aggregation; unverified rows are skipped and duplicate keys/errors are rejected.
- Added unit tests for its guardrails; local execution not independently verified in this environment.

## Panel preservation tooling
- `grafana/scripts/panel-preservation-audit.py` audits source panel count, target coverage, and panel metadata.
- A regression test covers panel count and unique IDs.

## Infinity draft dashboard generator
- `grafana/scripts/draft-infinity-dashboard.py` creates a draft while preserving panel metadata and keeping unverified targets inert.
- The generator now builds a parameterized `/dashboard-metrics` URL for mappings explicitly marked verified, including source, dataset, field path, aggregation and limit. URL encoding is handled by Python's standard library.
- It includes date/value/sample column selectors and labels the target as a draft pending live Infinity validation.
- Added `grafana/scripts/test-verified-target-url.py` to verify the request parameters, preservation of original target metadata, and fail-closed behavior when mappings are incomplete.
- CI now invokes this regression. CI execution is pending observation; no test result is claimed.

## CI automation
- `.github/workflows/grafana-audit.yml` runs synthetic regressions, conversion integrity, panel preservation, and guarded manifest-builder smoke check on relevant pushes/PRs and manual dispatch.
- CI execution has not yet been observed.

## Source-dashboard preservation regression
- `grafana/scripts/test-real-dashboard-draft-preservation.py` generates from the actual 62-panel source dashboard and checks panel IDs, titles, types, layout, options, field config, transformations, links, descriptions, and target refs.
- Wired into CI. Execution pending.

## Latest implementation
- Draft generator now constructs encoded Worker metric URLs for verified mappings instead of leaving the endpoint URL parameterless.
- Regression test and CI invocation added in the latest commits.
- Live schema validation, datasource auth configuration, Infinity rendering and visual comparison still require external access. Repository-side work continues independently.
