# Task 1.3 Quick Reference: ai_usage_logs Table

## 🎯 Purpose

Track AI API usage metrics to ensure free tier compliance (Google Gemini 1.5 Flash: 15 req/min, 1M tokens/day).

## 📁 Files

- `008-create-ai-usage-logs-table.sql` - Main migration
- `008-rollback-ai-usage-logs-table.sql` - Rollback
- `008-verify-ai-usage-logs-table.sql` - Verification
- `008-AI-USAGE-LOGS-README.md` - Full documentation

## 🚀 Quick Start

### Apply Migration

1. Open Supabase SQL Editor
2. Copy `008-create-ai-usage-logs-table.sql`
3. Paste and Run
4. Done! (< 1 second)

### Verify

```sql
-- Check table exists
SELECT * FROM ai_usage_logs LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'ai_usage_logs';
```

## 📊 Table Schema

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  submission_id UUID NULLABLE,  -- FK to exercise_submissions
  request_tokens INTEGER,
  response_tokens INTEGER,
  total_tokens INTEGER,
  cache_hit BOOLEAN,
  response_time INTEGER,        -- milliseconds
  created_at TIMESTAMPTZ
);
```

## 🔍 Common Queries

### Today's Usage

```sql
SELECT
  COUNT(*) as requests,
  SUM(CASE WHEN cache_hit THEN 0 ELSE 1 END) as api_calls,
  SUM(total_tokens) as tokens,
  ROUND(AVG(response_time), 2) as avg_ms
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE;
```

### Free Tier Check

```sql
SELECT
  SUM(total_tokens) as tokens_used,
  ROUND(100.0 * SUM(total_tokens) / 1000000, 2) as percent_of_limit
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE
  AND cache_hit = false;
```

### Cache Hit Rate

```sql
SELECT
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate
FROM ai_usage_logs
WHERE created_at >= CURRENT_DATE;
```

## ✅ Validates

- **Requirement 18.1**: Track daily AI API request count
- **Requirement 18.2**: Track daily AI API token usage

## 🔗 Integration

### Log Usage (TypeScript)

```typescript
await supabase.from('ai_usage_logs').insert({
  submission_id: submissionId,
  request_tokens: 150,
  response_tokens: 200,
  total_tokens: 350,
  cache_hit: false,
  response_time: 1250,
})
```

### Check Rate Limit

```typescript
const { data } = await supabase
  .from('ai_usage_logs')
  .select('total_tokens')
  .gte('created_at', today)
  .eq('cache_hit', false)

const tokensUsed = data.reduce((sum, log) => sum + log.total_tokens, 0)
const remaining = 1000000 - tokensUsed
```

## 📈 Monitoring

- **Daily tokens**: Should stay < 1M
- **Minute rate**: Should stay < 15 req/min
- **Cache hit rate**: Target > 30%
- **Response time**: Target < 2000ms

## 🔄 Next Steps

1. Implement AI Analyzer Service (Task 3.x)
2. Add usage logging to AI calls
3. Implement rate limiting (Task 6.x)
4. Create admin dashboard (Task 10.x)
