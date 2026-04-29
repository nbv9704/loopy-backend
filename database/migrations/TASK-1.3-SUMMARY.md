# Task 1.3 Summary: Create ai_usage_logs Table Migration

## Overview

Successfully created the `ai_usage_logs` table migration for the Auto-Grading System. This table tracks AI API usage metrics to ensure the system stays within Google Gemini 1.5 Flash free tier limits (15 requests/minute, 1M tokens/day).

## Feature

**Feature**: auto-grading-system  
**Task**: 1.3 - Create ai_usage_logs table migration  
**Validates Requirements**: 18.1, 18.2

## Files Created

1. **008-create-ai-usage-logs-table.sql** - Main migration file
2. **008-rollback-ai-usage-logs-table.sql** - Rollback script
3. **008-verify-ai-usage-logs-table.sql** - Verification script
4. **008-AI-USAGE-LOGS-README.md** - Comprehensive documentation
5. **TASK-1.3-SUMMARY.md** - This summary document

## Table Schema

### ai_usage_logs

| Column          | Type        | Constraints                                                      | Description                       |
| --------------- | ----------- | ---------------------------------------------------------------- | --------------------------------- |
| id              | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4()                          | Unique identifier                 |
| submission_id   | UUID        | NULLABLE, REFERENCES exercise_submissions(id) ON DELETE SET NULL | Optional FK to submissions        |
| request_tokens  | INTEGER     | NOT NULL                                                         | Tokens in API request             |
| response_tokens | INTEGER     | NOT NULL                                                         | Tokens in API response            |
| total_tokens    | INTEGER     | NOT NULL                                                         | Total tokens (request + response) |
| cache_hit       | BOOLEAN     | DEFAULT FALSE                                                    | Whether served from cache         |
| response_time   | INTEGER     | NOT NULL                                                         | Response time in milliseconds     |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                                    | Log creation timestamp            |

## Indexes

1. **idx_ai_usage_logs_created_at**: `(created_at DESC)`
   - Optimizes daily/weekly/monthly usage queries
   - Supports time-range filtering for monitoring

2. **idx_ai_usage_logs_cache_hit**: `(cache_hit)`
   - Optimizes cache hit rate analysis
   - Supports filtering cached vs. API calls

## Key Features

### 1. Nullable submission_id

- Allows logging AI usage even when not tied to a specific submission
- ON DELETE SET NULL preserves logs for historical analysis

### 2. Token Tracking

- Tracks request, response, and total tokens
- Supports monitoring against free tier limits (1M tokens/day)

### 3. Cache Hit Tracking

- Distinguishes actual API calls from cached results
- Enables cache effectiveness analysis

### 4. Performance Monitoring

- Records response time for each request
- Supports identifying slow API responses

## Usage Examples

### Daily Usage Statistics

```sql
SELECT
  COUNT(*) as total_requests,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
  SUM(total_tokens) as total_tokens_used,
  AVG(response_time) as avg_response_time
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE;
```

### Free Tier Compliance Check

```sql
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
  AND cache_hit = false;
```

## Execution Instructions

### Apply Migration

