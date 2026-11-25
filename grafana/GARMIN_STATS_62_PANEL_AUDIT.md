# Audit operativo replica Garmin Stats

Audit eseguito il 25 novembre 2026 sul branch `feat/grafana-automated-builder`. Solo analisi, nessun dashboard pubblicato o modificato.

## Verifiche strutturali
- JSON: `grafana/dashboards/garmin-original-clone.json`
- Dimensione: 341687 caratteri.
- Pannelli: 62 (atteso 62).
- Tutti i pannelli analizzati conservano ID, titolo, tipo, layout e conteggio targets.
- Il clone è ancora configurato con datasource InfluxDB. È il JSON di riferimento, NON quello pronto per importazione nel nostro ambiente.
- Target finale: replica visuale adattata a Infinity, Worker read-only e D1 `storico_garmin`; non installare InfluxDB.

## Matrice pannelli
| ID | Pannello | Tipo | Target | Famiglia | Stato |
|---:|---|---|---:|---|---|
| 14 | Intraday Health Stats | row | 0 | Other | UNVERIFIED |
| 25 | Support Me! | text | 0 | Other | UNVERIFIED |
| 15 | Heart Rate | timeseries | 1 | Health metrics | UNVERIFIED |
| 26 | Last Sync  | stat | 1 | Other | UNVERIFIED |
| 21 | Heart Rate Distribution | histogram | 4 | Health metrics | UNVERIFIED |
| 29 | Stress | timeseries | 2 | Stress/Body Battery | UNVERIFIED |
| 28 | Today RHR | gauge | 1 | Health metrics | UNVERIFIED |
| 30 | Today's Steps | gauge | 1 | Steps | UNVERIFIED |
| 16 | Steps Cumulative (24h) | timeseries | 1 | Steps | UNVERIFIED |
| 31 | Today SpO2 | gauge | 1 | Health metrics | UNVERIFIED |
| 68 | Steps Hourly (24h) | state-timeline | 1 | Steps | UNVERIFIED |
| 32 | Last Sleep Hours | gauge | 1 | Sleep | UNVERIFIED |
| 62 | Breathing Rates | timeseries | 1 | Health metrics | UNVERIFIED |
| 33 | High Stress Duration | gauge | 1 | Stress/Body Battery | UNVERIFIED |
| 52 | Sleep Movement Activity | timeseries | 1 | Sleep | UNVERIFIED |
| 36 | Last Sleep | piechart | 4 | Sleep | UNVERIFIED |
| 7 | Sleep Intraday Stats | timeseries | 3 | Sleep | UNVERIFIED |
| 35 | Today Activity | piechart | 4 | Activity summary | UNVERIFIED |
| 6 | Sleep Stages | timeseries | 4 | Sleep | UNVERIFIED |
| 43 | Activity HR Zones (mean) | piechart | 5 | Health metrics | UNVERIFIED |
| 44 | Activity Calories (mean) | piechart | 2 | Activity summary | UNVERIFIED |
| 48 | Activity HR difference (Max-Avg) | barchart | 2 | Health metrics | UNVERIFIED |
| 53 | Activity Distance | barchart | 1 | Activity summary | UNVERIFIED |
| 54 | Activity Duration | barchart | 1 | Activity summary | UNVERIFIED |
| 42 | Recent Activities | row | 0 | Activity summary | UNVERIFIED |
| 50 | GPS Track by Velocity | geomap | 4 | Activity detail/GPS | UNVERIFIED |
| 49 | GPS Track by Heart Rate | geomap | 4 | Activity detail/GPS | UNVERIFIED |
| 45 | GPS Track Heart Rate | barchart | 1 | Activity detail/GPS | UNVERIFIED |
| 61 | GPS Track Cadence | barchart | 1 | Activity detail/GPS | UNVERIFIED |
| 57 | Distance vs HR | trend | 4 | Activity detail/GPS | UNVERIFIED |
| 55 | Heart Rate vs Pace | xychart | 2 | Activity detail/GPS | UNVERIFIED |
| 47 | GPS Track pace | barchart | 2 | Activity detail/GPS | UNVERIFIED |
| 46 | GPS Track Altitude | barchart | 1 | Activity detail/GPS | UNVERIFIED |
| 38 | Recent Activity | table | 6 | Activity summary | UNVERIFIED |
| 41 | Activities | state-timeline | 1 | Other | UNVERIFIED |
| 9 | Long term visualization | row | 0 | Other | UNVERIFIED |
| 59 | Week at a Glance | table | 8 | Activity summary | UNVERIFIED |
| 1 | Daily Steps | barchart | 1 | Steps | UNVERIFIED |
| 3 | Daily Distance | barchart | 1 | Other | UNVERIFIED |
| 10 | Daily Calories | barchart | 2 | Activity summary | UNVERIFIED |
| 11 | Daily avg health metrics | timeseries | 3 | Other | UNVERIFIED |
| 51 | Daily avg health metrics | timeseries | 3 | Other | UNVERIFIED |
| 63 | Race Predictions | timeseries | 4 | Health metrics | UNVERIFIED |
| 64 | VO2 Max | timeseries | 1 | Health metrics | UNVERIFIED |
| 69 | Heatmap for GPS Activity (within selected time) | geomap | 2 | Activity detail/GPS | UNVERIFIED |
| 13 | Sleep Stages | barchart | 4 | Sleep | UNVERIFIED |
| 23 | Avg Activity over given duration | piechart | 4 | Activity summary | UNVERIFIED |
| 12 | Sleep Score | barchart | 1 | Sleep | UNVERIFIED |
| 17 | Daily Activity Overview | barchart | 4 | Activity summary | UNVERIFIED |
| 19 | Body Battery overview | barchart | 2 | Stress/Body Battery | UNVERIFIED |
| 4 | Daily Intensity Minutes | barchart | 2 | Other | UNVERIFIED |
| 18 | Stress overview | barchart | 5 | Stress/Body Battery | UNVERIFIED |
| 22 | Average Sleep trends | piechart | 4 | Sleep | UNVERIFIED |
| 37 | Body Battery Level Change | barchart | 2 | Stress/Body Battery | UNVERIFIED |
| 34 | Weight | timeseries | 1 | Health metrics | UNVERIFIED |
| 58 | HR Range (Max-Min) | barchart | 2 | Health metrics | UNVERIFIED |
| 66 | Month at a Glance (Daily Average) | state-timeline | 9 | Other | UNVERIFIED |
| 67 | Month at a Glance (Intraday) | state-timeline | 5 | Other | UNVERIFIED |
| 65 | HR Histogram Heatmap | heatmap | 1 | Health metrics | UNVERIFIED |
| 20 | Hourly walk heatmap | marcusolsson-hourly-heatmap-panel | 1 | Other | UNVERIFIED |
| 27 | Sleep Regularity | marcusolsson-hourly-heatmap-panel | 1 | Sleep | UNVERIFIED |
| 60 | Battery Level (Requires GarminHomeAssistant from ConnectIQ integration) | timeseries | 1 | Other | UNVERIFIED |

## Criteri
- REFERENCE_VERIFIED: struttura originale verificata.
- DATA_MAPPING_VERIFIED: field path e unità verificati nello schema live.
- INFINITY_QUERY_READY: query Infinity adattata e testata.
- GRAFANA_RENDER_VERIFIED: render visuale controllato.
- BLOCKED/UNAVAILABLE: dato o plugin mancante, non simulare valori.

## Prossimo blocco
1. Schema D1 live autenticato (read-only) e copertura/date range.
2. Mappatura dataset/field paths alla matrice.
3. Prioritizzare prima i pannelli senza GPS/stream complessi.
4. Conversione query Infinity per blocchi, mantenendo IDs, gridPos, fieldConfig, options e transformation quando compatibili.
5. Verifica in Grafana.
