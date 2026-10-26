-- READ ONLY. Review the selected Supabase project before running.
-- Schema metadata only; no user rows, credentials, DDL or writes.
BEGIN READ ONLY;

SELECT name AS required_table, to_regclass('public.' || name) IS NOT NULL AS present
FROM unnest(ARRAY['user_profiles','user_progress','user_daily_activity','lessons','lesson_steps',
  'lesson_test_cases','practice_sets','practice_questions','practice_attempts','practice_submissions',
  'pvp_matches','admin_audit_logs','loopy_schema_migrations','lesson_check_receipts']) name;

SELECT p.proname AS function_name, pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
  'update_lesson_progress_atomically','complete_lesson_atomically','record_lesson_check',
  'complete_checked_lesson_atomically','bulk_import_lessons_atomically',
  'save_practice_set_atomically','start_practice_attempt_atomically','submit_practice_answer_atomically',
  'loopy_schema_status','initialize_pvp_user_stats','increment_participant_score',
  'set_pvp_question_phase','submit_pvp_answer_atomically','join_pvp_match_atomically',
  'ready_pvp_match_atomically','matchmake_pvp_atomically','disconnect_pvp_participant','finish_pvp_match_atomically','update_pvp_user_stats')
ORDER BY p.proname;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='pvp_matches'
  AND column_name IN ('question_started_at','question_closed_at','question_started_index')
ORDER BY column_name;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='lessons' AND column_name='content_revision';

SELECT c.relname AS table_name, t.tgname AS trigger_name, t.tgenabled AS enabled
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND t.tgname IN ('lesson_content_revision','lesson_step_check_revision',
  'lesson_test_check_revision','chapter_language_check_revision');

SELECT table_name, column_name, grantee, privilege_type
FROM information_schema.column_privileges
WHERE table_schema='public' AND grantee IN ('PUBLIC','anon','authenticated')
  AND table_name IN ('user_profiles','user_progress','lesson_submissions','lessons','lesson_steps',
    'lesson_test_cases','practice_questions','practice_attempts','practice_submissions','lesson_check_receipts')
ORDER BY table_name,column_name,grantee,privilege_type;

SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('user_profiles','user_progress','lesson_submissions',
  'lessons','lesson_steps','lesson_test_cases','practice_questions')
ORDER BY tablename,policyname;

SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='content_items' AND column_name='revision';
SELECT COALESCE(has_function_privilege('service_role',to_regprocedure('public.import_cms_content_atomically(uuid,text,jsonb)'),'EXECUTE'),FALSE) AS cms_import_service;

COMMIT;
