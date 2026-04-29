# Migration 006: Auto-Grading System Database Schema

## Overview

This migration extends the `exercise_submissions` table to support the Auto-Grading System feature. It adds columns for storing test scores, AI analysis, combined grading results, and admin override capabilities.

## Feature

**Feature**: auto-grading-system  
**Task**: 1.1 - Create database migration file for exercise_submissions table extensions  
**Validates Requirements**: 4.7, 4.8, 11.1

## Files

- `006-add-auto-grading-columns.sql` - Main migration file
- `006-rollback-auto-grading-columns.sql` - Rollback migration
- `006-verify-auto-grading-columns.sql` - Verification queries
- `006-AUTO-GRADING-README.md` - This documentation

## Changes

### New Columns

#### Score Columns

- `test_score` (INTEGER) - Score from test-based grading (0-100)
- `ai_score` (INTEGER) - Score from AI-based code quality analysis (0-100)
- `final_score` (INTEGER) - Combined final score: (test_score × 0.7) + (ai_score × 0.3)

#### Grade Classification

- `grade_level` (TEXT) - Categorical grade based on final_score:
  - `excellent` (90-100)
  - `good` (80-89)
  - `satisfactory` (70-79)
  - `needs_improvement` (60-69)
  - `poor` (0-59)

#### Detailed Results

- `test_results` (JSONB) - Detailed test case results including pass/fail status, execution time, and errors
- `ai_analysis` (JSONB) - AI analysis breakdown including scores for code quality, best practices, complexity, and security

#### Feedback and Metadata

- `feedback` (TEXT) - Combined feedback text from test results and AI analysis
- `graded_at` (TIMESTAMPTZ) - Timestamp when grading was completed
- `grading_method` (TEXT) - Grading method used: `test`, `ai`, or `both` (default: `both`)

#### Admin Override

- `override_by` (UUID) - Foreign key to `auth.users(id)` - Admin who performed manual score override
- `override_at` (TIMESTAMPTZ) - Timestamp of manual score override
- `override_note` (TEXT) - Note explaining the reason for manual score override

### Constraints

#### CHECK Constraints

1. `test_score >= 0 AND test_score <= 100` - Ensures test score is in valid range
2. `ai_score >= 0 AND ai_score <= 100` - Ensures AI score is in valid range
3. `final_score >= 0 AND final_score <= 100` - Ensures final score is in valid range
4. `grade_level IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')` - Ensures valid grade level
5. `grading_method IN ('test', 'ai', 'both')` - Ensures valid grading method

#### Foreign Key Constraints

1. `override_by REFERENCES auth.users(id)` - Ensures override_by references a valid user

### Indexes

1. `idx_exercise_submissions_graded_at` - Index on `graded_at DESC` for efficient querying of recent submissions
2. `idx_exercise_submissions_final_score` - Index on `final_score DESC` for efficient querying of top-scoring submissions

## Usage

### Apply Migration

Run the migration in Supabase SQL Editor or via migration tool:

```sql
-- Execute the migration
\i backend/database/migrations/006-add-auto-grading-columns.sql
```

### Verify Migration

Run the verification script to confirm all changes were applied correctly:

```sql
-- Execute the verification script
\i backend/database/migrations/006-verify-auto-grading-columns.sql
```

Expected results:

- 12 new columns in `exercise_submissions` table
- 5 CHECK constraints
- 1 foreign key constraint
- 2 new indexes
- 12 column comments

### Rollback Migration

If you need to rollback the migration:

```sql
-- Execute the rollback script
\i backend/database/migrations/006-rollback-auto-grading-columns.sql
```

## JSONB Structure Examples

### test_results JSONB

```json
{
  "totalTests": 5,
  "passedTests": 4,
  "failedTests": 1,
  "totalWeight": 100,
  "earnedWeight": 80,
  "results": [
    {
      "testCaseId": "uuid",
      "description": "Basic array sum",
      "passed": true,
      "actualOutput": 15,
      "expectedOutput": 15,
      "executionTime": 2,
      "error": null
    },
    {
      "testCaseId": "uuid",
      "description": "Large numbers",
      "passed": false,
      "actualOutput": 5999999,
      "expectedOutput": 6000000,
      "executionTime": 5,
      "error": "Floating point precision error"
    }
  ]
}
```

### ai_analysis JSONB

