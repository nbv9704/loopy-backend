-- Verification Script for Migration 008: ai_usage_logs table
-- Feature: auto-grading-system
-- Task: 1.3 - Verify ai_usage_logs table migration

-- ============================================================================
-- VERIFY TABLE EXISTS
-- ============================================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'ai_usage_logs';

-- ============================================================================
-- VERIFY COLUMNS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_usage_logs'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'ai_usage_logs'
  AND con.contype = 'f'
ORDER BY con.conname;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'ai_usage_logs'
ORDER BY indexname;

-- ============================================================================
-- TEST INSERT WITH VALID DATA
-- ============================================================================

-- Example test insert (commented out to prevent errors if no submissions exist):
/*
INSERT INTO ai_usage_logs (
  submission_id,
  request_tokens,
  response_tokens,
  total_tokens,
  cache_hit,
  response_time
) VALUES (
  'YOUR_SUBMISSION_UUID_HERE',
  150,
  200,
  350,
  false,
  1250
);
*/

-- Test insert without submission_id (nullable field)
/*
INSERT INTO ai_usage_logs (
  submission_id,
  request_tokens,
  response_tokens,
  total_tokens,
  cache_hit,
  response_time
) VALUES (
  NULL,
  100,
  150,
  250,
  true,
  50
);
*/

-- ============================================================================
-- VERIFY ON DELETE SET NULL
-- ============================================================================

-- This verifies that the foreign key constraint includes ON DELETE SET NULL
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'ai_usage_logs'
  AND con.contype = 'f'
  AND pg_get_constraintdef(con.oid) LIKE '%ON DELETE SET NULL%';

-- ============================================================================
-- VERIFY INDEX PERFORMANCE
-- ============================================================================

-- Check that indexes are being used for common queries
EXPLAIN SELECT * FROM ai_usage_logs 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

EXPLAIN SELECT 
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '1 day';
