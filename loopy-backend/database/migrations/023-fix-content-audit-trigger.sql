-- Migration 023: Fix content audit trigger to allow NULL admin_id for seeding

-- Drop existing trigger
DROP TRIGGER IF EXISTS content_items_audit_insert_trigger ON content_items;
DROP TRIGGER IF EXISTS content_items_audit_update_trigger ON content_items;
DROP TRIGGER IF EXISTS content_items_audit_delete_trigger ON content_items;

-- Drop existing function
DROP FUNCTION IF EXISTS log_content_item_changes();

-- Create new trigger function that allows NULL admin_id
CREATE OR REPLACE FUNCTION log_content_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
  v_admin_id UUID;
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
    v_admin_id := NEW.created_by;
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
    v_admin_id := NEW.updated_by;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := jsonb_build_object(
      'key', OLD.key,
      'category_id', OLD.category_id,
      'language', OLD.language
    );
    v_admin_id := OLD.updated_by;
  END IF;

  -- Only insert audit log if admin_id is not null
  -- This allows seeding without audit logs
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      resource_name,
      changes,
      metadata
    ) VALUES (
      v_admin_id,
      v_action,
      'content_item',
      COALESCE(NEW.id, OLD.id),
      COALESCE(NEW.key, OLD.key),
      v_changes,
      jsonb_build_object('category_id', COALESCE(NEW.category_id, OLD.category_id))
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER content_items_audit_insert_trigger
  AFTER INSERT ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

CREATE TRIGGER content_items_audit_update_trigger
  AFTER UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();

CREATE TRIGGER content_items_audit_delete_trigger
  AFTER DELETE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION log_content_item_changes();
