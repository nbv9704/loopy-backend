-- Catalog metadata only. Run inside a READ ONLY transaction; never executes application RPCs.
WITH target_roles AS (
  SELECT oid, rolname, rolbypassrls FROM pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
), relations AS (
  SELECT c.* FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S')
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass
      AND d.objid=c.oid AND d.deptype='e')
), functions AS (
  SELECT p.* FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind='f'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass
      AND d.objid=p.oid AND d.deptype='e')
), objects AS (
  SELECT 'role' AS kind, rolname::text AS key,
    jsonb_build_object('bypass_rls',rolbypassrls) AS shape FROM target_roles
  UNION ALL
  SELECT 'table', 'public.'||c.relname,
    jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
      'grants',(SELECT jsonb_object_agg(r.rolname,jsonb_build_object(
        'select',has_table_privilege(r.oid,c.oid,'SELECT'),
        'insert',has_table_privilege(r.oid,c.oid,'INSERT'),
        'update',has_table_privilege(r.oid,c.oid,'UPDATE'),
        'delete',has_table_privilege(r.oid,c.oid,'DELETE'),
        'truncate',has_table_privilege(r.oid,c.oid,'TRUNCATE'),
        'references',has_table_privilege(r.oid,c.oid,'REFERENCES'),
        'trigger',has_table_privilege(r.oid,c.oid,'TRIGGER'))) FROM target_roles r))
  FROM relations c WHERE c.relkind IN ('r','p','v','m')
  UNION ALL
  SELECT 'column', 'public.'||c.relname||'.'||a.attname,
    jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,
      'identity',a.attidentity,'generated',a.attgenerated,
      'default_hash',md5(pg_get_expr(d.adbin,d.adrelid)),
      'grants',(SELECT jsonb_object_agg(r.rolname,jsonb_build_object(
        'select',has_column_privilege(r.oid,c.oid,a.attnum,'SELECT'),
        'insert',has_column_privilege(r.oid,c.oid,a.attnum,'INSERT'),
        'update',has_column_privilege(r.oid,c.oid,a.attnum,'UPDATE'),
        'references',has_column_privilege(r.oid,c.oid,a.attnum,'REFERENCES'))) FROM target_roles r))
  FROM relations c JOIN pg_attribute a ON a.attrelid=c.oid
  LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
  WHERE c.relkind IN ('r','p','v','m') AND a.attnum>0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'function', 'public.'||p.proname||'('||oidvectortypes(p.proargtypes)||')',
    jsonb_build_object('returns',pg_get_function_result(p.oid),'arguments',pg_get_function_identity_arguments(p.oid),
      'owner',pg_get_userbyid(p.proowner),'language',l.lanname,'security_definer',p.prosecdef,'strict',p.proisstrict,'volatility',p.provolatile,
      'body_hash',md5(p.prosrc),'defaults_hash',md5(pg_get_expr(p.proargdefaults,0)),
      'settings',COALESCE((SELECT jsonb_agg(v ORDER BY v) FROM unnest(p.proconfig) v),'[]'::jsonb),
      'execute',(SELECT jsonb_object_agg(r.rolname,has_function_privilege(r.oid,p.oid,'EXECUTE')) FROM target_roles r))
  FROM functions p JOIN pg_language l ON l.oid=p.prolang
  UNION ALL
  SELECT 'trigger', n.nspname||'.'||c.relname||'.'||t.tgname,
    jsonb_build_object('enabled',t.tgenabled,'definition_hash',md5(pg_get_triggerdef(t.oid,true)))
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid
    JOIN pg_namespace pn ON pn.oid=p.pronamespace
  WHERE NOT t.tgisinternal AND (c.oid IN (SELECT oid FROM relations)
    OR (n.nspname='auth' AND c.relname='users' AND pn.nspname='public'))
  UNION ALL
  SELECT 'constraint', 'public.'||c.relname||'.'||con.conname,
    jsonb_build_object('type',con.contype,'validated',con.convalidated,
      'deferrable',con.condeferrable,'deferred',con.condeferred,
      'definition_hash',md5(pg_get_constraintdef(con.oid,true)))
  -- PG18 exposes NOT NULL as constraints; use attnotnull above for cross-version comparison.
  FROM pg_constraint con JOIN relations c ON c.oid=con.conrelid WHERE con.contype<>'n'
  UNION ALL
  SELECT 'index', 'public.'||i.relname,
    jsonb_build_object('table','public.'||c.relname,'valid',x.indisvalid,'ready',x.indisready,
      'definition_hash',md5(pg_get_indexdef(i.oid)))
  FROM pg_index x JOIN relations c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid
  UNION ALL
  SELECT 'policy', 'public.'||c.relname||'.'||p.polname,
    jsonb_build_object('command',p.polcmd,'permissive',p.polpermissive,
      'roles',(SELECT jsonb_agg(CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_get_userbyid(r)::text END
          ORDER BY CASE WHEN r=0 THEN 'PUBLIC' ELSE pg_get_userbyid(r)::text END)
        FROM unnest(p.polroles) r),
      'using_hash',md5(pg_get_expr(p.polqual,p.polrelid)),
      'check_hash',md5(pg_get_expr(p.polwithcheck,p.polrelid)))
  FROM pg_policy p JOIN relations c ON c.oid=p.polrelid
  UNION ALL
  SELECT 'sequence', 'public.'||c.relname,
    jsonb_build_object('type',format_type(s.seqtypid,NULL),'increment',s.seqincrement::text,
      'min',s.seqmin::text,'max',s.seqmax::text,'cycle',s.seqcycle,
      'grants',(SELECT jsonb_object_agg(r.rolname,jsonb_build_object(
        'usage',has_sequence_privilege(r.oid,c.oid,'USAGE'),
        'select',has_sequence_privilege(r.oid,c.oid,'SELECT'),
        'update',has_sequence_privilege(r.oid,c.oid,'UPDATE'))) FROM target_roles r))
  FROM pg_sequence s JOIN relations c ON c.oid=s.seqrelid
), inventory AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('kind',kind,'key',key,'shape',shape) ORDER BY kind,key),'[]'::jsonb) AS objects
  FROM objects WHERE key<>'public.loopy_schema_migrations'
    AND left(key,length('public.loopy_schema_migrations.'))<>'public.loopy_schema_migrations.'
    AND NOT (kind='index' AND shape->>'table'='public.loopy_schema_migrations')
)
SELECT objects,md5(objects::text||':'||current_setting('server_version_num')) AS fingerprint,
  current_setting('server_version_num') AS "serverVersion" FROM inventory;