**Via Supabase Dashboard (Recommended)**:

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `008-create-ai-usage-logs-table.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (should take < 1 second)

**Expected Output**:

```
CREATE TABLE
CREATE INDEX
CREATE INDEX
COMMENT
COMMENT
COMMENT
...
```

### Verify Migration

Run the verification script:

1. Open Supabase SQL Editor
2. Copy contents of `008-verify-ai-usage-logs-table.sql`
3. Paste and run
4. Review output

**Expected Results**:

- Table `ai_usage_logs` exists
- 8 columns present with correct types
- 1 foreign key constraint with ON DELETE SET NULL
- 2 indexes created (created_at, cache_hit)

### Rollback Migration

If needed, run the rollback:

1. Open Supabase SQL Editor
2. Copy contents of `008-rollback-ai-usage-logs-table.sql`
3. Paste and run

**Warning**: This will permanently delete all AI usage logs!

## Requirements Validation

### Requirement 18.1: Track Daily AI API Request Count ✓

- `created_at` column with DESC index enables efficient daily queries
- `cache_hit` column distinguishes actual API calls from cached results
- Supports queries like: "How many API calls were made today?"

### Requirement 18.2: Track Daily AI API Token Usage ✓

- `request_tokens`, `response_tokens`, `total_tokens` columns track consumption
- `created_at` index enables efficient daily aggregation
- Supports queries like: "How many tokens were used today?"

## Integration Points

### 1. AI Analyzer Service

The AI Analyzer Service will log usage after each API call:

```typescript
async function analyzeCode(params: AIAnalysisParams): Promise<AIAnalysis> {
  const startTime = Date.now()

  // Check cache first
  const cacheKey = generateCacheKey(params.code, params.exerciseId, params.language)
  const cached = await cache.get(cacheKey)

  if (cached) {
    // Log cache hit
    await logAIUsage({
      submission_id: params.submissionId,
      request_tokens: 0,
      response_tokens: 0,
      total_tokens: 0,
      cache_hit: true,
      response_time: Date.now() - startTime,
    })
    return cached
  }

  // Make API call
  const result = await callGeminiAPI(params)

  // Log API usage
  await logAIUsage({
    submission_id: params.submissionId,
    request_tokens: result.usage.promptTokens,
    response_tokens: result.usage.completionTokens,
    total_tokens: result.usage.totalTokens,
    cache_hit: false,
    response_time: Date.now() - startTime,
  })

  return result
}
```

### 2. Admin Dashboard

The admin dashboard will query this table for usage statistics:

```typescript
// GET /api/admin/grading/usage
async function getUsageStats(req: AuthRequest, res: Response) {
  const stats = await supabase
    .from('ai_usage_logs')
    .select('*')
    .gte('created_at', new Date().toISOString().split('T')[0])

  const totalRequests = stats.data.length
  const apiCalls = stats.data.filter(log => !log.cache_hit).length
  const cacheHits = stats.data.filter(log => log.cache_hit).length
  const totalTokens = stats.data.reduce((sum, log) => sum + log.total_tokens, 0)

  return res.json({
    success: true,
    data: {
      totalRequests,
      apiCalls,
      cacheHits,
      cacheHitRate: (cacheHits / totalRequests) * 100,
      totalTokens,
      dailyLimit: 1000000,
      percentageUsed: (totalTokens / 1000000) * 100,
    },
  })
}
```

### 3. Rate Limiting

The rate limiter will check this table before making API calls:

```typescript
async function checkRateLimit(): Promise<RateLimitStatus> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Check daily token usage
  const { data: dailyLogs } = await supabase
    .from('ai_usage_logs')
    .select('total_tokens')
    .gte('created_at', today)
    .eq('cache_hit', false)

  const tokensUsed = dailyLogs.reduce((sum, log) => sum + log.total_tokens, 0)

  // Check minute rate limit
  const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString()
  const { data: recentLogs } = await supabase
    .from('ai_usage_logs')
    .select('id')
    .gte('created_at', oneMinuteAgo)
    .eq('cache_hit', false)

  return {
    requestsRemaining: Math.max(0, 15 - recentLogs.length),
    tokensRemaining: Math.max(0, 1000000 - tokensUsed),
    resetTime: new Date(now.getTime() + 60000),
  }
}
```

## Monitoring Use Cases

### 1. Daily Usage Dashboard

Track daily API consumption:

- Total requests (cached + API calls)
- Actual API calls (cache_hit = false)
- Cache hits and hit rate
- Total tokens consumed
- Average response time

### 2. Free Tier Compliance Alerts

Monitor against limits:

- Daily token usage vs. 1M limit
- Minute request rate vs. 15 req/min limit
- Alert at 80% of limits

### 3. Performance Monitoring

Identify issues:

- Slow API responses (> 5 seconds)
- Token usage spikes
- Cache effectiveness trends

### 4. Cost Optimization

Analyze patterns:

- Cache hit rate by time of day
- Token usage by exercise type
- Response time distribution

## Next Steps

After this migration:

1. **Task 1.4**: Create additional grading infrastructure (if any)
2. **Task 2.x**: Implement Test Runner Service
3. **Task 3.x**: Implement AI Analyzer Service with usage logging
4. **Task 6.x**: Implement rate limiting using ai_usage_logs
5. **Task 10.x**: Create admin dashboard endpoint for usage statistics

## Testing Checklist

- [ ] Migration runs successfully in Supabase
- [ ] All 8 columns created with correct types
- [ ] Foreign key constraint includes ON DELETE SET NULL
- [ ] Both indexes created successfully
- [ ] Can insert log entries with submission_id
- [ ] Can insert log entries without submission_id (NULL)
- [ ] Daily usage query performs well (uses created_at index)
- [ ] Cache hit rate query performs well (uses cache_hit index)
- [ ] Deleting a submission sets submission_id to NULL in logs

## Notes

- The table is designed for high-volume inserts (one per AI API call)
- Indexes optimize the most common query patterns (daily stats, cache analysis)
- ON DELETE SET NULL preserves historical data for analytics
- The schema supports both cached and non-cached requests
- Token tracking enables precise free tier monitoring

## Related Documentation

- **Design Document**: `.kiro/specs/auto-grading-system/design.md`
- **Requirements**: `.kiro/specs/auto-grading-system/requirements.md`
- **Tasks**: `.kiro/specs/auto-grading-system/tasks.md`
- **Migration README**: `008-AI-USAGE-LOGS-README.md`
- **Previous Migration**: `TASK-1.2-SUMMARY.md` (test_cases table)
