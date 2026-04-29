-- Verification Script for Header & Footer Migrations
-- Run this after executing migrations 003, 004, and 005
-- This script checks that all tables, indexes, policies, and triggers were created correctly
-- Compatible with Supabase SQL Editor (no psql meta-commands)

DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Header & Footer Migration Verification';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. VERIFY TABLES EXIST
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '1. Checking Tables...';
END $$;

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Check header_settings table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'header_settings';
  
  IF table_count = 1 THEN
    RAISE NOTICE '  ✓ header_settings table exists';
  ELSE
    RAISE EXCEPTION '  ✗ header_settings table NOT FOUND';
  END IF;

  -- Check footer_columns table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'footer_columns';
  
  IF table_count = 1 THEN
    RAISE NOTICE '  ✓ footer_columns table exists';
  ELSE
    RAISE EXCEPTION '  ✗ footer_columns table NOT FOUND';
  END IF;

  -- Check footer_column_items table
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'footer_column_items';
  
  IF table_count = 1 THEN
    RAISE NOTICE '  ✓ footer_column_items table exists';
  ELSE
    RAISE EXCEPTION '  ✗ footer_column_items table NOT FOUND';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 2. VERIFY TABLE COLUMNS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '2. Checking Table Columns...';
END $$;

DO $$
DECLARE
  column_count INTEGER;
BEGIN
  -- Verify header_settings columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'header_settings'
    AND column_name IN ('id', 'logo_url', 'logo_alt_text', 'logo_alt_text_en', 'created_at', 'updated_at');
  
  IF column_count = 6 THEN
    RAISE NOTICE '  ✓ header_settings has all 6 columns';
  ELSE
    RAISE EXCEPTION '  ✗ header_settings missing columns (found % of 6)', column_count;
  END IF;

  -- Verify footer_columns columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'footer_columns'
    AND column_name IN ('id', 'title', 'title_en', 'column_type', 'display_order', 'status', 'created_at', 'updated_at');
  
  IF column_count = 8 THEN
    RAISE NOTICE '  ✓ footer_columns has all 8 columns';
  ELSE
    RAISE EXCEPTION '  ✗ footer_columns missing columns (found % of 8)', column_count;
  END IF;

  -- Verify footer_column_items columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'footer_column_items'
    AND column_name IN ('id', 'column_id', 'item_type', 'content_data', 'display_order', 'created_at', 'updated_at');
  
  IF column_count = 7 THEN
    RAISE NOTICE '  ✓ footer_column_items has all 7 columns';
  ELSE
    RAISE EXCEPTION '  ✗ footer_column_items missing columns (found % of 7)', column_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 3. VERIFY INDEXES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '3. Checking Indexes...';
END $$;

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_footer_columns_display_order',
      'idx_footer_columns_status',
      'idx_footer_column_items_column',
      'idx_footer_column_items_display_order'
    );

  IF index_count = 4 THEN
    RAISE NOTICE '  ✓ All 4 indexes created';
    RAISE NOTICE '    - idx_footer_columns_display_order';
    RAISE NOTICE '    - idx_footer_columns_status';
    RAISE NOTICE '    - idx_footer_column_items_column';
    RAISE NOTICE '    - idx_footer_column_items_display_order';
  ELSE
    RAISE EXCEPTION '  ✗ Missing indexes (found % of 4)', index_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 4. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '4. Checking Foreign Key Constraints...';
END $$;

DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'footer_column_items'
    AND constraint_type = 'FOREIGN KEY';

  IF fk_count >= 1 THEN
    RAISE NOTICE '  ✓ Foreign key constraint exists on footer_column_items';
  ELSE
    RAISE EXCEPTION '  ✗ Foreign key constraint NOT FOUND on footer_column_items';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 5. VERIFY CHECK CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '5. Checking CHECK Constraints...';
END $$;

