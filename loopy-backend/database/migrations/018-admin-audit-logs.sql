-- Migration 018: Create admin audit logs table

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'publish', 'archive')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item')),
  resource_id UUID,
  resource_name TEXT,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_id ON admin_audit_logs(resource_id);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY admin_audit_logs_select_policy ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policy: Only backend service can insert audit logs
CREATE POLICY admin_audit_logs_insert_policy ON admin_audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Prevent updates and deletes
CREATE POLICY admin_audit_logs_no_update_policy ON admin_audit_logs
  FOR UPDATE
  USING (FALSE);

CREATE POLICY admin_audit_logs_no_delete_policy ON admin_audit_logs
  FOR DELETE
  USING (FALSE);
