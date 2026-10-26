-- A check belongs to one saved submission and one version of the lesson content.
-- Keep old submissions/progress intact; legacy grading does not issue completion receipts.
ALTER TABLE lessons ADD COLUMN content_revision BIGINT NOT NULL DEFAULT 1 CHECK (content_revision > 0);

CREATE FUNCTION bump_lesson_content_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  NEW.content_revision := OLD.content_revision + 1;
  RETURN NEW;
END;
$$;
CREATE TRIGGER lesson_content_revision BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION bump_lesson_content_revision();

CREATE FUNCTION invalidate_lesson_detail_checks() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_old UUID;
  v_new UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old := OLD.lesson_id; END IF;
  IF TG_OP <> 'DELETE' THEN v_new := NEW.lesson_id; END IF;
  -- Lock parents in a stable order, including a detail moved to another lesson.
  PERFORM id FROM lessons WHERE id IN (v_old, v_new) ORDER BY id FOR UPDATE;
  UPDATE lessons SET content_revision = content_revision WHERE id IN (v_old, v_new);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER lesson_step_check_revision BEFORE INSERT OR UPDATE OR DELETE ON lesson_steps
  FOR EACH ROW EXECUTE FUNCTION invalidate_lesson_detail_checks();
CREATE TRIGGER lesson_test_check_revision BEFORE INSERT OR UPDATE OR DELETE ON lesson_test_cases
  FOR EACH ROW EXECUTE FUNCTION invalidate_lesson_detail_checks();

CREATE FUNCTION invalidate_chapter_lesson_checks() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.language_id IS DISTINCT FROM OLD.language_id THEN
    PERFORM id FROM lessons WHERE chapter_id = OLD.id ORDER BY id FOR UPDATE;
    UPDATE lessons SET content_revision = content_revision WHERE chapter_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER chapter_language_check_revision BEFORE UPDATE OF language_id ON chapters
  FOR EACH ROW EXECUTE FUNCTION invalidate_chapter_lesson_checks();

CREATE TABLE lesson_check_receipts (
  id UUID PRIMARY KEY REFERENCES lesson_submissions(id) ON DELETE CASCADE,
  sequence BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  content_revision BIGINT NOT NULL CHECK (content_revision > 0)
);
CREATE INDEX lesson_check_receipts_latest ON lesson_check_receipts(user_id, lesson_id, sequence DESC);
ALTER TABLE lesson_check_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON lesson_check_receipts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE lesson_check_receipts_sequence_seq FROM PUBLIC, anon, authenticated;

CREATE FUNCTION record_lesson_check(
  p_user_id UUID, p_lesson_id UUID, p_content_revision BIGINT,
  p_code TEXT, p_result JSONB, p_execution_time INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_id UUID;
  v_passed BOOLEAN;
  v_score INTEGER;
BEGIN
  -- Share lock serializes receipt/complete with content writes, without blocking other learners.
  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id FOR SHARE;
  IF NOT FOUND OR v_lesson.status <> 'published' THEN
    RAISE EXCEPTION 'Lesson not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_lesson.content_revision IS DISTINCT FROM p_content_revision THEN
    RAISE EXCEPTION 'Lesson content changed; check again' USING ERRCODE = 'P0501';
  END IF;
  IF p_user_id IS NULL OR p_code IS NULL OR jsonb_typeof(p_result->'passed') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_result->'score') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_result->'checks') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid check result' USING ERRCODE = '22023';
  END IF;
  v_passed := (p_result->>'passed')::BOOLEAN;
  v_score := (p_result->>'score')::INTEGER;
  IF v_score < 0 OR v_score > 100 OR (v_passed AND v_score <> 100) THEN
    RAISE EXCEPTION 'Invalid check score' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || ':' || p_lesson_id::TEXT));
  INSERT INTO lesson_submissions(user_id, lesson_id, code, is_correct, execution_time,
    test_score, final_score, grade_level, test_results, feedback, graded_at, grading_method)
  VALUES(p_user_id, p_lesson_id, p_code, v_passed, GREATEST(0, COALESCE(p_execution_time, 0)),
    v_score, v_score, CASE WHEN v_passed THEN 'excellent' ELSE 'poor' END,
    jsonb_build_object('passed', v_passed, 'checks', p_result->'checks'),
    CASE WHEN v_passed THEN '✓ Trả lời chính xác!' ELSE p_result->>'hint' END, clock_timestamp(), 'test')
  RETURNING id INTO v_id;
  INSERT INTO lesson_check_receipts(id, user_id, lesson_id, passed, content_revision)
    VALUES(v_id, p_user_id, p_lesson_id, v_passed, v_lesson.content_revision);
  RETURN jsonb_build_object('id', v_id, 'user_id', p_user_id, 'lesson_id', p_lesson_id,
    'passed', v_passed, 'content_revision', v_lesson.content_revision);
