-- Rollback Migration 008: Drop ai_usage_logs table
-- Feature: auto-grading-system
-- Task: 1.3 - Rollback ai_usage_logs table migration

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_ai_usage_logs_created_at;
DROP INDEX IF EXISTS idx_ai_usage_logs_cache_hit;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

DROP TABLE IF EXISTS ai_usage_logs CASCADE;
