-- 036-update-chapters-learning-path.sql
-- Distribute chapters across learning paths based on chapter_number
-- Reference: docs/chapters/{language}-chapters.md

BEGIN;

-- Python chapters distribution
UPDATE chapters
SET learning_path = 'first_steps'
WHERE language_id = 'python' AND chapter_number BETWEEN 1 AND 6;

UPDATE chapters
SET learning_path = 'school_foundation'
WHERE language_id = 'python' AND chapter_number BETWEEN 7 AND 14;

UPDATE chapters
SET learning_path = 'logic_builder'
WHERE language_id = 'python' AND chapter_number BETWEEN 15 AND 22;

UPDATE chapters
SET learning_path = 'project_starter'
WHERE language_id = 'python' AND chapter_number BETWEEN 23 AND 29;

-- JavaScript chapters distribution
UPDATE chapters
SET learning_path = 'first_steps'
WHERE language_id = 'javascript' AND chapter_number BETWEEN 1 AND 6;

UPDATE chapters
SET learning_path = 'school_foundation'
WHERE language_id = 'javascript' AND chapter_number BETWEEN 7 AND 14;

UPDATE chapters
SET learning_path = 'logic_builder'
WHERE language_id = 'javascript' AND chapter_number BETWEEN 15 AND 22;

UPDATE chapters
SET learning_path = 'project_starter'
WHERE language_id = 'javascript' AND chapter_number BETWEEN 23 AND 29;

-- C++ chapters distribution
UPDATE chapters
SET learning_path = 'first_steps'
WHERE language_id = 'cpp' AND chapter_number BETWEEN 1 AND 6;

UPDATE chapters
SET learning_path = 'school_foundation'
WHERE language_id = 'cpp' AND chapter_number BETWEEN 7 AND 14;

UPDATE chapters
SET learning_path = 'logic_builder'
WHERE language_id = 'cpp' AND chapter_number BETWEEN 15 AND 22;

UPDATE chapters
SET learning_path = 'project_starter'
WHERE language_id = 'cpp' AND chapter_number BETWEEN 23 AND 29;

COMMIT;
