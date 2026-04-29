# Database Migrations Guide

This guide covers all database migrations for the project.

## Available Migrations

1. **002-add-multilingual-columns.sql** - Adds English translation columns to content tables
2. **003-add-header-footer-tables.sql** - Creates header and footer CMS tables
3. **004-add-header-footer-rls-policies.sql** - Adds Row Level Security policies for header/footer tables

---

## Migration 004: Header & Footer RLS Policies

### Quick Start

**Via Supabase Dashboard (Recommended)**

1. Open your Supabase project: https://pbqwkqvdnagkefikxwsv.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `004-add-header-footer-rls-policies.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (should take < 1 second)

**Expected Output:**

```
NOTICE:  ✓ RLS Migration completed successfully
NOTICE:  ✓ Enabled RLS on 3 tables: header_settings, footer_columns, footer_column_items
NOTICE:  ✓ Created 3 SELECT policies for public read access
NOTICE:  ✓ Created 3 INSERT policies for admin-only access
NOTICE:  ✓ Created 3 UPDATE policies for admin-only access
NOTICE:  ✓ Created 3 DELETE policies for admin-only access
NOTICE:  ✓ Total: 12 RLS policies created
NOTICE:  ✓ All verification checks passed
COMMIT
```

### What This Migration Does

**Enables Row Level Security on:**

- `header_settings` - Header logo and settings
- `footer_columns` - Footer column structure
- `footer_column_items` - Items within footer columns

**Creates Public Read Policies (SELECT):**

- Header settings: Always readable by everyone
- Footer columns: Published columns readable by everyone, admins see all
- Footer column items: Readable if parent column is published

**Creates Admin Write Policies (INSERT/UPDATE/DELETE):**

- Only users with `is_admin = true` in `user_profiles` can modify content
- Applies to all three tables
- Enforced at database level (even for direct SQL access)

### Verify the Migration

```sql
-- In Supabase SQL Editor

-- 1. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items');

-- Should return:
-- header_settings      | t
-- footer_columns       | t
-- footer_column_items  | t

-- 2. Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
ORDER BY tablename, cmd;

-- Should return 12 policies (4 per table: SELECT, INSERT, UPDATE, DELETE)

-- 3. Test public read access (as anonymous user)
SELECT * FROM header_settings;
SELECT * FROM footer_columns WHERE status = 'published';

-- Should work without authentication

-- 4. Test admin write access (requires admin user)
-- This will fail if you're not authenticated as admin
INSERT INTO header_settings (logo_alt_text) VALUES ('Test');
```

### Security Model

**Public Users (Unauthenticated):**

- ✅ Can read header settings
- ✅ Can read published footer columns
- ✅ Can read items in published columns
- ❌ Cannot insert, update, or delete any content

**Authenticated Non-Admin Users:**

- ✅ Can read header settings
- ✅ Can read published footer columns
- ✅ Can read items in published columns
- ❌ Cannot insert, update, or delete any content

**Admin Users (`is_admin = true`):**

- ✅ Can read all content (including drafts)
- ✅ Can insert new content
- ✅ Can update existing content
- ✅ Can delete content

### Troubleshooting

**"permission denied for table" Error:**

This means RLS is blocking your query. Check:

1. Are you trying to write as a non-admin user?
2. Is your user's `is_admin` flag set to `true`?
3. Are you using the correct authentication token?

```sql
-- Check your admin status
SELECT id, email, is_admin
FROM user_profiles
WHERE id = auth.uid();
```

**Policies Not Working:**

```sql
-- Check if RLS is actually enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'header_settings';

-- Check policy definitions
SELECT * FROM pg_policies
WHERE tablename = 'header_settings';
```

---

## Migration 002: Multilingual Columns

### Step 1: Run the Migration

**Via Supabase Dashboard (Recommended)**

1. Open your Supabase project: https://pbqwkqvdnagkefikxwsv.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `002-add-multilingual-columns.sql`
5. Paste into the editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (should take < 1 second)

**Expected Output:**

```
NOTICE:  ✓ Migration completed successfully
NOTICE:  ✓ Added English columns to 7 content tables
NOTICE:  ✓ Created 7 partial indexes for performance
NOTICE:  ✓ Added column comments for documentation
NOTICE:  ✓ All verification checks passed
COMMIT
```

### Step 2: Verify the Migration

Run the verification script from your terminal:

```bash
cd backend
npm run verify:multilingual
```

**Expected Output:**

