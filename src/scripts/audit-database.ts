import dotenv from 'dotenv'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { Client } from 'pg'
import { getMigrationPlan, MigrationError } from '../db/migrations'
import { buildContract } from '../db/audit/contract'
import { inspectDatabase, inventorySql } from '../db/audit/inventory'
import { compareSchema } from '../db/audit/compare'
import { renderReport, renderUpgradeSql } from '../db/audit/render'

async function main() {
  const args = process.argv.slice(2)
  const outputs = args.filter(arg => arg.startsWith('--out=') && arg.length > 6)
  if (
    args.some(arg => arg !== '--strict' && (!arg.startsWith('--out=') || arg.length === 6)) ||
    outputs.length > 1 ||
    args.filter(arg => arg === '--strict').length > 1
  )
    throw new MigrationError(
      'Usage: yarn db:audit [--out=NEW_DIRECTORY] [--strict]. This command cannot apply SQL.'
    )
  dotenv.config()
  if (!process.env.DATABASE_URL)
    throw new MigrationError(
      'Set DATABASE_URL locally; never print or pass credentials as arguments'
    )
  const url = new URL(process.env.DATABASE_URL)
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new MigrationError('DATABASE_URL must be a PostgreSQL URI')
  if (
    process.env.SUPABASE_URL &&
    (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.pooler.supabase.com'))
  ) {
    const project = new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
    const matches =
      url.hostname === `db.${project}.supabase.co` ||
      decodeURIComponent(url.username).endsWith(`.${project}`)
    if (!matches)
      throw new MigrationError('DATABASE_URL does not match the configured Supabase project')
  }
  const plan = getMigrationPlan()
  console.log('Building expected schema in disposable local PostgreSQL...')
  const contract = await buildContract(plan)
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    query_timeout: 20000,
  })
  client.on('error', () => {})
  let snapshot
  try {
    await client.connect()
    snapshot = await inspectDatabase(client)
  } finally {
    await client.end()
  }
  const report = compareSchema(snapshot, contract, plan)
  const output = path.resolve(
    outputs[0]?.slice('--out='.length) ||
      `database/reports/${new Date().toISOString().replace(/[:.]/g, '-')}`
  )
  mkdirSync(path.dirname(output), { recursive: true })
  mkdirSync(output)
  const save = (name: string, content: string) =>
    writeFileSync(path.join(output, name), content, { encoding: 'utf8', flag: 'wx' })
  save(
    'report.json',
    JSON.stringify({ ...report, snapshot, expectedContract: contract }, null, 2) + '\n'
  )
  save('report.md', renderReport(report))
  save('upgrade.review.sql', renderUpgradeSql(report, plan))
  save(
    'check.sql',
    `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSET LOCAL search_path=pg_catalog,public;\n${inventorySql};\nROLLBACK;\n`
  )
  console.log(
    JSON.stringify({
      ...report.totals,
      blockers: report.blockers.length,
      pending: report.pending.length,
    })
  )
  console.log(`Report and SQL review draft: ${output}`)
  console.log('Read-only audit completed. No migrations or data writes were executed.')
  if (
    args.includes('--strict') &&
    (report.blockers.length || report.findings.some(item => item.status !== 'extra'))
  )
    process.exitCode = 2
}

main().catch((error: unknown) => {
  if (error instanceof MigrationError) console.error(error.message)
  else
    console.error(
      'Database audit failed. No credentials printed; inspect connectivity, catalog permissions or local fixture compatibility.'
    )
  process.exitCode = 1
})
