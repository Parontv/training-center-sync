-- Training Center: viste analitiche iniziali per D1 storico_garmin
-- Eseguire solo dopo aver verificato il commit/deploy del Worker.
-- Le VIEW non duplicano i dati e non modificano raw_json.
-- Non contiene DROP, DELETE, UPDATE o INSERT.

CREATE VIEW IF NOT EXISTS vw_activities AS
SELECT
  activity_id,
  start_time_local,
  date(start_time_local) AS activity_date,
  activity_type,
  activity_name,
  distance_m,
  CASE WHEN distance_m IS NOT NULL THEN distance_m / 1000.0 END AS distance_km,
  duration_s,
  CASE WHEN duration_s IS NOT NULL THEN duration_s / 60.0 END AS duration_min,
  CASE
    WHEN distance_m > 0 AND duration_s > 0
    THEN duration_s / (distance_m / 1000.0)
  END AS pace_seconds_per_km,
  calories,
  average_hr,
  max_hr,
  first_seen_at,
  last_seen_at,
  raw_json
FROM activities;

CREATE VIEW IF NOT EXISTS vw_daily_records AS
SELECT
  record_date,
  dataset,
  updated_at,
  raw_json
FROM daily_records;

CREATE VIEW IF NOT EXISTS vw_garmin_records AS
SELECT
  dataset,
  record_key,
  record_date,
  source_endpoint,
  retrieved_at,
  raw_json
FROM garmin_records;

CREATE VIEW IF NOT EXISTS vw_activity_details AS
SELECT
  a.activity_id,
  a.start_time_local,
  a.activity_type,
  a.activity_name,
  d.source_endpoint,
  d.retrieved_at,
  d.raw_json AS detail_json
FROM activities a
LEFT JOIN activity_details d
  ON d.activity_id = a.activity_id;
