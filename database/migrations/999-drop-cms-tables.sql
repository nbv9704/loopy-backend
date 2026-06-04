-- ============================================================================
-- Migration: Drop CMS Tables
-- Date: 2026-04-27
-- Purpose: Remove all CMS-related tables as part of admin panel rework
-- 
-- These tables were used for managing static UI content (header, footer,
-- landing page, navigation, documentation). This content is now managed
-- via constants.ts file for better performance and simpler maintenance.
-- ============================================================================

-- Drop tables in correct order (respecting foreign key constraints)

-- Landing page tables
DROP TABLE IF EXISTS landing_how_it_works CASCADE;
DROP TABLE IF EXISTS landing_stats CASCADE;
DROP TABLE IF EXISTS landing_languages CASCADE;
DROP TABLE IF EXISTS landing_features CASCADE;

-- Footer tables
DROP TABLE IF EXISTS footer_column_items CASCADE;
DROP TABLE IF EXISTS footer_columns CASCADE;

-- Header tables
DROP TABLE IF EXISTS header_settings CASCADE;

-- Navigation tables
DROP TABLE IF EXISTS navigation_items CASCADE;

-- Documentation tables
DROP TABLE IF EXISTS documentation_links CASCADE;
DROP TABLE IF EXISTS documentation_technologies CASCADE;

-- Note: audit_logs table is kept for future use
-- TRUNCATE TABLE audit_logs; -- Uncomment if you want to clear audit data

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify tables are dropped:
-- 
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--   'landing_how_it_works', 'landing_stats', 'landing_languages', 'landing_features',
--   'footer_column_items', 'footer_columns', 'header_settings', 'navigation_items',
--   'documentation_links', 'documentation_technologies'
-- );
-- 
-- Should return 0 rows if successful.
-- ============================================================================
