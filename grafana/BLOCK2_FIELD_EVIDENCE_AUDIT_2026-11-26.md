# Block 2 — Field evidence and conservative mapping review (2026-11-26)

## Status: CLOSED for discovery and prioritization; semantic activation intentionally gated

### Evidence available
- Sanitized schema snapshot from run 45883431337, covering 19 datasets in each source snapshot.
- Candidate field inventory and coverage counts retained in `CORE_METRIC_EVIDENCE_CATALOG.json`.
- Stable target mapping review ledger with 11 candidate targets.
- No candidate promoted to VERIFIED. This is intentional: schema/path presence is insufficient proof of units, record cardinality, date semantics, aggregation, or equivalence with original Influx query.

### Prioritized core candidate groups
1. Steps and distance: daily steps and daily summary movement fields.
2. Heart-rate summary: resting/max/min HR candidates.
3. Sleep duration and stage composition.
4. Calories and intensity minutes.
5. Stress metrics.
6. Body/fitness metrics and body battery; HRV explicitly deprioritized due sparse coverage.

### Mapping limitations
- SpO2 candidate schema metadata includes a null-type observation; numeric suitability is not assumed.
- Steps daily data cannot recreate the original intraday cumulative/time-series behavior.
- Stress scale, units, aggregation and date cardinality remain unverified.
- Candidate fields are not automatically enabled in the conversion generator.
- Candidate counts from overlapping schema sources are not merged or interpreted as daily uniqueness.

### Safety gate
- [x] Evidence inventory structurally complete.
- [x] Coverage metadata and candidate statuses retained.
- [x] Candidate metrics and stable target identities documented.
- [x] Automated gate prevents accidental VERIFIED promotion.
- [ ] Semantic verification against authenticated value-level evidence remains pending.
- [ ] Units, aggregation, date/time interpretation and uniqueness remain pending.

### Block 2 exit
Discovery and candidate prioritization closed; no unsafe automatic query activation. This block does not claim metric equivalence.

### Next
Block 3 — validate read-only Worker endpoint implementation, request limits, date filtering, authentication and query-cost safety; use synthetic regression tests and avoid production D1 scans/deployment.
