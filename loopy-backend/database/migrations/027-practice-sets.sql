-- Migration 027: Practice sets
-- Purpose: Add non-realtime practice sets separate from PvP matches/questions.

CREATE TABLE IF NOT EXISTS practice_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type TEXT NOT NULL DEFAULT 'user' CHECK (owner_type IN ('official', 'user')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  language_id TEXT REFERENCES languages(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES practice_sets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')),
  title TEXT,
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  starter_code TEXT,
  test_cases JSONB,
  solution_code TEXT,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points > 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT practice_question_valid_choice CHECK (
    type NOT IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')
    OR (correct_answer IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES practice_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES practice_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_answer TEXT,
  code TEXT,
  execution_output TEXT,
  execution_error TEXT,
  test_results JSONB,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_sets_language ON practice_sets(language_id);
CREATE INDEX IF NOT EXISTS idx_practice_sets_status_visibility ON practice_sets(status, visibility);
CREATE INDEX IF NOT EXISTS idx_practice_sets_owner ON practice_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_practice_questions_set ON practice_questions(set_id, order_index);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON practice_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_set ON practice_attempts(set_id);
CREATE INDEX IF NOT EXISTS idx_practice_submissions_attempt ON practice_submissions(attempt_id);

CREATE OR REPLACE FUNCTION enforce_practice_set_question_limit()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count
  FROM practice_questions
  WHERE set_id = NEW.set_id;

  IF question_count >= 30 THEN
    RAISE EXCEPTION 'Practice sets can contain at most 30 questions';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS practice_question_limit_trigger ON practice_questions;
CREATE TRIGGER practice_question_limit_trigger
  BEFORE INSERT ON practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_practice_set_question_limit();

CREATE TRIGGER update_practice_sets_updated_at
  BEFORE UPDATE ON practice_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_questions_updated_at
  BEFORE UPDATE ON practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_attempts_updated_at
  BEFORE UPDATE ON practice_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published practice sets are viewable" ON practice_sets
  FOR SELECT USING (status = 'published' AND visibility IN ('public', 'unlisted') OR created_by = auth.uid());

CREATE POLICY "Users can create own practice sets" ON practice_sets
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own practice sets" ON practice_sets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own practice sets" ON practice_sets
  FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Questions are viewable through visible sets" ON practice_questions
  FOR SELECT USING (
    set_id IN (
      SELECT id FROM practice_sets
      WHERE status = 'published' AND visibility IN ('public', 'unlisted') OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage questions for own sets" ON practice_questions
  FOR ALL USING (
    set_id IN (SELECT id FROM practice_sets WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can view own attempts" ON practice_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own attempts" ON practice_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attempts" ON practice_attempts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own practice submissions" ON practice_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own practice submissions" ON practice_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());
