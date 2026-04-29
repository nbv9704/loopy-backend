-- Test Script: Verify updated_at Triggers for Header and Footer Tables
-- Description: Tests that the updated_at triggers automatically update timestamps on modifications
-- Author: Header & Footer CMS Expansion Feature
-- Date: 2024
-- Requirements: 7

BEGIN;

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Create temporary test data
DO $
DECLARE
  test_header_id UUID;
  test_column_id UUID;
  test_item_id UUID;
  initial_updated_at TIMESTAMPTZ;
  new_updated_at TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Testing updated_at Triggers';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 1: header_settings trigger
  -- ============================================================================
  
  RAISE NOTICE 'TEST 1: header_settings updated_at trigger';
  
  -- Insert test header settings
  INSERT INTO header_settings (logo_url, logo_alt_text, logo_alt_text_en)
  VALUES ('/test-logo.png', 'Test Logo', 'Test Logo EN')
  RETURNING id, updated_at INTO test_header_id, initial_updated_at;
  
  RAISE NOTICE '  ✓ Created header_settings record with id: %', test_header_id;
  RAISE NOTICE '  ✓ Initial updated_at: %', initial_updated_at;
  
  -- Wait a moment to ensure timestamp difference
  PERFORM pg_sleep(0.1);
  
  -- Update the header settings
  UPDATE header_settings
  SET logo_alt_text = 'Updated Logo'
  WHERE id = test_header_id
  RETURNING updated_at INTO new_updated_at;
  
  RAISE NOTICE '  ✓ Updated header_settings record';
  RAISE NOTICE '  ✓ New updated_at: %', new_updated_at;
  
  -- Verify the timestamp was updated
  IF new_updated_at > initial_updated_at THEN
    RAISE NOTICE '  ✓ TEST 1 PASSED: updated_at timestamp was automatically updated';
  ELSE
    RAISE EXCEPTION 'TEST 1 FAILED: updated_at timestamp was not updated (initial: %, new: %)', 
      initial_updated_at, new_updated_at;
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 2: footer_columns trigger
  -- ============================================================================
  
  RAISE NOTICE 'TEST 2: footer_columns updated_at trigger';
  
  -- Insert test footer column
  INSERT INTO footer_columns (title, title_en, column_type, display_order)
  VALUES ('Test Column', 'Test Column EN', 'company_links', 1)
  RETURNING id, updated_at INTO test_column_id, initial_updated_at;
  
  RAISE NOTICE '  ✓ Created footer_columns record with id: %', test_column_id;
  RAISE NOTICE '  ✓ Initial updated_at: %', initial_updated_at;
  
  -- Wait a moment to ensure timestamp difference
  PERFORM pg_sleep(0.1);
  
  -- Update the footer column
  UPDATE footer_columns
  SET title = 'Updated Column'
  WHERE id = test_column_id
  RETURNING updated_at INTO new_updated_at;
  
  RAISE NOTICE '  ✓ Updated footer_columns record';
  RAISE NOTICE '  ✓ New updated_at: %', new_updated_at;
  
  -- Verify the timestamp was updated
  IF new_updated_at > initial_updated_at THEN
    RAISE NOTICE '  ✓ TEST 2 PASSED: updated_at timestamp was automatically updated';
  ELSE
    RAISE EXCEPTION 'TEST 2 FAILED: updated_at timestamp was not updated (initial: %, new: %)', 
      initial_updated_at, new_updated_at;
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 3: footer_column_items trigger
  -- ============================================================================
  
  RAISE NOTICE 'TEST 3: footer_column_items updated_at trigger';
  
  -- Insert test footer column item
  INSERT INTO footer_column_items (column_id, item_type, content_data, display_order)
  VALUES (
    test_column_id,
    'navigation_link',
    '{"label": "Test Link", "label_en": "Test Link EN", "path": "/test"}'::jsonb,
    1
  )
  RETURNING id, updated_at INTO test_item_id, initial_updated_at;
  
  RAISE NOTICE '  ✓ Created footer_column_items record with id: %', test_item_id;
  RAISE NOTICE '  ✓ Initial updated_at: %', initial_updated_at;
  
  -- Wait a moment to ensure timestamp difference
  PERFORM pg_sleep(0.1);
  
  -- Update the footer column item
  UPDATE footer_column_items
  SET content_data = '{"label": "Updated Link", "label_en": "Updated Link EN", "path": "/updated"}'::jsonb
  WHERE id = test_item_id
  RETURNING updated_at INTO new_updated_at;
  
  RAISE NOTICE '  ✓ Updated footer_column_items record';
  RAISE NOTICE '  ✓ New updated_at: %', new_updated_at;
  
  -- Verify the timestamp was updated
  IF new_updated_at > initial_updated_at THEN
    RAISE NOTICE '  ✓ TEST 3 PASSED: updated_at timestamp was automatically updated';
  ELSE
    RAISE EXCEPTION 'TEST 3 FAILED: updated_at timestamp was not updated (initial: %, new: %)', 
      initial_updated_at, new_updated_at;
  END IF;
  
  RAISE NOTICE '';

  -- ============================================================================
  -- CLEANUP
  -- ============================================================================
  
  RAISE NOTICE 'Cleaning up test data...';
  
  -- Delete test data (cascade will handle footer_column_items)
  DELETE FROM header_settings WHERE id = test_header_id;
  DELETE FROM footer_columns WHERE id = test_column_id;
  
  RAISE NOTICE '  ✓ Test data cleaned up';
  RAISE NOTICE '';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All Tests Passed Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ header_settings trigger working correctly';
  RAISE NOTICE '✓ footer_columns trigger working correctly';
  RAISE NOTICE '✓ footer_column_items trigger working correctly';
  RAISE NOTICE '';
  
END $;

ROLLBACK;
