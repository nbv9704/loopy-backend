# Database Migrations

This directory contains SQL migration scripts for the Loopy database.

## Migration Files

### Multilingual Support (002)

- **002-add-multilingual-columns.sql**: Forward migration that adds English translation columns
- **002-rollback-multilingual-columns.sql**: Rollback migration that removes English translation columns

### Header & Footer CMS (003-005)

- **003-add-header-footer-tables.sql**: Creates header_settings, footer_columns, and footer_column_items tables
- **004-add-header-footer-rls-policies.sql**: Adds Row Level Security policies for header/footer tables
- **004-test-rls-policies.sql**: Test script for RLS policies
- **004-RLS-POLICIES-README.md**: Documentation for RLS policies
- **005-add-header-footer-updated-at-triggers.sql**: Adds automatic updated_at triggers
- **005-test-updated-at-triggers.sql**: Test script for updated_at triggers
- **005-TRIGGERS-README.md**: Documentation for updated_at triggers

## What These Migrations Do

### Multilingual Support (002)

### Forward Migration (002-add-multilingual-columns.sql)

Adds English translation columns to 7 content tables:

1. **landing_features**: `title_en`, `description_en`
2. **landing_languages**: `name_en`, `description_en`
3. **landing_stats**: `label_en`
4. **landing_how_it_works**: `title_en`, `description_en`
5. **navigation_items**: `label_en`
6. **documentation_technologies**: `name_en`
7. **documentation_links**: `title_en`, `description_en`

**Total**: 13 new columns across 7 tables

Each migration also:

- Creates partial indexes on English columns (WHERE column_en IS NOT NULL)
- Adds column comments documenting language and purpose
- Includes verification queries to ensure success
- Uses IF NOT EXISTS for idempotency (can be run multiple times safely)
- Executes within a transaction for atomicity

### Rollback Migration (002-rollback-multilingual-columns.sql)

Removes all English translation columns and indexes added by the forward migration.

**⚠️ WARNING**: Running the rollback will permanently delete all English translation data!

### Header & Footer CMS Tables (003)

Creates three new tables for managing header and footer content:

1. **header_settings**: Singleton table for header configuration (logo URL, alt text)
2. **footer_columns**: Footer column structure with configurable types
3. **footer_column_items**: Items within footer columns (navigation links, brand content)

Includes indexes for performance and foreign key constraints with CASCADE delete.

See: `003-add-header-footer-tables.sql`

### Row Level Security Policies (004)

Adds RLS policies to header and footer tables:

- Public SELECT access for published content
- Admin-only INSERT, UPDATE, DELETE access
- Policies enforce user_profiles.is_admin = true

See: `004-add-header-footer-rls-policies.sql` and `004-RLS-POLICIES-README.md`

### Updated_at Triggers (005)

Adds automatic timestamp triggers to header and footer tables:

- `update_header_settings_updated_at`
- `update_footer_columns_updated_at`
- `update_footer_column_items_updated_at`

These triggers automatically update the `updated_at` column whenever records are modified.

See: `005-add-header-footer-updated-at-triggers.sql` and `005-TRIGGERS-README.md`

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `002-add-multilingual-columns.sql`
5. Paste into the SQL editor
6. Click **Run** to execute
7. Check the output for success messages

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Forward migration
supabase db execute --file backend/database/migrations/002-add-multilingual-columns.sql

# Rollback (if needed)
supabase db execute --file backend/database/migrations/002-rollback-multilingual-columns.sql
```

### Option 3: psql Command Line

If you have direct PostgreSQL access:

```bash
# Forward migration
psql -h <your-supabase-host> -U postgres -d postgres -f backend/database/migrations/002-add-multilingual-columns.sql

# Rollback (if needed)
psql -h <your-supabase-host> -U postgres -d postgres -f backend/database/migrations/002-rollback-multilingual-columns.sql
```

## Verification

After running the forward migration, you should see output like:

```
NOTICE:  ✓ Migration completed successfully
NOTICE:  ✓ Added English columns to 7 content tables
NOTICE:  ✓ Created 7 partial indexes for performance
NOTICE:  ✓ Added column comments for documentation
NOTICE:  ✓ All verification checks passed
COMMIT
```

### Manual Verification Queries

You can verify the migration manually with these queries:

```sql
-- Check that all English columns exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE column_name LIKE '%_en'
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Should return 13 rows

-- Check that all indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE '%_en'
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Should return 7 rows

-- Check column comments
SELECT
  c.table_name,
  c.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
  pgd.objsubid = c.ordinal_position AND
  c.table_schema = st.schemaname AND
  c.table_name = st.relname
)
WHERE c.column_name LIKE '%_en'
  AND c.table_schema = 'public'
ORDER BY c.table_name, c.column_name;
```

## Testing on Local Database

To test the migrations on your local database:

1. Make sure your backend/.env file has correct Supabase credentials
2. Run the verification script:

```bash
cd backend
npm run test:migrations
```

This will:

- Execute the forward migration
- Verify all columns and indexes were created
- Test idempotency (run migration again)
- Execute the rollback migration
- Verify all columns and indexes were removed
- Re-apply the forward migration for final state

## Migration Safety Features

### Idempotency

Both migrations use `IF NOT EXISTS` and `IF EXISTS` clauses, making them safe to run multiple times:

```sql
ALTER TABLE landing_features
ADD COLUMN IF NOT EXISTS title_en TEXT;

DROP INDEX IF EXISTS idx_landing_features_title_en;
```

### Transactions

All operations are wrapped in transactions:

```sql
BEGIN;
-- migration operations
COMMIT;
```

If any operation fails, the entire migration is rolled back automatically.

### Verification

Each migration includes verification queries that check:

- All expected columns exist (forward) or don't exist (rollback)
- All expected indexes exist (forward) or don't exist (rollback)
- Original Vietnamese columns are preserved

### Data Preservation

- Forward migration adds nullable columns (no data modification)
- Rollback migration only drops English columns (Vietnamese data preserved)
- No UPDATE or DELETE statements on existing data

## Rollback Procedure

If you need to rollback the migration:

1. **Backup first** (if you have English translations you want to keep):

   ```sql
   -- Export English translations
   COPY (SELECT * FROM landing_features) TO '/tmp/landing_features_backup.csv' CSV HEADER;
   -- Repeat for other tables
   ```

2. Run the rollback migration through Supabase dashboard or CLI

3. Verify rollback success:
   ```sql
   -- Should return 0 rows
   SELECT COUNT(*) FROM information_schema.columns
   WHERE column_name LIKE '%_en' AND table_schema = 'public';
   ```

## Next Steps After Migration

1. **Verify migration success** using the queries above
2. **Deploy backend code** with language detection and localized queries
3. **Seed English translations** (optional - see seed script)
4. **Test API endpoints** with `?lang=en` parameter
5. **Update admin interface** to support translation management

## Troubleshooting

### Error: relation "table_name" does not exist

The content management tables haven't been created yet. Run the content management schema first:

```bash
# In Supabase SQL Editor
-- Run: backend/database/content-management-schema.sql
```

### Error: column "column_name" already exists

The migration has already been run. This is safe - the migration is idempotent.

### Error: permission denied

Make sure you're using the service role key or have sufficient database permissions.

### Migration hangs or times out

The migration should complete in under 1 second on an empty database. If it hangs:

- Check for locks on the tables
- Ensure no other migrations are running
- Try running in smaller chunks (one table at a time)

## Support

For issues or questions:

1. Check the verification queries above
2. Review the migration output for error messages
3. Check Supabase logs in the dashboard
4. Refer to the design document: `.kiro/specs/database-multilingual/design.md`
