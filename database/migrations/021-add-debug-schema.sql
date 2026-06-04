-- Migration 021: Add data-driven debug schema to lessons table

-- Add debug-related columns to store debug challenge data
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS debug_starter_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS debug_task_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS debug_validation_rules JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS debug_hint TEXT DEFAULT '';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lessons_debug_starter_code ON lessons (debug_starter_code);

-- Add comments explaining the structure
COMMENT ON COLUMN lessons.debug_starter_code IS 'Starter code for debug step (Fix) - code with intentional bug(s)';
COMMENT ON COLUMN lessons.debug_task_description IS 'Task description for debug step - what user needs to fix';
COMMENT ON COLUMN lessons.debug_validation_rules IS 'JSON array of validation rules for debug step: [{"type": "rule|exact|regex|stdout", "value": "...", "description": "..."}]';
COMMENT ON COLUMN lessons.debug_hint IS 'Hint for debug step - help user find the bug';
