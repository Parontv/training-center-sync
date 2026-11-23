PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS activities (
  activity_id TEXT PRIMARY KEY,
  start_time_local TEXT,
  activity_type TEXT,
  activity_name TEXT,
  distance_m REAL,
  duration_s REAL,
  calories REAL,
  average_hr REAL,
  max_hr REAL,
  raw_json TEXT NOT NULL,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time_local);

CREATE TABLE IF NOT EXISTS daily_records (
  record_date TEXT NOT NULL,
  dataset TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_date, dataset)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  activities_seen INTEGER NOT NULL DEFAULT 0,
  daily_records_seen INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

 
-- Append-safe raw Garmin record archive. The Worker also creates this table
-- defensively at runtime, so existing D1 databases can migrate on next sync.
CREATE TABLE IF NOT EXISTS garmin_records (
  dataset TEXT NOT NULL,
  record_key TEXT NOT NULL,
  record_date TEXT,
  source_endpoint TEXT,
  raw_json TEXT NOT NULL,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dataset, record_key)
);

CREATE INDEX IF NOT EXISTS idx_garmin_records_date
  ON garmin_records(record_date, dataset);

 
-- Resumable historical backfill cursor.
CREATE TABLE IF NOT EXISTS sync_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

 
-- Full activity detail payloads from Garmin Personal API.
CREATE TABLE IF NOT EXISTS activity_details (
  activity_id TEXT PRIMARY KEY,
  source_endpoint TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

 
-- Metadata for original Garmin activity ZIP files stored in Cloudflare R2.
CREATE TABLE IF NOT EXISTS activity_files (
  activity_id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL,
  byte_size INTEGER,
  source_endpoint TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
