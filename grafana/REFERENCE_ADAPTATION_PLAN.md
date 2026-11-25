# Grafana reference dashboard adaptation plan

## Governing rule
Use the existing Training Center dashboards as the base (UIDs and panel IDs preserved). The external `garmin-grafana` repository is a visual/reference inventory only. Do not import its queries, datasource assumptions, panel IDs, or raw GPS streams. Adapt the concepts to the existing D1 archive and Worker read-only API.

## Adaptation tiers

### Tier 1: Master dashboard (first)
- Sync/data freshness and archive counters (existing overview/catalog sources).
- Coverage indicator: dataset availability, record count, first/last date, gaps where measurable.
- Recent activities table using existing activity metadata.
- Data-quality / sparse-data warning rather than treating missing values as zero.

### Tier 2: Historical daily trends (after live field audit)
- Steps, resting HR, stress, sleep duration/score, HRV, weight.
- Keep recovery metrics together but separate panels where units or sampling differ.
- Show rolling averages only after a verified daily series and date semantics.
- Explicit units and aggregation; no inferred units from field names.

### Tier 3: Activity analytics (after detail audit)
- Activity table, weekly/monthly volume, distance, duration, pace/speed, HR, elevation.
- Activity type distribution and HR/effort summaries only where valid source fields exist.
- GPS map/track panels are deferred: require a privacy and payload-size review, verified coordinates, and user opt-in to display them.

### Tier 4: Advanced/reference-only ideas
- HR histograms, intraday stress/HR, sleep movement, respiration/SpO2, race predictions, VO2 max, Body Battery, strength training analysis, heatmaps.
- Include only if actual dataset coverage, semantics, units, and safe query limits are confirmed.
- Strength-specific panels require classified exercise/sets data; no assumptions from activity JSON.
- Third-party or ConnectIQ-dependent metrics are omitted unless they are present in the archive.

## Panel acceptance checklist
Every adapted panel must have:
1. Confirmed dataset and field path from a private live audit.
2. Verified type, unit, date/time interpretation, coverage and missingness.
3. A bounded allowlisted endpoint/query with safe limits.
4. A stable panel ID on an existing dashboard, avoiding duplicates.
5. A clear title, unit, time range, and missing-data behavior.
6. Test evidence for API response shape and JSON.
7. Grafana UI rendering verification before considering it complete.

## External reference
Reference repository: https://github.com/arpanghosh8453/garmin-grafana
Its panel inventory is inspiration only. Training Center's existing dashboards and data architecture take precedence.

## Current state
The PR's latest static CI run passed. Live schema audit, datasource auth, and Grafana UI rendering are still unverified. No deployment, merge, publishing, sync/backfill or D1 changes are authorized by this plan.
