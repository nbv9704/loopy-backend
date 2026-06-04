-- Migration 015: Align admin role and AI usage logging with schema-v2
-- Purpose: Ensure runtime code has the columns/tables it queries in production.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES lesson_submissions(id) ON DELETE SET NULL,
  request_tokens INTEGER NOT NULL,
  response_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  response_time INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
ON ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_cache_hit
ON ai_usage_logs(cache_hit);

COMMENT ON TABLE ai_usage_logs IS 'Logs for tracking AI API usage metrics.';
COMMENT ON COLUMN ai_usage_logs.submission_id IS 'Optional foreign key reference to lesson_submissions table.';
