-- Migration 013: Fix RLS for test cases
-- Reason: Prevent public APIs from leaking hidden test case metadata to unauthenticated users.

-- 1. Drop the old policy
DROP POLICY IF EXISTS "Public read for test cases" ON lesson_test_cases;

-- 2. Create the new policy that filters out hidden test cases
CREATE POLICY "Public read for test cases" ON lesson_test_cases 
FOR SELECT USING (is_hidden = false);
