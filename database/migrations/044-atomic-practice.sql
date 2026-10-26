-- All practice writes that span records share PostgreSQL transaction boundaries.
-- Apply before deploying the backend that calls these RPCs. No data is deleted on migration.
CREATE OR REPLACE FUNCTION save_practice_set_atomically(p_actor_id UUID, p_set_id UUID, p_payload JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_set practice_sets%ROWTYPE;
  v_question JSONB;
  v_admin BOOLEAN;
  v_index INTEGER := 0;
BEGIN
  SELECT is_admin INTO v_admin FROM user_profiles WHERE id = p_actor_id;
  IF COALESCE(p_payload->>'visibility', 'private') = 'official' AND NOT COALESCE(v_admin, FALSE) THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_payload->'questions') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Questions must be an array' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_payload->'questions') NOT BETWEEN 1 AND 30 OR length(btrim(COALESCE(p_payload->>'title', ''))) = 0 THEN
    RAISE EXCEPTION 'A title and 1-30 questions are required' USING ERRCODE = '22023';
  END IF;
  IF p_set_id IS NOT NULL THEN
    SELECT * INTO v_set FROM practice_sets WHERE id = p_set_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Practice set not found' USING ERRCODE = 'P0002'; END IF;
    IF v_set.created_by IS DISTINCT FROM p_actor_id AND NOT COALESCE(v_admin, FALSE) THEN
      RAISE EXCEPTION 'Not the owner' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM practice_attempts WHERE set_id = p_set_id) OR EXISTS (
      SELECT 1 FROM pvp_matches m WHERE m.question_ids && ARRAY(SELECT q.id FROM practice_questions q WHERE q.set_id = p_set_id)
    ) THEN
      RAISE EXCEPTION 'Questions are referenced by practice or PvP history' USING ERRCODE = '22023';
    END IF;
  ELSE
    INSERT INTO practice_sets(created_by, title) VALUES (p_actor_id, p_payload->>'title') RETURNING * INTO v_set;
  END IF;
  UPDATE practice_sets SET
    title = p_payload->>'title', description = p_payload->>'description', topic = p_payload->>'topic',
    language_id = p_payload->>'language_id', difficulty = COALESCE(p_payload->>'difficulty', 'easy'),
    visibility = COALESCE(p_payload->>'visibility', 'private'), status = COALESCE(p_payload->>'status', 'draft'),
    requirements = COALESCE(p_payload->'requirements', '{}'::JSONB),
    owner_type = CASE WHEN p_payload->>'visibility' = 'official' THEN 'official' ELSE 'user' END
  WHERE id = v_set.id;
  DELETE FROM practice_questions WHERE set_id = v_set.id;
  FOR v_question IN SELECT value FROM jsonb_array_elements(p_payload->'questions') LOOP
    INSERT INTO practice_questions(set_id, type, title, prompt, options, correct_answer, starter_code, test_cases, solution_code, explanation, points, order_index)
    VALUES (v_set.id, v_question->>'type', v_question->>'title', v_question->>'prompt', v_question->'options',
      v_question->>'correct_answer', v_question->>'starter_code', v_question->'test_cases', v_question->>'solution_code',
      v_question->>'explanation', COALESCE((v_question->>'points')::INTEGER, 10), COALESCE((v_question->>'order_index')::INTEGER, v_index));
    v_index := v_index + 1;
  END LOOP;
  RETURN v_set.id;
END;
$$;

