-- Migration: Add Row Level Security Policies for Header and Footer Tables
-- Description: Enables RLS and creates policies for header_settings, footer_columns, and footer_column_items
-- Author: Header & Footer CMS Expansion Feature
-- Date: 2024
-- Requirements: 19

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE header_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_column_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (if any)
-- ============================================================================

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

-- ============================================================================
-- PUBLIC READ POLICIES (SELECT)
-- ============================================================================

-- Header Settings: Allow public read access (no status field, always published)
CREATE POLICY "Header settings are viewable by everyone"
  ON header_settings FOR SELECT
  USING (true);

-- Footer Columns: Allow public read of published content, admins can see all
CREATE POLICY "Footer columns are viewable by everyone"
  ON footer_columns FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Column Items: Allow public read if parent column is published
CREATE POLICY "Footer column items are viewable by everyone"
  ON footer_column_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM footer_columns 
    WHERE id = footer_column_items.column_id 
    AND (status = 'published' OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    ))
  ));

-- ============================================================================
-- ADMIN WRITE POLICIES (INSERT, UPDATE, DELETE)
-- ============================================================================

-- Header Settings: INSERT
CREATE POLICY "Admins can insert header settings"
  ON header_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Header Settings: UPDATE
CREATE POLICY "Admins can update header settings"
  ON header_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Header Settings: DELETE
CREATE POLICY "Admins can delete header settings"
  ON header_settings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Columns: INSERT
CREATE POLICY "Admins can insert footer columns"
  ON footer_columns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Columns: UPDATE
CREATE POLICY "Admins can update footer columns"
  ON footer_columns FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Columns: DELETE
CREATE POLICY "Admins can delete footer columns"
  ON footer_columns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Column Items: INSERT
CREATE POLICY "Admins can insert footer column items"
  ON footer_column_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Column Items: UPDATE
CREATE POLICY "Admins can update footer column items"
  ON footer_column_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Footer Column Items: DELETE
CREATE POLICY "Admins can delete footer column items"
  ON footer_column_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  rls_enabled_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Verify RLS is enabled on all three tables
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND c.relrowsecurity = true;
  
  IF rls_enabled_count != 3 THEN
    RAISE EXCEPTION 'RLS not enabled on all tables (found % of 3)', rls_enabled_count;
  END IF;

  -- Verify all policies were created (4 policies per table = 12 total)
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items');
  
  IF policy_count != 12 THEN
    RAISE EXCEPTION 'Not all policies created (found % of 12)', policy_count;
  END IF;

  -- Verify SELECT policies exist for public access
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'SELECT';
  
  IF policy_count != 3 THEN
    RAISE EXCEPTION 'SELECT policies missing (found % of 3)', policy_count;
  END IF;

  -- Verify INSERT policies exist for admin access
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'INSERT';
  
  IF policy_count != 3 THEN
    RAISE EXCEPTION 'INSERT policies missing (found % of 3)', policy_count;
  END IF;

  -- Verify UPDATE policies exist for admin access
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'UPDATE';
  
  IF policy_count != 3 THEN
    RAISE EXCEPTION 'UPDATE policies missing (found % of 3)', policy_count;
  END IF;

  -- Verify DELETE policies exist for admin access
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND cmd = 'DELETE';
  
  IF policy_count != 3 THEN
    RAISE EXCEPTION 'DELETE policies missing (found % of 3)', policy_count;
  END IF;

  RAISE NOTICE '✓ RLS Migration completed successfully';
  RAISE NOTICE '✓ Enabled RLS on 3 tables: header_settings, footer_columns, footer_column_items';
  RAISE NOTICE '✓ Created 3 SELECT policies for public read access';
  RAISE NOTICE '✓ Created 3 INSERT policies for admin-only access';
  RAISE NOTICE '✓ Created 3 UPDATE policies for admin-only access';
  RAISE NOTICE '✓ Created 3 DELETE policies for admin-only access';
  RAISE NOTICE '✓ Total: 12 RLS policies created';
  RAISE NOTICE '✓ All verification checks passed';
END $$;

COMMIT;
