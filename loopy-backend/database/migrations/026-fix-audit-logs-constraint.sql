-- Migration 026: Fix admin_audit_logs resource_type constraint to include content_item

-- Drop the old constraint
ALTER TABLE admin_audit_logs
DROP CONSTRAINT IF EXISTS admin_audit_logs_resource_type_check;

-- Add the new constraint with content_item included
ALTER TABLE admin_audit_logs
ADD CONSTRAINT admin_audit_logs_resource_type_check 
CHECK (resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item'));
