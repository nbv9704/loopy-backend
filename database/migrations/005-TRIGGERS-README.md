# Migration 005: Updated_at Triggers for Header and Footer Tables

## Overview

This migration adds automatic timestamp triggers to the header and footer CMS tables. These triggers ensure that the `updated_at` column is automatically updated whenever a record is modified.

## Purpose

**Requirement 7**: Database Schema for Header and Footer Content

The triggers provide automatic timestamp management for:

- `header_settings` table
- `footer_columns` table
- `footer_column_items` table

## What This Migration Does

1. **Verifies Prerequisites**: Checks that the `update_updated_at_column()` function exists
2. **Creates Three Triggers**:
   - `update_header_settings_updated_at` - Updates timestamp on header settings modifications
   - `update_footer_columns_updated_at` - Updates timestamp on footer column modifications
   - `update_footer_column_items_updated_at` - Updates timestamp on footer item modifications
3. **Adds Documentation**: Includes comments on each trigger explaining its purpose
4. **Verifies Success**: Confirms all three triggers were created successfully

## Dependencies

- **Migration 003**: Must be run after `003-add-header-footer-tables.sql` (creates the tables)
- **Base Schema**: Requires `update_updated_at_column()` function from base schema

## How to Run

### In Supabase SQL Editor

```sql
-- Run the migration
\i backend/database/migrations/005-add-header-footer-updated-at-triggers.sql
```

### Using psql

```bash
psql -U postgres -d loopy -f backend/database/migrations/005-add-header-footer-updated-at-triggers.sql
```

## How to Test

Run the test script to verify the triggers work correctly:

```sql
-- Run the test script
\i backend/database/migrations/005-test-updated-at-triggers.sql
```

The test script will:

1. Create test records in each table
2. Update the records
3. Verify that `updated_at` timestamps were automatically updated
4. Clean up test data
5. Report success or failure

### Expected Test Output

```
========================================
Testing updated_at Triggers
========================================

TEST 1: header_settings updated_at trigger
  ✓ Created header_settings record with id: [uuid]
  ✓ Initial updated_at: [timestamp]
  ✓ Updated header_settings record
  ✓ New updated_at: [timestamp]
  ✓ TEST 1 PASSED: updated_at timestamp was automatically updated

TEST 2: footer_columns updated_at trigger
  ✓ Created footer_columns record with id: [uuid]
  ✓ Initial updated_at: [timestamp]
  ✓ Updated footer_columns record
  ✓ New updated_at: [timestamp]
  ✓ TEST 2 PASSED: updated_at timestamp was automatically updated

TEST 3: footer_column_items updated_at trigger
  ✓ Created footer_column_items record with id: [uuid]
  ✓ Initial updated_at: [timestamp]
  ✓ Updated footer_column_items record
  ✓ New updated_at: [timestamp]
  ✓ TEST 3 PASSED: updated_at timestamp was automatically updated

Cleaning up test data...
  ✓ Test data cleaned up

========================================
All Tests Passed Successfully!
========================================
✓ header_settings trigger working correctly
✓ footer_columns trigger working correctly
✓ footer_column_items trigger working correctly
```

## Verification

After running the migration, you can verify the triggers exist:

```sql
-- Check that all triggers were created
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('header_settings', 'footer_columns', 'footer_column_items')
  AND t.tgname LIKE '%updated_at%'
ORDER BY c.relname;
```

Expected output:

```
           trigger_name            |     table_name      |      function_name
-----------------------------------+---------------------+-------------------------
 update_footer_column_items_updated_at | footer_column_items | update_updated_at_column
 update_footer_columns_updated_at      | footer_columns      | update_updated_at_column
 update_header_settings_updated_at     | header_settings     | update_updated_at_column
```

## How It Works

The triggers use the `update_updated_at_column()` function which:

1. Fires **BEFORE UPDATE** on each row
2. Sets `NEW.updated_at = NOW()`
3. Returns the modified row

This ensures that every time a record is updated via SQL UPDATE statement, the `updated_at` timestamp is automatically refreshed to the current time.

## Rollback

If you need to remove these triggers:

```sql
BEGIN;

DROP TRIGGER IF EXISTS update_header_settings_updated_at ON header_settings;
DROP TRIGGER IF EXISTS update_footer_columns_updated_at ON footer_columns;
DROP TRIGGER IF EXISTS update_footer_column_items_updated_at ON footer_column_items;

COMMIT;
```

## Impact

- **Performance**: Minimal - triggers are lightweight and only fire on UPDATE operations
- **Behavior**: Automatic - no code changes needed, timestamps update automatically
- **Consistency**: Ensures all timestamp updates follow the same pattern as other tables in the system

## Related Files

- `backend/database/migrations/003-add-header-footer-tables.sql` - Creates the tables
- `backend/database/migrations/005-add-header-footer-updated-at-triggers.sql` - This migration
- `backend/database/migrations/005-test-updated-at-triggers.sql` - Test script
- `backend/database/schema.sql` - Contains the `update_updated_at_column()` function definition

## Notes

- These triggers follow the same pattern used throughout the database for other tables
- The `update_updated_at_column()` function is defined in the base schema
- Triggers only fire on UPDATE operations, not INSERT (created_at handles initial timestamp)
- The test script uses ROLLBACK to avoid leaving test data in the database
