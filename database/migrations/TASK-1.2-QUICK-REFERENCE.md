# Task 1.2 Quick Reference: test_cases Table Migration

## Quick Start

### Apply Migration

```bash
psql -U postgres -d loopy -f backend/database/migrations/007-create-test-cases-table.sql
```

### Verify Migration

```bash
psql -U postgres -d loopy -f backend/database/migrations/007-verify-test-cases-table.sql
```

### Run Tests

```bash
cd backend
npx ts-node database/migrations/007-test-test-cases-table.ts
```

### Rollback (if needed)

```bash
psql -U postgres -d loopy -f backend/database/migrations/007-rollback-test-cases-table.sql
```

## Table Structure

```sql
test_cases (
  id UUID PRIMARY KEY,
  exercise_id UUID NOT NULL → exercises(id) CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  weight INTEGER DEFAULT 10 CHECK (0-100),
  timeout INTEGER DEFAULT 1000 CHECK (> 0),
  description TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Key Constraints

- ✅ Weight: 0-100 (inclusive)
- ✅ Timeout: Must be positive (> 0)
- ✅ Foreign Key: CASCADE delete with exercises
- ✅ Indexes: (exercise_id, order_index), (exercise_id, is_hidden)

## Common Queries

### Insert Test Case

```sql
INSERT INTO test_cases (exercise_id, input, expected_output, weight, timeout, description, order_index)
VALUES ('exercise-id', '{"x": 5}'::jsonb, '{"y": 10}'::jsonb, 20, 1000, 'Test description', 1);
```

### Get Visible Test Cases (Student)

```sql
SELECT * FROM test_cases
WHERE exercise_id = 'exercise-id' AND is_hidden = false
ORDER BY order_index;
```

### Get All Test Cases (Admin)

```sql
SELECT * FROM test_cases
WHERE exercise_id = 'exercise-id'
ORDER BY order_index;
```

## Files Created

1. `007-create-test-cases-table.sql` - Main migration
2. `007-rollback-test-cases-table.sql` - Rollback script
3. `007-verify-test-cases-table.sql` - Verification queries
4. `007-test-test-cases-table.ts` - Automated tests
5. `007-TEST-CASES-TABLE-README.md` - Full documentation
6. `TASK-1.2-SUMMARY.md` - Task summary
7. `TASK-1.2-QUICK-REFERENCE.md` - This file

## Validates Requirements

- ✅ 1.1: Store test cases with all required fields
- ✅ 1.2: Support weights 0-100
- ✅ 1.5: Support timeout configuration
- ✅ 1.7: Validate positive timeout
- ✅ 11.2: Create test_cases table
- ✅ 11.3: Create indexes and FK with CASCADE

## Status

✅ **COMPLETED** - Ready for deployment
