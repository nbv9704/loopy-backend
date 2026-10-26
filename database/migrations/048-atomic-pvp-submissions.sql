-- Apply before the backend that uses the atomic submission RPC. No existing rows are reset.
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMPTZ;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS question_closed_at TIMESTAMPTZ;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS question_started_index INTEGER;

CREATE OR REPLACE FUNCTION set_pvp_question_phase(p_match_id UUID,p_question_index INTEGER,p_open BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_match pvp_matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM pvp_matches WHERE id=p_match_id FOR UPDATE;
  IF NOT FOUND OR v_match.status::TEXT <> 'in_progress' OR v_match.current_question_index IS DISTINCT FROM p_question_index
    OR p_open IS NULL THEN RETURN jsonb_build_object('changed',FALSE); END IF;
  IF p_open THEN
    -- A reconnect cannot reopen a round that is already in cooldown.
    IF v_match.question_started_index=p_question_index AND v_match.question_closed_at IS NOT NULL THEN
      RETURN jsonb_build_object('changed',FALSE);
    END IF;
    UPDATE pvp_matches SET question_started_at=clock_timestamp(),question_closed_at=NULL,question_started_index=p_question_index
      WHERE id=p_match_id RETURNING * INTO v_match;
  ELSE
    IF v_match.question_started_index IS DISTINCT FROM p_question_index OR v_match.question_closed_at IS NOT NULL THEN
      RETURN jsonb_build_object('changed',FALSE);
    END IF;
    UPDATE pvp_matches SET question_closed_at=clock_timestamp() WHERE id=p_match_id RETURNING * INTO v_match;
  END IF;
  RETURN jsonb_build_object('changed',TRUE,'started_at',v_match.question_started_at);
END;
$$;

CREATE OR REPLACE FUNCTION submit_pvp_answer_atomically(
  p_match_id UUID, p_actor_id UUID, p_question_id UUID, p_payload JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match pvp_matches%ROWTYPE;
  v_participant pvp_participants%ROWTYPE;
  v_question practice_questions%ROWTYPE;
  v_submission pvp_submissions%ROWTYPE;
  v_type TEXT := p_payload->>'submission_type';
  v_answer TEXT := p_payload->>'selected_answer';
  v_processed TEXT;
  v_code TEXT := p_payload->>'code';
  v_correct BOOLEAN := FALSE;
  v_base INTEGER := 0;
  v_points INTEGER := 0;
  v_rank INTEGER;
  v_index INTEGER;
  v_correct_index INTEGER;
  v_correct_id TEXT;
  v_participants INTEGER;
  v_submitted INTEGER;
  v_total INTEGER;
  v_passed INTEGER;
  v_replayed BOOLEAN := FALSE;
BEGIN
  -- One match lock serializes bonus selection, submissions, score and question transitions.
  SELECT * INTO v_match FROM pvp_matches WHERE id=p_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found' USING ERRCODE='P0002'; END IF;
  SELECT * INTO v_participant FROM pvp_participants WHERE match_id=p_match_id AND user_id=p_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not a participant' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_question FROM practice_questions WHERE id=p_question_id;
  IF NOT FOUND OR NOT p_question_id = ANY(v_match.question_ids) THEN
    RAISE EXCEPTION 'Question not found in match' USING ERRCODE='P0002';
  END IF;
  SELECT * INTO v_submission FROM pvp_submissions WHERE match_id=p_match_id AND user_id=p_actor_id AND question_id=p_question_id;
  IF FOUND THEN
    IF v_submission.submission_type::TEXT IS DISTINCT FROM v_type OR v_submission.selected_answer IS DISTINCT FROM v_answer
      OR v_submission.code IS DISTINCT FROM v_code THEN
      RAISE EXCEPTION 'A different answer was already submitted' USING ERRCODE='22023';
    END IF;
    v_replayed := TRUE; -- Retry returns the saved result even after the round closes.
  ELSE
    IF v_match.status::TEXT <> 'in_progress' OR v_match.question_ids[v_match.current_question_index+1] IS DISTINCT FROM p_question_id
      OR v_match.question_started_at IS NULL OR v_match.question_closed_at IS NOT NULL
      OR v_match.question_started_index IS DISTINCT FROM v_match.current_question_index
      OR EXISTS (SELECT 1 FROM pvp_participants WHERE match_id=p_match_id AND NOT COALESCE(is_connected,FALSE))
      OR clock_timestamp() > v_match.question_started_at + make_interval(secs => v_match.time_per_question) THEN
      RAISE EXCEPTION 'Question is no longer accepting answers' USING ERRCODE='22023';
    END IF;
    IF v_type = 'multiple_choice' THEN
      IF v_question.type NOT IN ('multiple_choice','true_false') OR v_answer IS NULL OR length(v_answer) NOT BETWEEN 1 AND 5000
        OR v_code IS NOT NULL OR NULLIF(btrim(v_question.correct_answer),'') IS NULL THEN
        RAISE EXCEPTION 'Invalid answer or question configuration' USING ERRCODE='22023';
      END IF;
      v_processed := v_answer;
      IF v_question.type = 'multiple_choice' AND jsonb_typeof(v_question.options)='array' THEN
        v_index := array_position(ARRAY['A','B','C','D','E','F'],v_answer);
        IF v_index IS NOT NULL AND v_question.options->>(v_index-1) IS NOT NULL THEN
          v_processed := v_question.options->>(v_index-1);
        END IF;
      END IF;
      v_correct := lower(btrim(v_processed)) = lower(btrim(v_question.correct_answer));
      v_base := CASE WHEN v_question.type='true_false' THEN 30 ELSE 50 END;
      v_points := CASE WHEN v_correct THEN v_base ELSE 0 END;
      IF v_correct AND NOT EXISTS (SELECT 1 FROM pvp_submissions s JOIN pvp_participants p
        ON p.match_id=s.match_id AND p.user_id=s.user_id
        WHERE s.match_id=p_match_id AND s.question_id=p_question_id AND s.is_correct) THEN
        v_points := v_points+10;
      END IF;
    ELSIF v_type = 'code_challenge' THEN
      IF v_question.type <> 'code_challenge' OR v_code IS NULL OR length(v_code) NOT BETWEEN 1 AND 10000 OR v_answer IS NOT NULL
        OR jsonb_typeof(p_payload->'test_results') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid code submission or question type' USING ERRCODE='22023';
      END IF;
      v_total := jsonb_array_length(p_payload->'test_results');
      IF v_total=0 OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_payload->'test_results') t
        WHERE jsonb_typeof(t->'passed') IS DISTINCT FROM 'boolean') THEN
        RAISE EXCEPTION 'Code grading requires test results' USING ERRCODE='22023';
      END IF;
      SELECT count(*) INTO v_passed FROM jsonb_array_elements(p_payload->'test_results') t WHERE t->'passed'='true'::JSONB;
      v_correct := v_passed=v_total;
      v_points := round(100.0*v_passed/v_total)::INTEGER;
      IF NOT EXISTS (SELECT 1 FROM pvp_submissions WHERE match_id=p_match_id AND question_id=p_question_id) THEN
        v_points := v_points+10;
      END IF;
    ELSE
      RAISE EXCEPTION 'Unsupported submission type' USING ERRCODE='22023';
    END IF;
    SELECT count(*)+1 INTO v_rank FROM pvp_submissions s JOIN pvp_participants p ON p.match_id=s.match_id AND p.user_id=s.user_id
      WHERE s.match_id=p_match_id AND s.question_id=p_question_id;
    INSERT INTO pvp_submissions(match_id,user_id,question_id,submission_type,selected_answer,code,test_results,is_correct,points_earned,time_taken,submission_rank)
      VALUES(p_match_id,p_actor_id,p_question_id,v_type::question_type,v_answer,v_code,p_payload->'test_results',v_correct,v_points,
        GREATEST(0,floor(extract(epoch FROM clock_timestamp()-v_match.question_started_at))::INTEGER),v_rank)
      RETURNING * INTO v_submission;
    UPDATE pvp_participants SET total_score=COALESCE(total_score,0)+v_points,
      questions_answered=COALESCE(questions_answered,0)+1,
      correct_answers=COALESCE(correct_answers,0)+CASE WHEN v_correct THEN 1 ELSE 0 END
      WHERE id=v_participant.id;
  END IF;
  v_correct_id := lower(v_question.correct_answer);
  IF v_question.type='multiple_choice' THEN
    SELECT ordinality::INTEGER INTO v_correct_index FROM jsonb_array_elements_text(v_question.options) WITH ORDINALITY opt(value,ordinality)
      WHERE lower(btrim(value))=lower(btrim(v_question.correct_answer)) LIMIT 1;
    v_correct_id := COALESCE((ARRAY['A','B','C','D','E','F'])[v_correct_index],v_question.correct_answer);
  END IF;
  SELECT count(*) INTO v_participants FROM pvp_participants WHERE match_id=p_match_id;
  SELECT count(*) INTO v_submitted FROM pvp_submissions s JOIN pvp_participants p ON p.match_id=s.match_id AND p.user_id=s.user_id
    WHERE s.match_id=p_match_id AND s.question_id=p_question_id;
  RETURN to_jsonb(v_submission) || jsonb_build_object('_replayed',v_replayed,'_correct_answer_id',v_correct_id,
    '_question_index',array_position(v_match.question_ids,p_question_id)-1,'_participant_count',v_participants,'_submission_count',v_submitted);
END;
$$;
REVOKE ALL ON FUNCTION submit_pvp_answer_atomically(UUID,UUID,UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION submit_pvp_answer_atomically(UUID,UUID,UUID,JSONB) TO service_role;
REVOKE ALL ON FUNCTION set_pvp_question_phase(UUID,INTEGER,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION set_pvp_question_phase(UUID,INTEGER,BOOLEAN) TO service_role;

-- Extend readiness without changing checksums of earlier migrations.
-- Read-only metadata RPC. It does not execute any progress/import/practice write function.
CREATE OR REPLACE FUNCTION loopy_schema_status()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT jsonb_build_object(
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
