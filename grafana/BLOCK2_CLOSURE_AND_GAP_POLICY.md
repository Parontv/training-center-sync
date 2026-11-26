# Block 2 closure — candidate mapping matrix

**Status: CLOSED as a mapping-discovery/engineering phase.** Semantic validation remains a downstream gate, not a blocker to conversion work.

- Original dashboard: 62 panels, 143 targets.
- Candidate fields in existing schema evidence catalog: 24.
- Mapping proposals generated: 24; proposals only, not verified or activated.
- Matrix reuses existing schema evidence and stable panel IDs. It does not modify live D1, Worker, Grafana, or Garmin sync.

## Resolution policy for gaps
1. Where a D1 dataset/path candidate exists, create a candidate mapping and validation checklist.
2. Where a direct match does not exist, retain the source target in the conversion queue and use the next relevant dataset/endpoint or activity-detail evidence path; do not invent a match.
3. If source Influx semantics are intraday/GPS/activity-specific, daily-summary data is not considered equivalent. Treat it as a separate conversion path.
4. Unverified candidates are never auto-enabled by the conversion generator.
5. Conversion can continue panel by panel; a gap in one target does not stop the entire dashboard.

## Candidate priority
Steps/distance and daily metrics; HR summary; sleep; calories/intensity; stress; body/fitness. GPS/activity-detail, intraday, HR histogram, race prediction, and advanced panels require separate dataset/API coverage and are not falsely mapped to daily summaries.

## Exit
Discovery, target classification, candidate linkage, gap policy and validation workflow are documented. Proceed to Block 3/API-query layer and query conversion with this matrix. This is not a claim that all metrics are semantically equivalent.
