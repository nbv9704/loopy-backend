-- Import a chapter's lesson payload as one transaction. Any invalid record rolls back all changes.

CREATE OR REPLACE FUNCTION bulk_import_lessons_atomically(
  p_chapter_id UUID,
  p_lessons JSONB
)
RETURNS TABLE (
  lessons_created INTEGER,
  test_cases_created INTEGER,
  test_cases_replaced INTEGER,
  steps_created INTEGER,
  steps_replaced INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson JSONB;
  v_test_case JSONB;
  v_step JSONB;
  v_lesson_row lessons%ROWTYPE;
  v_test_case_count INTEGER;
  v_step_count INTEGER;
  v_lessons_created INTEGER := 0;
  v_test_cases_created INTEGER := 0;
  v_test_cases_replaced INTEGER := 0;
  v_steps_created INTEGER := 0;
  v_steps_replaced INTEGER := 0;
BEGIN
  IF jsonb_typeof(p_lessons) <> 'array' OR jsonb_array_length(p_lessons) = 0 THEN
    RAISE EXCEPTION 'lessons must be a non-empty array';
  END IF;

  FOR v_lesson IN SELECT value FROM jsonb_array_elements(p_lessons)
  LOOP
    IF COALESCE(v_lesson->>'lesson_id', '') = '' OR v_lesson->>'order_index' IS NULL THEN
      RAISE EXCEPTION 'Every lesson requires lesson_id and order_index';
    END IF;

    INSERT INTO lessons (
      chapter_id, lesson_id, title, lesson_type, description, starter_code,
      task_description, hint, hint_level_1, hint_level_2, hint_level_3,
      common_mistakes, solution_code, is_aha_lesson, difficulty, grading_mode,
      validation_type, validation_rules, success_output, failure_hint, order_index, status
    ) VALUES (
      p_chapter_id, v_lesson->>'lesson_id', COALESCE(v_lesson->>'title', ''),
      COALESCE(v_lesson->>'lesson_type', 'code_fix'), COALESCE(v_lesson->>'description', ''),
      COALESCE(v_lesson->>'starter_code', ''), COALESCE(v_lesson->>'task_description', ''),
      COALESCE(v_lesson->>'hint', ''), COALESCE(v_lesson->>'hint_level_1', ''),
      COALESCE(v_lesson->>'hint_level_2', ''), COALESCE(v_lesson->>'hint_level_3', ''),
      COALESCE(v_lesson->>'common_mistakes', ''), COALESCE(v_lesson->>'solution_code', ''),
      COALESCE((v_lesson->>'is_aha_lesson')::BOOLEAN, FALSE),
      COALESCE(v_lesson->>'difficulty', 'beginner'), COALESCE(v_lesson->>'grading_mode', 'stdout'),
      COALESCE(v_lesson->>'validation_type', 'rule'), COALESCE(v_lesson->'validation_rules', '{}'::JSONB),
      COALESCE(v_lesson->>'success_output', ''), COALESCE(v_lesson->>'failure_hint', ''),
      (v_lesson->>'order_index')::INTEGER, COALESCE(v_lesson->>'status', 'draft')
    ) ON CONFLICT (chapter_id, lesson_id) DO UPDATE SET
      title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, description = EXCLUDED.description,
      starter_code = EXCLUDED.starter_code, task_description = EXCLUDED.task_description,
      hint = EXCLUDED.hint, hint_level_1 = EXCLUDED.hint_level_1, hint_level_2 = EXCLUDED.hint_level_2,
      hint_level_3 = EXCLUDED.hint_level_3, common_mistakes = EXCLUDED.common_mistakes,
      solution_code = EXCLUDED.solution_code, is_aha_lesson = EXCLUDED.is_aha_lesson,
      difficulty = EXCLUDED.difficulty, grading_mode = EXCLUDED.grading_mode,
      validation_type = EXCLUDED.validation_type, validation_rules = EXCLUDED.validation_rules,
      success_output = EXCLUDED.success_output, failure_hint = EXCLUDED.failure_hint,
      order_index = EXCLUDED.order_index, status = EXCLUDED.status
    RETURNING * INTO v_lesson_row;

    v_lessons_created := v_lessons_created + 1;

    IF v_lesson ? 'test_cases' THEN
      SELECT COUNT(*) INTO v_test_case_count FROM lesson_test_cases WHERE lesson_id = v_lesson_row.id;
      DELETE FROM lesson_test_cases WHERE lesson_id = v_lesson_row.id;
      v_test_cases_replaced := v_test_cases_replaced + v_test_case_count;

      FOR v_test_case IN SELECT value FROM jsonb_array_elements(COALESCE(v_lesson->'test_cases', '[]'::JSONB))
      LOOP
        IF v_test_case->>'order_index' IS NULL THEN
          RAISE EXCEPTION 'Every test case requires order_index';
        END IF;
        INSERT INTO lesson_test_cases (lesson_id, description, input, expected_output, weight, timeout, is_hidden, order_index)
        VALUES (
          v_lesson_row.id, COALESCE(v_test_case->>'description', ''), COALESCE(v_test_case->'input', '[]'::JSONB),
          v_test_case->'expected_output', COALESCE((v_test_case->>'weight')::INTEGER, 10),
          COALESCE((v_test_case->>'timeout')::INTEGER, 1000), COALESCE((v_test_case->>'is_hidden')::BOOLEAN, FALSE),
          (v_test_case->>'order_index')::INTEGER
        );
        v_test_cases_created := v_test_cases_created + 1;
      END LOOP;
    END IF;

    IF v_lesson ? 'steps' THEN
      SELECT COUNT(*) INTO v_step_count FROM lesson_steps WHERE lesson_id = v_lesson_row.id;
      DELETE FROM lesson_steps WHERE lesson_id = v_lesson_row.id;
      v_steps_replaced := v_steps_replaced + v_step_count;

      FOR v_step IN SELECT value FROM jsonb_array_elements(COALESCE(v_lesson->'steps', '[]'::JSONB))
      LOOP
        IF COALESCE(v_step->>'type', '') = '' OR COALESCE(v_step->>'prompt', '') = '' OR v_step->>'order_index' IS NULL THEN
          RAISE EXCEPTION 'Every lesson step requires type, prompt and order_index';
        END IF;
        INSERT INTO lesson_steps (lesson_id, type, title, prompt, options, correct_answer, explanation, hint, is_required, order_index)
        VALUES (
          v_lesson_row.id, v_step->>'type', COALESCE(v_step->>'title', ''), v_step->>'prompt',
          COALESCE(v_step->'options', '[]'::JSONB), v_step->'correct_answer', COALESCE(v_step->>'explanation', ''),
          COALESCE(v_step->>'hint', ''), COALESCE((v_step->>'is_required')::BOOLEAN, FALSE),
          (v_step->>'order_index')::INTEGER
        );
        v_steps_created := v_steps_created + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_lessons_created, v_test_cases_created, v_test_cases_replaced, v_steps_created, v_steps_replaced;
END;
$$;

REVOKE ALL ON FUNCTION bulk_import_lessons_atomically(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION bulk_import_lessons_atomically(UUID, JSONB) TO service_role;
