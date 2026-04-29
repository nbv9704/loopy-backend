-- Content Management System Schema Migration
-- Run this SQL in Supabase SQL Editor after the main schema.sql

-- ============================================================================
-- CONTENT MANAGEMENT TABLES
-- ============================================================================

-- Documentation Technologies
CREATE TABLE IF NOT EXISTS documentation_technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentation Links
CREATE TABLE IF NOT EXISTS documentation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technology_id UUID NOT NULL REFERENCES documentation_technologies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('docs', 'video', 'article')),
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page Features
CREATE TABLE IF NOT EXISTS landing_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  color_gradient TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page Statistics
CREATE TABLE IF NOT EXISTS landing_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page Languages
CREATE TABLE IF NOT EXISTS landing_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lesson_count INTEGER NOT NULL,
  color TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page How It Works Steps
CREATE TABLE IF NOT EXISTS landing_how_it_works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation Items
CREATE TABLE IF NOT EXISTS navigation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  label_en TEXT,
  parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER PROFILES EXTENSION
-- ============================================================================

-- Add is_admin field to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Documentation Technologies Indexes
CREATE INDEX IF NOT EXISTS idx_doc_tech_display_order ON documentation_technologies(display_order);
CREATE INDEX IF NOT EXISTS idx_doc_tech_status ON documentation_technologies(status);
CREATE INDEX IF NOT EXISTS idx_doc_tech_category ON documentation_technologies(category);

-- Documentation Links Indexes
CREATE INDEX IF NOT EXISTS idx_doc_links_tech ON documentation_links(technology_id);
CREATE INDEX IF NOT EXISTS idx_doc_links_display_order ON documentation_links(display_order);

-- Landing Features Indexes
CREATE INDEX IF NOT EXISTS idx_landing_features_display_order ON landing_features(display_order);
CREATE INDEX IF NOT EXISTS idx_landing_features_status ON landing_features(status);

-- Landing Stats Indexes
CREATE INDEX IF NOT EXISTS idx_landing_stats_display_order ON landing_stats(display_order);
CREATE INDEX IF NOT EXISTS idx_landing_stats_status ON landing_stats(status);

-- Landing Languages Indexes
CREATE INDEX IF NOT EXISTS idx_landing_languages_display_order ON landing_languages(display_order);
CREATE INDEX IF NOT EXISTS idx_landing_languages_status ON landing_languages(status);

-- Landing How It Works Indexes
CREATE INDEX IF NOT EXISTS idx_how_it_works_display_order ON landing_how_it_works(display_order);
CREATE INDEX IF NOT EXISTS idx_how_it_works_status ON landing_how_it_works(status);

-- Navigation Items Indexes
CREATE INDEX IF NOT EXISTS idx_nav_items_location ON navigation_items(location);
CREATE INDEX IF NOT EXISTS idx_nav_items_display_order ON navigation_items(display_order);
CREATE INDEX IF NOT EXISTS idx_nav_items_status ON navigation_items(status);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- User Profiles Admin Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON user_profiles(is_admin);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_documentation_technologies_updated_at ON documentation_technologies;
DROP TRIGGER IF EXISTS update_documentation_links_updated_at ON documentation_links;
DROP TRIGGER IF EXISTS update_landing_features_updated_at ON landing_features;
DROP TRIGGER IF EXISTS update_landing_stats_updated_at ON landing_stats;
DROP TRIGGER IF EXISTS update_landing_languages_updated_at ON landing_languages;
DROP TRIGGER IF EXISTS update_landing_how_it_works_updated_at ON landing_how_it_works;
DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON navigation_items;

-- Documentation Technologies
CREATE TRIGGER update_documentation_technologies_updated_at
  BEFORE UPDATE ON documentation_technologies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Documentation Links
CREATE TRIGGER update_documentation_links_updated_at
  BEFORE UPDATE ON documentation_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Landing Features
CREATE TRIGGER update_landing_features_updated_at
  BEFORE UPDATE ON landing_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Landing Stats
CREATE TRIGGER update_landing_stats_updated_at
  BEFORE UPDATE ON landing_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Landing Languages
CREATE TRIGGER update_landing_languages_updated_at
  BEFORE UPDATE ON landing_languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Landing How It Works
CREATE TRIGGER update_landing_how_it_works_updated_at
  BEFORE UPDATE ON landing_how_it_works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Navigation Items
CREATE TRIGGER update_navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all content tables
ALTER TABLE documentation_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_how_it_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Documentation technologies are viewable by everyone" ON documentation_technologies;
DROP POLICY IF EXISTS "Documentation links are viewable by everyone" ON documentation_links;
DROP POLICY IF EXISTS "Landing features are viewable by everyone" ON landing_features;
DROP POLICY IF EXISTS "Landing stats are viewable by everyone" ON landing_stats;
DROP POLICY IF EXISTS "Landing languages are viewable by everyone" ON landing_languages;
DROP POLICY IF EXISTS "Landing how it works are viewable by everyone" ON landing_how_it_works;
DROP POLICY IF EXISTS "Navigation items are viewable by everyone" ON navigation_items;

