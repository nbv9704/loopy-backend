-- ============================================================================
-- ⚠️ WARNING: DESTRUCTIVE SCRIPT ⚠️
-- ============================================================================
-- Loopy Database Schema V2 ("Beginner-First" Architecture)
-- 
-- 🚨 DO NOT RUN THIS SCRIPT ON PRODUCTION IF YOU WANT TO KEEP YOUR DATA! 🚨
-- This is a reset script. Running this will DROP ALL TABLES WITH CASCADE, 
-- permanently deleting all user progress, submissions, PvP data, and streaks.
-- 
-- For safe upgrades on existing databases, use the additive migrations in 
-- the `database/migrations/` directory instead (e.g., 010-beginner-flow.sql).
-- 
-- Use this script ONLY for fresh initializations or wiping development environments.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & CLEANUP
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-running (DANGER: destroys data)
DROP TABLE IF EXISTS code_executions CASCADE;
DROP TABLE IF EXISTS pvp_reactions CASCADE;
DROP TABLE IF EXISTS pvp_submissions CASCADE;
DROP TABLE IF EXISTS pvp_participants CASCADE;
DROP TABLE IF EXISTS pvp_matches CASCADE;
DROP TABLE IF EXISTS pvp_user_stats CASCADE;
DROP TABLE IF EXISTS pvp_questions CASCADE;
DROP TABLE IF EXISTS lesson_submissions CASCADE;
DROP TABLE IF EXISTS lesson_test_cases CASCADE;
DROP TABLE IF EXISTS user_daily_activity CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS path_chapters CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS languages CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Also drop legacy tables if they exist
DROP TABLE IF EXISTS exercise_submissions CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;


-- ============================================================================
-- 1. CORE PROFILES & LANGUAGES
-- ============================================================================

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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