CREATE OR REPLACE FUNCTION start_practice_attempt_atomically(p_set_id UUID, p_actor_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_set practice_sets%ROWTYPE;
  v_attempt practice_attempts%ROWTYPE;
  v_questions JSONB;
  v_max_score INTEGER;
  v_requirement JSONB;
  v_completed INTEGER;
BEGIN
  -- Same parent lock as edit. Questions cannot be replaced between read and attempt insert.
  SELECT * INTO v_set FROM practice_sets WHERE id = p_set_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Practice set not found' USING ERRCODE = 'P0002'; END IF;
  IF v_set.status = 'archived' THEN RAISE EXCEPTION 'Practice set is archived' USING ERRCODE = '22023'; END IF;
  IF v_set.created_by IS DISTINCT FROM p_actor_id AND NOT (v_set.status = 'published' AND v_set.visibility IN ('public', 'unlisted', 'official')) THEN
    RAISE EXCEPTION 'Set is not visible' USING ERRCODE = '42501';
  END IF;
  v_requirement := v_set.requirements;
  IF v_requirement->>'type' = 'completed_lessons_count' THEN
    IF COALESCE((v_requirement->>'count')::INTEGER, 0) < 1 OR v_requirement->>'languageId' IS NULL THEN
      RAISE EXCEPTION 'Invalid practice requirements' USING ERRCODE = '22023';
    END IF;
    SELECT count(*) INTO v_completed FROM user_progress p
      JOIN lessons l ON l.id = p.lesson_id JOIN chapters c ON c.id = l.chapter_id
      WHERE p.user_id = p_actor_id AND p.status = 'completed' AND l.status = 'published'
        AND c.language_id = v_requirement->>'languageId';
    IF v_completed < (v_requirement->>'count')::INTEGER THEN
      RAISE EXCEPTION 'Practice requirements are not met' USING ERRCODE = '42501';
    END IF;
  END IF;
  SELECT jsonb_agg(to_jsonb(q) - 'correct_answer' - 'solution_code' - 'test_cases' ORDER BY q.order_index), sum(q.points)
    INTO v_questions, v_max_score FROM practice_questions q WHERE q.set_id = p_set_id;
  IF v_questions IS NULL THEN RAISE EXCEPTION 'Practice set has no questions' USING ERRCODE = '22023'; END IF;
  INSERT INTO practice_attempts(set_id, user_id, max_score) VALUES (p_set_id, p_actor_id, v_max_score) RETURNING * INTO v_attempt;
  RETURN jsonb_build_object('attempt', to_jsonb(v_attempt), 'questions', v_questions);
END;
$$;

CREATE OR REPLACE FUNCTION practice_answer_values(p_value TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v_json JSONB;
BEGIN
  BEGIN
    v_json := p_value::JSONB;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN ARRAY(SELECT btrim(value) FROM unnest(string_to_array(p_value, '|')) value WHERE btrim(value) <> '' ORDER BY btrim(value));
  END;
  IF jsonb_typeof(v_json) <> 'array' THEN RETURN ARRAY[]::TEXT[]; END IF;
  RETURN ARRAY(SELECT btrim(value) FROM jsonb_array_elements_text(v_json) value WHERE btrim(value) <> '' ORDER BY btrim(value));
END;
$$;

CREATE OR REPLACE FUNCTION submit_practice_answer_atomically(p_attempt_id UUID, p_question_id UUID, p_actor_id UUID, p_answer TEXT, p_code TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_attempt practice_attempts%ROWTYPE;
  v_question practice_questions%ROWTYPE;
  v_submission practice_submissions%ROWTYPE;
  v_correct BOOLEAN := FALSE;
  v_score INTEGER;
  v_submitted INTEGER;
  v_total INTEGER;
BEGIN
  -- Serializes submits for different questions too, so the aggregate cannot overwrite newer scores.
  SELECT * INTO v_attempt FROM practice_attempts WHERE id = p_attempt_id AND user_id = p_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Practice attempt not found' USING ERRCODE = 'P0002'; END IF;
  IF p_answer IS NULL THEN RAISE EXCEPTION 'Selected answer is required' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_submission FROM practice_submissions WHERE attempt_id = p_attempt_id AND question_id = p_question_id;
  IF FOUND THEN
    IF v_submission.selected_answer IS DISTINCT FROM p_answer OR v_submission.code IS DISTINCT FROM p_code THEN
      RAISE EXCEPTION 'Answer already submitted with a different payload' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('submission', to_jsonb(v_submission), 'attempt', to_jsonb(v_attempt));
  END IF;
  IF v_attempt.status = 'completed' THEN RAISE EXCEPTION 'Practice attempt is already completed' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_question FROM practice_questions WHERE id = p_question_id AND set_id = v_attempt.set_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Practice question not found' USING ERRCODE = 'P0002'; END IF;
  IF v_question.type = 'multiple_select' THEN
    v_correct := cardinality(practice_answer_values(v_question.correct_answer)) >= 2
      AND practice_answer_values(p_answer) = practice_answer_values(v_question.correct_answer);
  ELSIF v_question.type = 'fill_blank' THEN
    v_correct := lower(btrim(p_answer)) = lower(btrim(v_question.correct_answer));
  ELSE
    v_correct := btrim(p_answer) = btrim(v_question.correct_answer);
  END IF;
  INSERT INTO practice_submissions(attempt_id, question_id, user_id, selected_answer, code, is_correct, points_earned)
    VALUES (p_attempt_id, p_question_id, p_actor_id, p_answer, p_code, COALESCE(v_correct, FALSE),
      CASE WHEN v_correct THEN v_question.points ELSE 0 END) RETURNING * INTO v_submission;
  SELECT count(*), COALESCE(sum(points_earned), 0) INTO v_submitted, v_score FROM practice_submissions WHERE attempt_id = p_attempt_id;
  SELECT count(*) INTO v_total FROM practice_questions WHERE set_id = v_attempt.set_id;
  UPDATE practice_attempts SET score = v_score,
    status = CASE WHEN v_submitted >= v_total THEN 'completed' ELSE 'in_progress' END,
    completed_at = CASE WHEN v_submitted >= v_total THEN COALESCE(completed_at, NOW()) ELSE NULL END
    WHERE id = p_attempt_id RETURNING * INTO v_attempt;
  RETURN jsonb_build_object('submission', to_jsonb(v_submission) - 'selected_answer' - 'code', 'attempt', to_jsonb(v_attempt));
END;
$$;

-- A PvP question ID array has no FK. Lock parent sets before storing references and reject stale IDs.
CREATE OR REPLACE FUNCTION lock_pvp_question_sets() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM s.id FROM practice_sets s WHERE EXISTS (
    SELECT 1 FROM practice_questions q WHERE q.set_id = s.id AND q.id = ANY(NEW.question_ids)
  ) ORDER BY s.id FOR SHARE;
  IF cardinality(NEW.question_ids) IS DISTINCT FROM (SELECT count(*)::INTEGER FROM practice_questions WHERE id = ANY(NEW.question_ids)) THEN
    RAISE EXCEPTION 'PvP question selection is stale; retry creating the match' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS lock_pvp_question_sets ON pvp_matches;
CREATE TRIGGER lock_pvp_question_sets BEFORE INSERT OR UPDATE OF question_ids ON pvp_matches FOR EACH ROW EXECUTE FUNCTION lock_pvp_question_sets();

REVOKE ALL ON FUNCTION save_practice_set_atomically(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION start_practice_attempt_atomically(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION submit_practice_answer_atomically(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION save_practice_set_atomically(UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION start_practice_attempt_atomically(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION submit_practice_answer_atomically(UUID, UUID, UUID, TEXT, TEXT) TO service_role;
