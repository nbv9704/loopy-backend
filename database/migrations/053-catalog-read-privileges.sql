-- Public catalogs are read-only for clients; backend service CRUD remains available.
-- Does not alter rows, RLS, policies, owners or historical migrations.
-- Apply through the reviewed migration plan after staging/backup verification.
DO $catalog_privileges$
DECLARE
  v_table text;
  v_columns text;
  v_role text;
  v_privilege text;
  v_relation regclass;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['badges','chapters','languages','learning_paths','path_chapters'] LOOP
    v_relation := to_regclass(format('public.%I',v_table));
    IF v_relation IS NULL OR NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class WHERE oid=v_relation AND relkind='r' AND relrowsecurity
    ) THEN
      RAISE EXCEPTION 'Review missing table or disabled RLS before hardening catalog %',v_table;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polrelid=v_relation AND polcmd<>'r') THEN
      RAISE EXCEPTION 'Review catalog write policies before hardening %',v_table;
    END IF;
    EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.%I FROM PUBLIC,anon,authenticated',v_table);
    SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO v_columns
      FROM pg_catalog.pg_attribute WHERE attrelid=v_relation AND attnum>0 AND NOT attisdropped;
    -- Explicit column ACLs survive table-level REVOKE, so remove their write grants too.
    EXECUTE format('REVOKE INSERT (%1$s),UPDATE (%1$s),REFERENCES (%1$s) ON TABLE public.%2$I FROM PUBLIC,anon,authenticated',v_columns,v_table);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon,authenticated',v_table);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.%I TO service_role',v_table);
    FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF NOT has_table_privilege(v_role,v_relation,'SELECT') THEN
        RAISE EXCEPTION 'Catalog read grant missing for % on %',v_role,v_table;
      END IF;
      FOREACH v_privilege IN ARRAY ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
        IF has_table_privilege(v_role,v_relation,v_privilege) THEN
          RAISE EXCEPTION 'Inherited catalog write privilege needs review: %/%/%',v_role,v_table,v_privilege;
        END IF;
      END LOOP;
      IF EXISTS (SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid=v_relation AND attnum>0 AND NOT attisdropped
        AND (has_column_privilege(v_role,v_relation,attnum,'INSERT')
          OR has_column_privilege(v_role,v_relation,attnum,'UPDATE')
          OR has_column_privilege(v_role,v_relation,attnum,'REFERENCES'))) THEN
        RAISE EXCEPTION 'Catalog column write privilege needs review: %/%',v_role,v_table;
      END IF;
    END LOOP;
  END LOOP;
END;
$catalog_privileges$;
