-- Migration 017: Add status column to lessons table

-- Add status column
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));

-- Set existing lessons to published so we don't break existing content
UPDATE lessons SET status = 'published' WHERE status = 'draft';
