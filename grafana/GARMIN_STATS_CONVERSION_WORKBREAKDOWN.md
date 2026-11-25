# Garmin Stats conversion work breakdown

Generated from the 62-panel clone and 143 target audit. This is a sequencing and compatibility triage, not live field validation.

## Conversion order

1. **Daily aggregates / simple scalar panels** (typically lower complexity): RHR, steps, SpO2, sleep hours/score, daily calories, weight, VO2 Max, intensity minutes, daily health metrics. These still require exact field path verification.
2. **Daily multi-series summaries**: stress overview, body battery, sleep stages, activity overview, weekly/monthly summaries.
3. **Intraday streams**: heart rate, stress, respiration, steps timeline, sleep movement, HR histogram/heatmaps. Require timestamp-level data and potentially custom Infinity response shape.
4. **Activity streams/GPS**: GPS maps, HR/pace scatter, cadence, altitude, activity HR zones, track heatmap. These are likely dependent on activity_details availability and should be handled last.

## Panel families
### Other

- ID 14: Intraday Health Stats (row, 0 target)
- ID 25: Support Me! (text, 0 target)
- ID 26: Last Sync  (stat, 1 target)
- ID 41: Activities (state-timeline, 1 target)
- ID 9: Long term visualization (row, 0 target)
- ID 3: Daily Distance (barchart, 1 target)
- ID 11: Daily avg health metrics (timeseries, 3 target)
- ID 51: Daily avg health metrics (timeseries, 3 target)
- ID 4: Daily Intensity Minutes (barchart, 2 target)
- ID 66: Month at a Glance (Daily Average) (state-timeline, 9 target)
- ID 67: Month at a Glance (Intraday) (state-timeline, 5 target)
- ID 20: Hourly walk heatmap (marcusolsson-hourly-heatmap-panel, 1 target)

### Health metrics

- ID 15: Heart Rate (timeseries, 1 target)
- ID 21: Heart Rate Distribution (histogram, 4 target)
- ID 28: Today RHR (gauge, 1 target)
- ID 31: Today SpO2 (gauge, 1 target)
- ID 62: Breathing Rates (timeseries, 1 target)
- ID 43: Activity HR Zones (mean) (piechart, 5 target)
- ID 48: Activity HR difference (Max-Avg) (barchart, 2 target)
- ID 63: Race Predictions (timeseries, 4 target)
- ID 64: VO2 Max (timeseries, 1 target)
- ID 34: Weight (timeseries, 1 target)
- ID 58: HR Range (Max-Min) (barchart, 2 target)
- ID 65: HR Histogram Heatmap (heatmap, 1 target)

### Stress/Body Battery

- ID 29: Stress (timeseries, 2 target)
- ID 33: High Stress Duration (gauge, 1 target)
- ID 19: Body Battery overview (barchart, 2 target)
- ID 18: Stress overview (barchart, 5 target)
- ID 37: Body Battery Level Change (barchart, 2 target)
- ID 60: Battery Level (Requires GarminHomeAssistant from ConnectIQ integration) (timeseries, 1 target)

### Steps

- ID 30: Today's Steps (gauge, 1 target)
- ID 16: Steps Cumulative (24h) (timeseries, 1 target)
- ID 68: Steps Hourly (24h) (state-timeline, 1 target)
- ID 1: Daily Steps (barchart, 1 target)

### Sleep

- ID 32: Last Sleep Hours (gauge, 1 target)
- ID 52: Sleep Movement Activity (timeseries, 1 target)
- ID 36: Last Sleep (piechart, 4 target)
- ID 7: Sleep Intraday Stats (timeseries, 3 target)
- ID 6: Sleep Stages (timeseries, 4 target)
- ID 13: Sleep Stages (barchart, 4 target)
- ID 12: Sleep Score (barchart, 1 target)
- ID 22: Average Sleep trends (piechart, 4 target)
- ID 27: Sleep Regularity (marcusolsson-hourly-heatmap-panel, 1 target)

### Activity summaries

- ID 35: Today Activity (piechart, 4 target)
- ID 44: Activity Calories (mean) (piechart, 2 target)
- ID 53: Activity Distance (barchart, 1 target)
- ID 54: Activity Duration (barchart, 1 target)
- ID 42: Recent Activities (row, 0 target)
- ID 38: Recent Activity (table, 6 target)
- ID 59: Week at a Glance (table, 8 target)
- ID 10: Daily Calories (barchart, 2 target)
- ID 23: Avg Activity over given duration (piechart, 4 target)
- ID 17: Daily Activity Overview (barchart, 4 target)

### GPS/Activity streams

- ID 50: GPS Track by Velocity (geomap, 4 target)
- ID 49: GPS Track by Heart Rate (geomap, 4 target)
- ID 45: GPS Track Heart Rate (barchart, 1 target)
- ID 61: GPS Track Cadence (barchart, 1 target)
- ID 57: Distance vs HR (trend, 4 target)
- ID 55: Heart Rate vs Pace (xychart, 2 target)
- ID 47: GPS Track pace (barchart, 2 target)
- ID 46: GPS Track Altitude (barchart, 1 target)
- ID 69: Heatmap for GPS Activity (within selected time) (geomap, 2 target)

## Preconditions for any converted panel
- Validate field path in live schema and its coverage by date.
- Identify timestamp semantics, unit, aggregation, and missingness.
- Test the endpoint query in Infinity and confirm response format.
- Only then label panel INFINITY_QUERY_READY.
- Visual comparison and rendering test before calling it complete.
