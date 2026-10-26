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
