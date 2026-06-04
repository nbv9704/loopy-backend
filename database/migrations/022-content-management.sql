-- Migration 022: Create content management tables (content_categories and content_items)

-- Create content_categories table
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_items table
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES content_categories(id) ON DELETE RESTRICT,
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en')),
  value TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'markdown', 'html')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, key, language)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_items_category_id ON content_items(category_id);
CREATE INDEX IF NOT EXISTS idx_content_items_key ON content_items(key);
CREATE INDEX IF NOT EXISTS idx_content_items_language ON content_items(language);
CREATE INDEX IF NOT EXISTS idx_content_items_category_language ON content_items(category_id, language);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_updated_at ON content_items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_categories_display_order ON content_categories(display_order);

-- Add comments explaining the structure
COMMENT ON TABLE content_categories IS 'Categories for organizing content items (header, footer, landing, etc.)';
COMMENT ON TABLE content_items IS 'Content items managed by CMS (text, markdown, html)';
COMMENT ON COLUMN content_items.key IS 'Unique key for content item (e.g., nav.learn, landing.hero.title)';
COMMENT ON COLUMN content_items.language IS 'Language of content item (vi, en)';
COMMENT ON COLUMN content_items.value IS 'Actual content text/markdown/html';
COMMENT ON COLUMN content_items.type IS 'Type of content (text, markdown, html)';
COMMENT ON COLUMN content_items.created_by IS 'Admin user who created this item';
COMMENT ON COLUMN content_items.updated_by IS 'Admin user who last updated this item';

-- Enable RLS
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_categories

-- Policy: Public can read all categories
CREATE POLICY content_categories_select_policy ON content_categories
  FOR SELECT
  USING (TRUE);

-- Policy: Only admins can insert categories
CREATE POLICY content_categories_insert_policy ON content_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can update categories
CREATE POLICY content_categories_update_policy ON content_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can delete categories
CREATE POLICY content_categories_delete_policy ON content_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for content_items

-- Policy: Public can read all content items
CREATE POLICY content_items_select_policy ON content_items
  FOR SELECT
  USING (TRUE);

-- Policy: Only admins can insert content items
CREATE POLICY content_items_insert_policy ON content_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can update content items
CREATE POLICY content_items_update_policy ON content_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: Only admins can delete content items
CREATE POLICY content_items_delete_policy ON content_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create trigger function for audit logging on content_items
CREATE OR REPLACE FUNCTION log_content_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := jsonb_build_object(
      'key', NEW.key,
      'category_id', NEW.category_id,
      'language', NEW.language,
      'value', NEW.value,
      'type', NEW.type
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object(
        'value', OLD.value,
        'description', OLD.description,
        'type', OLD.type
      ),
      'new', jsonb_build_object(
        'value', NEW.value,
        'description', NEW.description,
        'type', NEW.type
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := jsonb_build_object(
      'key', OLD.key,
      'category_id', OLD.category_id,
      'language', OLD.language
    );
  END IF;

  -- Insert audit log
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    resource_name,
    changes,
    metadata
  ) VALUES (
    COALESCE(NEW.updated_by, OLD.updated_by, auth.uid()),
    v_action,
    'content_item',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.key, OLD.key),
    v_changes,
    jsonb_build_object('category_id', COALESCE(NEW.category_id, OLD.category_id))
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS content_items_audit_insert_trigger ON content_items;
CREATE TRIGGER content_items_audit_insert_trigger
  AFTER INSERT ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

DROP TRIGGER IF EXISTS content_items_audit_update_trigger ON content_items;
CREATE TRIGGER content_items_audit_update_trigger
  AFTER UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

DROP TRIGGER IF EXISTS content_items_audit_delete_trigger ON content_items;
CREATE TRIGGER content_items_audit_delete_trigger
  AFTER DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS content_items_update_timestamp_trigger ON content_items;
CREATE TRIGGER content_items_update_timestamp_trigger
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

-- Create trigger function to update updated_at timestamp for categories
CREATE OR REPLACE FUNCTION update_content_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on categories
DROP TRIGGER IF EXISTS content_categories_update_timestamp_trigger ON content_categories;
CREATE TRIGGER content_categories_update_timestamp_trigger
  BEFORE UPDATE ON content_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_content_categories_updated_at();

-- Insert default content categories
INSERT INTO content_categories (name, description, display_order) VALUES
  ('header', 'Header navigation content', 1),
  ('footer', 'Footer content', 2),
  ('landing', 'Landing page content', 3),
  ('languages', 'Languages page content', 4),
  ('library', 'Library page content', 5),
  ('learn', 'Learn page content', 6),
  ('playground', 'Playground page content', 7),
  ('docs', 'Documentation page content', 8),
  ('onboarding', 'Onboarding page content', 9),
  ('settings', 'Settings page content', 10),
  ('pvp', 'PvP pages content', 11)
ON CONFLICT (name) DO NOTHING;