END;
$$;

CREATE FUNCTION complete_checked_lesson_atomically(
  p_user_id UUID, p_lesson_id UUID, p_submission_id UUID,
  p_completed_at TIMESTAMPTZ, p_activity_date DATE
) RETURNS TABLE (id UUID, status TEXT, completed_at TIMESTAMPTZ, time_spent INTEGER, was_first_completion BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_lesson lessons%ROWTYPE;
  v_receipt lesson_check_receipts%ROWTYPE;
BEGIN
  SELECT * INTO v_lesson FROM lessons WHERE lessons.id = p_lesson_id FOR SHARE;
  IF NOT FOUND OR v_lesson.status <> 'published' THEN
    RAISE EXCEPTION 'Lesson not found' USING ERRCODE = 'P0002';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || ':' || p_lesson_id::TEXT));
  -- Lost HTTP responses may be retried even after a later content edit/check.
  IF NOT EXISTS (SELECT 1 FROM user_progress p
    WHERE p.user_id = p_user_id AND p.lesson_id = p_lesson_id AND p.status = 'completed') THEN
    SELECT * INTO v_receipt FROM lesson_check_receipts r
      WHERE r.user_id = p_user_id AND r.lesson_id = p_lesson_id ORDER BY r.sequence DESC LIMIT 1;
    IF NOT FOUND OR p_submission_id IS DISTINCT FROM v_receipt.id
      OR v_receipt.passed IS NOT TRUE
      OR v_receipt.content_revision <> v_lesson.content_revision
      OR NOT EXISTS (SELECT 1 FROM lesson_submissions s WHERE s.id = v_receipt.id
        AND s.user_id = p_user_id AND s.lesson_id = p_lesson_id AND s.is_correct IS TRUE AND s.grading_method = 'test') THEN
      RAISE EXCEPTION 'Check the current lesson before completing it' USING ERRCODE = 'P0502';
    END IF;
  END IF;
  RETURN QUERY SELECT * FROM complete_lesson_atomically(p_user_id, p_lesson_id, p_completed_at, p_activity_date);
END;
$$;

