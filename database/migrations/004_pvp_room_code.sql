-- ============================================================================
-- PvP Room Code Migration
-- Adds a short, human-readable room code to pvp_matches
-- ============================================================================

-- Add room_code column (6-char alphanumeric, unique)
ALTER TABLE pvp_matches
  ADD COLUMN IF NOT EXISTS room_code CHAR(6) UNIQUE;

-- Index for fast lookups by room_code
CREATE INDEX IF NOT EXISTS idx_pvp_matches_room_code
  ON pvp_matches(room_code);

-- Backfill existing matches with random room codes
UPDATE pvp_matches
SET room_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE room_code IS NULL;

-- Make room_code NOT NULL after backfill
ALTER TABLE pvp_matches
  ALTER COLUMN room_code SET NOT NULL;

SELECT 'Migration 004 completed: room_code added to pvp_matches' AS status;
