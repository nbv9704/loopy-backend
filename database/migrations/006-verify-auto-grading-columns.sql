-- Verification Script for Migration 006: Auto-Grading System columns
-- Feature: auto-grading-system
-- Task: 1.1 - Verify database migration for exercise_submissions table extensions

-- ============================================================================
-- VERIFY COLUMNS EXIST
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exercise_submissions'
  AND column_name IN (
    'test_score',
    'ai_score',
    'final_score',
    'grade_level',
    'test_results',
    'ai_analysis',
    'feedback',
    'graded_at',
    'grading_method',
    'override_by',
    'override_at',
    'override_note'
  )
ORDER BY column_name;

-- ============================================================================
-- VERIFY CHECK CONSTRAINTS
-- ============================================================================

SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'exercise_submissions'
  AND con.contype = 'c'
  AND (
    con.conname LIKE '%test_score%' OR
    con.conname LIKE '%ai_score%' OR
    con.conname LIKE '%final_score%' OR
    con.conname LIKE '%grade_level%' OR
    con.conname LIKE '%grading_method%'
  )
ORDER BY con.conname;

-- ============================================================================
-- VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'exercise_submissions'
  AND con.contype = 'f'
  AND con.conname LIKE '%override_by%'
ORDER BY con.conname;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'exercise_submissions'
  AND (
    indexname = 'idx_exercise_submissions_graded_at' OR
    indexname = 'idx_exercise_submissions_final_score'
  )
ORDER BY indexname;

-- ============================================================================
-- VERIFY COLUMN COMMENTS
-- ============================================================================

SELECT 
  cols.column_name,
  pg_catalog.col_description(c.oid, cols.ordinal_position::int) AS column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
WHERE cols.table_name = 'exercise_submissions'
  AND cols.column_name IN (
    'test_score',
    'ai_score',
    'final_score',
    'grade_level',
    'test_results',
    'ai_analysis',
    'feedback',
    'graded_at',
    'grading_method',
    'override_by',
    'override_at',
    'override_note'
  )
ORDER BY cols.column_name;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- Expected columns (12 total):
-- 1. test_score (integer, nullable)
-- 2. ai_score (integer, nullable)
-- 3. final_score (integer, nullable)
-- 4. grade_level (text, nullable)
-- 5. test_results (jsonb, nullable)
-- 6. ai_analysis (jsonb, nullable)
-- 7. feedback (text, nullable)
-- 8. graded_at (timestamp with time zone, nullable)
-- 9. grading_method (text, nullable, default 'both')
-- 10. override_by (uuid, nullable, foreign key to auth.users)
-- 11. override_at (timestamp with time zone, nullable)
-- 12. override_note (text, nullable)

-- Expected CHECK constraints (5 total):
-- 1. test_score >= 0 AND test_score <= 100
-- 2. ai_score >= 0 AND ai_score <= 100
-- 3. final_score >= 0 AND final_score <= 100
-- 4. grade_level IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')
-- 5. grading_method IN ('test', 'ai', 'both')

-- Expected indexes (2 total):
-- 1. idx_exercise_submissions_graded_at (on graded_at DESC)
-- 2. idx_exercise_submissions_final_score (on final_score DESC)

-- Expected foreign key (1 total):
-- 1. override_by REFERENCES auth.users(id)