-- The unchecked implementation is now internal, callable only by its owner/wrapper.
REVOKE ALL ON FUNCTION complete_lesson_atomically(UUID,UUID,TIMESTAMPTZ,DATE) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION record_lesson_check(UUID,UUID,BIGINT,TEXT,JSONB,INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_checked_lesson_atomically(UUID,UUID,UUID,TIMESTAMPTZ,DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_lesson_check(UUID,UUID,BIGINT,TEXT,JSONB,INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION complete_checked_lesson_atomically(UUID,UUID,UUID,TIMESTAMPTZ,DATE) TO service_role;
REVOKE ALL ON FUNCTION bump_lesson_content_revision(), invalidate_lesson_detail_checks(), invalidate_chapter_lesson_checks() FROM PUBLIC, anon, authenticated;

-- Extend readiness; leave historical migration checksums unchanged.
CREATE OR REPLACE FUNCTION loopy_schema_status()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT jsonb_build_object(
    'lessonChecks', NOT EXISTS (SELECT 1 FROM unnest(ARRAY[
      'public.record_lesson_check(uuid,uuid,bigint,text,jsonb,integer)',
      'public.complete_checked_lesson_atomically(uuid,uuid,uuid,timestamptz,date)']) signature
      WHERE to_regprocedure(signature) IS NULL
        OR NOT COALESCE(has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE'),FALSE)
        OR COALESCE(has_function_privilege('anon',to_regprocedure(signature),'EXECUTE'),TRUE)
        OR COALESCE(has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE'),TRUE))
      AND NOT has_function_privilege('service_role','public.complete_lesson_atomically(uuid,uuid,timestamptz,date)','EXECUTE')
      AND NOT has_any_column_privilege('anon','public.lesson_check_receipts','SELECT')
      AND NOT has_any_column_privilege('authenticated','public.lesson_check_receipts','INSERT')
      AND (SELECT count(*) = 4 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND t.tgenabled IN ('O','A') AND t.tgname IN (
          'lesson_content_revision','lesson_step_check_revision','lesson_test_check_revision','chapter_language_check_revision')),
    'progress', to_regprocedure('public.update_lesson_progress_atomically(uuid,uuid,text,integer)') IS NOT NULL
      AND to_regprocedure('public.complete_lesson_atomically(uuid,uuid,timestamptz,date)') IS NOT NULL,
    'import', to_regprocedure('public.bulk_import_lessons_atomically(uuid,jsonb)') IS NOT NULL,
    'practice', to_regprocedure('public.save_practice_set_atomically(uuid,uuid,jsonb)') IS NOT NULL
      AND to_regprocedure('public.start_practice_attempt_atomically(uuid,uuid)') IS NOT NULL
      AND to_regprocedure('public.submit_practice_answer_atomically(uuid,uuid,uuid,text,text)') IS NOT NULL,
    'pvp', to_regprocedure('public.increment_participant_score(uuid,uuid,integer,boolean)') IS NOT NULL
      AND has_function_privilege('service_role', to_regprocedure('public.increment_participant_score(uuid,uuid,integer,boolean)'), 'EXECUTE')
      AND NOT has_function_privilege('anon', to_regprocedure('public.increment_participant_score(uuid,uuid,integer,boolean)'), 'EXECUTE')
      AND NOT has_function_privilege('authenticated', to_regprocedure('public.increment_participant_score(uuid,uuid,integer,boolean)'), 'EXECUTE'),
    'pvpSubmissions', NOT EXISTS (SELECT 1 FROM unnest(ARRAY[
      'public.submit_pvp_answer_atomically(uuid,uuid,uuid,jsonb)',
      'public.set_pvp_question_phase(uuid,integer,boolean)']) signature
      WHERE to_regprocedure(signature) IS NULL
        OR NOT COALESCE(has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE'),FALSE)
        OR COALESCE(has_function_privilege('anon',to_regprocedure(signature),'EXECUTE'),TRUE)
        OR COALESCE(has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE'),TRUE)),
    'pvpLifecycle', NOT EXISTS (SELECT 1 FROM unnest(ARRAY[
      'public.join_pvp_match_atomically(uuid,uuid)','public.ready_pvp_match_atomically(uuid,uuid)',
      'public.disconnect_pvp_participant(uuid,uuid)','public.finish_pvp_match_atomically(uuid,uuid)']) signature
      WHERE to_regprocedure(signature) IS NULL
        OR NOT COALESCE(has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE'),FALSE)
        OR COALESCE(has_function_privilege('anon',to_regprocedure(signature),'EXECUTE'),TRUE)
        OR COALESCE(has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE'),TRUE)),
    'dataBoundaries', NOT has_any_column_privilege('authenticated', 'public.user_profiles', 'UPDATE')
      AND NOT has_table_privilege('authenticated', 'public.user_progress', 'INSERT')
      AND NOT has_table_privilege('authenticated', 'public.lesson_submissions', 'INSERT')
      AND NOT has_any_column_privilege('anon', 'public.lessons', 'SELECT')
      AND NOT has_any_column_privilege('authenticated', 'public.practice_questions', 'SELECT')
      -- Revoking grants also requires the signup trigger/audit compatibility patch in 046.
      AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'initialize_pvp_user_stats' AND p.prosecdef)
      AND EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = 'public.admin_audit_logs'::regclass
        AND c.contype = 'c' AND pg_get_constraintdef(c.oid) LIKE '%practice_set%')
  );
$$;
REVOKE ALL ON FUNCTION loopy_schema_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION loopy_schema_status() TO service_role;

