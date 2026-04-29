# Migration 008: Create ai_usage_logs Table

## Overview

This migration creates the `ai_usage_logs` table for the Auto-Grading System. The table tracks AI API usage metrics to ensure the system stays within free tier limits and provides visibility into API consumption patterns.

## Feature

**Feature**: auto-grading-system  
**Task**: 1.3 - Create ai_usage_logs table migration  
**Validates Requirements**: 18.1, 18.2

## Files

- `008-create-ai-usage-logs-table.sql` - Main migration file
- `008-rollback-ai-usage-logs-table.sql` - Rollback script
- `008-verify-ai-usage-logs-table.sql` - Verification script
- `008-AI-USAGE-LOGS-README.md` - This documentation

## Table Schema

### ai_usage_logs

Stores AI API usage metrics for monitoring and free tier compliance.

| Column          | Type        | Constraints                                                      | Description                            |
| --------------- | ----------- | ---------------------------------------------------------------- | -------------------------------------- |
| id              | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4()                          | Unique identifier                      |
| submission_id   | UUID        | NULLABLE, REFERENCES exercise_submissions(id) ON DELETE SET NULL | Optional foreign key to submissions    |
| request_tokens  | INTEGER     | NOT NULL                                                         | Number of tokens in API request        |
| response_tokens | INTEGER     | NOT NULL                                                         | Number of tokens in API response       |
| total_tokens    | INTEGER     | NOT NULL                                                         | Total tokens used (request + response) |
| cache_hit       | BOOLEAN     | DEFAULT FALSE                                                    | Whether request was served from cache  |
| response_time   | INTEGER     | NOT NULL                                                         | Response time in milliseconds          |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                                    | Timestamp when log was created         |

## Constraints

### Foreign Key Constraints

1. **submission_id → exercise_submissions(id)**
   - ON DELETE SET NULL: When a submission is deleted, the log entry is preserved but submission_id is set to NULL
   - NULLABLE: Allows logging AI usage even when not directly tied to a submission
   - Validates Requirement 18.1

## Indexes

1. **idx_ai_usage_logs_created_at**: `(created_at DESC)`
   - Optimizes queries for daily/weekly/monthly usage statistics
   - Supports efficient time-range queries for monitoring
   - Validates Requirement 18.1

2. **idx_ai_usage_logs_cache_hit**: `(cache_hit)`
   - Optimizes queries for cache hit rate analysis
   - Supports filtering cached vs. API calls
   - Validates Requirement 18.2

## Usage Examples

### Insert a Usage Log Entry

```sql
-- Log an AI API call
INSERT INTO ai_usage_logs (
  submission_id,
  request_tokens,
  response_tokens,
  total_tokens,
  cache_hit,
  response_time
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  150,
  200,
  350,
  false,
  1250
);

-- Log a cached result (no API call)
INSERT INTO ai_usage_logs (
  submission_id,
  request_tokens,
  response_tokens,
  total_tokens,
  cache_hit,
  response_time
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  0,
  0,
  0,
  true,
  50
);
```

### Query Daily Usage Statistics

```sql
-- Get today's AI API usage
SELECT
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
  SUM(total_tokens) as total_tokens_used,
  AVG(response_time) as avg_response_time
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day';
```

### Query Usage by Time Period

```sql
-- Get usage statistics for the last 7 days
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(total_tokens) as tokens_used,
  ROUND(AVG(response_time), 2) as avg_response_time
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Check Free Tier Compliance

```sql
-- Check if approaching daily token limit (1M tokens/day)
SELECT
  SUM(total_tokens) as tokens_used_today,
  1000000 as daily_limit,
  ROUND(100.0 * SUM(total_tokens) / 1000000, 2) as percentage_used,
  CASE
    WHEN SUM(total_tokens) > 800000 THEN 'WARNING: Approaching limit'
    WHEN SUM(total_tokens) > 1000000 THEN 'CRITICAL: Limit exceeded'
    ELSE 'OK'
  END as status
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
  AND cache_hit = false;
```

### Analyze Cache Effectiveness

```sql
-- Analyze cache hit rate by hour
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
  SUM(CASE WHEN cache_hit THEN 0 ELSE total_tokens END) as tokens_saved
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

## Execution Instructions

### Apply Migration

```bash
# Using psql
psql -U your_username -d your_database -f backend/database/migrations/008-create-ai-usage-logs-table.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of 008-create-ai-usage-logs-table.sql
```

### Verify Migration

```bash
# Run verification script
psql -U your_username -d your_database -f backend/database/migrations/008-verify-ai-usage-logs-table.sql
```

Expected verification output:

- Table `ai_usage_logs` exists
- All 8 columns are present with correct types
- 1 foreign key constraint exists with SET NULL on delete
- 2 indexes exist (created_at, cache_hit)
- Foreign key constraint includes ON DELETE SET NULL