```
🚀 Multilingual Migration Verification
Database: https://pbqwkqvdnagkefikxwsv.supabase.co
======================================================================

📋 Checking English Columns...
✓ landing_features.title_en: Column exists
✓ landing_features.description_en: Column exists
✓ landing_languages.name_en: Column exists
✓ landing_languages.description_en: Column exists
✓ landing_stats.label_en: Column exists
✓ landing_how_it_works.title_en: Column exists
✓ landing_how_it_works.description_en: Column exists
✓ navigation_items.label_en: Column exists
✓ documentation_technologies.name_en: Column exists
✓ documentation_links.title_en: Column exists
✓ documentation_links.description_en: Column exists
✓ Total English Columns: Found 13 of 13 expected columns

📊 Checking Data Types...
✓ Data Type Test: English text stored and retrieved correctly

🔍 Checking Nullability...
✓ Nullability Test: English columns are nullable (optional)

🔄 Checking Fallback Behavior...
✓ Fallback Test: Vietnamese data available for fallback when English is null

💾 Checking Existing Data Preservation...
✓ Data Preservation: All existing records have Vietnamese content intact

======================================================================
📊 VERIFICATION SUMMARY
======================================================================

Total Checks: 16
✓ Passed: 16
✗ Failed: 0

======================================================================
✅ All checks passed! Multilingual migration is working correctly.

📝 Next Steps:
  1. Deploy backend code with language detection
  2. Test API endpoints with ?lang=en parameter
  3. Update admin interface for translation management
```

### Step 3: Test the Migration

Test that the migration works by querying the database:

```sql
-- In Supabase SQL Editor

-- 1. Check that columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'landing_features'
  AND column_name LIKE '%_en';

-- Should return:
-- title_en       | text | YES
-- description_en | text | YES

-- 2. Test inserting data with English translations
INSERT INTO landing_features (
  icon, title, description, title_en, description_en,
  color_gradient, display_order, status
) VALUES (
  'TestIcon',
  'Tiêu đề Việt',
  'Mô tả Việt',
  'English Title',
  'English Description',
  'from-blue-500 to-purple-600',
  999,
  'draft'
);

-- 3. Test COALESCE fallback pattern
SELECT
  title,
  title_en,
  COALESCE(title_en, title) as title_with_fallback,
  description,
  description_en,
  COALESCE(description_en, description) as description_with_fallback
FROM landing_features
WHERE display_order = 999;

-- Should show:
-- - title: "Tiêu đề Việt"
-- - title_en: "English Title"
-- - title_with_fallback: "English Title"
-- - description: "Mô tả Việt"
-- - description_en: "English Description"
-- - description_with_fallback: "English Description"

-- 4. Clean up test data
DELETE FROM landing_features WHERE display_order = 999;
```

## What Was Changed

### Database Schema

**7 Tables Modified:**

1. `landing_features` - Added `title_en`, `description_en`
2. `landing_languages` - Added `name_en`, `description_en`
3. `landing_stats` - Added `label_en`
4. `landing_how_it_works` - Added `title_en`, `description_en`
5. `navigation_items` - Added `label_en`
6. `documentation_technologies` - Added `name_en`
7. `documentation_links` - Added `title_en`, `description_en`

**Total Changes:**

- 13 new columns (all TEXT, nullable)
- 7 new partial indexes (for performance)
- 13 column comments (for documentation)

### Column Properties

All English columns have these properties:

- **Type**: TEXT (same as Vietnamese columns)
- **Nullable**: YES (English translations are optional)
- **Default**: NULL
- **Indexed**: Partial index (WHERE column_en IS NOT NULL)

### Performance Impact

**Zero Performance Degradation:**

- Nullable columns add no storage overhead when NULL
- Partial indexes only index non-NULL values
- COALESCE in SELECT clause maintains index usage
- Query performance equivalent to single-language queries

## Migration Safety

### Idempotent

The migration can be run multiple times safely:

```sql
ALTER TABLE landing_features
ADD COLUMN IF NOT EXISTS title_en TEXT;
```

If the column already exists, the statement is skipped.

### Transactional

All operations are wrapped in a transaction:

```sql
BEGIN;
-- All migration operations
COMMIT;
```

If any operation fails, everything is rolled back automatically.

### Data Preservation

- No existing data is modified
- All Vietnamese content remains intact
- Only adds new nullable columns
- No DELETE or UPDATE statements

### Verification Built-In

The migration includes verification queries that check:

- All 13 columns were created
- All 7 indexes were created
- No errors occurred

If verification fails, the migration raises an exception and rolls back.

## Rollback Procedure

If you need to undo the migration:

