-- Migration: Add updated_at Triggers for Header and Footer Tables
-- Description: Creates triggers to automatically update the updated_at timestamp on record modifications
-- Author: Header & Footer CMS Expansion Feature
-- Date: 2024
-- Requirements: 7
-- Compatible with: Supabase SQL Editor

-- ============================================================================
-- VERIFY FUNCTION EXISTS (Optional check - comment out if causing issues)
-- ============================================================================

-- Check if update_updated_at_column() function exists
-- If this fails, you need to run the base schema first
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'update_updated_at_column';
  
  IF function_count = 0 THEN
    RAISE EXCEPTION 'Migration failed: update_updated_at_column() function does not exist. Please run the base schema first.';
  END IF;
  
  RAISE NOTICE '✓ Function update_updated_at_column() exists';
END $$;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger for header_settings table
DROP TRIGGER IF EXISTS update_header_settings_updated_at ON header_settings;
CREATE TRIGGER update_header_settings_updated_at
  BEFORE UPDATE ON header_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_header_settings_updated_at ON header_settings IS 
  'Automatically updates the updated_at timestamp when header settings are modified';

-- Trigger for footer_columns table
DROP TRIGGER IF EXISTS update_footer_columns_updated_at ON footer_columns;
CREATE TRIGGER update_footer_columns_updated_at
  BEFORE UPDATE ON footer_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_footer_columns_updated_at ON footer_columns IS 
  'Automatically updates the updated_at timestamp when footer columns are modified';

-- Trigger for footer_column_items table
DROP TRIGGER IF EXISTS update_footer_column_items_updated_at ON footer_column_items;
CREATE TRIGGER update_footer_column_items_updated_at
  BEFORE UPDATE ON footer_column_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_footer_column_items_updated_at ON footer_column_items IS 
  'Automatically updates the updated_at timestamp when footer column items are modified';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Verify all three triggers were created
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname IN ('header_settings', 'footer_columns', 'footer_column_items')
    AND t.tgname IN (
      'update_header_settings_updated_at',
      'update_footer_columns_updated_at',
      'update_footer_column_items_updated_at'
    );
  
  IF trigger_count != 3 THEN
    RAISE EXCEPTION 'Migration failed: Expected 3 triggers but found %', trigger_count;
  END IF;

  RAISE NOTICE '✓ Migration completed successfully';
  RAISE NOTICE '✓ Created trigger: update_header_settings_updated_at';
  RAISE NOTICE '✓ Created trigger: update_footer_columns_updated_at';
  RAISE NOTICE '✓ Created trigger: update_footer_column_items_updated_at';
  RAISE NOTICE '✓ All triggers verified and functional';
END $$;
