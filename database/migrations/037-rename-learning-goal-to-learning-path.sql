-- 037-rename-learning-goal-to-learning-path.sql
-- Rename learning_goal to learning_path for clarity
-- This tracks the user's selected learning path (first_steps, school_foundation, logic_builder, project_starter)

BEGIN;

ALTER TABLE user_profiles
RENAME COLUMN learning_goal TO learning_path;

-- Update comment
COMMENT ON COLUMN user_profiles.learning_path IS 'User-selected learning path: first_steps, school_foundation, logic_builder, or project_starter';

COMMIT;
