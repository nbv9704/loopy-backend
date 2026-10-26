-- Reviewed snapshot for EMPTY development schemas only. No reset/drop-table.
-- Requires Supabase auth schema; fixture tests mock auth only.
-- Immutable after applying with migration ledger. Forward patches are in migration-plan.json.

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferred_language TEXT DEFAULT 'javascript',
  
  -- New fields for Beginner-First onboarding
  learning_goal TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  experience_level TEXT,
  current_path_id UUID,
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE languages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  can_run_in_browser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 2. LEARNING PATHS & CURRICULUM
-- ============================================================================

CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id TEXT REFERENCES languages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_id TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, language_id)
);

-- Circular FK resolution: Now that learning_paths exists, add FK to user_profiles
ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_current_path
FOREIGN KEY (current_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;


CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language_id, chapter_number)
);

CREATE TABLE path_chapters (
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (path_id, chapter_id)
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT,
  insight TEXT,
  order_index INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER DEFAULT 10,
  
  -- New fields for rich interactive learning
  starter_code TEXT,
  task_description TEXT,
  hint TEXT,
  common_mistakes TEXT,
  solution_code TEXT,
  is_aha_lesson BOOLEAN DEFAULT FALSE,
  grading_mode TEXT DEFAULT 'stdout' CHECK (grading_mode IN ('stdout', 'function')),
  
  -- New validation fields for deterministic validation
  validation_type TEXT DEFAULT 'rule' CHECK (validation_type IN ('rule', 'exact', 'regex', 'stdout', 'function')),
  validation_rules JSONB DEFAULT '{}',
  success_output TEXT,
  failure_hint TEXT,
  
  -- Publish Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- QA Checklist
  qa_checklist JSONB DEFAULT '[]',
  
  -- Data-driven Debug Schema (for Fix step)
  debug_starter_code TEXT DEFAULT '',
  debug_task_description TEXT DEFAULT '',
  debug_validation_rules JSONB DEFAULT '[]',
  debug_hint TEXT DEFAULT '',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, lesson_id)
);


-- ============================================================================
-- 3. GRADING & SUBMISSIONS
-- ============================================================================

