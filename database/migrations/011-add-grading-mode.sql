-- Migration 011: Add grading_mode to lessons table
-- This explicitly defines how a lesson should be graded ('stdout' or 'function')
-- instead of relying on a fallback heuristic.

BEGIN;

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS grading_mode TEXT DEFAULT 'stdout' CHECK (grading_mode IN ('stdout', 'function'));

COMMIT;
