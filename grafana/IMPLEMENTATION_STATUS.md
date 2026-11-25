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
