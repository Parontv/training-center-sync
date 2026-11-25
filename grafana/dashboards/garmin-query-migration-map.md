# Garmin Stats query migration map (reference-only)

Source: original 62-panel dashboard JSON. Architecture remains Grafana Cloud + Infinity + Worker + D1 `storico_garmin`; no InfluxDB installation.

## Measurement inventory
| Original measurement | Query target count | Panel areas |
|---|---:|---|
| DailyStats | 49 | Daily metrics, steps, activity overview, stress/body battery, weekly/monthly |
| ActivityGPS | 21 | GPS, pace, altitude, cadence, XY relationships and heatmap |
| ActivitySummary | 18 | Activity zone/calorie/distance/duration and recent activity |
| SleepSummary | 17 | Sleep duration/stages/score/trends |
| SleepIntraday | 8 | Sleep movement/stats/stages/regularity |
| HeartRateIntraday | 5 | Heart rate and monthly intraday |
| HeartRate_Intraday | 4 | HR distribution histogram |
| StepsIntraday | 4 | Steps intraday/cumulative/hourly |
| RacePredictions | 4 | Race prediction panels |
| StressIntraday | 3 | Stress and trends |
| HRV_Intraday | 3 | HRV and trends |
| BodyBatteryIntraday | 2 | Body battery intraday |
| BreathingRateIntraday | 2 | Respiration |
| VO2_Max | 1 | VO2 max |
| BodyComposition | 1 | Weight |
| % | 1 | Battery level, external source dependency |

## Translation plan / status
- `DailyStats`, `ActivitySummary`, `SleepSummary`, `HeartRateIntraday`, `StepsIntraday`, `StressIntraday`, `HRV_Intraday`, `BodyBatteryIntraday`, `BreathingRateIntraday`, `VO2_Max`, `BodyComposition`: candidate D1 dataset/field mapping must be matched to live schema, never guessed.
- `ActivityGPS`: candidate activity_details or Garmin GPS payload; only promote when coordinate/series coverage is verified.
- `RacePredictions`: source-dependent; retain as candidate until actual D1 field coverage is confirmed.
- `%`: external GarminHomeAssistant/ConnectIQ dependency, not assumed available in D1.

## Adaptation invariants
1. Preserve source panel IDs, titles, types, layout, field styling and options as far as native Grafana supports.
2. Replace Influx targets with Infinity targets calling the Worker endpoints.
3. Historical charts use `/dashboard-metrics` only after exact dataset and JSON fullkey are verified, date-range-aware.
4. `/dashboard-data` is snapshot data and does not itself implement Grafana time picker filtering.
5. Preserve unsupported panels as clearly marked candidates rather than silently fabricating data.
6. API auth must be via datasource secure configuration; no tokens in panel JSON, URLs or committed files.
7. No Worker deployment, D1 mutation, dashboard publication or PR merge without user authorization.

## Verification blocker
Live schema inventory and Infinity UI/auth validation require the configured private bearer token and datasource UI context. Repository assets and mapping analysis can continue without these; actual field-to-panel conversion cannot safely be asserted until verified schema evidence exists.
