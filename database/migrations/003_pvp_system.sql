-- ============================================================================
-- PvP System Migration (Clean Version)
-- Use this if you have enum type conflicts
-- This version safely handles existing enums
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS & TYPES (Safe creation - won't fail if already exist)
-- ============================================================================

-- Match status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM (
      'waiting',      -- Waiting for players
      'starting',     -- Countdown before match starts
      'in_progress',  -- Match is active
      'completed',    -- Match finished
      'cancelled'     -- Match was cancelled
    );
  END IF;
END $$;

-- Question type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM (
      'multiple_choice',  -- Multiple choice question (fastest answer wins)
      'code_challenge'    -- Code challenge (fastest correct submission wins)
    );
  END IF;
END $$;

-- Match mode enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_mode') THEN
    CREATE TYPE match_mode AS ENUM (
      '1v1',          -- One vs One
      'battle_royale' -- Multiple players (future)
    );
  END IF;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- PvP Questions Bank
CREATE TABLE IF NOT EXISTS pvp_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Question details
  type question_type NOT NULL,
  language_id TEXT REFERENCES languages(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Multiple choice fields
  question_text TEXT,
  options JSONB,
  correct_answer TEXT,
  
  -- Code challenge fields
  problem_title TEXT,
  problem_description TEXT,
  starter_code TEXT,
  test_cases JSONB,
  solution_code TEXT,
  
  -- Metadata
  time_limit INTEGER NOT NULL DEFAULT 300,
  points INTEGER NOT NULL DEFAULT 100,
  tags TEXT[],
  
  -- Stats
  times_used INTEGER DEFAULT 0,
  average_solve_time INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_multiple_choice CHECK (
    type != 'multiple_choice' OR 
    (question_text IS NOT NULL AND options IS NOT NULL AND correct_answer IS NOT NULL)
  ),
  CONSTRAINT valid_code_challenge CHECK (
    type != 'code_challenge' OR 
    (problem_title IS NOT NULL AND problem_description IS NOT NULL AND test_cases IS NOT NULL)
  )
);

-- PvP Matches
CREATE TABLE IF NOT EXISTS pvp_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Match configuration
  mode match_mode NOT NULL DEFAULT '1v1',
  status match_status NOT NULL DEFAULT 'waiting',
  language_id TEXT REFERENCES languages(id) ON DELETE CASCADE,
  
  -- Questions in this match
  question_ids UUID[] NOT NULL,
  current_question_index INTEGER DEFAULT 0,
  
  -- Timing
  max_players INTEGER NOT NULL DEFAULT 2,
  time_per_question INTEGER NOT NULL DEFAULT 300,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Winner
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PvP Match Participants
CREATE TABLE IF NOT EXISTS pvp_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  is_ready BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT TRUE,
  
  -- Score
  total_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  
  -- Placement
  final_rank INTEGER,
  
  -- Timing
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(match_id, user_id)
);

-- PvP Submissions
CREATE TABLE IF NOT EXISTS pvp_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES pvp_questions(id) ON DELETE CASCADE,
  
  -- Submission content
  submission_type question_type NOT NULL,
  
  -- For multiple choice
  selected_answer TEXT,
  
  -- For code challenge
  code TEXT,
  execution_output TEXT,
  execution_error TEXT,
  test_results JSONB,
  
  -- Evaluation
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  time_taken INTEGER NOT NULL,
  
  -- Ranking
  submission_rank INTEGER,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, user_id, question_id)
);

-- PvP Reactions
CREATE TABLE IF NOT EXISTS pvp_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES pvp_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reaction details
  emoji TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PvP User Stats
CREATE TABLE IF NOT EXISTS pvp_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Match stats
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  
  -- Performance
  total_score INTEGER DEFAULT 0,
  average_rank DECIMAL(3,2),
  best_rank INTEGER,
  
  -- Question stats
  total_questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2),
  
  -- Timing
  average_answer_time INTEGER,
  fastest_answer_time INTEGER,
  
  -- Streaks
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  
  -- Rating
  rating INTEGER DEFAULT 1000,
  peak_rating INTEGER DEFAULT 1000,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pvp_questions_type ON pvp_questions(type);
CREATE INDEX IF NOT EXISTS idx_pvp_questions_language ON pvp_questions(language_id);
CREATE INDEX IF NOT EXISTS idx_pvp_questions_difficulty ON pvp_questions(difficulty);

CREATE INDEX IF NOT EXISTS idx_pvp_matches_status ON pvp_matches(status);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_language ON pvp_matches(language_id);
CREATE INDEX IF NOT EXISTS idx_pvp_matches_created ON pvp_matches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pvp_participants_match ON pvp_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_pvp_participants_user ON pvp_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_participants_connected ON pvp_participants(is_connected);

CREATE INDEX IF NOT EXISTS idx_pvp_submissions_match ON pvp_submissions(match_id);
CREATE INDEX IF NOT EXISTS idx_pvp_submissions_user ON pvp_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_submissions_question ON pvp_submissions(question_id);

