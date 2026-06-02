-- Migration 025: Fix content_items RLS policy to allow authenticated users to read

-- Drop existing select policy
DROP POLICY IF EXISTS content_items_select_policy ON content_items;

-- Create new select policy that allows:
-- 1. Public (anonymous) users to read
-- 2. Authenticated users to read
CREATE POLICY content_items_select_policy ON content_items
  FOR SELECT
  USING (TRUE);

-- Verify policy is in place
-- SELECT * FROM pg_policies WHERE tablename = 'content_items' AND policyname = 'content_items_select_policy';
