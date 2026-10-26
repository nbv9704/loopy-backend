-- Keep progress transitions and first-completion rewards consistent under concurrent requests.

CREATE OR REPLACE FUNCTION update_lesson_progress_atomically(
  p_user_id UUID,
  p_lesson_id UUID,
  p_status TEXT,
  p_time_spent INTEGER
)
RETURNS TABLE (id UUID, status TEXT, completed_at TIMESTAMPTZ, time_spent INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress user_progress%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || ':' || p_lesson_id::TEXT));

  SELECT * INTO v_progress
  FROM user_progress
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
  FOR UPDATE;

  IF FOUND AND v_progress.status = 'completed' THEN
    RETURN QUERY SELECT v_progress.id, v_progress.status, v_progress.completed_at, v_progress.time_spent;
    RETURN;
  END IF;

  IF FOUND THEN
    UPDATE user_progress
    SET status = p_status,
        time_spent = GREATEST(0, COALESCE(v_progress.time_spent, 0) + GREATEST(0, COALESCE(p_time_spent, 0))),
        updated_at = NOW()
    WHERE user_progress.id = v_progress.id
    RETURNING * INTO v_progress;
  ELSE
    INSERT INTO user_progress (user_id, lesson_id, status, time_spent)
    VALUES (p_user_id, p_lesson_id, p_status, GREATEST(0, COALESCE(p_time_spent, 0)))
    RETURNING * INTO v_progress;
  END IF;

  RETURN QUERY SELECT v_progress.id, v_progress.status, v_progress.completed_at, v_progress.time_spent;
END;
$$;

CREATE OR REPLACE FUNCTION complete_lesson_atomically(
  p_user_id UUID,
  p_lesson_id UUID,
  p_completed_at TIMESTAMPTZ,
  p_activity_date DATE
)
RETURNS TABLE (id UUID, status TEXT, completed_at TIMESTAMPTZ, time_spent INTEGER, was_first_completion BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress user_progress%ROWTYPE;
  v_is_first_completion BOOLEAN := FALSE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || ':' || p_lesson_id::TEXT));

  SELECT * INTO v_progress
  FROM user_progress
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_progress (user_id, lesson_id, status, completed_at)
    VALUES (p_user_id, p_lesson_id, 'completed', p_completed_at)
    RETURNING * INTO v_progress;
    v_is_first_completion := TRUE;
  ELSIF v_progress.status <> 'completed' THEN
    UPDATE user_progress
    SET status = 'completed', completed_at = COALESCE(v_progress.completed_at, p_completed_at), updated_at = NOW()
    WHERE user_progress.id = v_progress.id
    RETURNING * INTO v_progress;
    v_is_first_completion := TRUE;
  END IF;

  IF v_is_first_completion THEN
    INSERT INTO user_daily_activity (user_id, activity_date, lessons_completed, points_earned)
    VALUES (p_user_id, p_activity_date, 1, 100)
    ON CONFLICT (user_id, activity_date) DO UPDATE
    SET lessons_completed = user_daily_activity.lessons_completed + 1,
        points_earned = user_daily_activity.points_earned + 100;

    UPDATE user_profiles
    SET points = COALESCE(points, 0) + 100
    WHERE user_profiles.id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_progress.id, v_progress.status, v_progress.completed_at, v_progress.time_spent, v_is_first_completion;
END;
$$;

REVOKE ALL ON FUNCTION update_lesson_progress_atomically(UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_lesson_atomically(UUID, UUID, TIMESTAMPTZ, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_lesson_progress_atomically(UUID, UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION complete_lesson_atomically(UUID, UUID, TIMESTAMPTZ, DATE) TO service_role;
