# Garmin Grafana Reference Panel Inventory

Reference source: arpanghosh8453/garmin-grafana, main dashboard JSON (62 panels), accessed 25 Nov 2026.
The source dashboard uses InfluxDB and query syntax that is NOT directly compatible with our D1/Worker datasource. This is a visual/functional blueprint: replicate panel types, layout and concepts while translating each query to verified D1 fields/endpoints. Do not copy incompatible Influx queries verbatim.

## Priority adaptation catalogue

### A — Core health/day overview
- Last Sync (stat)
- Today RHR (gauge/stat)
- Today's Steps (gauge/stat)
- Today SpO2 (stat, if field verified)
- Last Sleep Hours (gauge/stat)
- High Stress Duration (stat, only if data definition verified)
- Steps Cumulative (24h) (time series)
- Steps Hourly (24h) (state timeline)
- Stress (time series)
- Breathing Rates (time series)

### B — Sleep / recovery
- Last Sleep (pie or composition)
- Sleep Intraday Stats (time series)
- Sleep Stages (time series / bar)
- Sleep Movement Activity
- Sleep Score (bar)
- Average Sleep trends
- Sleep Regularity (special panel dependency; use native panel alternative if plugin unavailable)
- Body Battery overview / Body Battery Level Change (if verified)

### C — Activities
- Recent Activity (table)
- Recent Activities (navigation/section)
- Activities (state timeline)
- Today Activity (composition)
- Activity HR Zones (mean)
- Activity Calories (mean)
- Activity HR difference (Max-Avg)
- Activity Distance
- Activity Duration
- Distance vs HR
- Heart Rate vs Pace (XY)
- GPS Track by Velocity (geomap)
- GPS Track by Heart Rate (geomap)
- GPS Track pace / altitude / cadence
- Heatmap for GPS Activity (time-range map)
- Week at a Glance

### D — Long-term trends
- Daily Steps
- Daily Distance
- Daily Calories
- Daily avg health metrics (two reference panels)
- Race Predictions (only if source verified)
- VO2 Max
- Daily Intensity Minutes
- Daily Activity Overview
- Stress overview
- Average Sleep trends
- Body Battery overview
- Weight
- HR Range (Max-Min)
- Month at a Glance (daily average and intraday)
- HR Histogram Heatmap
- Hourly walk heatmap

### E — Optional / source-dependent
- Battery Level (requires GarminHomeAssistant / ConnectIQ source in reference project)
- Strength Training dashboard (separate reference JSON)
- Shoe wear dashboard (separate reference JSON)
- GPS/fit-file detail panels that require activity detail records and a valid track.

## Translation rules for our stack
1. Keep the existing working live activity table and HR chart.
2. Translate visual structure and panel type; do not transplant InfluxQL queries.
3. Validate each candidate field path, unit, coverage and date span before panel query.
4. Prefer Grafana built-in panels (stat, timeseries, bar, pie, table, state timeline, geomap, heatmap, XY chart) where available.
5. Plugins required by reference must be replaced with native equivalents if installation is not possible or appropriate.
6. GPS map panels require valid coordinates/track records and must remain candidates until confirmed.
7. Panel mapping status: VERIFIED DATA / CANDIDATE / UNAVAILABLE / BLOCKED.
8. Do not expose Garmin data or datasource credentials publicly.

## Progress
- Source JSON inspected: 62 panels.
- This catalogue is the visual target and adaptation inventory, not proof that all reference data exists in our archive.