DO $$
DECLARE
  check_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO check_count
  FROM information_schema.check_constraints
  WHERE constraint_name LIKE '%column_type%'
    OR constraint_name LIKE '%status%'
    OR constraint_name LIKE '%item_type%';

  IF check_count >= 3 THEN
    RAISE NOTICE '  ✓ CHECK constraints exist (found %)', check_count;
  ELSE
    RAISE EXCEPTION '  ✗ CHECK constraints missing (found % of 3)', check_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 6. VERIFY ROW LEVEL SECURITY ENABLED
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '6. Checking Row Level Security...';
END $$;

DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND c.relrowsecurity = true;
  
  IF rls_count = 3 THEN
    RAISE NOTICE '  ✓ RLS enabled on all 3 tables';
  ELSE
    RAISE EXCEPTION '  ✗ RLS not enabled on all tables (found % of 3)', rls_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 7. VERIFY RLS POLICIES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '7. Checking RLS Policies...';
END $$;

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Check total policy count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items');
  
  IF policy_count = 12 THEN
    RAISE NOTICE '  ✓ All 12 RLS policies created';
  ELSE
    RAISE EXCEPTION '  ✗ Missing policies (found % of 12)', policy_count;
  END IF;

  -- Check SELECT policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'SELECT';
  
  IF policy_count = 3 THEN
    RAISE NOTICE '  ✓ All 3 SELECT policies created';
  ELSE
    RAISE EXCEPTION '  ✗ Missing SELECT policies (found % of 3)', policy_count;
  END IF;

  -- Check INSERT policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'INSERT';
  
  IF policy_count = 3 THEN
    RAISE NOTICE '  ✓ All 3 INSERT policies created';
  ELSE
    RAISE EXCEPTION '  ✗ Missing INSERT policies (found % of 3)', policy_count;
  END IF;

  -- Check UPDATE policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'UPDATE';
  
  IF policy_count = 3 THEN
    RAISE NOTICE '  ✓ All 3 UPDATE policies created';
  ELSE
    RAISE EXCEPTION '  ✗ Missing UPDATE policies (found % of 3)', policy_count;
  END IF;

  -- Check DELETE policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'DELETE';
  
  IF policy_count = 3 THEN
    RAISE NOTICE '  ✓ All 3 DELETE policies created';
  ELSE
    RAISE EXCEPTION '  ✗ Missing DELETE policies (found % of 3)', policy_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 8. VERIFY TRIGGERS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '8. Checking Triggers...';
END $$;

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND t.tgname IN (
      'update_header_settings_updated_at',
      'update_footer_columns_updated_at',
      'update_footer_column_items_updated_at'
    );
  
  IF trigger_count = 3 THEN
    RAISE NOTICE '  ✓ All 3 triggers created';
    RAISE NOTICE '    - update_header_settings_updated_at';
    RAISE NOTICE '    - update_footer_columns_updated_at';
    RAISE NOTICE '    - update_footer_column_items_updated_at';
  ELSE
    RAISE EXCEPTION '  ✗ Missing triggers (found % of 3)', trigger_count;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 9. VERIFY update_updated_at_column FUNCTION EXISTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '9. Checking Required Functions...';
END $$;

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'update_updated_at_column';
  
  IF function_count > 0 THEN
    RAISE NOTICE '  ✓ update_updated_at_column() function exists';
  ELSE
    RAISE EXCEPTION '  ✗ update_updated_at_column() function NOT FOUND';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Verification Summary';
  RAISE NOTICE '=========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:        3';
  RAISE NOTICE 'Columns Verified:      21 (6 + 8 + 7)';
  RAISE NOTICE 'Indexes Created:       4';
  RAISE NOTICE 'Foreign Keys:          1';
  RAISE NOTICE 'CHECK Constraints:     3+';
  RAISE NOTICE 'RLS Enabled:           3 tables';
  RAISE NOTICE 'RLS Policies:          12 (3 SELECT, 3 INSERT, 3 UPDATE, 3 DELETE)';
  RAISE NOTICE 'Triggers:              3';
  RAISE NOTICE '';
  RAISE NOTICE '✓ All verification checks PASSED';
  RAISE NOTICE '✓ Migrations 003, 004, and 005 executed successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Mark task 1.4 as complete in tasks.md';
  RAISE NOTICE '  2. Proceed to task 2.1 (Backend file upload service)';
  RAISE NOTICE '';
END $$;
