# Task 1.2 Summary: Create test_cases Table Migration

## Overview

This task creates the database migration for the `test_cases` table, which stores test case configurations for the Auto-Grading System. The table enables instructors to define multiple test cases per exercise with configurable weights, timeouts, and visibility settings.

## Feature

**Feature**: auto-grading-system  
**Task**: 1.2 - Create test_cases table migration  
**Validates Requirements**: 1.1, 1.2, 1.5, 1.7, 11.2, 11.3

## Files Created

1. **007-create-test-cases-table.sql** - Main migration file
2. **007-rollback-test-cases-table.sql** - Rollback script
3. **007-verify-test-cases-table.sql** - Verification queries
4. **007-TEST-CASES-TABLE-README.md** - Comprehensive documentation
5. **007-test-test-cases-table.ts** - Automated test script
6. **TASK-1.2-SUMMARY.md** - This summary document

## Table Schema

### test_cases

| Column          | Type        | Constraints                                    | Description                    |
| --------------- | ----------- | ---------------------------------------------- | ------------------------------ |
| id              | UUID        | PRIMARY KEY, DEFAULT uuid_generate_v4()        | Unique identifier              |
| exercise_id     | UUID        | NOT NULL, FK → exercises(id) ON DELETE CASCADE | Foreign key to exercises       |
| input           | JSONB       | NOT NULL                                       | Test case input data           |
| expected_output | JSONB       | NOT NULL                                       | Expected output for comparison |
| weight          | INTEGER     | DEFAULT 10, CHECK (0-100)                      | Weight in score calculation    |
| timeout         | INTEGER     | DEFAULT 1000, CHECK (> 0)                      | Max execution time (ms)        |
| description     | TEXT        | NOT NULL                                       | Human-readable description     |
| is_hidden       | BOOLEAN     | DEFAULT FALSE                                  | Hidden from students flag      |
| order_index     | INTEGER     | NOT NULL                                       | Display order                  |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                  | Creation timestamp             |
| updated_at      | TIMESTAMPTZ | DEFAULT NOW()                                  | Update timestamp               |

## Key Features

### 1. CHECK Constraints

- **Weight Range**: Ensures `weight >= 0 AND weight <= 100`
  - Validates Requirements 1.2, 1.6
  - Prevents invalid weight values that would break score calculations

- **Timeout Positive**: Ensures `timeout > 0`
  - Validates Requirement 1.7
  - Prevents zero or negative timeout values

### 2. Foreign Key Constraint

- **exercise_id → exercises(id) ON DELETE CASCADE**
  - Validates Requirement 11.3
  - Automatically deletes test cases when parent exercise is deleted
  - Maintains referential integrity

### 3. Indexes

- **idx_test_cases_exercise_order**: `(exercise_id, order_index)`
  - Optimizes retrieval of test cases by exercise in display order
  - Supports efficient sorting for UI display

- **idx_test_cases_exercise_hidden**: `(exercise_id, is_hidden)`
  - Optimizes filtering of visible/hidden test cases
  - Supports student view (visible only) vs admin view (all)

### 4. JSONB Columns

- **input**: Flexible storage for any input type (arrays, objects, primitives)
- **expected_output**: Flexible storage for expected results
- Supports complex test scenarios without schema changes

## Requirements Validation

| Requirement | Description                                    | Status |
| ----------- | ---------------------------------------------- | ------ |
| 1.1         | Store test cases with all required fields      | ✅     |
| 1.2         | Support weights between 0-100                  | ✅     |
| 1.5         | Support timeout configuration in milliseconds  | ✅     |
| 1.7         | Validate timeout is positive integer           | ✅     |
| 11.2        | Create test_cases table with specified columns | ✅     |
| 11.3        | Create indexes and FK with CASCADE delete      | ✅     |

## Usage Examples

### Create a Test Case

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
  'exercise-uuid-here',
  '{"numbers": [1, 2, 3, 4, 5]}'::jsonb,
  '{"sum": 15}'::jsonb,
  20,
  1000,
  'Test basic array sum with positive integers',
  false,
  1
);
```

### Query Visible Test Cases (Student View)

```sql
SELECT
  id,
  input,
  expected_output,
  weight,
  timeout,
  description,
  order_index
FROM test_cases
WHERE exercise_id = 'exercise-uuid-here'
  AND is_hidden = false
