-- REVIEW BEFORE APPLYING: data access for these tables goes through Express/service_role.
-- This intentionally removes direct anon/authenticated Data API access, including column grants.
-- No rows, policies, or tables are deleted. Existing direct PostgREST clients need migration first.
DO $$
DECLARE
  v_table TEXT;
  v_columns TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'user_profiles', 'user_progress', 'lesson_submissions', 'user_streaks',
    'user_daily_activity', 'user_badges', 'code_executions',
    'lessons', 'lesson_steps', 'lesson_test_cases',
    'practice_sets', 'practice_questions', 'practice_attempts', 'practice_submissions',
    'pvp_matches', 'pvp_participants', 'pvp_submissions', 'pvp_reactions', 'pvp_user_stats', 'pvp_questions',
    'content_categories', 'content_items', 'content_moderation_keywords',
    'admin_audit_logs', 'import_history', 'ai_usage_logs'
  ] LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      CONTINUE; -- Optional/legacy tables may not exist; readiness checks mandatory tables separately.
    END IF;
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', v_table);
    SELECT string_agg(quote_ident(attname), ', ') INTO v_columns
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', v_table)) AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated', v_columns, v_table);
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', v_table);
  END LOOP;
END;
$$;

-- Supabase default privileges may grant these roles explicitly, independently of PUBLIC.
REVOKE ALL ON FUNCTION update_lesson_progress_atomically(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_lesson_atomically(UUID, UUID, TIMESTAMPTZ, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bulk_import_lessons_atomically(UUID, JSONB) FROM PUBLIC, anon, authenticated;
