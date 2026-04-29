# Auto-Grading System Migrations Guide

## Overview

This guide covers the execution and verification of database migrations for the Auto-Grading System feature. Three migrations need to be executed in order:

1. **Migration 006**: Extends `exercise_submissions` table with grading columns
2. **Migration 007**: Creates `test_cases` table for test case management
3. **Migration 008**: Creates `ai_usage_logs` table for AI API usage tracking

## Prerequisites

- Access to Supabase Dashboard
- Admin privileges on the database
- The base schema must already be deployed (with `exercises` and `exercise_submissions` tables)

## Quick Start (Recommended Method)

### Via Supabase SQL Editor

This is the **recommended approach** as it provides immediate feedback and doesn't require local PostgreSQL tools.

#### Step 1: Execute Migration 006

1. Open your Supabase project: https://pbqwkqvdnagkefikxwsv.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `backend/database/migrations/006-add-auto-grading-columns.sql`
5. Copy the entire contents and paste into the editor
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
7. **Expected Output**: Success message with no errors

#### Step 2: Verify Migration 006

1. In the same SQL Editor, click **New Query**
2. Open `backend/database/migrations/006-verify-auto-grading-columns.sql`
3. Copy the entire contents and paste into the editor
4. Click **Run**
5. **Expected Results**:
   - 12 columns should be listed (test_score, ai_score, final_score, etc.)
   - 5 CHECK constraints should be present
   - 2 indexes should be created
   - 1 foreign key constraint should exist

#### Step 3: Execute Migration 007

1. Click **New Query** in SQL Editor
2. Open `backend/database/migrations/007-create-test-cases-table.sql`
3. Copy the entire contents and paste into the editor
4. Click **Run**
5. **Expected Output**: Success message with no errors

#### Step 4: Verify Migration 007

1. Click **New Query** in SQL Editor
2. Open `backend/database/migrations/007-verify-test-cases-table.sql`
3. Copy the entire contents and paste into the editor
4. Click **Run**
5. **Expected Results**:
   - `test_cases` table should exist
   - 11 columns should be listed
   - 2 CHECK constraints should be present (weight, timeout)
   - 1 foreign key constraint with CASCADE delete
   - 2 indexes should be created

#### Step 5: Execute Migration 008

1. Click **New Query** in SQL Editor
2. Open `backend/database/migrations/008-create-ai-usage-logs-table.sql`
3. Copy the entire contents and paste into the editor
4. Click **Run**
5. **Expected Output**: Success message with no errors

#### Step 6: Verify Migration 008

1. Click **New Query** in SQL Editor
2. Open `backend/database/migrations/008-verify-ai-usage-logs-table.sql`
3. Copy the entire contents and paste into the editor
4. Click **Run**
5. **Expected Results**:
   - `ai_usage_logs` table should exist
   - 8 columns should be listed
   - 1 foreign key constraint with SET NULL on delete
   - 2 indexes should be created

## Alternative Method: Command Line (Advanced)

If you have PostgreSQL client tools installed and a direct database connection string:

### Using the Shell Script

```bash
# Set your database connection string
export DATABASE_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'

# Run the migration script
cd backend/database/migrations
./run-auto-grading-migrations.sh
```

### Manual psql Execution

```bash
# Execute migrations
psql $DATABASE_URL -f 006-add-auto-grading-columns.sql
psql $DATABASE_URL -f 006-verify-auto-grading-columns.sql

psql $DATABASE_URL -f 007-create-test-cases-table.sql
psql $DATABASE_URL -f 007-verify-test-cases-table.sql

psql $DATABASE_URL -f 008-create-ai-usage-logs-table.sql
psql $DATABASE_URL -f 008-verify-ai-usage-logs-table.sql
```

## What Gets Created

### Migration 006: exercise_submissions Extensions

**12 New Columns:**

- `test_score` (INTEGER, 0-100) - Score from test-based grading
- `ai_score` (INTEGER, 0-100) - Score from AI-based grading
- `final_score` (INTEGER, 0-100) - Combined final score
- `grade_level` (TEXT) - Categorical grade (excellent, good, satisfactory, needs_improvement, poor)
- `test_results` (JSONB) - Detailed test case results
- `ai_analysis` (JSONB) - AI analysis scores and feedback
- `feedback` (TEXT) - Combined feedback text
- `graded_at` (TIMESTAMPTZ) - Grading completion timestamp
- `grading_method` (TEXT) - Method used (test, ai, both)
- `override_by` (UUID) - Admin who performed override
- `override_at` (TIMESTAMPTZ) - Override timestamp
- `override_note` (TEXT) - Override explanation

