# Task 1.4 Quick Reference

## TL;DR - What You Need to Do

1. **Open Supabase SQL Editor** (in your browser)
2. **Run these 3 scripts in order:**
   - `003-add-header-footer-tables.sql`
   - `004-add-header-footer-rls-policies.sql`
   - `005-add-header-footer-updated-at-triggers.sql`
3. **Run verification script:**
   - `verify-header-footer-migrations.sql`
4. **Confirm all checks pass** ✓

## Copy-Paste Checklist

```
□ Logged into Supabase Dashboard
□ Opened SQL Editor
□ Ran 003-add-header-footer-tables.sql
   → Saw "✓ Migration completed successfully"
□ Ran 004-add-header-footer-rls-policies.sql
   → Saw "✓ RLS Migration completed successfully"
□ Ran 005-add-header-footer-updated-at-triggers.sql
   → Saw "✓ Migration completed successfully"
□ Ran verify-header-footer-migrations.sql
   → Saw "✓ All verification checks PASSED"
□ Marked task 1.4 as complete
```

## Expected Success Messages

### After 003 (Tables):

```
NOTICE:  ✓ Migration completed successfully
NOTICE:  ✓ Created header_settings table with 6 columns
NOTICE:  ✓ Created footer_columns table with 8 columns
NOTICE:  ✓ Created footer_column_items table with 7 columns
```

### After 004 (RLS):

```
NOTICE:  ✓ RLS Migration completed successfully
NOTICE:  ✓ Total: 12 RLS policies created
NOTICE:  ✓ All verification checks passed
```

### After 005 (Triggers):

```
NOTICE:  ✓ Migration completed successfully
NOTICE:  ✓ Created trigger: update_header_settings_updated_at
NOTICE:  ✓ Created trigger: update_footer_columns_updated_at
NOTICE:  ✓ Created trigger: update_footer_column_items_updated_at
```

### After Verification:

```
✓ All verification checks PASSED
✓ Migrations 003, 004, and 005 executed successfully
```

## What Gets Created

| Category         | Count | Items                                                |
| ---------------- | ----- | ---------------------------------------------------- |
| **Tables**       | 3     | header_settings, footer_columns, footer_column_items |
| **Indexes**      | 4     | display_order (×2), status, column_id                |
| **RLS Policies** | 12    | SELECT (×3), INSERT (×3), UPDATE (×3), DELETE (×3)   |
| **Triggers**     | 3     | updated_at auto-update triggers                      |

## Troubleshooting

| Error                     | Solution                          |
| ------------------------- | --------------------------------- |
| "function does not exist" | Deploy base schema first          |
| "relation already exists" | Safe to ignore (already migrated) |
| "permission denied"       | Use admin/superuser account       |

## Files You Need

All files are in: `backend/database/migrations/`

1. `003-add-header-footer-tables.sql` ← Run first
2. `004-add-header-footer-rls-policies.sql` ← Run second
3. `005-add-header-footer-updated-at-triggers.sql` ← Run third
4. `verify-header-footer-migrations.sql` ← Run to verify

## After Completion

✓ Task 1.4 complete
→ Next: Task 2.1 (Backend file upload service)

---

**Need detailed instructions?** See `TASK-1.4-EXECUTION-GUIDE.md`
