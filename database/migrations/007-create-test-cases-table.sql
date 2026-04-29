-- Migration 007: Create test_cases table for Auto-Grading System
-- Feature: auto-grading-system
-- Task: 1.2 - Create test_cases table migration
-- Validates Requirements: 1.1, 1.2, 1.5, 1.7, 11.2, 11.3

-- ============================================================================
-- CREATE test_cases TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  weight INTEGER DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  timeout INTEGER DEFAULT 1000 CHECK (timeout > 0),
  description TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Composite index for efficient test case retrieval by exercise and order
CREATE INDEX IF NOT EXISTS idx_test_cases_exercise_order 
ON test_cases(exercise_id, order_index);

-- Composite index for filtering visible/hidden test cases by exercise
CREATE INDEX IF NOT EXISTS idx_test_cases_exercise_hidden 
ON test_cases(exercise_id, is_hidden);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE test_cases IS 'Test cases for automated code grading in exercises';
COMMENT ON COLUMN test_cases.id IS 'Unique identifier for the test case';
COMMENT ON COLUMN test_cases.exercise_id IS 'Foreign key reference to exercises table';
COMMENT ON COLUMN test_cases.input IS 'JSONB containing test case input data';
COMMENT ON COLUMN test_cases.expected_output IS 'JSONB containing expected output for comparison';
COMMENT ON COLUMN test_cases.weight IS 'Weight of this test case in final score calculation (0-100)';
COMMENT ON COLUMN test_cases.timeout IS 'Maximum execution time in milliseconds (must be positive)';
COMMENT ON COLUMN test_cases.description IS 'Human-readable description of what this test case validates';
COMMENT ON COLUMN test_cases.is_hidden IS 'Whether this test case is hidden from students before submission';
COMMENT ON COLUMN test_cases.order_index IS 'Display order of test cases within an exercise';
COMMENT ON COLUMN test_cases.created_at IS 'Timestamp when test case was created';
COMMENT ON COLUMN test_cases.updated_at IS 'Timestamp when test case was last updated';

