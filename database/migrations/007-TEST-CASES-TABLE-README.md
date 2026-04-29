# Migration 007: Create test_cases Table

## Overview

This migration creates the `test_cases` table for the Auto-Grading System. The table stores test case configurations that are used to automatically validate student code submissions.

## Feature

**Feature**: auto-grading-system  
**Task**: 1.2 - Create test_cases table migration  
**Validates Requirements**: 1.1, 1.2, 1.5, 1.7, 11.2, 11.3

## Files

- `007-create-test-cases-table.sql` - Main migration file
- `007-rollback-test-cases-table.sql` - Rollback script
- `007-verify-test-cases-table.sql` - Verification script
- `007-TEST-CASES-TABLE-README.md` - This documentation

## Table Schema

### test_cases

Stores test case configurations for automated code grading.

| Column          | Type        | Constraints                                          | Description                               |
| --------------- | ----------- | ---------------------------------------------------- | ----------------------------------------- |
| id              | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4()              | Unique identifier                         |
| exercise_id     | UUID        | NOT NULL, REFERENCES exercises(id) ON DELETE CASCADE | Foreign key to exercises                  |
| input           | JSONB       | NOT NULL                                             | Test case input data                      |
| expected_output | JSONB       | NOT NULL                                             | Expected output for comparison            |
| weight          | INTEGER     | DEFAULT 10, CHECK (weight >= 0 AND weight <= 100)    | Weight in score calculation (0-100)       |
| timeout         | INTEGER     | DEFAULT 1000, CHECK (timeout > 0)                    | Maximum execution time in milliseconds    |
| description     | TEXT        | NOT NULL                                             | Human-readable test case description      |
| is_hidden       | BOOLEAN     | DEFAULT FALSE                                        | Whether test case is hidden from students |
| order_index     | INTEGER     | NOT NULL                                             | Display order within exercise             |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                        | Creation timestamp                        |
| updated_at      | TIMESTAMPTZ | DEFAULT NOW()                                        | Last update timestamp                     |

## Constraints

### CHECK Constraints

1. **weight_range**: `weight >= 0 AND weight <= 100`
   - Ensures test case weights are between 0 and 100 (inclusive)
   - Validates Requirement 1.2, 1.6

2. **timeout_positive**: `timeout > 0`
   - Ensures timeout is a positive integer
   - Validates Requirement 1.7

### Foreign Key Constraints

1. **exercise_id → exercises(id)**
   - ON DELETE CASCADE: When an exercise is deleted, all its test cases are automatically deleted
   - Validates Requirement 11.3

## Indexes

1. **idx_test_cases_exercise_order**: `(exercise_id, order_index)`
   - Composite index for efficient retrieval of test cases by exercise in display order
   - Validates Requirement 11.3

2. **idx_test_cases_exercise_hidden**: `(exercise_id, is_hidden)`
   - Composite index for filtering visible/hidden test cases by exercise
   - Supports requirement to hide test cases from students (Requirement 1.3)

## Usage Examples

### Insert a Test Case

```sql
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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '{"numbers": [1, 2, 3, 4, 5]}'::jsonb,
  '{"sum": 15}'::jsonb,
  20,
  1000,
  'Test basic array sum with positive integers',
  false,
  1
);
```

### Query Test Cases for an Exercise

```sql
-- Get all visible test cases for an exercise (student view)
SELECT
  id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  order_index
FROM test_cases
WHERE exercise_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND is_hidden = false
ORDER BY order_index;

-- Get all test cases for an exercise (admin view)
SELECT
  id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  is_hidden,
  order_index
FROM test_cases
WHERE exercise_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY order_index;
```

### Update a Test Case

```sql
UPDATE test_cases
SET
  weight = 25,
  timeout = 2000,
  updated_at = NOW()
WHERE id = 'test-case-uuid-here';
```

## Execution Instructions

### Apply Migration

```bash
# Using psql
psql -U your_username -d your_database -f backend/database/migrations/007-create-test-cases-table.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of 007-create-test-cases-table.sql
```

### Verify Migration

```bash
# Run verification script
psql -U your_username -d your_database -f backend/database/migrations/007-verify-test-cases-table.sql
```

Expected verification output:

- Table `test_cases` exists
- All 11 columns are present with correct types
- 2 CHECK constraints exist (weight range, timeout positive)
- 1 foreign key constraint exists with CASCADE delete
- 2 indexes exist (exercise_order, exercise_hidden)

### Rollback Migration

```bash
# If you need to rollback
psql -U your_username -d your_database -f backend/database/migrations/007-rollback-test-cases-table.sql
```

## Testing

### Manual Testing

1. **Test Valid Insert**:

   ```sql
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
     (SELECT id FROM exercises LIMIT 1),
     '{"test": "data"}'::jsonb,
     '{"result": "expected"}'::jsonb,
     50,
     1500,
     'Test case description',
     false,
     1
   );
   ```

2. **Test Weight Constraint** (should fail):

   ```sql
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
     (SELECT id FROM exercises LIMIT 1),
     '{}'::jsonb,
     '{}'::jsonb,
     150,  -- Invalid: exceeds 100
     1000,
     'Invalid weight test',
     false,
     1
   );
   ```

3. **Test Timeout Constraint** (should fail):

   ```sql
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
     (SELECT id FROM exercises LIMIT 1),
     '{}'::jsonb,
     '{}'::jsonb,
     10,
     0,  -- Invalid: must be positive
     'Invalid timeout test',
     false,
     1
   );
   ```

4. **Test CASCADE Delete**:

   ```sql
   -- Create a test exercise and test case
   INSERT INTO exercises (id, title, question, language)
   VALUES ('test-exercise-id', 'Test', 'Test question', 'javascript');

   INSERT INTO test_cases (exercise_id, input, expected_output, description, order_index)
   VALUES ('test-exercise-id', '{}'::jsonb, '{}'::jsonb, 'Test', 1);

   -- Delete the exercise (should cascade to test_cases)
   DELETE FROM exercises WHERE id = 'test-exercise-id';

   -- Verify test case was deleted
   SELECT COUNT(*) FROM test_cases WHERE exercise_id = 'test-exercise-id';
   -- Should return 0
   ```

## Requirements Validation

This migration validates the following requirements:

- **Requirement 1.1**: Store test cases with input, expected output, weight, timeout, description, and visibility flag ✓
- **Requirement 1.2**: Support test case weights between 0 and 100 ✓
- **Requirement 1.5**: Support test case timeout configuration in milliseconds ✓
- **Requirement 1.7**: Validate that timeout is a positive integer ✓
- **Requirement 11.2**: Create test_cases table with specified columns ✓
- **Requirement 11.3**: Create indexes and enforce foreign key constraint with CASCADE delete ✓

## Notes

- The `input` and `expected_output` columns use JSONB for flexible data structures
- JSONB allows storing arrays, objects, primitives, and nested structures
- The `is_hidden` flag supports hidden test cases that students cannot see before submission
- The `order_index` allows instructors to control the display order of test cases
- CASCADE delete ensures data integrity when exercises are removed

## Related Migrations

- **Migration 006**: Added auto-grading columns to `exercise_submissions` table
- **Migration 007**: Creates `test_cases` table (this migration)
- **Future migrations**: Will create `ai_usage_logs` table and additional grading infrastructure