DROP POLICY IF EXISTS "Admins can insert documentation technologies" ON documentation_technologies;
DROP POLICY IF EXISTS "Admins can update documentation technologies" ON documentation_technologies;
DROP POLICY IF EXISTS "Admins can delete documentation technologies" ON documentation_technologies;

DROP POLICY IF EXISTS "Admins can insert documentation links" ON documentation_links;
DROP POLICY IF EXISTS "Admins can update documentation links" ON documentation_links;
DROP POLICY IF EXISTS "Admins can delete documentation links" ON documentation_links;

DROP POLICY IF EXISTS "Admins can insert landing features" ON landing_features;
DROP POLICY IF EXISTS "Admins can update landing features" ON landing_features;
DROP POLICY IF EXISTS "Admins can delete landing features" ON landing_features;

DROP POLICY IF EXISTS "Admins can insert landing stats" ON landing_stats;
DROP POLICY IF EXISTS "Admins can update landing stats" ON landing_stats;
DROP POLICY IF EXISTS "Admins can delete landing stats" ON landing_stats;

DROP POLICY IF EXISTS "Admins can insert landing languages" ON landing_languages;
DROP POLICY IF EXISTS "Admins can update landing languages" ON landing_languages;
DROP POLICY IF EXISTS "Admins can delete landing languages" ON landing_languages;

DROP POLICY IF EXISTS "Admins can insert landing how it works" ON landing_how_it_works;
DROP POLICY IF EXISTS "Admins can update landing how it works" ON landing_how_it_works;
DROP POLICY IF EXISTS "Admins can delete landing how it works" ON landing_how_it_works;

DROP POLICY IF EXISTS "Admins can insert navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Admins can update navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Admins can delete navigation items" ON navigation_items;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;

-- Public Read Policies (all users can read published content)
CREATE POLICY "Documentation technologies are viewable by everyone"
  ON documentation_technologies FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Documentation links are viewable by everyone"
  ON documentation_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documentation_technologies 
    WHERE id = documentation_links.technology_id 
    AND (status = 'published' OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    ))
  ));

CREATE POLICY "Landing features are viewable by everyone"
  ON landing_features FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Landing stats are viewable by everyone"
  ON landing_stats FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Landing languages are viewable by everyone"
  ON landing_languages FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Landing how it works are viewable by everyone"
  ON landing_how_it_works FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Navigation items are viewable by everyone"
  ON navigation_items FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Admin Write Policies (only admins can insert, update, delete)
CREATE POLICY "Admins can insert documentation technologies"
  ON documentation_technologies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update documentation technologies"
  ON documentation_technologies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete documentation technologies"
  ON documentation_technologies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert documentation links"
  ON documentation_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update documentation links"
  ON documentation_links FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete documentation links"
  ON documentation_links FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert landing features"
  ON landing_features FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update landing features"
  ON landing_features FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete landing features"
  ON landing_features FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert landing stats"
  ON landing_stats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update landing stats"
  ON landing_stats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete landing stats"
  ON landing_stats FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert landing languages"
  ON landing_languages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update landing languages"
  ON landing_languages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete landing languages"
  ON landing_languages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert landing how it works"
  ON landing_how_it_works FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update landing how it works"
  ON landing_how_it_works FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete landing how it works"
  ON landing_how_it_works FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert navigation items"
  ON navigation_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update navigation items"
  ON navigation_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can delete navigation items"
  ON navigation_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Audit Logs Policies (only admins can view)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE documentation_technologies IS 'Programming technologies and frameworks with documentation resources';
COMMENT ON TABLE documentation_links IS 'Documentation links for each technology';
COMMENT ON TABLE landing_features IS 'Features displayed on the landing page';
COMMENT ON TABLE landing_stats IS 'Statistics displayed on the landing page';
COMMENT ON TABLE landing_languages IS 'Programming languages showcased on the landing page';
COMMENT ON TABLE landing_how_it_works IS 'How-it-works steps displayed on the landing page';
COMMENT ON TABLE navigation_items IS 'Navigation menu items for header and footer';
COMMENT ON TABLE audit_logs IS 'Audit trail of all content management actions';
COMMENT ON COLUMN user_profiles.is_admin IS 'Flag indicating if user has admin privileges';

-- ============================================================================
-- GRANT ADMIN PRIVILEGES TO FIRST USER (OPTIONAL)
-- ============================================================================

-- Uncomment and replace with your user ID to grant admin access
UPDATE user_profiles SET is_admin = true WHERE id = 'be7b8f24-881d-4037-ac2d-8ad25d970913';

