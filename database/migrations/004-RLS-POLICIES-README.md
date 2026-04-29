# Row Level Security (RLS) Policies for Header & Footer Tables

## Overview

This migration adds Row Level Security policies to the header and footer CMS tables, ensuring that:

- **Public users** can read published content
- **Admin users** can read all content (including drafts) and perform all write operations
- **Security is enforced at the database level**, even for direct SQL access

## Files

- `004-add-header-footer-rls-policies.sql` - Main migration script
- `004-test-rls-policies.sql` - Test script to verify policies work correctly
- `004-RLS-POLICIES-README.md` - This documentation file

## Prerequisites

Before running this migration, ensure:

1. ✅ Migration `003-add-header-footer-tables.sql` has been applied
2. ✅ Tables `header_settings`, `footer_columns`, and `footer_column_items` exist
3. ✅ Table `user_profiles` exists with `is_admin` column
4. ✅ Supabase `auth.uid()` function is available

## Quick Start

### Step 1: Apply the Migration

**Via Supabase Dashboard:**

1. Open your Supabase project SQL Editor
2. Copy the contents of `004-add-header-footer-rls-policies.sql`
3. Paste and click **Run**
4. Verify success message appears

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

### Step 2: Test the Policies

Run the test script to verify policies work:

1. Open Supabase SQL Editor
2. Copy the contents of `004-test-rls-policies.sql`
3. Paste and click **Run**
4. Review test results

## What This Migration Does

### Enables RLS on 3 Tables

```sql
ALTER TABLE header_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_column_items ENABLE ROW LEVEL SECURITY;
```

### Creates 12 Policies (4 per table)

**For each table:**

- 1 SELECT policy (public read access)
- 1 INSERT policy (admin-only)
- 1 UPDATE policy (admin-only)
- 1 DELETE policy (admin-only)

## Security Model

### Header Settings Table

| Operation | Public Users | Admin Users |
| --------- | ------------ | ----------- |
| SELECT    | ✅ Always    | ✅ Always   |
| INSERT    | ❌ Denied    | ✅ Allowed  |
| UPDATE    | ❌ Denied    | ✅ Allowed  |
| DELETE    | ❌ Denied    | ✅ Allowed  |

**Policy Logic:**

- **SELECT**: Always returns `true` (header is always public)
- **INSERT/UPDATE/DELETE**: Checks `user_profiles.is_admin = true`

### Footer Columns Table

| Operation | Public Users      | Admin Users               |
| --------- | ----------------- | ------------------------- |
| SELECT    | ✅ Published only | ✅ All (including drafts) |
| INSERT    | ❌ Denied         | ✅ Allowed                |
| UPDATE    | ❌ Denied         | ✅ Allowed                |
| DELETE    | ❌ Denied         | ✅ Allowed                |

**Policy Logic:**

- **SELECT**: Returns `status = 'published'` OR user is admin
- **INSERT/UPDATE/DELETE**: Checks `user_profiles.is_admin = true`

### Footer Column Items Table

| Operation | Public Users                  | Admin Users  |
| --------- | ----------------------------- | ------------ |
| SELECT    | ✅ If parent column published | ✅ All items |
| INSERT    | ❌ Denied                     | ✅ Allowed   |
| UPDATE    | ❌ Denied                     | ✅ Allowed   |
| DELETE    | ❌ Denied                     | ✅ Allowed   |

**Policy Logic:**

- **SELECT**: Checks if parent `footer_columns.status = 'published'` OR user is admin
- **INSERT/UPDATE/DELETE**: Checks `user_profiles.is_admin = true`

## Policy Details

### Public Read Policies (SELECT)

```sql
-- Header: Always readable
CREATE POLICY "Header settings are viewable by everyone"
  ON header_settings FOR SELECT
  USING (true);

-- Footer Columns: Published or admin
CREATE POLICY "Footer columns are viewable by everyone"
  ON footer_columns FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Items: Parent column published or admin
CREATE POLICY "Footer column items are viewable by everyone"
  ON footer_column_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM footer_columns
    WHERE id = footer_column_items.column_id
    AND (status = 'published' OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    ))
  ));
```

### Admin Write Policies (INSERT/UPDATE/DELETE)

All write policies follow the same pattern:

```sql
CREATE POLICY "Admins can [operation] [table]"
  ON [table] FOR [operation]
  [WITH CHECK | USING] (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));
```

**Key Points:**

- `WITH CHECK` is used for INSERT (validates new rows)
- `USING` is used for UPDATE/DELETE (validates existing rows)
- All check if current user has `is_admin = true`

## Verification

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items');
```

**Expected:**

```
tablename            | rowsecurity
---------------------|------------
header_settings      | t
footer_columns       | t
footer_column_items  | t
```

### Check Policies Exist

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
ORDER BY tablename, cmd;
```

**Expected:** 12 rows (4 policies per table)

### Test Public Read Access

```sql
-- Should work without authentication
SELECT * FROM header_settings;
SELECT * FROM footer_columns WHERE status = 'published';
```

### Test Admin Write Access

```sql
-- Should work only for admin users
INSERT INTO header_settings (logo_alt_text) VALUES ('Test');
UPDATE footer_columns SET title = 'Updated' WHERE id = 'some-id';
DELETE FROM footer_column_items WHERE id = 'some-id';
```

## Troubleshooting

