import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'
import { Client } from 'pg'

export class MigrationError extends Error {}
export interface Migration {
  name: string
  sql: string
  checksum: string
}
const databaseRoot = path.resolve(__dirname, '../../database')

export function getMigrationPlan(bootstrap = false): Migration[] {
  const manifest = JSON.parse(
    readFileSync(path.join(databaseRoot, 'migration-plan.json'), 'utf8')
  ) as {
    bootstrap: string[]
    forward: string[]
  }
  const names = [...(bootstrap ? manifest.bootstrap : []), ...manifest.forward]
  if (new Set(names).size !== names.length) throw new MigrationError('Duplicate migration entries')
  return names.map(name => {
    if (!/^(baseline|migrations)\/[\w-]+\.sql$/.test(name))
      throw new MigrationError('Invalid migration path')
    const sql = readFileSync(path.join(databaseRoot, name), 'utf8')
    return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') }
  })
}

export async function applyMigrationPlan(
  client: Client,
  plan: Migration[],
  bootstrap = false
): Promise<void> {
  await client.query('BEGIN')
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('loopy-schema-migrations'))")
    if (bootstrap) {
      const { rows } = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 1"
      )
      if (rows.length) throw new MigrationError('Bootstrap refused: public schema is not empty')
    } else {
      const required = [
        'user_profiles',
        'user_progress',
        'user_daily_activity',
        'lessons',
        'lesson_steps',
        'lesson_test_cases',
        'practice_sets',
        'practice_questions',
        'practice_attempts',
        'practice_submissions',
        'pvp_matches',
        'admin_audit_logs',
        'content_items',
        'content_categories',
      ]
      const { rows } = await client.query(
        "SELECT name FROM unnest($1::text[]) name WHERE to_regclass('public.' || name) IS NULL",
        [required]
      )
      if (rows.length)
        throw new MigrationError(
          'Required tables are missing; review the baseline instead of applying an upgrade'
        )
    }
    await client.query(`CREATE TABLE IF NOT EXISTS public.loopy_schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    await client.query(
      'REVOKE ALL ON public.loopy_schema_migrations FROM PUBLIC, anon, authenticated'
    )
    const { rows } = await client.query('SELECT name, checksum FROM public.loopy_schema_migrations')
    const applied = new Map(rows.map(row => [row.name, row.checksum]))
    for (const migration of plan) {
      if (applied.has(migration.name)) {
        if (applied.get(migration.name) !== migration.checksum)
          throw new MigrationError(`Applied migration changed: ${migration.name}`)
        continue
      }
      await client.query(migration.sql)
      await client.query(
        'INSERT INTO public.loopy_schema_migrations(name, checksum) VALUES ($1, $2)',
        [migration.name, migration.checksum]
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}
