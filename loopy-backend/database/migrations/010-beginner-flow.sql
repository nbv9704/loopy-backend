-- Migration: Beginner Flow & Lesson Rework
-- Description: Additive migration to support the Beginner-First onboarding flow and lesson-centric grading.
-- This migration is safe to run on an existing database and does not drop any existing data.

-- ============================================================================
-- 0. Safety Type Conversion for user_profiles
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
      AND column_name = 'current_path_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE user_profiles
    ALTER COLUMN current_path_id TYPE UUID USING current_path_id::uuid;
  END IF;
END $$;

-- ============================================================================
-- 1. Update user_profiles
-- ============================================================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS learning_goal TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS current_path_id UUID,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Update lessons table
-- ============================================================================
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS starter_code TEXT,
ADD COLUMN IF NOT EXISTS task_description TEXT,
ADD COLUMN IF NOT EXISTS hint TEXT,
ADD COLUMN IF NOT EXISTS common_mistakes TEXT,
ADD COLUMN IF NOT EXISTS solution_code TEXT,
ADD COLUMN IF NOT EXISTS is_aha_lesson BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 3. Create learning_paths and path_chapters
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_paths (
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

-- Robust column additions for learning_paths
ALTER TABLE learning_paths
ADD COLUMN IF NOT EXISTS language_id TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS goal_id TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS path_chapters (
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (path_id, chapter_id)
);

-- Robust column additions for path_chapters
ALTER TABLE path_chapters
ADD COLUMN IF NOT EXISTS path_id UUID,
ADD COLUMN IF NOT EXISTS chapter_id UUID,
ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Now we can safely add FK from user_profiles to learning_paths
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_profiles_current_path' 
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE user_profiles
        ADD CONSTRAINT fk_user_profiles_current_path
        FOREIGN KEY (current_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. Create lesson-centric grading tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS lesson_test_cases (
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

-- Robust column additions for lesson_test_cases
ALTER TABLE lesson_test_cases
ADD COLUMN IF NOT EXISTS lesson_id UUID,
ADD COLUMN IF NOT EXISTS input JSONB,
ADD COLUMN IF NOT EXISTS expected_output JSONB,
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS timeout INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS order_index INTEGER;

CREATE TABLE IF NOT EXISTS lesson_submissions (
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

-- Robust column additions for lesson_submissions
ALTER TABLE lesson_submissions
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS lesson_id UUID,
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS test_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_score INTEGER,
ADD COLUMN IF NOT EXISTS final_score INTEGER,
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS test_results JSONB,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'both',
ADD COLUMN IF NOT EXISTS override_by UUID,
ADD COLUMN IF NOT EXISTS override_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS override_note TEXT,
ADD COLUMN IF NOT EXISTS execution_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- ============================================================================
-- 5. Indexes and Triggers
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_learning_paths_language ON learning_paths(language_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_goal ON learning_paths(goal_id);
CREATE INDEX IF NOT EXISTS idx_path_chapters_path ON path_chapters(path_id);
CREATE INDEX IF NOT EXISTS idx_path_chapters_chapter ON path_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lesson_test_cases_lesson_order ON lesson_test_cases(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_submissions_user ON lesson_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_submissions_lesson ON lesson_submissions(lesson_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_learning_paths_updated_at') THEN
        CREATE TRIGGER handle_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_lesson_test_cases_updated_at') THEN
        CREATE TRIGGER handle_lesson_test_cases_updated_at BEFORE UPDATE ON lesson_test_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- learning_paths
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for paths') THEN
        CREATE POLICY "Public read for paths" ON learning_paths FOR SELECT USING (true);
    END IF;
    
    -- path_chapters
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for path_chapters') THEN
        CREATE POLICY "Public read for path_chapters" ON path_chapters FOR SELECT USING (true);
    END IF;
    
    -- lesson_test_cases
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read for test cases') THEN
        CREATE POLICY "Public read for test cases" ON lesson_test_cases FOR SELECT USING (is_hidden = false);
    END IF;
    
    -- lesson_submissions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own submissions') THEN
        CREATE POLICY "Users can view own submissions" ON lesson_submissions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own submissions') THEN
        CREATE POLICY "Users can insert own submissions" ON lesson_submissions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

-- ============================================================================
-- 7. Add missing pvp_matches columns
-- ============================================================================
ALTER TABLE pvp_matches
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));
