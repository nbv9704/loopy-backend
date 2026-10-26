import dotenv from 'dotenv'
import { Client } from 'pg'
import { applyMigrationPlan, getMigrationPlan, MigrationError } from '../db/migrations'

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2))
  const accepted = ['--apply', '--status', '--bootstrap', '--database-kind=development', '--database-kind=production', '--allow-production']
  if ([...args].some(arg => !accepted.includes(arg))) throw new MigrationError('Unknown option; default command only prints a plan')
  const bootstrap = args.has('--bootstrap')
  const plan = getMigrationPlan(bootstrap)
  for (const item of plan) console.log(`${item.name}  sha256:${item.checksum.slice(0, 12)}`)
  if (!args.has('--apply') && !args.has('--status')) {
    console.log('Plan only. No database connection was opened. Review database/README.md before applying.')
    return
  }
  const development = args.has('--database-kind=development')
  const production = args.has('--database-kind=production')
  if (args.has('--apply') && development === production) throw new MigrationError('Specify exactly one --database-kind before applying')
  if (bootstrap && (!development || production)) throw new MigrationError('Bootstrap is allowed only for an empty development schema')
  if (production && !args.has('--allow-production')) throw new MigrationError('Production apply requires explicit --allow-production after review')
  dotenv.config()
  if (!process.env.DATABASE_URL) throw new MigrationError('Set DATABASE_URL locally; never put credentials in command arguments')
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, statement_timeout: 30000 })
  try {
    await client.connect()
    if (args.has('--status')) {
      const { rows } = await client.query("SELECT to_regclass('public.loopy_schema_migrations') AS ledger")
      if (!rows[0].ledger) console.log('No migration ledger exists. Review the current schema before applying.')
      else console.table((await client.query('SELECT name, checksum, applied_at FROM public.loopy_schema_migrations ORDER BY name')).rows)
      return
    }
    await applyMigrationPlan(client, plan, bootstrap)
    console.log('Migration transaction committed. Verify /api/ready before switching traffic.')
  } finally { await client.end() }
}

main().catch((error: unknown) => {
  // Driver errors may contain connection details. Print only safe local errors or SQLSTATE.
  if (error instanceof MigrationError) console.error(error.message)
  else console.error('Database operation failed; no credentials printed. Review the database log and transaction status.')
  process.exitCode = 1
})
