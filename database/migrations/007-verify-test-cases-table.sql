-- Verification Script for Migration 007: test_cases table
-- Feature: auto-grading-system
-- Task: 1.2 - Verify test_cases table migration

-- ============================================================================
-- VERIFY TABLE EXISTS
-- ============================================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'test_cases';

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
  AND table_name = 'test_cases'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFY CHECK CONSTRAINTS
-- ============================================================================

SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'test_cases'
  AND con.contype = 'c'
ORDER BY con.conname;

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
  AND rel.relname = 'test_cases'
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
  AND tablename = 'test_cases'
ORDER BY indexname;

-- ============================================================================
-- TEST INSERT WITH VALID DATA
-- ============================================================================

-- Note: This requires an existing exercise_id. Replace with actual UUID from your exercises table.
-- Example test insert (commented out to prevent errors if no exercises exist):
/*
INSERT INTO test_cases (
  exercise_id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  is_hidden,
  order_index
) VALUES (
  'YOUR_EXERCISE_UUID_HERE',
  '{"numbers": [1, 2, 3, 4, 5]}'::jsonb,
  '{"sum": 15}'::jsonb,
  20,
  1000,
  'Test basic array sum',
  false,
  1
);
*/

-- ============================================================================
-- TEST CHECK CONSTRAINTS
-- ============================================================================

-- Test weight constraint (should fail with weight > 100)
-- Uncomment to test:
/*
INSERT INTO test_cases (
  exercise_id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  is_hidden,
  order_index
) VALUES (
  'YOUR_EXERCISE_UUID_HERE',
  '{}'::jsonb,
  '{}'::jsonb,
  150,  -- Invalid: exceeds 100
  1000,
  'Test invalid weight',
  false,
  1
);
*/

-- Test timeout constraint (should fail with timeout <= 0)
-- Uncomment to test:
/*
INSERT INTO test_cases (
  exercise_id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  is_hidden,
  order_index
) VALUES (
  'YOUR_EXERCISE_UUID_HERE',
  '{}'::jsonb,
  '{}'::jsonb,
  10,
  0,  -- Invalid: must be positive
  'Test invalid timeout',
  false,
  1
);
*/

-- ============================================================================
-- VERIFY CASCADE DELETE
-- ============================================================================

-- This verifies that the foreign key constraint includes ON DELETE CASCADE
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'test_cases'
  AND con.contype = 'f'
  AND pg_get_constraintdef(con.oid) LIKE '%ON DELETE CASCADE%';

