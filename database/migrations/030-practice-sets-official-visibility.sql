-- Migration 030: Add 'official' visibility to practice_sets
-- Purpose: Allow admin-created sets to have a special 'official' visibility

-- Drop old constraint and re-add with 'official' included
ALTER TABLE practice_sets
  DROP CONSTRAINT IF EXISTS practice_sets_visibility_check;

ALTER TABLE practice_sets
  ADD CONSTRAINT practice_sets_visibility_check
  CHECK (visibility IN ('public', 'private', 'unlisted', 'official'));
