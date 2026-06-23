-- 035-add-learning-path-to-chapters.sql
-- Add learning_path column to chapters table to support multiple learning paths per language

BEGIN;

ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS learning_path text NOT NULL DEFAULT 'first_steps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chapters_learning_path_check'
  ) THEN
    ALTER TABLE chapters
    ADD CONSTRAINT chapters_learning_path_check
    CHECK (learning_path IN (
      'first_steps',
      'school_foundation',
      'logic_builder',
      'project_starter'
    ));
  END IF;
END $$;

-- Update schema documentation
COMMENT ON COLUMN chapters.learning_path IS 'Learning path identifier: first_steps, school_foundation, logic_builder, or project_starter';

COMMIT;