### Error: "permission denied for table"

**Cause:** RLS is blocking your query because you don't have the required permissions.

**Solutions:**

1. **For read operations:** Make sure you're querying published content

   ```sql
   -- Instead of:
   SELECT * FROM footer_columns;

   -- Use:
   SELECT * FROM footer_columns WHERE status = 'published';
   ```

2. **For write operations:** Verify you're authenticated as an admin user

   ```sql
   -- Check your admin status
   SELECT id, email, is_admin
   FROM user_profiles
   WHERE id = auth.uid();
   ```

3. **If you're an admin but still getting errors:** Check your authentication token is valid
   ```sql
   -- Check current user
   SELECT auth.uid();
   -- Should return your user ID, not NULL
   ```

### Error: "relation does not exist"

**Cause:** The header/footer tables haven't been created yet.

**Solution:** Run migration `003-add-header-footer-tables.sql` first.

### Policies Not Working as Expected

**Debug steps:**

1. Check if RLS is actually enabled:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'footer_columns';
   ```

2. Check policy definitions:

   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'footer_columns';
   ```

3. Test with explicit user context:

   ```sql
   -- Set user context (for testing)
   SET LOCAL role authenticated;
   SET LOCAL request.jwt.claim.sub = 'your-user-id';

   -- Now test queries
   SELECT * FROM footer_columns;
   ```

### Migration Fails During Verification

**Cause:** Policies weren't created correctly.

**Solution:**

1. Check for error messages in the migration output
2. Verify the `user_profiles` table exists
3. Verify the `auth.uid()` function is available (Supabase-specific)
4. Try running the migration again (it's idempotent)

## Impact on Application

### Backend API

Your backend API will automatically respect RLS policies when using Supabase client:

```typescript
// Public read (works for everyone)
const { data } = await supabase.from('footer_columns').select('*').eq('status', 'published')

// Admin write (requires admin authentication)
const { data, error } = await supabase
  .from('footer_columns')
  .insert({ title: 'New Column', column_type: 'company_links' })
// Will fail if user is not admin
```

### Service Role Key

If you need to bypass RLS (e.g., for admin operations), use the service role key:

```typescript
// Bypasses RLS (use carefully!)
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY)

const { data } = await supabaseAdmin.from('footer_columns').select('*') // Returns all columns, including drafts
```

### Frontend Implications

- Public pages can safely query published content
- Admin pages must authenticate users before write operations
- Draft content is automatically hidden from non-admin users

## Rollback

If you need to remove RLS policies:

```sql
BEGIN;

-- Disable RLS
ALTER TABLE header_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE footer_columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE footer_column_items DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Header settings are viewable by everyone" ON header_settings;
DROP POLICY IF EXISTS "Admins can insert header settings" ON header_settings;
DROP POLICY IF EXISTS "Admins can update header settings" ON header_settings;
DROP POLICY IF EXISTS "Admins can delete header settings" ON header_settings;

DROP POLICY IF EXISTS "Footer columns are viewable by everyone" ON footer_columns;
DROP POLICY IF EXISTS "Admins can insert footer columns" ON footer_columns;
DROP POLICY IF EXISTS "Admins can update footer columns" ON footer_columns;
DROP POLICY IF EXISTS "Admins can delete footer columns" ON footer_columns;

DROP POLICY IF EXISTS "Footer column items are viewable by everyone" ON footer_column_items;
DROP POLICY IF EXISTS "Admins can insert footer column items" ON footer_column_items;
DROP POLICY IF EXISTS "Admins can update footer column items" ON footer_column_items;
DROP POLICY IF EXISTS "Admins can delete footer column items" ON footer_column_items;

COMMIT;
```

⚠️ **Warning:** Disabling RLS removes all security restrictions. Only do this if you understand the implications.

## Best Practices

1. **Always use RLS in production** - It provides defense-in-depth security
2. **Test with different user roles** - Verify policies work for public, authenticated, and admin users
3. **Use service role key sparingly** - Only for trusted backend operations
4. **Monitor policy performance** - Complex policies can impact query performance
5. **Document policy changes** - Keep this README updated when modifying policies

## Related Requirements

This migration implements **Requirement 19** from the Header & Footer CMS Expansion spec:

> **Requirement 19: Row Level Security for Header and Footer Tables**
>
> As a system, I need database-level security policies, so that only authorized users can modify header and footer content.

**Acceptance Criteria Met:**

- ✅ RLS enabled on header_settings, footer_columns, footer_column_items
- ✅ SELECT policies allow public read of published content
- ✅ INSERT/UPDATE/DELETE policies restrict to admin users only
- ✅ Admin verification checks user_profiles.is_admin = true
- ✅ Non-admin users are rejected at database level
- ✅ Policies apply to all operations including direct database access

## Next Steps

After applying this migration:

1. ✅ Test policies with the test script
2. ⏭️ Implement backend API endpoints (Task 1.3)
3. ⏭️ Test API endpoints respect RLS policies
4. ⏭️ Implement admin UI for header/footer management
5. ⏭️ Test with authenticated and unauthenticated users

## Support

For issues or questions:

- Review the test script: `004-test-rls-policies.sql`
- Check Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Review the design document: `.kiro/specs/header-footer-cms-expansion/design.md`
- Check requirements: `.kiro/specs/header-footer-cms-expansion/requirements.md`
