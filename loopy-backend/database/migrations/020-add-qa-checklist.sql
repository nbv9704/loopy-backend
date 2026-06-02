-- Migration 020: Add QA checklist to lessons table

-- Add qa_checklist column to store checklist items as JSON
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS qa_checklist JSONB DEFAULT '[]';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_lessons_qa_checklist ON lessons USING GIN (qa_checklist);

-- Add comment explaining the structure
COMMENT ON COLUMN lessons.qa_checklist IS 'JSON array of QA checklist items: [{"id": "string", "label": "string", "checked": boolean, "order": number}]';
