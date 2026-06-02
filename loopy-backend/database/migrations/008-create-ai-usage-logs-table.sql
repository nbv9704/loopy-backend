-- Migration 008: Create ai_usage_logs table for Auto-Grading System
-- Feature: auto-grading-system
-- Task: 1.3 - Create ai_usage_logs table migration
-- Validates Requirements: 18.1, 18.2

-- ============================================================================
-- CREATE ai_usage_logs TABLE
-- ============================================================================

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

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying logs by date (for daily usage tracking)
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at 
ON ai_usage_logs(created_at DESC);

-- Index for filtering by cache hit status (for cache hit rate analysis)
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_cache_hit 
ON ai_usage_logs(cache_hit);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_usage_logs IS 'Logs for tracking AI API usage metrics to ensure free tier compliance';
COMMENT ON COLUMN ai_usage_logs.id IS 'Unique identifier for the usage log entry';
COMMENT ON COLUMN ai_usage_logs.submission_id IS 'Optional foreign key reference to lesson_submissions table (nullable)';
COMMENT ON COLUMN ai_usage_logs.request_tokens IS 'Number of tokens used in the API request';
COMMENT ON COLUMN ai_usage_logs.response_tokens IS 'Number of tokens used in the API response';
COMMENT ON COLUMN ai_usage_logs.total_tokens IS 'Total tokens used (request + response)';
COMMENT ON COLUMN ai_usage_logs.cache_hit IS 'Whether this request was served from cache (true) or made an API call (false)';
COMMENT ON COLUMN ai_usage_logs.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN ai_usage_logs.created_at IS 'Timestamp when the log entry was created';
