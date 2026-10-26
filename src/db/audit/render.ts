import { Migration } from '../migrations'
import { inventorySql } from './inventory'
import { AuditReport } from './model'
import { schemaCapabilities } from '../schema-capabilities'

const literal = (value: string) => `'${value.replace(/'/g, "''")}'`
const cell = (value: string) => value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')

export function renderReport(report: AuditReport): string {
  return [
    '# Loopy database audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '**Read-only catalog audit. No application rows or credentials are included. No SQL was applied.**',
    '',
    `Fingerprint: \`${report.fingerprint}\``,
    `PostgreSQL server_version_num: expected fixture ${report.serverVersions.expected}; actual ${report.serverVersions.actual}`,
    `Absent optional legacy tables (not created by this proposal): ${report.optionalTablesAbsent.join(', ') || 'none'}`,
    `Ledger: ${report.ledger === null ? 'absent; migration history cannot be inferred from object presence' : `${report.ledger.length} entries`}`,
    `Expected/actual objects: ${report.totals.expected}/${report.totals.actual}`,
    `Matching: ${report.totals.matching}; missing: ${report.totals.missing}; different: ${report.totals.different}; extra: ${report.totals.extra}`,
    '',
    '## SQL proposal',
    '',
    report.blockers.length
      ? '**BLOCKED:** reconcile the findings below before executing the proposed migrations.'
      : 'Review the proposed SQL, test on a production clone, and confirm a recoverable backup before approval.',
    'The SQL is a review draft with an execution gate, a catalog fingerprint guard and a ledger guard. It is never executed by this command.',
    'It contains only pending allowlisted migration sources, in dependency order; it does not invent row conversions or mark old migrations as applied. Baseline-origin defaults, grants and custom-policy differences may remain: different does not automatically mean broken.',
    '',
    ...report.pending.map(name => `- ${name}`),
    '',
    '## Blocking review',
    '',
    ...(report.blockers.length
      ? report.blockers.map(message => `- ${cell(message)}`)
      : ['None detected by these structural checks. This is not production approval.']),
    '',
    '## Differences',
    '',
    '| Status | Kind | Object | Fields | Source migration |',
    '| --- | --- | --- | --- | --- |',
    ...report.findings.map(
      item =>
        `| ${item.status} | ${item.kind} | ${cell(item.key)} | ${item.changedFields.map(key => `${key} → ${item.fieldMigrations?.[key] ?? item.migration}`).join(', ')} | ${item.migration ?? 'not in contract'} |`
    ),
    '',
    '## Limits and rollout',
    '',
    '- Expected schema comes from the empty development baseline plus the reviewed forward plan, in disposable PostgreSQL. It is not a production clone.',
    '- Definition/default/policy bodies are represented by hashes; PostgreSQL version/deparser differences can require manual review.',
    '- Exact function argument identities, return types, body/settings, SECURITY DEFINER, effective role grants, column grants, RLS, policies, triggers, constraints, indexes and sequence structure are compared.',
    '- Extra objects are reported, never deleted. Equivalent legacy defaults/index names/custom policies may need an explicit forward patch.',
    '- No user data, constraint data validation, function execution, backups, Auth/PostgREST integration, external clients or deployment compatibility were verified.',
    '- Migration 043 changes direct Data API access; 048/049 require PvP coordination; 050 requires Learn/schema/client coordination; 052 requires CMS coordination.',
    '- Refresh this audit after any schema or ledger change. Review backup/staging/grants and reload PostgREST after the actual rollout.',
    '',
  ].join('\n')
}

export function renderUpgradeSql(report: AuditReport, plan: Migration[]): string {
  const selected = plan.filter(item => report.pending.includes(item.name))
  const blockers = report.blockers.length
    ? `RAISE EXCEPTION 'Audit has unresolved blockers. Reconcile schema and generate a new audit before applying.';`
    : ''
  const ledgerGuard =
    report.ledger === null
      ? "IF to_regclass('public.loopy_schema_migrations') IS NOT NULL THEN RAISE EXCEPTION 'Migration ledger changed; audit again'; END IF;"
      : `IF to_regclass('public.loopy_schema_migrations') IS NULL THEN RAISE EXCEPTION 'Migration ledger changed; audit again'; END IF;
       SELECT COALESCE(jsonb_agg(jsonb_build_object('name',name,'checksum',checksum) ORDER BY name),'[]'::jsonb)
       INTO found_ledger FROM public.loopy_schema_migrations;
       IF found_ledger IS DISTINCT FROM ${literal(JSON.stringify(report.ledger))}::jsonb THEN RAISE EXCEPTION 'Migration ledger changed; audit again'; END IF;`
  return [
    '-- REVIEW DRAFT. Generated locally; NOT executed. Do not run against production before staging/backup/client review.',
    '-- This file is intentionally gated. Never remove a blocker by marking migrations as applied.',
    'BEGIN;',
    "SET LOCAL lock_timeout='5s';",
    "SET LOCAL statement_timeout='60s';",
    'SET LOCAL search_path=pg_catalog,public;',
    `-- Only after review, uncomment the next setting. A fresh catalog/ledger match is still required.`,
    `-- SET LOCAL loopy.reviewed_schema_fingerprint=${literal(report.fingerprint)};`,
    "SELECT pg_advisory_xact_lock(hashtext('loopy-schema-migrations'));",
    `DO $loopy_audit_guard$ DECLARE found_fingerprint text; found_ledger jsonb; BEGIN
      ${blockers}
      IF current_setting('loopy.reviewed_schema_fingerprint',true) IS DISTINCT FROM ${literal(report.fingerprint)}
        THEN RAISE EXCEPTION 'Review SQL proposal and explicitly enable its execution gate'; END IF;
      SELECT fingerprint INTO found_fingerprint FROM (\n${inventorySql}\n) catalog_snapshot;
      IF found_fingerprint IS DISTINCT FROM ${literal(report.fingerprint)} THEN RAISE EXCEPTION 'Schema changed; audit again'; END IF;
      ${ledgerGuard}
    END $loopy_audit_guard$;`,
    'SET LOCAL search_path=public;',
    `CREATE TABLE IF NOT EXISTS public.loopy_schema_migrations (
      name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now());`,
    'REVOKE ALL ON public.loopy_schema_migrations FROM PUBLIC,anon,authenticated;',
    ...selected.map(
      migration =>
        `\n-- ${migration.name} sha256:${migration.checksum}\n${migration.sql}\nINSERT INTO public.loopy_schema_migrations(name,checksum) VALUES (${literal(migration.name)},${literal(migration.checksum)});`
    ),
    `DO $loopy_postcheck$ DECLARE readiness jsonb; BEGIN
      SELECT public.loopy_schema_status() INTO readiness;
      IF readiness IS NULL OR NOT (readiness @> ${literal(JSON.stringify(Object.fromEntries(schemaCapabilities.map(key => [key, true]))))}::jsonb)
        THEN RAISE EXCEPTION 'Required schema capabilities are not ready; transaction must roll back'; END IF;
    END $loopy_postcheck$;`,
    "NOTIFY pgrst,'reload schema';",
    'COMMIT;',
    '',
  ].join('\n')
}
