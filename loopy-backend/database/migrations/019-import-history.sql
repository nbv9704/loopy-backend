-- Migration 019: Create import history table

-- Create import_history table
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  lessons_count INTEGER DEFAULT 0,
  test_cases_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_history_admin_id ON import_history(admin_id);
CREATE INDEX IF NOT EXISTS idx_import_history_chapter_id ON import_history(chapter_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status);

-- Enable RLS
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view import history
CREATE POLICY import_history_select_policy ON import_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only backend service can insert import history (allow all inserts from authenticated users)
CREATE POLICY import_history_insert_policy ON import_history
  FOR INSERT
  WITH CHECK (admin_id IS NOT NULL);

-- RLS Policy: Prevent updates and deletes
CREATE POLICY import_history_no_update_policy ON import_history
  FOR UPDATE
  USING (FALSE);

CREATE POLICY import_history_no_delete_policy ON import_history
  FOR DELETE
  USING (FALSE);
