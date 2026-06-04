-- Rollback Migration: Remove Multilingual Support Columns
-- Description: Removes all English translation columns and indexes from content tables
-- Author: Database Multilingual Feature
-- Date: 2024
-- WARNING: This will permanently delete all English translation data!

BEGIN;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

-- Drop all partial indexes created for English columns
DROP INDEX IF EXISTS idx_landing_features_title_en;
DROP INDEX IF EXISTS idx_landing_languages_name_en;
DROP INDEX IF EXISTS idx_landing_stats_label_en;
DROP INDEX IF EXISTS idx_landing_how_it_works_title_en;
DROP INDEX IF EXISTS idx_navigation_items_label_en;
DROP INDEX IF EXISTS idx_navigation_items_parent_id;
DROP INDEX IF EXISTS idx_documentation_technologies_name_en;
DROP INDEX IF EXISTS idx_documentation_links_title_en;

-- ============================================================================
-- DROP COLUMNS FROM LANDING FEATURES
-- ============================================================================

ALTER TABLE landing_features 
DROP COLUMN IF EXISTS title_en,
DROP COLUMN IF EXISTS description_en;

-- ============================================================================
-- DROP COLUMNS FROM LANDING LANGUAGES
-- ============================================================================

ALTER TABLE landing_languages 
DROP COLUMN IF EXISTS name_en,
DROP COLUMN IF EXISTS description_en;

-- ============================================================================
-- DROP COLUMNS FROM LANDING STATS
-- ============================================================================

ALTER TABLE landing_stats 
DROP COLUMN IF EXISTS label_en;

-- ============================================================================
-- DROP COLUMNS FROM LANDING HOW IT WORKS
-- ============================================================================

ALTER TABLE landing_how_it_works 
DROP COLUMN IF EXISTS title_en,
DROP COLUMN IF EXISTS description_en;

-- ============================================================================
-- DROP COLUMNS FROM NAVIGATION ITEMS
-- ============================================================================

ALTER TABLE navigation_items 
DROP COLUMN IF EXISTS label_en,
DROP COLUMN IF EXISTS parent_id,
DROP COLUMN IF EXISTS icon;

-- ============================================================================
-- DROP COLUMNS FROM DOCUMENTATION TECHNOLOGIES
-- ============================================================================

ALTER TABLE documentation_technologies 
DROP COLUMN IF EXISTS name_en;

-- ============================================================================
-- DROP COLUMNS FROM DOCUMENTATION LINKS
-- ============================================================================

ALTER TABLE documentation_links 
DROP COLUMN IF EXISTS title_en,
DROP COLUMN IF EXISTS description_en;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all columns were removed successfully
DO $$
DECLARE
  column_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Check that no English columns remain
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_schema = 'public'
    AND column_name LIKE '%_en';
  
  IF column_count > 0 THEN
    RAISE EXCEPTION 'Rollback failed: % English columns still exist', column_count;
  END IF;

  -- Check that no English column indexes remain
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_landing_features_title_en',
      'idx_landing_languages_name_en',
      'idx_landing_stats_label_en',
      'idx_landing_how_it_works_title_en',
      'idx_navigation_items_label_en',
      'idx_documentation_technologies_name_en',
      'idx_documentation_links_title_en'
    );

  IF index_count > 0 THEN
    RAISE EXCEPTION 'Rollback failed: % indexes still exist', index_count;
  END IF;

  -- Verify original columns still exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_features' 
    AND column_name IN ('title', 'description');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Rollback verification failed: original landing_features columns missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_languages' 
    AND column_name IN ('name', 'description');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Rollback verification failed: original landing_languages columns missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_stats' 
    AND column_name = 'label';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Rollback verification failed: original landing_stats column missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_how_it_works' 
    AND column_name IN ('title', 'description');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Rollback verification failed: original landing_how_it_works columns missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'navigation_items' 
    AND column_name = 'label';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Rollback verification failed: original navigation_items column missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'documentation_technologies' 
    AND column_name = 'name';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Rollback verification failed: original documentation_technologies column missing';
  END IF;

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'documentation_links' 
    AND column_name IN ('title', 'description');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Rollback verification failed: original documentation_links columns missing';
  END IF;

  RAISE NOTICE '✓ Rollback completed successfully';
  RAISE NOTICE '✓ Removed all English translation columns';
  RAISE NOTICE '✓ Removed all 7 partial indexes';
  RAISE NOTICE '✓ Original Vietnamese columns preserved';
  RAISE NOTICE '✓ All verification checks passed';
  RAISE WARNING 'All English translation data has been permanently deleted';
END $$;

COMMIT;
