/**
 * Run auto-grading migrations on Supabase
 * Usage: npx tsx src/scripts/migrate-grading.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('🔄 Running auto-grading migrations...\n')

  // Migration 1: Add columns to exercise_submissions
  console.log('1/3 Adding grading columns to exercise_submissions...')
  const { error: e1 } = await supabase.rpc('pgmigrate', {
    query: `
      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS test_score INTEGER,
      ADD COLUMN IF NOT EXISTS ai_score INTEGER,
      ADD COLUMN IF NOT EXISTS final_score INTEGER;

      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS grade_level TEXT;

      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS test_results JSONB,
      ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS feedback TEXT,
      ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'both';

      ALTER TABLE exercise_submissions 
      ADD COLUMN IF NOT EXISTS override_by UUID,
      ADD COLUMN IF NOT EXISTS override_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS override_note TEXT;
    `,
  })

  if (e1) {
    // RPC doesn't exist, we need to use the Supabase SQL editor
    console.log('⚠️  Cannot run SQL via RPC. Using direct table operations instead...\n')

    // Test if columns already exist by trying to select them
    const { error: testErr } = await supabase
      .from('exercise_submissions')
      .select('test_score')
      .limit(1)

    if (testErr) {
      console.log('❌ Columns missing. Please run the following SQL in Supabase SQL Editor:')
      console.log('   URL: https://supabase.com/dashboard/project/pbqwkqvdnagkefikxwsv/sql\n')
      console.log('--- COPY FROM HERE ---')
      console.log(`
-- Migration 006: Add grading columns
ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS test_score INTEGER,
ADD COLUMN IF NOT EXISTS ai_score INTEGER,
ADD COLUMN IF NOT EXISTS final_score INTEGER;

ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS grade_level TEXT;

ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS test_results JSONB,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'both';

ALTER TABLE exercise_submissions 
ADD COLUMN IF NOT EXISTS override_by UUID,
ADD COLUMN IF NOT EXISTS override_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS override_note TEXT;

-- Migration 007: Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  weight INTEGER DEFAULT 10,
  timeout INTEGER DEFAULT 1000,
  description TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_exercise_order 
ON test_cases(exercise_id, order_index);

-- Migration 008: Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES exercise_submissions(id) ON DELETE SET NULL,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  response_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created 
ON ai_usage_logs(created_at DESC);

-- Disable RLS for service role access
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on test_cases" ON test_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on ai_usage_logs" ON ai_usage_logs FOR ALL USING (true) WITH CHECK (true);
`)
      console.log('--- END COPY ---\n')
    } else {
      console.log('✅ Columns already exist!')
    }
    return
  }

  console.log('✅ All migrations completed!')
}

runMigrations().catch(console.error)
