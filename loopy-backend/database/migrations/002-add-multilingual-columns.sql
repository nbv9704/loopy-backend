-- Migration: Add Multilingual Support Columns
-- Description: Adds English translation columns to all 7 content tables
-- Author: Database Multilingual Feature
-- Date: 2024
-- Requirements: 1, 10, 11

BEGIN;

-- ============================================================================
-- LANDING FEATURES TABLE
-- ============================================================================

-- Add English translation columns
ALTER TABLE landing_features
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Create partial index for performance (only indexes non-NULL values)
CREATE INDEX IF NOT EXISTS idx_landing_features_title_en 
  ON landing_features(title_en) WHERE title_en IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN landing_features.title IS 'Feature title in Vietnamese (default language)';
COMMENT ON COLUMN landing_features.title_en IS 'Feature title in English (optional translation)';
COMMENT ON COLUMN landing_features.description IS 'Feature description in Vietnamese (default language)';
COMMENT ON COLUMN landing_features.description_en IS 'Feature description in English (optional translation)';

-- ============================================================================
-- LANDING LANGUAGES TABLE
-- ============================================================================

-- Add English translation columns
ALTER TABLE landing_languages
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_landing_languages_name_en 
  ON landing_languages(name_en) WHERE name_en IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN landing_languages.name IS 'Language name in Vietnamese (default language)';
COMMENT ON COLUMN landing_languages.name_en IS 'Language name in English (optional translation)';
COMMENT ON COLUMN landing_languages.description IS 'Language description in Vietnamese (default language)';
COMMENT ON COLUMN landing_languages.description_en IS 'Language description in English (optional translation)';

-- ============================================================================
-- LANDING STATS TABLE
-- ============================================================================

-- Add English translation column
ALTER TABLE landing_stats
ADD COLUMN IF NOT EXISTS label_en TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_landing_stats_label_en 
  ON landing_stats(label_en) WHERE label_en IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN landing_stats.label IS 'Stat label in Vietnamese (default language)';
COMMENT ON COLUMN landing_stats.label_en IS 'Stat label in English (optional translation)';

-- ============================================================================
-- LANDING HOW IT WORKS TABLE
-- ============================================================================

-- Add English translation columns
ALTER TABLE landing_how_it_works
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_landing_how_it_works_title_en 
  ON landing_how_it_works(title_en) WHERE title_en IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN landing_how_it_works.title IS 'Step title in Vietnamese (default language)';
COMMENT ON COLUMN landing_how_it_works.title_en IS 'Step title in English (optional translation)';
COMMENT ON COLUMN landing_how_it_works.description IS 'Step description in Vietnamese (default language)';
COMMENT ON COLUMN landing_how_it_works.description_en IS 'Step description in English (optional translation)';

-- ============================================================================
-- NAVIGATION ITEMS TABLE
-- ============================================================================

-- Add English translation column
ALTER TABLE navigation_items
ADD COLUMN IF NOT EXISTS label_en TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_navigation_items_label_en 
  ON navigation_items(label_en) WHERE label_en IS NOT NULL;

-- Create index for parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id 
  ON navigation_items(parent_id) WHERE parent_id IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN navigation_items.label IS 'Navigation label in Vietnamese (default language)';
COMMENT ON COLUMN navigation_items.label_en IS 'Navigation label in English (optional translation)';
COMMENT ON COLUMN navigation_items.parent_id IS 'Parent navigation item ID for hierarchical menus (NULL for top-level items)';
COMMENT ON COLUMN navigation_items.icon IS 'Icon identifier or emoji for the navigation item';

-- ============================================================================
-- DOCUMENTATION TECHNOLOGIES TABLE
-- ============================================================================

-- Add English translation column
ALTER TABLE documentation_technologies
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_documentation_technologies_name_en 
  ON documentation_technologies(name_en) WHERE name_en IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN documentation_technologies.name IS 'Technology name in Vietnamese (default language)';
COMMENT ON COLUMN documentation_technologies.name_en IS 'Technology name in English (optional translation)';

-- ============================================================================
-- DOCUMENTATION LINKS TABLE
-- ============================================================================

-- Add English translation columns
ALTER TABLE documentation_links
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Create partial index for performance
CREATE INDEX IF NOT EXISTS idx_documentation_links_title_en 
  ON documentation_links(title_en) WHERE title_en IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN documentation_links.title IS 'Link title in Vietnamese (default language)';
COMMENT ON COLUMN documentation_links.title_en IS 'Link title in English (optional translation)';
COMMENT ON COLUMN documentation_links.description IS 'Link description in Vietnamese (default language)';
COMMENT ON COLUMN documentation_links.description_en IS 'Link description in English (optional translation)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all columns were created successfully
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  -- Check landing_features columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_features' 
    AND column_name IN ('title_en', 'description_en');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Migration failed: landing_features columns not created (found % of 2)', column_count;
  END IF;

  -- Check landing_languages columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_languages' 
    AND column_name IN ('name_en', 'description_en');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Migration failed: landing_languages columns not created (found % of 2)', column_count;
  END IF;

  -- Check landing_stats columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_stats' 
    AND column_name = 'label_en';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: landing_stats column not created';
  END IF;

  -- Check landing_how_it_works columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'landing_how_it_works' 
    AND column_name IN ('title_en', 'description_en');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Migration failed: landing_how_it_works columns not created (found % of 2)', column_count;
  END IF;

  -- Check navigation_items columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'navigation_items' 
    AND column_name = 'label_en';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: navigation_items column not created';
  END IF;

  -- Check documentation_technologies columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'documentation_technologies' 
    AND column_name = 'name_en';
  
  IF column_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: documentation_technologies column not created';
  END IF;

  -- Check documentation_links columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'documentation_links' 
    AND column_name IN ('title_en', 'description_en');
  
  IF column_count != 2 THEN
    RAISE EXCEPTION 'Migration failed: documentation_links columns not created (found % of 2)', column_count;
  END IF;

  -- Verify indexes were created
  SELECT COUNT(*) INTO column_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_landing_features_title_en',
    'idx_landing_languages_name_en',
    'idx_landing_stats_label_en',
    'idx_landing_how_it_works_title_en',
    'idx_navigation_items_label_en',
    'idx_documentation_technologies_name_en',
    'idx_documentation_links_title_en'
  );

  IF column_count != 7 THEN
    RAISE EXCEPTION 'Migration failed: not all indexes created (found % of 7)', column_count;
  END IF;

  RAISE NOTICE '✓ Migration completed successfully';
  RAISE NOTICE '✓ Added English columns to 7 content tables';
  RAISE NOTICE '✓ Created 7 partial indexes for performance';
  RAISE NOTICE '✓ Added column comments for documentation';
  RAISE NOTICE '✓ All verification checks passed';
END $$;

COMMIT;
