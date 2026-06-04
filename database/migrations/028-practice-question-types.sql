-- Migration 028: Align practice question types with quiz builder
-- Purpose: Replace code_challenge with quiz-style types used by practice sets.

ALTER TABLE practice_questions
  DROP CONSTRAINT IF EXISTS practice_questions_type_check,
  DROP CONSTRAINT IF EXISTS practice_question_valid_choice,
  DROP CONSTRAINT IF EXISTS practice_question_valid_code;

ALTER TABLE practice_questions
  ADD CONSTRAINT practice_questions_type_check
    CHECK (type IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')),
  ADD CONSTRAINT practice_question_valid_answer
    CHECK (
      type NOT IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')
      OR correct_answer IS NOT NULL
    );
