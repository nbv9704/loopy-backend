# Quick Start: Auto-Grading Migrations

## 🚀 5-Minute Setup

### Prerequisites

- Supabase Dashboard access: https://pbqwkqvdnagkefikxwsv.supabase.co
- SQL Editor permissions

### Execution Steps

1. **Open SQL Editor**
   - Go to Supabase Dashboard → SQL Editor → New Query

2. **Run Migration 006**

   ```
   Copy: backend/database/migrations/006-add-auto-grading-columns.sql
   Paste → Run
   ```

3. **Run Migration 007**

   ```
   Copy: backend/database/migrations/007-create-test-cases-table.sql
   Paste → Run
   ```

4. **Run Migration 008**

   ```
   Copy: backend/database/migrations/008-create-ai-usage-logs-table.sql
   Paste → Run
   ```

5. **Verify All**

   ```sql
   SELECT
     'exercise_submissions columns' as check_type,
     COUNT(*) as count
   FROM information_schema.columns
   WHERE table_name = 'exercise_submissions'
     AND column_name IN (
       'test_score', 'ai_score', 'final_score', 'grade_level',
       'test_results', 'ai_analysis', 'feedback', 'graded_at',
       'grading_method', 'override_by', 'override_at', 'override_note'
     )
   UNION ALL
   SELECT 'test_cases table', COUNT(*)
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'test_cases'
   UNION ALL
   SELECT 'ai_usage_logs table', COUNT(*)
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'ai_usage_logs';
   ```

   **Expected:** 12, 1, 1

### ✅ Done!

If all counts match, migrations are complete.

### 📚 Need Help?

- Full guide: `AUTO-GRADING-MIGRATIONS-GUIDE.md`
- Detailed summary: `TASK-1.4-EXECUTION-SUMMARY.md`
- Troubleshooting: See guides above

### ⚠️ Common Issues

**"already exists"** → Safe to ignore  
**"permission denied"** → Use service role key  
**Wrong counts** → Re-run failed migration
