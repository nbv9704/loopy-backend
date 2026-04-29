-- Migration 009: Relax exercise_submissions constraints for auto-grading dev testing
-- Allows submissions without a valid exercise_id or user_id (for dev mode)

-- Drop the foreign key constraint on exercise_id (make it a loose reference)
ALTER TABLE exercise_submissions DROP CONSTRAINT IF EXISTS exercise_submissions_exercise_id_fkey;

-- Drop the foreign key constraint on user_id (allow dev test UUIDs)
ALTER TABLE exercise_submissions DROP CONSTRAINT IF EXISTS exercise_submissions_user_id_fkey;

-- Make user_id nullable for dev testing
ALTER TABLE exercise_submissions ALTER COLUMN user_id DROP NOT NULL;

-- Make exercise_id nullable
ALTER TABLE exercise_submissions ALTER COLUMN exercise_id DROP NOT NULL;

-- Make execution_time have a default value
ALTER TABLE exercise_submissions ALTER COLUMN execution_time SET DEFAULT 0;
