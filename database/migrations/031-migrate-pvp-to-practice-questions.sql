-- Migration 031: Migrate PvP to Practice Questions
-- Purpose: Remove pvp_questions and point pvp_submissions to practice_questions

-- 1. Drop foreign key constraint on pvp_submissions
ALTER TABLE pvp_submissions
  DROP CONSTRAINT IF EXISTS pvp_submissions_question_id_fkey;

-- 2. Drop pvp_questions table (along with its triggers and policies)
DROP TABLE IF EXISTS pvp_questions CASCADE;

-- 3. Add foreign key from pvp_submissions to practice_questions
ALTER TABLE pvp_submissions
  ADD CONSTRAINT pvp_submissions_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES practice_questions(id) ON DELETE CASCADE;
