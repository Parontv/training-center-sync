# Grafana Garmin Clone: Audit Snapshot (2026-11-25)

## Confirmed repository facts
- Original dashboard asset: `grafana/dashboards/garmin-original-clone.json`
- Original dashboard title: Garmin Stats
- Original dashboard inventory: 62 panels, 143 targets
- Infinity mapping template: 143 entries, 0 marked verified
- Clone source contains 46 targets with visible legacy query strings; many other targets have no query string in the JSON export.
- Important structural mismatch discovered: original targets do not expose target `ref` values in the source JSON as expected by mapping template. The mapping template instead assumes letter refs (A, B, etc.). This must be resolved by deterministic positional assignment before 1:1 mapping.
- Current draft converter only wires targets where mappings are verified and structurally valid; otherwise it intentionally leaves them inert.
- Candidate-builder workflow exists but creates heuristic candidate panels, not a faithful 62-panel clone. It is not the primary path to the finish.

## CI status evidence
- Commit `7326a4f721f60308edac60684cd4280602438b34` was associated with a catalog/analytics validation workflow run that completed successfully.
- Run: https://github.com/Parontv/training-center-sync/actions/runs/45707026998
- This success validates existing repository tests, not a live Grafana import or real panel rendering.

## Main blockers to a faithful integration
1. No verified field-to-panel mapping against actual live Garmin D1 values yet.
2. Target refs are absent/undefined in source JSON and mapping-template identity relies on assumed refs.
3. Legacy query logic is partly InfluxQL and partly hidden/non-query target configuration; endpoint compatibility and aggregation semantics must be understood.
4. Infinity datasource UID and Worker endpoint must be confirmed in the actual Grafana instance.
5. GPS/activity-detail panels require a data shape beyond simple scalar metric series and likely a dedicated data endpoint/transform path.

## Next engineering sequence
1. Normalize panel-target identity using panel ID + target index, preserving original IDs and ordering; emit A/B/C ref labels deterministically.
2. Generate an exact target inventory (143 rows) with query text, panel metadata, datasource/plugin, unit, transformations and legacy query details.
3. Inspect the live schema audit securely and generate coverage-ranked mapping candidates.
4. Map and validate scalar daily/intraday panels first, then sleep, activity summary, GPS/detail panels.
5. Generate the cloned dashboard from the source JSON, retaining panel layout/options and replacing datasource/target wiring.
6. Test JSON structure and endpoint response contracts, then verify import/rendering in Grafana.

## Status
Audit snapshot only. Not a claim that integration is complete or live-tested.
