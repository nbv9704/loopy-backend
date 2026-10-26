-- CMS edits use a database revision, never a timestamp rounded by JavaScript.
ALTER TABLE content_items ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
CREATE FUNCTION bump_cms_revision() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  NEW.revision := CASE WHEN TG_OP='INSERT' THEN 0 ELSE OLD.revision+1 END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION bump_cms_revision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER cms_item_revision BEFORE INSERT OR UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION bump_cms_revision();

CREATE FUNCTION import_cms_content_atomically(p_actor_id UUID,p_language TEXT,p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  v_item JSONB;
  v_category UUID;
  v_count INTEGER := 0;
BEGIN
  IF p_language IS NULL OR p_language NOT IN ('vi','en') OR jsonb_typeof(p_items) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Invalid CMS import' USING ERRCODE='22023';
  END IF;
  PERFORM id FROM user_profiles WHERE id=p_actor_id AND is_admin=TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
  -- Deterministic ordering and a transfer lock serialize imports, including new category creation.
  PERFORM pg_advisory_xact_lock(hashtext('loopy-cms-import'));
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_items) i GROUP BY i->>'category',i->>'key' HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Duplicate CMS entry' USING ERRCODE='22023';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'category',value->>'key' LOOP
    IF jsonb_typeof(v_item) IS DISTINCT FROM 'object'
      OR jsonb_typeof(v_item->'category') IS DISTINCT FROM 'string'
      OR length(btrim(v_item->>'category')) NOT BETWEEN 1 AND 100
      OR jsonb_typeof(v_item->'key') IS DISTINCT FROM 'string'
      OR length(btrim(v_item->>'key')) NOT BETWEEN 1 AND 255
      OR jsonb_typeof(v_item->'value') IS DISTINCT FROM 'string'
      OR length(v_item->>'value')>5000 OR length(btrim(v_item->>'value'))=0
      OR (v_item ? 'type' AND (jsonb_typeof(v_item->'type') IS DISTINCT FROM 'string' OR v_item->>'type' NOT IN ('text','markdown','html')))
      OR (v_item ? 'description' AND (jsonb_typeof(v_item->'description') NOT IN ('string','null') OR length(v_item->>'description')>2000)) THEN
      RAISE EXCEPTION 'Invalid CMS entry' USING ERRCODE='22023';
    END IF;
    INSERT INTO content_categories(name,description,display_order)
      VALUES(v_item->>'category','Imported content',999) ON CONFLICT(name) DO NOTHING;
    SELECT id INTO STRICT v_category FROM content_categories WHERE name=v_item->>'category';
    INSERT INTO content_items(category_id,key,language,value,type,description,created_by,updated_by)
      VALUES(v_category,v_item->>'key',p_language,v_item->>'value',COALESCE(v_item->>'type','text'),v_item->>'description',p_actor_id,p_actor_id)
      ON CONFLICT(category_id,key,language) DO UPDATE SET value=EXCLUDED.value,updated_by=p_actor_id,
        type=CASE WHEN v_item ? 'type' THEN EXCLUDED.type ELSE content_items.type END,
        description=CASE WHEN v_item ? 'description' THEN EXCLUDED.description ELSE content_items.description END;
    v_count := v_count+1;
  END LOOP;
  RETURN jsonb_build_object('imported',v_count,'language',p_language);
END;
$$;
REVOKE ALL ON FUNCTION import_cms_content_atomically(UUID,TEXT,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION import_cms_content_atomically(UUID,TEXT,JSONB) TO service_role;

-- Preserve previous readiness flags without copying historical function bodies.
ALTER FUNCTION loopy_schema_status() RENAME TO loopy_schema_status_before_cms;
REVOKE ALL ON FUNCTION loopy_schema_status_before_cms() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION loopy_schema_status() RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT loopy_schema_status_before_cms() || jsonb_build_object('cms',
    to_regprocedure('public.import_cms_content_atomically(uuid,text,jsonb)') IS NOT NULL
    AND has_function_privilege('service_role','public.import_cms_content_atomically(uuid,text,jsonb)','EXECUTE')
    AND NOT has_function_privilege('anon','public.import_cms_content_atomically(uuid,text,jsonb)','EXECUTE')
    AND NOT has_function_privilege('authenticated','public.import_cms_content_atomically(uuid,text,jsonb)','EXECUTE')
    AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.content_items'::regclass AND attname='revision' AND attnotnull AND NOT attisdropped)
    AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.content_items'::regclass AND tgname='cms_item_revision' AND tgenabled IN ('O','A')));
$$;
REVOKE ALL ON FUNCTION loopy_schema_status() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION loopy_schema_status() TO service_role;
