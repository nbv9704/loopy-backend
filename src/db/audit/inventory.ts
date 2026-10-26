import { readFileSync } from 'fs'
import path from 'path'
import type { Client } from 'pg'
import { Inventory, LedgerEntry, Snapshot } from './model'

export const inventorySql = readFileSync(
  path.resolve(__dirname, '../../../database/checks/schema-inventory.sql'),
  'utf8'
)
  .trim()
  .replace(/;$/, '')

/** Only catalog metadata and our migration ledger are read, under a consistent read-only snapshot. */
export async function inspectDatabase(client: Pick<Client, 'query'>): Promise<Snapshot> {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    await client.query('SET LOCAL search_path=pg_catalog,public')
    const { rows } = await client.query<Inventory>(inventorySql)
    if (!rows[0] || !Array.isArray(rows[0].objects)) throw new Error('Invalid catalog inventory')
    const ledgerExists = await client.query<{ present: boolean }>(
      "SELECT to_regclass('public.loopy_schema_migrations') IS NOT NULL AS present"
    )
    let ledger: LedgerEntry[] | null = null
    if (ledgerExists.rows[0].present) {
      const result = await client.query<LedgerEntry>(
        'SELECT name,checksum FROM public.loopy_schema_migrations ORDER BY name LIMIT 1001'
      )
      if (result.rows.length > 1000) throw new Error('Migration ledger exceeds audit limit')
      ledger = result.rows
    }
    return { ...rows[0], ledger }
  } finally {
    await client.query('ROLLBACK')
  }
}
