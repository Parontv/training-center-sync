-- Migration 0003: resumable Garmin historical backfill cursor.
-- Safe to run more than once.
CREATE TABLE IF NOT EXISTS sync_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
