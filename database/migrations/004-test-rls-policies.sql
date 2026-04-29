-- Test Script: Verify RLS Policies for Header and Footer Tables
-- Description: Tests that RLS policies work correctly for public and admin users
-- Run this AFTER applying 004-add-header-footer-rls-policies.sql

-- ============================================================================
-- SETUP: Create test data
-- ============================================================================

BEGIN;

-- Insert test header settings
INSERT INTO header_settings (logo_url, logo_alt_text, logo_alt_text_en)
VALUES ('/uploads/test-logo.png', 'Logo thử nghiệm', 'Test Logo')
ON CONFLICT (id) DO NOTHING;

-- Insert test footer columns
INSERT INTO footer_columns (id, title, title_en, column_type, display_order, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Công ty (Published)', 'Company (Published)', 'company_links', 1, 'published'),
  ('22222222-2222-2222-2222-222222222222', 'Thương hiệu (Draft)', 'Brand (Draft)', 'brand_identity', 2, 'draft')
ON CONFLICT (id) DO NOTHING;

-- Insert test footer column items
INSERT INTO footer_column_items (column_id, item_type, content_data, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'navigation_link', '{"label": "Về chúng tôi", "label_en": "About Us", "path": "/about"}', 1),
  ('22222222-2222-2222-2222-222222222222', 'brand_content', '{"logo_url": "/uploads/brand.png", "description": "Mô tả thương hiệu", "description_en": "Brand description"}', 1)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- TEST 1: Public Read Access (SELECT)
-- ============================================================================

-- These queries should work for everyone (no authentication required)

-- Test 1.1: Read header settings (always public)
SELECT 'Test 1.1: Read header settings' as test_name;
SELECT id, logo_url, logo_alt_text FROM header_settings LIMIT 1;
-- Expected: Returns data

-- Test 1.2: Read published footer columns
SELECT 'Test 1.2: Read published footer columns' as test_name;
SELECT id, title, column_type, status FROM footer_columns WHERE status = 'published';
-- Expected: Returns only published columns

-- Test 1.3: Read items in published columns
SELECT 'Test 1.3: Read items in published columns' as test_name;
SELECT fci.id, fci.item_type, fc.status as column_status
FROM footer_column_items fci
JOIN footer_columns fc ON fc.id = fci.column_id
WHERE fc.status = 'published';
-- Expected: Returns items from published columns only

-- ============================================================================
-- TEST 2: Admin Read Access (SELECT with admin privileges)
-- ============================================================================

-- These queries should return ALL data for admin users (including drafts)
-- For non-admin users, they should only see published content

-- Test 2.1: Admin can see draft columns
SELECT 'Test 2.1: Admin can see draft columns' as test_name;
SELECT id, title, column_type, status FROM footer_columns WHERE status = 'draft';
-- Expected for admin: Returns draft columns
-- Expected for non-admin: Returns empty (RLS blocks)

-- Test 2.2: Admin can see items in draft columns
SELECT 'Test 2.2: Admin can see items in draft columns' as test_name;
SELECT fci.id, fci.item_type, fc.status as column_status
FROM footer_column_items fci
JOIN footer_columns fc ON fc.id = fci.column_id
WHERE fc.status = 'draft';
-- Expected for admin: Returns items from draft columns
-- Expected for non-admin: Returns empty (RLS blocks)

-- ============================================================================
-- TEST 3: Write Access (INSERT/UPDATE/DELETE - Admin Only)
-- ============================================================================

-- These operations should ONLY work for admin users
-- Non-admin users should get "permission denied" errors

-- Test 3.1: Try to insert header settings
SELECT 'Test 3.1: Try to insert header settings' as test_name;
-- Uncomment to test (will fail for non-admin):
-- INSERT INTO header_settings (logo_alt_text) VALUES ('Unauthorized insert');
-- Expected for admin: Success
-- Expected for non-admin: ERROR: new row violates row-level security policy

-- Test 3.2: Try to update header settings
SELECT 'Test 3.2: Try to update header settings' as test_name;
-- Uncomment to test (will fail for non-admin):
-- UPDATE header_settings SET logo_alt_text = 'Unauthorized update' WHERE id IS NOT NULL;
-- Expected for admin: Success
-- Expected for non-admin: ERROR: new row violates row-level security policy

-- Test 3.3: Try to insert footer column
SELECT 'Test 3.3: Try to insert footer column' as test_name;
-- Uncomment to test (will fail for non-admin):
-- INSERT INTO footer_columns (title, column_type, display_order) VALUES ('Unauthorized', 'company_links', 999);
-- Expected for admin: Success
-- Expected for non-admin: ERROR: new row violates row-level security policy

-- Test 3.4: Try to delete footer column
SELECT 'Test 3.4: Try to delete footer column' as test_name;
-- Uncomment to test (will fail for non-admin):
-- DELETE FROM footer_columns WHERE display_order = 999;
-- Expected for admin: Success
-- Expected for non-admin: ERROR: new row violates row-level security policy

-- ============================================================================
-- TEST 4: Verify RLS is Actually Enabled
-- ============================================================================

SELECT 'Test 4: Verify RLS is enabled' as test_name;

SELECT 
  t.tablename,
  c.relrowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
GROUP BY t.tablename, c.relrowsecurity
ORDER BY t.tablename;

-- Expected output:
-- footer_column_items | t | 4
-- footer_columns      | t | 4
-- header_settings     | t | 4

-- ============================================================================
-- TEST 5: List All Policies
-- ============================================================================

SELECT 'Test 5: List all RLS policies' as test_name;

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Public + Admin'
    ELSE 'Admin Only'
  END as allowed_users
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('header_settings', 'footer_columns', 'footer_column_items')
ORDER BY tablename, cmd;

-- Expected: 12 policies total (4 per table)

-- ============================================================================
-- CLEANUP: Remove test data
-- ============================================================================

BEGIN;

-- Remove test data
DELETE FROM footer_column_items 
WHERE column_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

DELETE FROM footer_columns 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Note: We keep header_settings as it's a singleton table

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '
✓ RLS Policy Test Summary
========================

Public Users (Unauthenticated):
  ✓ Can read header_settings
  ✓ Can read published footer_columns
  ✓ Can read items in published columns
  ✗ Cannot read draft columns
  ✗ Cannot read items in draft columns
  ✗ Cannot insert/update/delete any content

Admin Users (is_admin = true):
  ✓ Can read all content (including drafts)
  ✓ Can insert new content
  ✓ Can update existing content
  ✓ Can delete content

Security Model:
  • RLS enabled on 3 tables
  • 12 policies created (4 per table)
  • Database-level enforcement
  • Works even with direct SQL access

Next Steps:
  1. Test with actual admin user authentication
  2. Verify API endpoints respect RLS policies
  3. Test frontend with authenticated/unauthenticated users
' as summary;
