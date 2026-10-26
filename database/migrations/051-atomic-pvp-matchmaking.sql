-- Matchmaking must not leave an empty room when eligibility/join fails.
-- User lock makes retries idempotent; queue lock lets simultaneous seekers meet.
CREATE FUNCTION matchmake_pvp_atomically(
  p_actor_id UUID, p_mode TEXT, p_language_id TEXT, p_difficulty TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_match pvp_matches%ROWTYPE;
  v_player JSONB;
  v_questions UUID[];
  v_difficulty TEXT := COALESCE(p_difficulty, 'medium');
  v_created BOOLEAN := FALSE;
  v_replayed BOOLEAN := FALSE;
  v_attempt INTEGER;
BEGIN
  IF p_actor_id IS NULL OR p_mode IS NULL OR p_mode NOT IN ('1v1','battle_royale')
    OR v_difficulty NOT IN ('easy','medium','hard') THEN
    RAISE EXCEPTION 'Invalid matchmaking selection' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('pvp-matchmaking-user:' || p_actor_id::TEXT));
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id=p_actor_id AND onboarding_completed=TRUE)
    OR NOT EXISTS (SELECT 1 FROM user_progress p JOIN lessons l ON l.id=p.lesson_id
      WHERE p.user_id=p_actor_id AND p.status='completed' AND l.status='published') THEN
    RAISE EXCEPTION 'Complete onboarding and a published lesson first' USING ERRCODE='42501';
  END IF;

  -- Resume an existing live membership even if a retry changed the requested filters.
  SELECT m.* INTO v_match FROM pvp_matches m JOIN pvp_participants p ON p.match_id=m.id
    WHERE p.user_id=p_actor_id AND p.left_at IS NULL AND m.status::TEXT IN ('waiting','starting','in_progress')
    ORDER BY CASE WHEN m.status::TEXT='in_progress' THEN 0 ELSE 1 END, m.created_at, m.id
    LIMIT 1 FOR UPDATE OF m;
  IF FOUND THEN
    v_replayed := TRUE;
  ELSE
    PERFORM pg_advisory_xact_lock(hashtext('pvp-matchmaking-queue:' || p_mode || ':' ||
      COALESCE(p_language_id,'*') || ':' || v_difficulty));
    SELECT m.* INTO v_match FROM pvp_matches m
      WHERE m.status::TEXT='waiting' AND m.mode::TEXT=p_mode AND m.difficulty::TEXT=v_difficulty
        AND m.language_id IS NOT DISTINCT FROM p_language_id AND cardinality(m.question_ids)>0
        AND (SELECT count(*) FROM pvp_participants p WHERE p.match_id=m.id)<m.max_players
      ORDER BY m.created_at,m.id LIMIT 1 FOR UPDATE;
    -- A manual join/ready can race the candidate selection without taking the queue lock.
    IF FOUND AND ((SELECT count(*) FROM pvp_participants WHERE match_id=v_match.id)>=v_match.max_players
      OR (SELECT status::TEXT FROM pvp_matches WHERE id=v_match.id)<>'waiting') THEN
      v_match := NULL;
    END IF;
    IF v_match.id IS NULL THEN
      PERFORM s.id FROM practice_sets s
        WHERE s.visibility='official' AND s.status='published' AND s.difficulty=v_difficulty
          AND (p_language_id IS NULL OR s.language_id=p_language_id) ORDER BY s.id FOR SHARE;
      SELECT ARRAY(SELECT q.id FROM practice_questions q JOIN practice_sets s ON s.id=q.set_id
        WHERE s.visibility='official' AND s.status='published' AND s.difficulty=v_difficulty
          AND (p_language_id IS NULL OR s.language_id=p_language_id)
          AND q.type IN ('true_false','multiple_choice') ORDER BY random() LIMIT 5) INTO v_questions;
      IF cardinality(v_questions)=0 THEN
        RAISE EXCEPTION 'No official questions for this selection' USING ERRCODE='P0511';
      END IF;
      FOR v_attempt IN 1..5 LOOP
        BEGIN
          INSERT INTO pvp_matches(mode,language_id,difficulty,max_players,time_per_question,
            question_ids,current_question_index,status,room_code)
          VALUES(p_mode::match_mode,p_language_id,v_difficulty,CASE WHEN p_mode='1v1' THEN 2 ELSE 10 END,
            30,v_questions,0,'waiting',upper(substr(replace(gen_random_uuid()::TEXT,'-',''),1,6)))
          RETURNING * INTO v_match;
          EXIT;
        EXCEPTION WHEN unique_violation THEN
          IF v_attempt=5 THEN RAISE; END IF;
        END;
      END LOOP;
      v_created := TRUE;
    END IF;
  END IF;
  v_player := join_pvp_match_atomically(v_match.id,p_actor_id);
  RETURN jsonb_build_object('match',to_jsonb(v_match) || jsonb_build_object('participants',
      (SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.joined_at,p.id),'[]'::JSONB)
        FROM pvp_participants p WHERE p.match_id=v_match.id)),
    'participant',v_player,'created',v_created,'replayed',v_replayed);
END;
$$;
REVOKE ALL ON FUNCTION matchmake_pvp_atomically(UUID,TEXT,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION matchmake_pvp_atomically(UUID,TEXT,TEXT,TEXT) TO service_role;

-- Extend readiness without editing historical migrations.
CREATE OR REPLACE FUNCTION loopy_schema_status()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT jsonb_build_object(
    'pvpMatchmaking', to_regprocedure('public.matchmake_pvp_atomically(uuid,text,text,text)') IS NOT NULL
      AND has_function_privilege('service_role',to_regprocedure('public.matchmake_pvp_atomically(uuid,text,text,text)'),'EXECUTE')
      AND NOT has_function_privilege('anon',to_regprocedure('public.matchmake_pvp_atomically(uuid,text,text,text)'),'EXECUTE')
      AND NOT has_function_privilege('authenticated',to_regprocedure('public.matchmake_pvp_atomically(uuid,text,text,text)'),'EXECUTE'),
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