### ⚠️ WARNING

**Running the rollback will permanently delete all English translation data!**

Make sure to backup first if you have translations you want to keep.

### Backup English Translations

```sql
-- Export to CSV (in Supabase SQL Editor)
COPY (
  SELECT id, title, title_en, description, description_en
  FROM landing_features
  WHERE title_en IS NOT NULL
) TO '/tmp/landing_features_en.csv' CSV HEADER;

-- Repeat for other tables...
```

### Run Rollback Migration

1. Open Supabase SQL Editor
2. Copy contents of `002-rollback-multilingual-columns.sql`
3. Paste and run
4. Verify success

**Expected Output:**

```
NOTICE:  ✓ Rollback completed successfully
NOTICE:  ✓ Removed all English translation columns
NOTICE:  ✓ Removed all 7 partial indexes
NOTICE:  ✓ Original Vietnamese columns preserved
NOTICE:  ✓ All verification checks passed
WARNING: All English translation data has been permanently deleted
COMMIT
```

### Verify Rollback

```sql
-- Should return 0 rows
SELECT COUNT(*)
FROM information_schema.columns
WHERE column_name LIKE '%_en'
  AND table_schema = 'public';
```

## Troubleshooting

### Migration Fails: "relation does not exist"

**Problem**: Content management tables haven't been created yet.

**Solution**: Run the content management schema first:

```bash
# In Supabase SQL Editor, run:
backend/database/content-management-schema.sql
```

### Migration Succeeds but Verification Fails

**Problem**: Supabase client permissions or RLS policies.

**Solution**:

1. Check that you're using the service role key in `.env`
2. Verify RLS policies allow reading the new columns
3. Try querying directly in SQL Editor

### "Column already exists" Error

**Problem**: Migration has already been run.

**Solution**: This is safe! The migration is idempotent. The error message is expected if you run it twice.

### Verification Script Won't Run

**Problem**: TypeScript compilation errors or missing dependencies.

**Solution**:

```bash
# Install dependencies
cd backend
npm install

# Run with tsx (bypasses compilation)
npx tsx src/scripts/verify-multilingual-migration.ts
```

### Performance Degradation After Migration

**Problem**: Indexes not being used or query plan changed.

**Solution**:

```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT COALESCE(title_en, title) as title
FROM landing_features
WHERE status = 'published';

-- Should show index usage on status column
-- COALESCE in SELECT doesn't affect WHERE clause indexes
```

### English Columns Show as NULL in Admin

**Problem**: Admin queries not selecting English columns.

**Solution**: Update admin service methods to select all columns:

```typescript
// Before
.select('id, title, description')

// After
.select('id, title, title_en, description, description_en')
```

## Next Steps

After successful migration:

### 1. Backend Implementation

Implement language detection and localized queries:

- [ ] Create `backend/src/utils/language.ts`
- [ ] Create `backend/src/utils/localizedQuery.ts`
- [ ] Update service methods to accept language parameter
- [ ] Update controllers to detect language from request
- [ ] Add language to cache keys

### 2. API Testing

Test the multilingual API:

```bash
# Vietnamese (default)
curl http://localhost:3000/api/landing/features

# English
curl http://localhost:3000/api/landing/features?lang=en

# Should return same structure, different content
```

### 3. Frontend Integration

Update React components:

- [ ] Add language parameter to API client functions
- [ ] Create React hooks with i18n integration
- [ ] Update cache keys to include language
- [ ] Test language switching

### 4. Admin Interface

Add translation management:

- [ ] Create `MultilingualInput` component
- [ ] Create `TranslationStatus` component
- [ ] Update admin forms with language tabs
- [ ] Add translation status indicators

### 5. Translation Work

Add English translations:

- [ ] Translate landing page content
- [ ] Translate navigation items
- [ ] Translate documentation
- [ ] Review and refine translations

## Support

For issues or questions:

1. **Check verification output**: Run `npm run verify:multilingual`
2. **Review migration logs**: Check Supabase SQL Editor output
3. **Check database directly**: Use SQL queries in Supabase dashboard
4. **Review design document**: `.kiro/specs/database-multilingual/design.md`
5. **Check requirements**: `.kiro/specs/database-multilingual/requirements.md`

## Files Reference

- `002-add-multilingual-columns.sql` - Forward migration
- `002-rollback-multilingual-columns.sql` - Rollback migration
- `verify-multilingual-migration.ts` - Verification script
- `README.md` - Detailed migration documentation
- `MIGRATION_GUIDE.md` - This file (quick start guide)