### Rollback Migration

```bash
# If you need to rollback
psql -U your_username -d your_database -f backend/database/migrations/008-rollback-ai-usage-logs-table.sql
```

## Testing

### Manual Testing

1. **Test Valid Insert with Submission**:

   ```sql
   INSERT INTO ai_usage_logs (
     submission_id,
     request_tokens,
     response_tokens,
     total_tokens,
     cache_hit,
     response_time
   ) VALUES (
     (SELECT id FROM exercise_submissions LIMIT 1),
     150,
     200,
     350,
     false,
     1250
   );
   ```

2. **Test Insert without Submission** (nullable field):

   ```sql
   INSERT INTO ai_usage_logs (
     submission_id,
     request_tokens,
     response_tokens,
     total_tokens,
     cache_hit,
     response_time
   ) VALUES (
     NULL,
     100,
     150,
     250,
     true,
     50
   );
   ```

3. **Test SET NULL on Delete**:

   ```sql
   -- Create a test submission
   INSERT INTO exercise_submissions (id, user_id, exercise_id, code, language)
   VALUES ('test-submission-id', 'user-id', 'exercise-id', 'console.log("test")', 'javascript');

   -- Create a usage log for this submission
   INSERT INTO ai_usage_logs (submission_id, request_tokens, response_tokens, total_tokens, cache_hit, response_time)
   VALUES ('test-submission-id', 100, 150, 250, false, 1000);

   -- Delete the submission (should set submission_id to NULL in ai_usage_logs)
   DELETE FROM exercise_submissions WHERE id = 'test-submission-id';

   -- Verify log entry still exists but submission_id is NULL
   SELECT * FROM ai_usage_logs WHERE submission_id IS NULL;
   ```

4. **Test Index Performance**:

   ```sql
   -- Verify created_at index is used
   EXPLAIN SELECT * FROM ai_usage_logs
   WHERE created_at >= NOW() - INTERVAL '1 day'
   ORDER BY created_at DESC;

   -- Verify cache_hit index is used
   EXPLAIN SELECT COUNT(*) FROM ai_usage_logs
   WHERE cache_hit = true;
   ```

## Requirements Validation

This migration validates the following requirements:

- **Requirement 18.1**: Track daily AI API request count ✓
  - The `created_at` column with index supports efficient daily queries
  - The `cache_hit` column distinguishes actual API calls from cached results

- **Requirement 18.2**: Track daily AI API token usage ✓
  - The `request_tokens`, `response_tokens`, and `total_tokens` columns track token consumption
  - The `created_at` index enables efficient daily aggregation queries

## Monitoring Use Cases

### 1. Daily Usage Dashboard

```sql
-- Get comprehensive daily statistics
SELECT
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate_percent,
  SUM(total_tokens) as total_tokens,
  SUM(CASE WHEN cache_hit THEN 0 ELSE total_tokens END) as api_tokens,
  AVG(response_time) as avg_response_time_ms,
  MAX(response_time) as max_response_time_ms
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE;
```

### 2. Free Tier Compliance Alert

```sql
-- Check if approaching free tier limits
WITH daily_stats AS (
  SELECT
    SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
    SUM(CASE WHEN cache_hit THEN 0 ELSE total_tokens END) as tokens_used
  FROM ai_usage_logs
  WHERE created_at >= CURRENT_DATE
)
SELECT
  api_calls,
  tokens_used,
  CASE
    WHEN api_calls > 12000 THEN 'WARNING: 80% of daily request limit (15 req/min * 60 min * 24 hr = 21,600)'
    WHEN tokens_used > 800000 THEN 'WARNING: 80% of daily token limit (1M tokens)'
    ELSE 'OK'
  END as alert_status
FROM daily_stats;
```

### 3. Performance Monitoring

```sql
-- Identify slow API responses
SELECT
  id,
  submission_id,
  response_time,
  total_tokens,
  cache_hit,
  created_at
FROM ai_usage_logs
WHERE response_time > 5000  -- Slower than 5 seconds
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY response_time DESC;
```

## Notes

- The `submission_id` is nullable to allow logging AI usage even when not tied to a specific submission
- ON DELETE SET NULL preserves usage logs for historical analysis even after submissions are deleted
- The `cache_hit` flag is crucial for distinguishing actual API calls from cached results
- Indexes on `created_at` and `cache_hit` optimize the most common query patterns
- Token tracking supports monitoring against Google Gemini 1.5 Flash free tier limits (1M tokens/day)

## Related Migrations

- **Migration 006**: Added auto-grading columns to `exercise_submissions` table
- **Migration 007**: Created `test_cases` table
- **Migration 008**: Creates `ai_usage_logs` table (this migration)
- **Future migrations**: Will add additional grading infrastructure and API endpoints
