-- Preserve signup trigger writes after anon/authenticated direct table grants are removed.
CREATE OR REPLACE FUNCTION initialize_pvp_user_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO pvp_user_stats(user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION initialize_pvp_user_stats() FROM PUBLIC, anon, authenticated;

-- Existing admin practice operations use this resource type; old constraint omitted it.
ALTER TABLE admin_audit_logs DROP CONSTRAINT IF EXISTS admin_audit_logs_resource_type_check;
ALTER TABLE admin_audit_logs ADD CONSTRAINT admin_audit_logs_resource_type_check
  CHECK (resource_type IN ('lesson', 'chapter', 'test_case', 'import', 'content_item', 'practice_set'));
