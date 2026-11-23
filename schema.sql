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