CREATE TABLE lesson_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  weight INTEGER DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  timeout INTEGER DEFAULT 1000 CHECK (timeout > 0),
  description TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for dev testing
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  
  -- Enhanced grading results
  test_score INTEGER,
  ai_score INTEGER,
  final_score INTEGER,
  grade_level TEXT CHECK (grade_level IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')),
  test_results JSONB,
  ai_analysis JSONB,
  feedback TEXT,
  grading_method TEXT DEFAULT 'both' CHECK (grading_method IN ('test', 'ai', 'both')),
  
  -- Admin overrides
  override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  override_at TIMESTAMPTZ,
  override_note TEXT,
  
  execution_time INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES lesson_submissions(id) ON DELETE SET NULL,
  request_tokens INTEGER NOT NULL,
  response_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  response_time INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 4. GAMIFICATION & TRACKING
-- ============================================================================

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lessons_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT, 
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE code_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  error TEXT,
  execution_time INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX idx_chapters_language ON chapters(language_id);
CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX idx_learning_paths_language ON learning_paths(language_id);
CREATE INDEX idx_learning_paths_goal ON learning_paths(goal_id);
CREATE INDEX idx_path_chapters_path ON path_chapters(path_id);
CREATE INDEX idx_path_chapters_chapter ON path_chapters(chapter_id);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(lesson_id);

CREATE INDEX idx_lesson_test_cases_lesson_order ON lesson_test_cases(lesson_id, order_index);
CREATE INDEX idx_lesson_submissions_user ON lesson_submissions(user_id);
CREATE INDEX idx_lesson_submissions_lesson ON lesson_submissions(lesson_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_cache_hit ON ai_usage_logs(cache_hit);

CREATE INDEX idx_user_streaks_last_activity ON user_streaks(last_activity_date);
CREATE INDEX idx_user_daily_activity_user ON user_daily_activity(user_id);
CREATE INDEX idx_user_daily_activity_date ON user_daily_activity(activity_date);

CREATE INDEX idx_code_executions_user ON code_executions(user_id);


-- ============================================================================
-- 6. TRIGGERS (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER handle_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_lesson_test_cases_updated_at BEFORE UPDATE ON lesson_test_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER handle_user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;

-- Public Data (Languages, Chapters, Paths, Lessons, Badges)
CREATE POLICY "Public read for languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Public read for chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public read for paths" ON learning_paths FOR SELECT USING (true);
CREATE POLICY "Public read for path_chapters" ON path_chapters FOR SELECT USING (true);
CREATE POLICY "Public read for lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Public read for test cases" ON lesson_test_cases FOR SELECT USING (is_hidden = false);
CREATE POLICY "Public read for badges" ON badges FOR SELECT USING (true);

-- User Data (Profiles, Progress, Submissions, Streaks)
CREATE POLICY "Profiles are viewable by authenticated users" ON user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions" ON lesson_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON lesson_submissions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streaks" ON user_streaks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily activity" ON user_daily_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own daily activity" ON user_daily_activity FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Executions
CREATE POLICY "Users can view own executions" ON code_executions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert executions" ON code_executions FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 8. INITIAL DATA SEEDING (Badges)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, requirement_type, requirement_value) VALUES
  ('first-step', 'Bước chân đầu tiên', 'Hoàn thành bài học đầu tiên của bạn', 'footprints', 'lessons_completed', 1),
  ('quick-learner', 'Học nhanh như chớp', 'Hoàn thành 5 bài học trong một ngày', 'zap', 'daily_lessons', 5),
  ('chapter-one', 'Khai phá kiến thức', 'Hoàn thành chương đầu tiên của bất kỳ ngôn ngữ nào', 'book-open', 'chapter_completed', 1),
  ('streak-3', 'Kiên trì khởi đầu', 'Đạt chuỗi 3 ngày học liên tiếp', 'flame', 'streak', 3),
  ('streak-7', 'Thói quen bền bỉ', 'Đạt chuỗi 7 ngày học liên tiếp', 'award', 'streak', 7),
  ('point-master', 'Tích tiểu thành đại', 'Đạt 1000 điểm học tập', 'star', 'points', 1000)
ON CONFLICT (id) DO NOTHING;
-- ============================================================================
-- 9. PVP SYSTEM
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM (
      'waiting', 'starting', 'in_progress', 'completed', 'cancelled'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM (
      'multiple_choice', 'code_challenge'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_mode') THEN
    CREATE TYPE match_mode AS ENUM (
      '1v1', 'battle_royale'
    );
  END IF;
END $$;

CREATE TABLE pvp_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type question_type NOT NULL,
  language_id TEXT REFERENCES languages(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT,
  options JSONB,
  correct_answer TEXT,
  problem_title TEXT,
  problem_description TEXT,
  starter_code TEXT,
  test_cases JSONB,
  solution_code TEXT,
  time_limit INTEGER NOT NULL DEFAULT 300,
  points INTEGER NOT NULL DEFAULT 100,
  tags TEXT[],
  times_used INTEGER DEFAULT 0,
  average_solve_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_multiple_choice CHECK (
    type != 'multiple_choice' OR 
    (question_text IS NOT NULL AND options IS NOT NULL AND correct_answer IS NOT NULL)
  ),
  CONSTRAINT valid_code_challenge CHECK (
    type != 'code_challenge' OR 
    (problem_title IS NOT NULL AND problem_description IS NOT NULL AND test_cases IS NOT NULL)
  )
);

CREATE TABLE pvp_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code CHAR(6) UNIQUE NOT NULL,
  mode match_mode NOT NULL DEFAULT '1v1',
  status match_status NOT NULL DEFAULT 'waiting',
  language_id TEXT REFERENCES languages(id) ON DELETE CASCADE,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_ids UUID[] NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 2,
  time_per_question INTEGER NOT NULL DEFAULT 300,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pvp_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_ready BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT TRUE,
  total_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  final_rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(match_id, user_id)
);

CREATE TABLE pvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pvp_questions(id) ON DELETE CASCADE,
  submission_type question_type NOT NULL,
  selected_answer TEXT,
  code TEXT,
  execution_output TEXT,
  execution_error TEXT,
  test_results JSONB,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  time_taken INTEGER NOT NULL,
  submission_rank INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id, question_id)
);

CREATE TABLE pvp_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pvp_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_rank DECIMAL(3,2),
  best_rank INTEGER,
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2),
  average_answer_time INTEGER,
  fastest_answer_time INTEGER,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,
  peak_rating INTEGER DEFAULT 1000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PvP Indexes
CREATE INDEX idx_pvp_matches_room_code ON pvp_matches(room_code);
CREATE INDEX idx_pvp_participants_match ON pvp_participants(match_id);
CREATE INDEX idx_pvp_submissions_match ON pvp_submissions(match_id);

-- PvP RLS
ALTER TABLE pvp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone" ON pvp_questions FOR SELECT USING (true);
CREATE POLICY "Matches are viewable by participants" ON pvp_matches FOR SELECT USING (id IN (SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can create matches" ON pvp_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can view match participants" ON pvp_participants FOR SELECT USING (match_id IN (SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can join matches" ON pvp_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON pvp_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Participants can view match submissions" ON pvp_submissions FOR SELECT USING (match_id IN (SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can submit own answers" ON pvp_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants can view match reactions" ON pvp_reactions FOR SELECT USING (match_id IN (SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can send reactions" ON pvp_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Stats are viewable by everyone" ON pvp_user_stats FOR SELECT USING (true);
CREATE POLICY "Users can update own stats" ON pvp_user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_pvp_user_stats() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE pvp_user_stats
    SET 
      total_matches = pvp_user_stats.total_matches + 1,
      matches_won = pvp_user_stats.matches_won + CASE WHEN p.user_id = NEW.winner_id THEN 1 ELSE 0 END,
      matches_lost = pvp_user_stats.matches_lost + CASE WHEN p.user_id != NEW.winner_id THEN 1 ELSE 0 END,
      total_score = pvp_user_stats.total_score + p.total_score,
      current_win_streak = CASE WHEN p.user_id = NEW.winner_id THEN pvp_user_stats.current_win_streak + 1 ELSE 0 END,
      longest_win_streak = GREATEST(pvp_user_stats.longest_win_streak, CASE WHEN p.user_id = NEW.winner_id THEN pvp_user_stats.current_win_streak + 1 ELSE pvp_user_stats.current_win_streak END),
      updated_at = NOW()
    FROM pvp_participants p
    WHERE pvp_user_stats.user_id = p.user_id AND p.match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION initialize_pvp_user_stats() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pvp_user_stats (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_pvp_stats_on_match_complete ON pvp_matches;
CREATE TRIGGER update_pvp_stats_on_match_complete AFTER UPDATE ON pvp_matches FOR EACH ROW EXECUTE FUNCTION update_pvp_user_stats();

DROP TRIGGER IF EXISTS init_pvp_stats_on_user_create ON auth.users;
CREATE TRIGGER init_pvp_stats_on_user_create AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION initialize_pvp_user_stats();

DROP TRIGGER IF EXISTS update_pvp_questions_updated_at ON pvp_questions;
CREATE TRIGGER update_pvp_questions_updated_at BEFORE UPDATE ON pvp_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pvp_matches_updated_at ON pvp_matches;
CREATE TRIGGER update_pvp_matches_updated_at BEFORE UPDATE ON pvp_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Snapshot source: 017-lesson-status.sql
-- Migration 017: Add status column to lessons table

-- Add status column
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));

-- Set existing lessons to published so we don't break existing content
UPDATE lessons SET status = 'published' WHERE status = 'draft';


-- Snapshot source: 018-admin-audit-logs.sql
-- Migration 018: Create admin audit logs table

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'publish', 'archive')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item')),
  resource_id UUID,
  resource_name TEXT,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON admin_audit_logs(resource_id);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY admin_audit_logs_select_policy ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only backend service can insert audit logs
CREATE POLICY admin_audit_logs_insert_policy ON admin_audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Prevent updates and deletes
CREATE POLICY admin_audit_logs_no_update_policy ON admin_audit_logs
  FOR UPDATE
  USING (FALSE);

CREATE POLICY admin_audit_logs_no_delete_policy ON admin_audit_logs
  FOR DELETE
  USING (FALSE);


-- Snapshot source: 019-import-history.sql
-- Migration 019: Create import history table

-- Create import_history table
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  lessons_count INTEGER DEFAULT 0,
  test_cases_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_history_admin_id ON import_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_import_history_chapter_id ON import_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status);

-- Enable RLS
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view import history
CREATE POLICY import_history_select_policy ON import_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only backend service can insert import history (allow all inserts from authenticated users)
CREATE POLICY import_history_insert_policy ON import_history
  FOR INSERT
  WITH CHECK (admin_id IS NOT NULL);

-- RLS Policy: Prevent updates and deletes
CREATE POLICY import_history_no_update_policy ON import_history
  FOR UPDATE
  USING (FALSE);

CREATE POLICY import_history_no_delete_policy ON import_history
  FOR DELETE
  USING (FALSE);


-- Snapshot source: 020-add-qa-checklist.sql
-- Migration 020: Add QA checklist to lessons table

-- Add qa_checklist column to store checklist items as JSON
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS qa_checklist JSONB DEFAULT '[]';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_lessons_qa_checklist ON lessons USING GIN (qa_checklist);

-- Add comment explaining the structure
COMMENT ON COLUMN lessons.qa_checklist IS 'JSON array of QA checklist items: [{"id": "string", "label": "string", "checked": boolean, "order": number}]';


-- Snapshot source: 022-content-management.sql
-- Migration 022: Create content management tables (content_categories and content_items)

-- Create content_categories table
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES content_categories(id) ON DELETE RESTRICT,
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en')),
  value TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'markdown', 'html')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, key, language)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_items_category_id ON content_items(category_id);
CREATE INDEX IF NOT EXISTS idx_content_items_key ON content_items(key);
CREATE INDEX IF NOT EXISTS idx_content_items_language ON content_items(language);
CREATE INDEX IF NOT EXISTS idx_content_items_category_language ON content_items(category_id, language);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_updated_at ON content_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_categories_display_order ON content_categories(display_order);

-- Add comments explaining the structure
COMMENT ON TABLE content_categories IS 'Categories for organizing content items (header, footer, landing, etc.)';
COMMENT ON TABLE content_items IS 'Content items managed by CMS (text, markdown, html)';
COMMENT ON COLUMN content_items.key IS 'Unique key for content item (e.g., nav.learn, landing.hero.title)';
COMMENT ON COLUMN content_items.language IS 'Language of content item (vi, en)';
COMMENT ON COLUMN content_items.value IS 'Actual content text/markdown/html';
COMMENT ON COLUMN content_items.type IS 'Type of content (text, markdown, html)';
COMMENT ON COLUMN content_items.created_by IS 'Admin user who created this item';
COMMENT ON COLUMN content_items.updated_by IS 'Admin user who last updated this item';

-- Enable RLS
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_categories

-- Policy: Public can read all categories
CREATE POLICY content_categories_select_policy ON content_categories
  FOR SELECT
  USING (TRUE);

-- Policy: Only admins can insert categories
CREATE POLICY content_categories_insert_policy ON content_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can update categories
CREATE POLICY content_categories_update_policy ON content_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can delete categories
CREATE POLICY content_categories_delete_policy ON content_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for content_items

-- Policy: Public can read all content items
CREATE POLICY content_items_select_policy ON content_items
  FOR SELECT
  USING (TRUE);

-- Policy: Only admins can insert content items
CREATE POLICY content_items_insert_policy ON content_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can update content items
CREATE POLICY content_items_update_policy ON content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can delete content items
CREATE POLICY content_items_delete_policy ON content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create trigger function for audit logging on content_items
CREATE OR REPLACE FUNCTION log_content_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := jsonb_build_object(
      'key', NEW.key,
      'category_id', NEW.category_id,
      'language', NEW.language,
      'value', NEW.value,
      'type', NEW.type
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object(
        'value', OLD.value,
        'description', OLD.description,
        'type', OLD.type
      ),
      'new', jsonb_build_object(
        'value', NEW.value,
        'description', NEW.description,
        'type', NEW.type
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := jsonb_build_object(
      'key', OLD.key,
      'category_id', OLD.category_id,
      'language', OLD.language
    );
  END IF;

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    resource_name,
    changes,
    metadata
  ) VALUES (
    COALESCE(NEW.updated_by, OLD.updated_by, auth.uid()),
    v_action,
    'content_item',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.key, OLD.key),
    v_changes,
    jsonb_build_object('category_id', COALESCE(NEW.category_id, OLD.category_id))
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS content_items_audit_insert_trigger ON content_items;
CREATE TRIGGER content_items_audit_insert_trigger
  AFTER INSERT ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

DROP TRIGGER IF EXISTS content_items_audit_update_trigger ON content_items;
CREATE TRIGGER content_items_audit_update_trigger
  AFTER UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

DROP TRIGGER IF EXISTS content_items_audit_delete_trigger ON content_items;
CREATE TRIGGER content_items_audit_delete_trigger
  AFTER DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS content_items_update_timestamp_trigger ON content_items;
CREATE TRIGGER content_items_update_timestamp_trigger
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

-- Create trigger function to update updated_at timestamp for categories
CREATE OR REPLACE FUNCTION update_content_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on categories
DROP TRIGGER IF EXISTS content_categories_update_timestamp_trigger ON content_categories;
CREATE TRIGGER content_categories_update_timestamp_trigger
  BEFORE UPDATE ON content_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_content_categories_updated_at();

-- Insert default content categories
INSERT INTO content_categories (name, description, display_order) VALUES
  ('header', 'Header navigation content', 1),
  ('footer', 'Footer content', 2),
  ('landing', 'Landing page content', 3),
  ('languages', 'Languages page content', 4),
  ('library', 'Library page content', 5),
  ('learn', 'Learn page content', 6),
  ('playground', 'Playground page content', 7),
  ('docs', 'Documentation page content', 8),
  ('onboarding', 'Onboarding page content', 9),
  ('settings', 'Settings page content', 10),
  ('pvp', 'PvP pages content', 11)
ON CONFLICT (name) DO NOTHING;


-- Snapshot source: 023-fix-content-audit-trigger.sql
-- Migration 023: Fix content audit trigger to allow NULL admin_id for seeding

-- Drop existing trigger
DROP TRIGGER IF EXISTS content_items_audit_insert_trigger ON content_items;
DROP TRIGGER IF EXISTS content_items_audit_update_trigger ON content_items;
DROP TRIGGER IF EXISTS content_items_audit_delete_trigger ON content_items;

-- Drop existing function
DROP FUNCTION IF EXISTS log_content_item_changes();

-- Create new trigger function that allows NULL admin_id
CREATE OR REPLACE FUNCTION log_content_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
  v_admin_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := jsonb_build_object(
      'key', NEW.key,
      'category_id', NEW.category_id,
      'language', NEW.language,
      'value', NEW.value,
      'type', NEW.type
    );
    v_admin_id := NEW.created_by;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object(
        'value', OLD.value,
        'description', OLD.description,
        'type', OLD.type
      ),
      'new', jsonb_build_object(
        'value', NEW.value,
        'description', NEW.description,
        'type', NEW.type
      )
    );
    v_admin_id := NEW.updated_by;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := jsonb_build_object(
      'key', OLD.key,
      'category_id', OLD.category_id,
      'language', OLD.language
    );
    v_admin_id := OLD.updated_by;
  END IF;

  -- Only insert audit log if admin_id is not null
  -- This allows seeding without audit logs
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      resource_name,
      changes,
      metadata
    ) VALUES (
      v_admin_id,
      v_action,
      'content_item',
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.key, OLD.key),
      v_changes,
      jsonb_build_object('category_id', COALESCE(NEW.category_id, OLD.category_id))
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER content_items_audit_insert_trigger
  AFTER INSERT ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

CREATE TRIGGER content_items_audit_update_trigger
  AFTER UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

CREATE TRIGGER content_items_audit_delete_trigger
  AFTER DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();


-- Snapshot source: 025-fix-content-items-rls.sql
-- Migration 025: Fix content_items RLS policy to allow authenticated users to read

-- Drop existing select policy
DROP POLICY IF EXISTS content_items_select_policy ON content_items;

-- Create new select policy that allows:
-- 1. Public (anonymous) users to read
-- 2. Authenticated users to read
CREATE POLICY content_items_select_policy ON content_items
  FOR SELECT
  USING (TRUE);

-- Verify policy is in place
-- SELECT * FROM pg_policies WHERE tablename = 'content_items' AND policyname = 'content_items_select_policy';


-- Snapshot source: 026-fix-audit-logs-constraint.sql
-- Migration 026: Fix admin_audit_logs resource_type constraint to include content_item

-- Drop the old constraint
ALTER TABLE admin_audit_logs
DROP CONSTRAINT IF EXISTS admin_audit_logs_resource_type_check;

-- Add the new constraint with content_item included
ALTER TABLE admin_audit_logs
ADD CONSTRAINT admin_audit_logs_resource_type_check 
CHECK (resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item'));


-- Snapshot source: 027-practice-sets.sql
-- Migration 027: Practice sets
-- Purpose: Add non-realtime practice sets separate from PvP matches/questions.

CREATE TABLE IF NOT EXISTS practice_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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


-- Snapshot source: 028-practice-question-types.sql
-- Migration 028: Align practice question types with quiz builder
-- Purpose: Replace code_challenge with quiz-style types used by practice sets.

ALTER TABLE practice_questions
  DROP CONSTRAINT IF EXISTS practice_questions_type_check,
  DROP CONSTRAINT IF EXISTS practice_question_valid_choice,
  DROP CONSTRAINT IF EXISTS practice_question_valid_code;

ALTER TABLE practice_questions
  ADD CONSTRAINT practice_questions_type_check
    CHECK (type IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')),
  ADD CONSTRAINT practice_question_valid_answer
    CHECK (
      type NOT IN ('true_false', 'multiple_choice', 'multiple_select', 'fill_blank')
      OR correct_answer IS NOT NULL
    );


-- Snapshot source: 029-content-moderation-keywords.sql
-- ============================================================================
-- Migration 029: Content Moderation Keywords
-- ============================================================================
-- Purpose: Add content moderation system with keyword management
-- Date: 2026-06-04
-- Dependencies: None
-- ============================================================================

-- Create content_moderation_keywords table
CREATE TABLE content_moderation_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general' CHECK (category IN ('profanity', 'hate_speech', 'spam', 'general')),
  language TEXT DEFAULT 'all' CHECK (language IN ('vi', 'en', 'all')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active keyword lookups (performance)
CREATE INDEX idx_moderation_keywords_active ON content_moderation_keywords(is_active);
CREATE INDEX idx_moderation_keywords_language ON content_moderation_keywords(language);

-- Add updated_at trigger
CREATE TRIGGER handle_keywords_updated_at 
BEFORE UPDATE ON content_moderation_keywords 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE content_moderation_keywords ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage keywords" 
ON content_moderation_keywords 
FOR ALL 
USING ((SELECT is_admin FROM user_profiles WHERE id = auth.uid()) = TRUE);

-- Public read for active keywords (for client-side preview/warnings)
CREATE POLICY "Anyone can read active keywords" 
ON content_moderation_keywords 
FOR SELECT 
USING (is_active = TRUE);

-- ============================================================================
-- Seed Initial Keywords (English + Vietnamese)
-- ============================================================================

-- Note: All keywords are lowercase as they will be normalized during validation

-- English Profanity
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  ('fuck', 'profanity', 'en'),
  ('fucking', 'profanity', 'en'),
  ('fucked', 'profanity', 'en'),
  ('fucker', 'profanity', 'en'),
  ('shit', 'profanity', 'en'),
  ('shitting', 'profanity', 'en'),
  ('shitty', 'profanity', 'en'),
  ('bitch', 'profanity', 'en'),
  ('bitches', 'profanity', 'en'),
  ('bitching', 'profanity', 'en'),
  ('asshole', 'profanity', 'en'),
  ('bastard', 'profanity', 'en'),
  ('damn', 'profanity', 'en'),
  ('crap', 'profanity', 'en'),
  ('piss', 'profanity', 'en'),
  ('dick', 'profanity', 'en'),
  ('cock', 'profanity', 'en'),
  ('pussy', 'profanity', 'en'),
  ('whore', 'profanity', 'en'),
  ('slut', 'profanity', 'en'),
  ('nigger', 'hate_speech', 'en'),
  ('nigga', 'hate_speech', 'en'),
  ('faggot', 'hate_speech', 'en'),
  ('retard', 'hate_speech', 'en'),
  ('retarded', 'hate_speech', 'en')
ON CONFLICT (keyword) DO NOTHING;

-- Vietnamese Profanity (Base forms)
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  -- Core vulgar words
  ('dm', 'profanity', 'vi'),
  ('dmm', 'profanity', 'vi'),
  ('dit', 'profanity', 'vi'),
  ('dit me', 'profanity', 'vi'),
  ('dit may', 'profanity', 'vi'),
  ('du', 'profanity', 'vi'),
  ('du ma', 'profanity', 'vi'),
  ('lon', 'profanity', 'vi'),
  ('cac', 'profanity', 'vi'),
  ('buoi', 'profanity', 'vi'),
  ('dcm', 'profanity', 'vi'),
  ('dcmm', 'profanity', 'vi'),
  ('dkm', 'profanity', 'vi'),
  ('dkmm', 'profanity', 'vi'),
  
  -- Common variations and abbreviations
  ('vcl', 'profanity', 'vi'),
  ('vl', 'profanity', 'vi'),
  ('cc', 'profanity', 'vi'),
  ('cl', 'profanity', 'vi'),
  ('cmm', 'profanity', 'vi'),
  ('cmn', 'profanity', 'vi'),
  ('cmnr', 'profanity', 'vi'),
  
  -- More explicit terms
  ('cut', 'profanity', 'vi'),
  ('cho', 'profanity', 'vi'),
  ('cho me', 'profanity', 'vi'),
  ('con cho', 'profanity', 'vi'),
  ('me may', 'profanity', 'vi'),
  ('thang cho', 'profanity', 'vi'),
  ('thang ngu', 'profanity', 'vi'),
  ('ngu', 'profanity', 'vi'),
  ('ngoc', 'profanity', 'vi'),
  ('lac', 'profanity', 'vi'),
  ('cave', 'profanity', 'vi'),
  
  -- Vulgar expressions
  ('bo di', 'profanity', 'vi'),
  ('di cho', 'profanity', 'vi'),
  ('chet di', 'profanity', 'vi'),
  ('dan ba', 'profanity', 'vi'),
  ('di me', 'profanity', 'vi')
ON CONFLICT (keyword) DO NOTHING;

-- Common spam patterns
INSERT INTO content_moderation_keywords (keyword, category, language) VALUES
  ('click here', 'spam', 'en'),
  ('buy now', 'spam', 'en'),
  ('make money', 'spam', 'en'),
  ('casino', 'spam', 'all'),
  ('viagra', 'spam', 'all'),
  ('penis enlargement', 'spam', 'en'),
  ('weight loss', 'spam', 'en'),
  ('crypto investment', 'spam', 'en')
ON CONFLICT (keyword) DO NOTHING;

-- ============================================================================
-- Verification Queries (commented out - for reference)
-- ============================================================================

-- Verify table created:
-- SELECT * FROM content_moderation_keywords LIMIT 10;

-- Count keywords by category:
-- SELECT category, language, COUNT(*) 
-- FROM content_moderation_keywords 
-- GROUP BY category, language 
-- ORDER BY category, language;

-- Total active keywords:
-- SELECT COUNT(*) as total_active_keywords 
-- FROM content_moderation_keywords 
-- WHERE is_active = TRUE;


-- Snapshot source: 030-practice-sets-official-visibility.sql
-- Migration 030: Add 'official' visibility to practice_sets
-- Purpose: Allow admin-created sets to have a special 'official' visibility

-- Drop old constraint and re-add with 'official' included
ALTER TABLE practice_sets
  DROP CONSTRAINT IF EXISTS practice_sets_visibility_check;

ALTER TABLE practice_sets
  ADD CONSTRAINT practice_sets_visibility_check
  CHECK (visibility IN ('public', 'private', 'unlisted', 'official'));


-- Snapshot source: 032-add-lesson-hint-levels.sql
-- Migration 032: Add progressive hint levels to lessons
-- AI remains hint-only. Lesson pass/fail must continue to use deterministic validation.

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hint_level_3 TEXT DEFAULT '';

-- Preserve existing authored hints as the first, lowest-friction hint.
UPDATE lessons
SET hint_level_1 = hint
WHERE COALESCE(hint_level_1, '') = ''
  AND COALESCE(hint, '') <> '';

COMMENT ON COLUMN lessons.hint_level_1 IS 'Progressive hint level 1: direct nudge/spoon-feeding for stuck beginners';
COMMENT ON COLUMN lessons.hint_level_2 IS 'Progressive hint level 2: conceptual explanation of the relevant idea';
COMMENT ON COLUMN lessons.hint_level_3 IS 'Progressive hint level 3: safety net, common mistake warning, or final non-AI guidance';


-- Snapshot source: 033-add-lesson-steps.sql
-- Migration 033: Learn-scoped lesson steps
-- Purpose: Add inline Learn activities without reusing Practice domain tables.

CREATE TABLE IF NOT EXISTS lesson_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'code_prompt')),
  title TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT,
  hint TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_steps_lesson_order ON lesson_steps(lesson_id, order_index);

DROP TRIGGER IF EXISTS update_lesson_steps_updated_at ON lesson_steps;
CREATE TRIGGER update_lesson_steps_updated_at
  BEFORE UPDATE ON lesson_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lesson_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lesson steps are viewable through published lessons" ON lesson_steps;
CREATE POLICY "Lesson steps are viewable through published lessons" ON lesson_steps
  FOR SELECT USING (
    lesson_id IN (
      SELECT id FROM lessons WHERE status = 'published'
    )
  );


-- Snapshot source: 035-add-learning-path-to-chapters.sql
-- 035-add-learning-path-to-chapters.sql
-- Add learning_path column to chapters table to support multiple learning paths per language


ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS learning_path text NOT NULL DEFAULT 'first_steps';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chapters_learning_path_check'
  ) THEN
    ALTER TABLE chapters
    ADD CONSTRAINT chapters_learning_path_check
    CHECK (learning_path IN (
      'first_steps',
      'school_foundation',
      'logic_builder',
      'project_starter'
    ));
  END IF;
END $$;

-- Update schema documentation
COMMENT ON COLUMN chapters.learning_path IS 'Learning path identifier: first_steps, school_foundation, logic_builder, or project_starter';



-- Snapshot source: 037-rename-learning-goal-to-learning-path.sql
-- 037-rename-learning-goal-to-learning-path.sql
-- Rename learning_goal to learning_path for clarity
-- This tracks the user's selected learning path (first_steps, school_foundation, logic_builder, project_starter)


ALTER TABLE user_profiles
RENAME COLUMN learning_goal TO learning_path;

-- Update comment
COMMENT ON COLUMN user_profiles.learning_path IS 'User-selected learning path: first_steps, school_foundation, logic_builder, or project_starter';


ALTER TABLE lessons ADD COLUMN lesson_type text NOT NULL DEFAULT 'code_fix'
  CHECK (lesson_type IN ('concept','true_false','multiple_choice','fill_blank','short_answer','code_fix','code_output','code_build'));
ALTER TABLE pvp_submissions DROP CONSTRAINT pvp_submissions_question_id_fkey;
ALTER TABLE pvp_submissions ADD CONSTRAINT pvp_submissions_question_id_fkey FOREIGN KEY(question_id) REFERENCES practice_questions(id) ON DELETE CASCADE;
