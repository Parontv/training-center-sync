-- Migration 0005: metadata for original Garmin activity files in R2.
CREATE TABLE IF NOT EXISTS activity_files (
  activity_id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL,
  byte_size INTEGER,
  source_endpoint TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
