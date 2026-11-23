-- Migration 0002: append-safe Garmin raw record archive.
-- Safe to run more than once.
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
