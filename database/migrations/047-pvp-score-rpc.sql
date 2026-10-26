-- Restore the existing PvP service contract in fresh schemas too.
-- Invoker permissions plus service-only EXECUTE keep score updates behind Express.
CREATE OR REPLACE FUNCTION increment_participant_score(
  p_match_id UUID, p_user_id UUID, p_points INTEGER, p_is_correct BOOLEAN
)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  UPDATE pvp_participants SET
    total_score = COALESCE(total_score, 0) + p_points,
    questions_answered = COALESCE(questions_answered, 0) + 1,
    correct_answers = COALESCE(correct_answers, 0) + CASE WHEN p_is_correct THEN 1 ELSE 0 END
  WHERE match_id = p_match_id AND user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION increment_participant_score(UUID, UUID, INTEGER, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_participant_score(UUID, UUID, INTEGER, BOOLEAN) TO service_role;
