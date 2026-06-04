-- Migration: Restrict user_profiles RLS to authenticated users only
-- Description: Limits public read access to user_profiles so anonymous users cannot scrape them.

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON user_profiles;

-- Create the new, restricted policy
CREATE POLICY "Profiles are viewable by authenticated users" ON user_profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');
