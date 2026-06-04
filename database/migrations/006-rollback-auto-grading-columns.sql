-- Rollback Migration 006: Remove Auto-Grading System columns from exercise_submissions table
-- Feature: auto-grading-system
-- Task: 1.1 - Rollback database migration for exercise_submissions table extensions

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_exercise_submissions_graded_at;
DROP INDEX IF EXISTS idx_exercise_submissions_final_score;

-- ============================================================================
-- REMOVE COLUMNS FROM exercise_submissions TABLE
-- ============================================================================

ALTER TABLE exercise_submissions 
DROP COLUMN IF EXISTS test_score,
DROP COLUMN IF EXISTS ai_score,
DROP COLUMN IF EXISTS final_score,
DROP COLUMN IF EXISTS grade_level,
DROP COLUMN IF EXISTS test_results,
DROP COLUMN IF EXISTS ai_analysis,
DROP COLUMN IF EXISTS feedback,
DROP COLUMN IF EXISTS graded_at,
DROP COLUMN IF EXISTS grading_method,
DROP COLUMN IF EXISTS override_by,
DROP COLUMN IF EXISTS override_at,
DROP COLUMN IF EXISTS override_note;
