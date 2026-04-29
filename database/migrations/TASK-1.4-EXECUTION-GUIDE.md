# Task 1.4: Migration Execution Guide

## Overview

This guide walks you through executing the three migration scripts (003, 004, 005) in Supabase SQL Editor and verifying the results.

## Prerequisites

- Access to Supabase Dashboard
- Admin privileges on the database
- The base schema must already be deployed (with `update_updated_at_column()` function)

## Migration Scripts to Execute

Execute these scripts **in order**:

1. `003-add-header-footer-tables.sql` - Creates tables and indexes
2. `004-add-header-footer-rls-policies.sql` - Adds Row Level Security policies
3. `005-add-header-footer-updated-at-triggers.sql` - Adds updated_at triggers

## Step-by-Step Execution

### Step 1: Open Supabase SQL Editor

1. Log in to your Supabase Dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query" to create a new query

### Step 2: Execute Migration 003 (Tables)

1. Open the file: `backend/database/migrations/003-add-header-footer-tables.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
5. **Expected Output:**
   ```
   NOTICE:  ✓ Migration completed successfully
   NOTICE:  ✓ Created header_settings table with 6 columns
   NOTICE:  ✓ Created footer_columns table with 8 columns
   NOTICE:  ✓ Created footer_column_items table with 7 columns
   NOTICE:  ✓ Created 4 indexes for performance optimization
   NOTICE:  ✓ Added foreign key constraint with CASCADE delete
   NOTICE:  ✓ Added CHECK constraints for column_type, status, and item_type
   NOTICE:  ✓ All verification checks passed
   ```
6. If you see any errors, **STOP** and investigate before proceeding

### Step 3: Execute Migration 004 (RLS Policies)

1. Open the file: `backend/database/migrations/004-add-header-footer-rls-policies.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor (clear previous query first)
4. Click "Run"
5. **Expected Output:**
   ```
   NOTICE:  ✓ RLS Migration completed successfully
   NOTICE:  ✓ Enabled RLS on 3 tables: header_settings, footer_columns, footer_column_items
   NOTICE:  ✓ Created 3 SELECT policies for public read access
   NOTICE:  ✓ Created 3 INSERT policies for admin-only access
   NOTICE:  ✓ Created 3 UPDATE policies for admin-only access
   NOTICE:  ✓ Created 3 DELETE policies for admin-only access
   NOTICE:  ✓ Total: 12 RLS policies created
   NOTICE:  ✓ All verification checks passed
   ```
6. If you see any errors, **STOP** and investigate before proceeding

### Step 4: Execute Migration 005 (Triggers)

1. Open the file: `backend/database/migrations/005-add-header-footer-updated-at-triggers.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor (clear previous query first)
4. Click "Run"
5. **Expected Output:**
   ```
   NOTICE:  ✓ Function update_updated_at_column() exists
   NOTICE:  ✓ Migration completed successfully
   NOTICE:  ✓ Created trigger: update_header_settings_updated_at
   NOTICE:  ✓ Created trigger: update_footer_columns_updated_at
   NOTICE:  ✓ Created trigger: update_footer_column_items_updated_at
   NOTICE:  ✓ All triggers verified and functional
   ```
6. If you see any errors, **STOP** and investigate before proceeding

## Verification

After executing all three migrations, run the verification script to confirm everything is set up correctly.

### Option 1: Run Verification in Supabase SQL Editor

1. Open the file: `backend/database/migrations/verify-header-footer-migrations.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run"
5. Review the output to ensure all checks pass

### Option 2: Run Verification Script Locally (if you have psql access)

```bash
# From the backend directory
psql $DATABASE_URL -f database/migrations/verify-header-footer-migrations.sql
```

## What Gets Created

### Tables (3)

- `header_settings` - Stores header logo and alt text
- `footer_columns` - Stores footer column structure
- `footer_column_items` - Stores items within footer columns

### Indexes (4)

- `idx_footer_columns_display_order` - Fast sorting of columns
- `idx_footer_columns_status` - Fast filtering by status
- `idx_footer_column_items_column` - Fast lookup of items by column
- `idx_footer_column_items_display_order` - Fast sorting of items

### RLS Policies (12)

- 3 SELECT policies (public read access)
- 3 INSERT policies (admin-only)
- 3 UPDATE policies (admin-only)
- 3 DELETE policies (admin-only)

### Triggers (3)

- `update_header_settings_updated_at` - Auto-update timestamp
- `update_footer_columns_updated_at` - Auto-update timestamp
- `update_footer_column_items_updated_at` - Auto-update timestamp

## Troubleshooting

### Error: "update_updated_at_column() function does not exist"

**Cause:** The base schema hasn't been deployed yet.

**Solution:** Deploy the base schema first (`backend/database/schema.sql` or `content-management-schema.sql`)

### Error: "relation already exists"

**Cause:** The migration has already been run.

**Solution:** This is safe to ignore if the tables already exist. The migrations are designed to be idempotent.

### Error: "permission denied"

**Cause:** Your database user doesn't have sufficient privileges.

**Solution:** Ensure you're logged in as a superuser or the database owner.

### Error: "policy already exists"

**Cause:** Migration 004 has already been run.

**Solution:** The script drops existing policies before creating them, so this shouldn't happen. If it does, you can manually drop the policies and re-run.

## Post-Migration Checklist

- [ ] All three migrations executed without errors
- [ ] Verification script shows all checks passing
- [ ] Tables visible in Supabase Table Editor
- [ ] RLS policies visible in Supabase Authentication > Policies
- [ ] No console errors in Supabase Dashboard

## Next Steps

After successful migration execution:

1. Proceed to Task 2.1 (Backend file upload service)
2. Update the tasks.md file to mark task 1.4 as complete
3. Document any issues encountered in this guide

## Support

If you encounter issues not covered in this guide:

1. Check the Supabase logs for detailed error messages
2. Verify the base schema is deployed
3. Ensure the `user_profiles` table exists (required for RLS policies)
4. Check that the `update_updated_at_column()` function exists