ORDER BY order_index;
```

### Query All Test Cases (Admin View)

```sql
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
WHERE exercise_id = 'exercise-uuid-here'
ORDER BY order_index;
```

## Execution Instructions

### 1. Apply Migration

```bash
# Using psql
psql -U your_username -d your_database -f backend/database/migrations/007-create-test-cases-table.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of 007-create-test-cases-table.sql
```

### 2. Verify Migration

```bash
# Run verification script
psql -U your_username -d your_database -f backend/database/migrations/007-verify-test-cases-table.sql
```

Expected output:

- ✅ Table `test_cases` exists
- ✅ All 11 columns present with correct types
- ✅ 2 CHECK constraints (weight, timeout)
- ✅ 1 foreign key with CASCADE delete
- ✅ 2 indexes created

### 3. Run Automated Tests

```bash
# Install dependencies if needed
cd backend
npm install

# Run test script
npx ts-node database/migrations/007-test-test-cases-table.ts
```

Expected test results:

- ✅ Table creation
- ✅ Column creation (11 columns)
- ✅ Index creation (2 indexes)
- ✅ Valid weight constraint
- ✅ Invalid weight rejection
- ✅ Invalid timeout rejection
- ✅ Migration idempotency
- ✅ CASCADE delete functionality
- ✅ Rollback migration
- ✅ Rollback idempotency

### 4. Rollback (if needed)

```bash
psql -U your_username -d your_database -f backend/database/migrations/007-rollback-test-cases-table.sql
```

## Testing Strategy

### Automated Tests

The `007-test-test-cases-table.ts` script provides comprehensive automated testing:

1. **Table Creation Tests**
   - Verifies table exists
   - Verifies all 11 columns exist with correct types
   - Verifies indexes are created

2. **Constraint Tests**
   - Tests valid weight (50) is accepted
   - Tests invalid weight (150) is rejected
   - Tests invalid timeout (0) is rejected

3. **CASCADE Delete Test**
   - Creates test exercise and test cases
   - Deletes exercise
   - Verifies test cases are automatically deleted

4. **Idempotency Tests**
   - Runs migration twice
   - Verifies no duplicate columns or errors

5. **Rollback Tests**
   - Verifies table and indexes are removed
   - Tests rollback idempotency

### Manual Testing

See `007-verify-test-cases-table.sql` for manual verification queries.

## Design Decisions

### 1. JSONB for Input/Output

**Decision**: Use JSONB instead of TEXT or specific columns

**Rationale**:

- Supports any data type (arrays, objects, primitives, nested structures)
- Enables complex test scenarios without schema changes
- Allows JSON querying and indexing if needed in future
- More flexible than TEXT (no parsing needed)

### 2. Composite Indexes

**Decision**: Create composite indexes on `(exercise_id, order_index)` and `(exercise_id, is_hidden)`

**Rationale**:

- Most queries filter by exercise_id first
- Composite indexes are more efficient than separate indexes
- Supports common query patterns (ordered retrieval, visibility filtering)

### 3. CASCADE Delete

**Decision**: Use `ON DELETE CASCADE` for exercise_id foreign key

**Rationale**:

- Test cases have no meaning without their parent exercise
- Prevents orphaned test cases
- Simplifies exercise deletion logic
- Maintains referential integrity automatically

### 4. Default Values

**Decision**: Provide sensible defaults (weight=10, timeout=1000, is_hidden=false)

**Rationale**:

- Reduces required fields for common cases
- 1000ms (1 second) is reasonable default timeout
- Weight of 10 allows 10 equal-weight test cases to sum to 100
- Most test cases should be visible by default

## Integration with Auto-Grading System

This table integrates with the grading system as follows:

1. **Test Runner Service** queries test cases by exercise_id
2. **Test execution** uses input/expected_output for validation
3. **Score calculation** uses weight values
4. **Timeout enforcement** uses timeout values
5. **Student UI** filters by is_hidden=false
6. **Admin UI** shows all test cases including hidden ones

## Next Steps

After this migration:

1. **Task 1.3**: Create ai_usage_logs table migration
2. **Task 2.x**: Implement Test Runner Service
3. **Task 3.x**: Implement AI Analyzer Service
4. **Task 12.x**: Create API endpoints for test case management

## Related Files

- **Migration 006**: Added auto-grading columns to exercise_submissions
- **Migration 007**: Creates test_cases table (this migration)
- **Design Document**: `.kiro/specs/auto-grading-system/design.md`
- **Requirements**: `.kiro/specs/auto-grading-system/requirements.md`

## Notes

- The migration is idempotent (safe to run multiple times)
- All constraints are enforced at database level for data integrity
- JSONB columns support flexible test case definitions
- Indexes optimize common query patterns
- CASCADE delete maintains referential integrity

## Status

✅ **COMPLETED**

All files created, tested, and documented. Migration is ready for deployment.
