-- Migration: Add Header and Footer CMS Tables
-- Description: Creates tables for header logo management and footer column structure
-- Author: Header & Footer CMS Expansion Feature
-- Date: 2024
-- Requirements: 7

BEGIN;

-- ============================================================================
-- ENABLE UUID EXTENSION (if not already enabled)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HEADER SETTINGS TABLE
-- ============================================================================

-- Create header_settings table (singleton table for header configuration)
CREATE TABLE IF NOT EXISTS header_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url TEXT,
  logo_alt_text TEXT,
  logo_alt_text_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add column comments for documentation
COMMENT ON TABLE header_settings IS 'Singleton table storing header configuration including logo and alt text';
COMMENT ON COLUMN header_settings.logo_url IS 'Public URL of the uploaded logo image';
COMMENT ON COLUMN header_settings.logo_alt_text IS 'Logo alt text in Vietnamese (for accessibility)';
COMMENT ON COLUMN header_settings.logo_alt_text_en IS 'Logo alt text in English (optional translation)';

-- ============================================================================
-- FOOTER COLUMNS TABLE
-- ============================================================================

-- Create footer_columns table
CREATE TABLE IF NOT EXISTS footer_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_en TEXT,
  column_type TEXT NOT NULL CHECK (column_type IN ('company_links', 'brand_identity')),
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_footer_columns_display_order 
  ON footer_columns(display_order);

CREATE INDEX IF NOT EXISTS idx_footer_columns_status 
  ON footer_columns(status);

-- Add column comments for documentation
COMMENT ON TABLE footer_columns IS 'Footer column structure with configurable column types';
COMMENT ON COLUMN footer_columns.title IS 'Column title in Vietnamese (default language)';
COMMENT ON COLUMN footer_columns.title_en IS 'Column title in English (optional translation)';
COMMENT ON COLUMN footer_columns.column_type IS 'Type of column content: company_links or brand_identity';
COMMENT ON COLUMN footer_columns.display_order IS 'Display order for column positioning (lower numbers appear first)';
COMMENT ON COLUMN footer_columns.status IS 'Publication status: draft or published';

-- ============================================================================
-- FOOTER COLUMN ITEMS TABLE
-- ============================================================================

-- Create footer_column_items table (polymorphic content storage)
CREATE TABLE IF NOT EXISTS footer_column_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID NOT NULL REFERENCES footer_columns(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('navigation_link', 'brand_content')),
  content_data JSONB NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_footer_column_items_column 
  ON footer_column_items(column_id);

CREATE INDEX IF NOT EXISTS idx_footer_column_items_display_order 
  ON footer_column_items(display_order);

-- Add column comments for documentation
COMMENT ON TABLE footer_column_items IS 'Items within footer columns with polymorphic content storage';
COMMENT ON COLUMN footer_column_items.column_id IS 'Foreign key to parent footer column (CASCADE delete)';
COMMENT ON COLUMN footer_column_items.item_type IS 'Type of item: navigation_link or brand_content';
COMMENT ON COLUMN footer_column_items.content_data IS 'JSONB field storing polymorphic content based on item_type';
COMMENT ON COLUMN footer_column_items.display_order IS 'Display order within the column (lower numbers appear first)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  column_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify header_settings table exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'header_settings';
  
  IF table_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: header_settings table not created';
  END IF;

  -- Verify footer_columns table exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'footer_columns';
  
  IF table_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: footer_columns table not created';
  END IF;

  -- Verify footer_column_items table exists
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'footer_column_items';
  
  IF table_count != 1 THEN
    RAISE EXCEPTION 'Migration failed: footer_column_items table not created';
  END IF;

  -- Verify header_settings columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'header_settings'
    AND column_name IN ('id', 'logo_url', 'logo_alt_text', 'logo_alt_text_en', 'created_at', 'updated_at');
  
  IF column_count != 6 THEN
    RAISE EXCEPTION 'Migration failed: header_settings columns not created (found % of 6)', column_count;
  END IF;

  -- Verify footer_columns columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'footer_columns'
    AND column_name IN ('id', 'title', 'title_en', 'column_type', 'display_order', 'status', 'created_at', 'updated_at');
  
  IF column_count != 8 THEN
    RAISE EXCEPTION 'Migration failed: footer_columns columns not created (found % of 8)', column_count;
  END IF;

  -- Verify footer_column_items columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'footer_column_items'
    AND column_name IN ('id', 'column_id', 'item_type', 'content_data', 'display_order', 'created_at', 'updated_at');
  
  IF column_count != 7 THEN
    RAISE EXCEPTION 'Migration failed: footer_column_items columns not created (found % of 7)', column_count;
  END IF;

  -- Verify indexes were created
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_footer_columns_display_order',
      'idx_footer_columns_status',
      'idx_footer_column_items_column',
      'idx_footer_column_items_display_order'
    );

  IF index_count != 4 THEN
    RAISE EXCEPTION 'Migration failed: not all indexes created (found % of 4)', index_count;
  END IF;

  -- Verify foreign key constraint exists
  SELECT COUNT(*) INTO column_count
  FROM information_schema.table_constraints
  WHERE table_name = 'footer_column_items'
    AND constraint_type = 'FOREIGN KEY';

  IF column_count < 1 THEN
    RAISE EXCEPTION 'Migration failed: foreign key constraint not created on footer_column_items';
  END IF;

  -- Verify CHECK constraints exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.check_constraints
  WHERE constraint_name LIKE '%column_type%'
    OR constraint_name LIKE '%status%'
    OR constraint_name LIKE '%item_type%';

  IF column_count < 3 THEN
    RAISE EXCEPTION 'Migration failed: CHECK constraints not created (found % of 3)', column_count;
  END IF;

  RAISE NOTICE '✓ Migration completed successfully';
  RAISE NOTICE '✓ Created header_settings table with 6 columns';
  RAISE NOTICE '✓ Created footer_columns table with 8 columns';
  RAISE NOTICE '✓ Created footer_column_items table with 7 columns';
  RAISE NOTICE '✓ Created 4 indexes for performance optimization';
  RAISE NOTICE '✓ Added foreign key constraint with CASCADE delete';
  RAISE NOTICE '✓ Added CHECK constraints for column_type, status, and item_type';
  RAISE NOTICE '✓ All verification checks passed';
END $$;

COMMIT;
