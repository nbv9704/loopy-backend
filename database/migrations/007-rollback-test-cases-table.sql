-- Rollback Migration 007: Drop test_cases table
-- Feature: auto-grading-system
-- Task: 1.2 - Rollback test_cases table migration

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_test_cases_exercise_order;
DROP INDEX IF EXISTS idx_test_cases_exercise_hidden;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS test_cases CASCADE;