**5 CHECK Constraints:**

- test_score: 0-100 range
- ai_score: 0-100 range
- final_score: 0-100 range
- grade_level: Valid enum values
- grading_method: Valid enum values (test, ai, both)

**2 Indexes:**

- `idx_exercise_submissions_graded_at` - For timestamp queries
- `idx_exercise_submissions_final_score` - For score-based queries

**1 Foreign Key:**

- `override_by` → `auth.users(id)` - Links to admin user

### Migration 007: test_cases Table

**New Table with 11 Columns:**

- `id` (UUID) - Primary key
- `exercise_id` (UUID) - Foreign key to exercises
- `input` (JSONB) - Test case input data
- `expected_output` (JSONB) - Expected output for comparison
- `weight` (INTEGER, 0-100) - Weight in final score calculation
- `timeout` (INTEGER, >0) - Maximum execution time in milliseconds
- `description` (TEXT) - Human-readable description
- `is_hidden` (BOOLEAN) - Whether hidden from students
- `order_index` (INTEGER) - Display order
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**2 CHECK Constraints:**

- weight: 0-100 range
- timeout: Must be positive

**1 Foreign Key:**

- `exercise_id` → `exercises(id)` ON DELETE CASCADE

**2 Indexes:**

- `idx_test_cases_exercise_order` - Composite index on (exercise_id, order_index)
- `idx_test_cases_exercise_hidden` - Composite index on (exercise_id, is_hidden)

### Migration 008: ai_usage_logs Table

**New Table with 8 Columns:**

- `id` (UUID) - Primary key
- `submission_id` (UUID, nullable) - Optional link to submission
- `request_tokens` (INTEGER) - Tokens used in request
- `response_tokens` (INTEGER) - Tokens used in response
- `total_tokens` (INTEGER) - Total tokens used
- `cache_hit` (BOOLEAN) - Whether served from cache
- `response_time` (INTEGER) - Response time in milliseconds
- `created_at` (TIMESTAMPTZ) - Log entry timestamp

**1 Foreign Key:**

- `submission_id` → `exercise_submissions(id)` ON DELETE SET NULL

**2 Indexes:**

- `idx_ai_usage_logs_created_at` - For date-based queries
- `idx_ai_usage_logs_cache_hit` - For cache hit rate analysis

## Verification Checklist

After running all migrations, verify the following:

### In Supabase Dashboard

- [ ] Navigate to **Table Editor**
- [ ] Confirm `exercise_submissions` table has 12 new columns
- [ ] Confirm `test_cases` table exists with 11 columns
- [ ] Confirm `ai_usage_logs` table exists with 8 columns
- [ ] Navigate to **Database** > **Indexes**
- [ ] Confirm 4 new indexes are present
- [ ] Navigate to **Database** > **Constraints**
- [ ] Confirm CHECK constraints are present

### Via SQL Queries

Run these queries in SQL Editor to double-check:

```sql
-- Check exercise_submissions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'exercise_submissions'
  AND column_name IN (
    'test_score', 'ai_score', 'final_score', 'grade_level',
    'test_results', 'ai_analysis', 'feedback', 'graded_at',
    'grading_method', 'override_by', 'override_at', 'override_note'
  )
ORDER BY column_name;
-- Expected: 12 rows

-- Check test_cases table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'test_cases';
-- Expected: 1 row

-- Check ai_usage_logs table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'ai_usage_logs';
-- Expected: 1 row

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('exercise_submissions', 'test_cases', 'ai_usage_logs')
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
-- Expected: 4 rows
```

## Troubleshooting

### Error: "relation does not exist"

**Problem**: Base tables haven't been created yet.

**Solution**: Deploy the base schema first:

1. Ensure `exercises` table exists
2. Ensure `exercise_submissions` table exists
3. Ensure `auth.users` table exists (Supabase default)

### Error: "column already exists"

**Problem**: Migration has already been run.

**Solution**: This is safe! The migrations use `IF NOT EXISTS` clauses. You can:

- Skip to the next migration
- Or re-run safely (it will be a no-op)

### Error: "permission denied"

**Problem**: Insufficient database privileges.

**Solution**: Ensure you're using the service role key or are logged in as a superuser.

### Verification Shows Missing Items

**Problem**: Some columns, indexes, or constraints are missing.

**Solution**:

1. Check the SQL Editor output for errors during migration
2. Re-run the specific migration that failed
3. Check Supabase logs for detailed error messages

## Rollback Procedure

If you need to undo the migrations:

### ⚠️ WARNING

**Running rollback will permanently delete all grading data!**

