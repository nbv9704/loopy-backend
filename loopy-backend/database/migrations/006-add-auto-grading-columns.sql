-- Migration 006: Add Auto-Grading System columns to exercise_submissions table
-- Feature: auto-grading-system
-- Task: 1.1 - Create database migration file for exercise_submissions table extensions
-- Validates Requirements: 4.7, 4.8, 11.1

-- ============================================================================
-- EXTEND exercise_submissions TABLE
-- ============================================================================

-- Add grading score columns with CHECK constraints
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS test_score INTEGER CHECK (test_score >= 0 AND test_score <= 100),
ADD COLUMN IF NOT EXISTS ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
ADD COLUMN IF NOT EXISTS final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100);

-- Add grade level column with CHECK constraint for valid values
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS grade_level TEXT CHECK (grade_level IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'));

-- Add JSONB columns for storing detailed results and analysis
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS test_results JSONB,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Add feedback and timestamp columns
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- Add grading method column with CHECK constraint and default value
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'both' CHECK (grading_method IN ('test', 'ai', 'both'));

-- Add admin override columns
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS override_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS override_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS override_note TEXT;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying submissions by grading timestamp (descending order)
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_graded_at 
ON exercise_submissions(graded_at DESC);

-- Index for querying submissions by final score (descending order)
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_final_score 
ON exercise_submissions(final_score DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN exercise_submissions.test_score IS 'Score from test-based grading (0-100)';
COMMENT ON COLUMN exercise_submissions.ai_score IS 'Score from AI-based code quality analysis (0-100)';
COMMENT ON COLUMN exercise_submissions.final_score IS 'Combined final score: (test_score * 0.7) + (ai_score * 0.3)';
COMMENT ON COLUMN exercise_submissions.grade_level IS 'Categorical grade: excellent (90-100), good (80-89), satisfactory (70-79), needs_improvement (60-69), poor (0-59)';
COMMENT ON COLUMN exercise_submissions.test_results IS 'JSONB containing detailed test case results';
COMMENT ON COLUMN exercise_submissions.ai_analysis IS 'JSONB containing AI analysis scores, strengths, improvements, and suggestions';
COMMENT ON COLUMN exercise_submissions.feedback IS 'Combined feedback text from test results and AI analysis';
COMMENT ON COLUMN exercise_submissions.graded_at IS 'Timestamp when grading was completed';
COMMENT ON COLUMN exercise_submissions.grading_method IS 'Grading method used: test (test-only), ai (AI-only), both (combined)';
COMMENT ON COLUMN exercise_submissions.override_by IS 'Admin user ID who performed manual score override';
COMMENT ON COLUMN exercise_submissions.override_at IS 'Timestamp of manual score override';
COMMENT ON COLUMN exercise_submissions.override_note IS 'Note explaining the reason for manual score override';
