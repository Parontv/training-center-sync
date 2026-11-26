# Block 5 — source-driven progressive conversion status (2026-11-26)

## Governing requirement
The work is a faithful D1 adaptation of the existing GitHub Garmin Stats dashboard, not a replacement dashboard. The preserved source master is `grafana/dashboards/garmin-original-clone.json` (62 panels, 143 target slots). Panel identities, visual layout, transformations, options, thresholds and source target identity must remain intact unless a query conversion specifically requires a documented change.

## Candidate generation guard
The generic live-candidate generator (`build-live-candidate-dashboard.mjs`) is not a conversion path for the source dashboard. It creates generic schema-derived panels and can multiply JSON leaf fields into misleading panels. Its generated output must not be used as a replacement or imported. Source conversion must use the original 62-panel JSON and stable target keys `panelId:targetIndex`.

## Block 5 daily metrics
- Continue the source-target queue `PROGRESSIVE_CONVERSION_PHASES.json`, prioritizing Phase 5A/5B (daily/simple fields) only when actual evidence validates the field path, date key, value type, unit, semantics and aggregation.
- Existing schema snapshot and CORE_METRIC_EVIDENCE_CATALOG are discovery evidence only; not sufficient to activate queries.
- No guessed mapping is marked VERIFIED or wired.
- Worker endpoint cost and date cardinality must be evaluated before Grafana wiring.
- The progressive dashboard currently has five activity-panel targets connected through `/dashboard-data`; this is a separate activity-summary contract and is not proof of daily metric coverage.

## Block 6/7
Intraday and activity-detail targets remain unconverted until the D1 record data supports compatible time-series/detail semantics. GPS/map data must not be published or exposed by dashboard conversion without explicit user authorization.

## Validation gates
1. Preserve all 62 panel IDs, titles, types, grid positions and source target stable keys.
2. Compare converted panel JSON against source, documenting only necessary query/data-source changes.
3. Test generated JSON and Infinity target contracts synthetically.
4. Runtime-render verification is required before claiming visual/functional closure.
5. No deployment, import, live dashboard publishing, D1 mutation or production changes are performed in this block.

## Status
This report documents the conversion guard and the next evidence-gated path. It does not claim daily metric panels have been verified or completed.