Backup first if you have data you want to keep.

### Rollback Migration 008

```sql
-- Drop ai_usage_logs table
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
```

### Rollback Migration 007

```sql
-- Drop test_cases table
DROP TABLE IF EXISTS test_cases CASCADE;
```

### Rollback Migration 006

Run the rollback script:

```bash
# Via SQL Editor
# Open and run: 006-rollback-auto-grading-columns.sql
```

Or manually:

```sql
-- Drop columns from exercise_submissions
ALTER TABLE exercise_submissions
DROP COLUMN IF EXISTS test_score,
DROP COLUMN IF EXISTS ai_score,
DROP COLUMN IF EXISTS final_score,
DROP COLUMN IF EXISTS grade_level,
DROP COLUMN IF EXISTS test_results,
DROP COLUMN IF EXISTS ai_analysis,
DROP COLUMN IF EXISTS feedback,
DROP COLUMN IF EXISTS graded_at,
DROP COLUMN IF EXISTS grading_method,
DROP COLUMN IF EXISTS override_by,
DROP COLUMN IF EXISTS override_at,
DROP COLUMN IF EXISTS override_note;

-- Drop indexes
DROP INDEX IF EXISTS idx_exercise_submissions_graded_at;
DROP INDEX IF EXISTS idx_exercise_submissions_final_score;
```

## Post-Migration Steps

After successful migration:

1. **Update Task Status**: Mark Task 1.4 as complete in `tasks.md`
2. **Document Issues**: Note any issues encountered in this guide
3. **Proceed to Next Task**: Move to Task 2.1 (Cache Service implementation)
4. **Test Schema**: Try inserting test data to verify constraints work

### Test Data Example

```sql
-- Test inserting a graded submission (requires existing exercise and submission)
UPDATE exercise_submissions
SET
  test_score = 85,
  ai_score = 78,
  final_score = 82,  -- (85 * 0.7) + (78 * 0.3) = 82.9 ≈ 82
  grade_level = 'good',
  grading_method = 'both',
  graded_at = NOW()
WHERE id = 'YOUR_SUBMISSION_ID';

-- Test inserting a test case (requires existing exercise)
INSERT INTO test_cases (
  exercise_id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  is_hidden,
  order_index
) VALUES (
  'YOUR_EXERCISE_ID',
  '{"numbers": [1, 2, 3, 4, 5]}'::jsonb,
  '{"sum": 15}'::jsonb,
  20,
  1000,
  'Test basic array sum',
  false,
  1
);

-- Test inserting an AI usage log
INSERT INTO ai_usage_logs (
  submission_id,
  request_tokens,
  response_tokens,
  total_tokens,
  cache_hit,
  response_time
) VALUES (
  NULL,  -- Can be null
  150,
  200,
  350,
  false,
  1250
);
```

## Support

For issues or questions:

1. **Check verification output**: Run all verification scripts
2. **Review migration logs**: Check Supabase SQL Editor output
3. **Check database directly**: Use SQL queries in Supabase dashboard
4. **Review design document**: `.kiro/specs/auto-grading-system/design.md`
5. **Check requirements**: `.kiro/specs/auto-grading-system/requirements.md`

## Files Reference

- `006-add-auto-grading-columns.sql` - Migration for exercise_submissions extensions
- `006-verify-auto-grading-columns.sql` - Verification script for migration 006
- `006-rollback-auto-grading-columns.sql` - Rollback script for migration 006
- `007-create-test-cases-table.sql` - Migration for test_cases table
- `007-verify-test-cases-table.sql` - Verification script for migration 007
- `007-rollback-test-cases-table.sql` - Rollback script for migration 007
- `008-create-ai-usage-logs-table.sql` - Migration for ai_usage_logs table
- `008-verify-ai-usage-logs-table.sql` - Verification script for migration 008
- `008-rollback-ai-usage-logs-table.sql` - Rollback script for migration 008
- `run-auto-grading-migrations.sh` - Automated execution script (requires psql)
- `AUTO-GRADING-MIGRATIONS-GUIDE.md` - This file (comprehensive guide)

## Migration Status

- [x] Migration 006: exercise_submissions extensions - **Ready to execute**
- [x] Migration 007: test_cases table - **Ready to execute**
- [x] Migration 008: ai_usage_logs table - **Ready to execute**
- [ ] Verification 006 - **Pending execution**
- [ ] Verification 007 - **Pending execution**
- [ ] Verification 008 - **Pending execution**

---

**Last Updated**: Task 1.4 execution
**Feature**: auto-grading-system
**Requirements Validated**: 11.1, 11.2, 11.3