CREATE INDEX IF NOT EXISTS idx_pvp_reactions_match ON pvp_reactions(match_id);
CREATE INDEX IF NOT EXISTS idx_pvp_reactions_created ON pvp_reactions(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE pvp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON pvp_questions;
DROP POLICY IF EXISTS "Matches are viewable by participants" ON pvp_matches;
DROP POLICY IF EXISTS "Anyone can create matches" ON pvp_matches;
DROP POLICY IF EXISTS "Participants can view match participants" ON pvp_participants;
DROP POLICY IF EXISTS "Users can join matches" ON pvp_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON pvp_participants;
DROP POLICY IF EXISTS "Participants can view match submissions" ON pvp_submissions;
DROP POLICY IF EXISTS "Users can submit own answers" ON pvp_submissions;
DROP POLICY IF EXISTS "Participants can view match reactions" ON pvp_reactions;
DROP POLICY IF EXISTS "Users can send reactions" ON pvp_reactions;
DROP POLICY IF EXISTS "Stats are viewable by everyone" ON pvp_user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON pvp_user_stats;

-- Create policies
CREATE POLICY "Questions are viewable by everyone"
  ON pvp_questions FOR SELECT
  USING (true);

CREATE POLICY "Matches are viewable by participants"
  ON pvp_matches FOR SELECT
  USING (
    id IN (
      SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create matches"
  ON pvp_matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can view match participants"
  ON pvp_participants FOR SELECT
  USING (
    match_id IN (
      SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join matches"
  ON pvp_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON pvp_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Participants can view match submissions"
  ON pvp_submissions FOR SELECT
  USING (
    match_id IN (
      SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit own answers"
  ON pvp_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view match reactions"
  ON pvp_reactions FOR SELECT
  USING (
    match_id IN (
      SELECT match_id FROM pvp_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send reactions"
  ON pvp_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stats are viewable by everyone"
  ON pvp_user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update own stats"
  ON pvp_user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update pvp_user_stats after match completion
CREATE OR REPLACE FUNCTION update_pvp_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE pvp_user_stats
    SET 
      total_matches = pvp_user_stats.total_matches + 1,
      matches_won = pvp_user_stats.matches_won + CASE WHEN p.user_id = NEW.winner_id THEN 1 ELSE 0 END,
      matches_lost = pvp_user_stats.matches_lost + CASE WHEN p.user_id != NEW.winner_id THEN 1 ELSE 0 END,
      total_score = pvp_user_stats.total_score + p.total_score,
      current_win_streak = CASE 
        WHEN p.user_id = NEW.winner_id THEN pvp_user_stats.current_win_streak + 1 
        ELSE 0 
      END,
      longest_win_streak = GREATEST(
        pvp_user_stats.longest_win_streak,
        CASE WHEN p.user_id = NEW.winner_id THEN pvp_user_stats.current_win_streak + 1 ELSE pvp_user_stats.current_win_streak END
      ),
      updated_at = NOW()
    FROM pvp_participants p
    WHERE pvp_user_stats.user_id = p.user_id
      AND p.match_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user stats
CREATE OR REPLACE FUNCTION initialize_pvp_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pvp_user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pvp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment participant score
CREATE OR REPLACE FUNCTION increment_participant_score(
  p_match_id UUID,
  p_user_id UUID,
  p_points INTEGER,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE pvp_participants
  SET 
    total_score = total_score + p_points,
    questions_answered = questions_answered + 1,
    correct_answers = correct_answers + CASE WHEN p_is_correct THEN 1 ELSE 0 END
  WHERE match_id = p_match_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_pvp_stats_on_match_complete ON pvp_matches;
DROP TRIGGER IF EXISTS init_pvp_stats_on_user_create ON auth.users;
DROP TRIGGER IF EXISTS update_pvp_questions_updated_at ON pvp_questions;
DROP TRIGGER IF EXISTS update_pvp_matches_updated_at ON pvp_matches;

-- Create triggers
CREATE TRIGGER update_pvp_stats_on_match_complete
  AFTER UPDATE ON pvp_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_pvp_user_stats();

CREATE TRIGGER init_pvp_stats_on_user_create
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_pvp_user_stats();

CREATE TRIGGER update_pvp_questions_updated_at
  BEFORE UPDATE ON pvp_questions
  FOR EACH ROW EXECUTE FUNCTION update_pvp_updated_at();

CREATE TRIGGER update_pvp_matches_updated_at
  BEFORE UPDATE ON pvp_matches
  FOR EACH ROW EXECUTE FUNCTION update_pvp_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pvp_questions IS 'Question bank for PvP matches';
COMMENT ON TABLE pvp_matches IS 'PvP match instances';
COMMENT ON TABLE pvp_participants IS 'Players participating in matches';
COMMENT ON TABLE pvp_submissions IS 'User submissions for questions in matches';
COMMENT ON TABLE pvp_reactions IS 'Real-time emoji reactions during matches';
COMMENT ON TABLE pvp_user_stats IS 'Aggregate statistics for each user';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 'Tables created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pvp_%'
ORDER BY table_name;

-- Verify enums were created
SELECT 'Enums created:' as status;
SELECT typname 
FROM pg_type 
WHERE typname IN ('match_status', 'question_type', 'match_mode')
ORDER BY typname;

SELECT 'Migration completed successfully!' as status;