```json
{
  "scores": {
    "codeQuality": 85,
    "bestPractices": 90,
    "complexity": 75,
    "security": 80
  },
  "overallScore": 83,
  "strengths": [
    "Tên biến rõ ràng và có ý nghĩa",
    "Xử lý lỗi tốt với try-catch",
    "Code dễ đọc và dễ hiểu"
  ],
  "improvements": [
    "Có thể tối ưu vòng lặp bằng Array.reduce()",
    "Nên thêm validate input",
    "Có thể cải thiện time complexity"
  ],
  "suggestions": [
    "Dùng Array.reduce() thay vì vòng lặp for",
    "Thêm kiểm tra input !== null && input !== undefined",
    "Xem xét sử dụng Map để tối ưu lookup"
  ],
  "feedback": "Code của bạn rất tốt! Tên biến rõ ràng và dễ hiểu..."
}
```

## Integration Notes

### Backend Integration

After applying this migration, update your backend code to:

1. **Insert submissions with grading data**:

```typescript
const { data, error } = await supabase.from('exercise_submissions').insert({
  user_id: userId,
  exercise_id: exerciseId,
  code: code,
  test_score: 85,
  ai_score: 90,
  final_score: 87,
  grade_level: 'good',
  test_results: testResultsJson,
  ai_analysis: aiAnalysisJson,
  feedback: feedbackText,
  graded_at: new Date(),
  grading_method: 'both',
})
```

2. **Query submissions with grading data**:

```typescript
const { data, error } = await supabase
  .from('exercise_submissions')
  .select('*, test_score, ai_score, final_score, grade_level, feedback, graded_at')
  .eq('user_id', userId)
  .eq('exercise_id', exerciseId)
  .order('graded_at', { ascending: false })
```

3. **Admin override**:

```typescript
const { data, error } = await supabase
  .from('exercise_submissions')
  .update({
    test_score: newTestScore,
    ai_score: newAiScore,
    final_score: newFinalScore,
    grade_level: newGradeLevel,
    override_by: adminUserId,
    override_at: new Date(),
    override_note: overrideNote,
  })
  .eq('id', submissionId)
```

## Testing

### Manual Testing

1. **Test score constraints**:

```sql
-- Should succeed
INSERT INTO exercise_submissions (user_id, exercise_id, code, execution_time, test_score)
VALUES ('user-uuid', 'exercise-uuid', 'console.log("test")', 100, 85);

-- Should fail (score > 100)
INSERT INTO exercise_submissions (user_id, exercise_id, code, execution_time, test_score)
VALUES ('user-uuid', 'exercise-uuid', 'console.log("test")', 100, 150);

-- Should fail (score < 0)
INSERT INTO exercise_submissions (user_id, exercise_id, code, execution_time, test_score)
VALUES ('user-uuid', 'exercise-uuid', 'console.log("test")', 100, -10);
```

2. **Test grade_level constraint**:

```sql
-- Should succeed
UPDATE exercise_submissions SET grade_level = 'excellent' WHERE id = 'submission-uuid';

-- Should fail (invalid grade level)
UPDATE exercise_submissions SET grade_level = 'invalid' WHERE id = 'submission-uuid';
```

3. **Test grading_method constraint**:

```sql
-- Should succeed
UPDATE exercise_submissions SET grading_method = 'test' WHERE id = 'submission-uuid';

-- Should fail (invalid grading method)
UPDATE exercise_submissions SET grading_method = 'invalid' WHERE id = 'submission-uuid';
```

4. **Test indexes**:

```sql
-- Should use idx_exercise_submissions_graded_at
EXPLAIN ANALYZE
SELECT * FROM exercise_submissions
ORDER BY graded_at DESC
LIMIT 10;

-- Should use idx_exercise_submissions_final_score
EXPLAIN ANALYZE
SELECT * FROM exercise_submissions
ORDER BY final_score DESC
LIMIT 10;
```

## Related Documentation

- [Auto-Grading System Requirements](.kiro/specs/auto-grading-system/requirements.md)
- [Auto-Grading System Design](.kiro/specs/auto-grading-system/design.md)
- [Auto-Grading System Tasks](.kiro/specs/auto-grading-system/tasks.md)

## Notes

- All new columns are nullable to maintain backward compatibility with existing submissions
- The `grading_method` column has a default value of `'both'` for new submissions
- The `override_by` foreign key references `auth.users(id)` which is managed by Supabase Auth
- JSONB columns allow flexible storage of complex grading data without schema changes
- Indexes are created with `DESC` order for efficient querying of recent/top submissions
