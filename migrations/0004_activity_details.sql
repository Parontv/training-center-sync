-- Migration 0004: Garmin activity details.
CREATE TABLE IF NOT EXISTS activity_details (
  activity_id TEXT PRIMARY KEY,
  source_endpoint TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
