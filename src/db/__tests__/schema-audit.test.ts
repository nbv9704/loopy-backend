import { compareSchema } from '../audit/compare'
import { inspectDatabase } from '../audit/inventory'
import { renderUpgradeSql } from '../audit/render'
import { Contract, ExpectedObject, SchemaObject, Snapshot } from '../audit/model'
import { Migration } from '../migrations'
import type { Client } from 'pg'

const plan: Migration[] = [
  { name: 'migrations/050-check.sql', checksum: 'first', sql: 'SELECT 50;' },
  { name: 'migrations/052-cms.sql', checksum: 'second', sql: 'SELECT 52;' },
]
const table: SchemaObject = {
  kind: 'table',
  key: 'public.content_items',
  shape: { kind: 'r', rls: true },
}
const column: ExpectedObject = {
  kind: 'column',
  key: 'public.content_items.revision',
  shape: { type: 'integer', not_null: true },
  introducedBy: plan[1].name,
  changedBy: plan[1].name,
}
const contract: Contract = {
  baseline: [table],
  objects: [
    { ...table, introducedBy: 'baseline/core.sql', changedBy: 'baseline/core.sql' },
    column,
  ],
}
const snapshot = (objects: SchemaObject[] = [table]): Snapshot => ({
  objects,
  fingerprint: 'a'.repeat(32),
  serverVersion: '170000',
  ledger: null,
})

it('never infers an applied migration from an existing function name or missing ledger', () => {
  const report = compareSchema(snapshot(), contract, plan)
  expect(report.pending).toEqual(plan.map(item => item.name))
  expect(report.findings).toContainEqual(
    expect.objectContaining({ key: column.key, status: 'missing' })
  )
  expect(report.blockers).toEqual([])
})
it('blocks a partial untracked CREATE/ADD instead of silently skipping it', () => {
  const report = compareSchema(snapshot([table, column]), contract, plan)
  expect(report.blockers).toContainEqual(expect.stringContaining('partial forward object'))
  expect(renderUpgradeSql(report, plan)).toContain('Audit has unresolved blockers')
})
it('blocks checksum mismatch and non-prefix ledgers', () => {
  const state = { ...snapshot(), ledger: [{ name: plan[1].name, checksum: 'changed' }] }
  const report = compareSchema(state, contract, plan)
  expect(report.blockers).toContainEqual(expect.stringContaining('checksum differs'))
  expect(report.blockers).toContainEqual(expect.stringContaining('not an ordered prefix'))
})
it('blocks a ledger entry outside the allowlist', () => {
  const report = compareSchema(
    { ...snapshot(), ledger: [{ name: 'migrations/999-drop.sql', checksum: 'x' }] },
    contract,
    plan
  )
  expect(report.blockers).toContainEqual(expect.stringContaining('unknown migration'))
})
it('does not count a different overload as the required RPC', () => {
  const required: ExpectedObject = {
    kind: 'function',
    key: 'public.save(uuid)',
    shape: { returns: 'jsonb' },
    introducedBy: plan[0].name,
    changedBy: plan[0].name,
  }
  const report = compareSchema(
    snapshot([table, { ...required, key: 'public.save(text)' }]),
    { baseline: [table], objects: [required] },
    plan
  )
  expect(report.findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: 'public.save(uuid)', status: 'missing' }),
      expect.objectContaining({ key: 'public.save(text)', status: 'extra' }),
    ])
  )
})
it('blocks structural baseline differences rather than guessing conversions for real rows', () => {
  const base: SchemaObject = {
    kind: 'column',
    key: 'public.content_items.id',
    shape: { type: 'uuid', not_null: true },
  }
  const target: ExpectedObject = {
    ...base,
    introducedBy: 'baseline/core.sql',
    changedBy: 'baseline/core.sql',
  }
  const report = compareSchema(
    snapshot([{ ...base, shape: { type: 'text', not_null: true } }]),
    { baseline: [base], objects: [target] },
    plan
  )
  expect(report.blockers).toContainEqual(expect.stringContaining('Baseline structure needs review'))
})
it('treats missing legacy pvp_questions as optional, without adding unused tables', () => {
  const legacy: ExpectedObject = {
    kind: 'table',
    key: 'public.pvp_questions',
    shape: { kind: 'r' },
    introducedBy: 'baseline/core.sql',
    changedBy: 'baseline/core.sql',
  }
  const report = compareSchema(
    snapshot(),
    { baseline: [table, legacy], objects: [...contract.objects, legacy] },
    plan
  )
  expect(report.findings.some(item => item.key === legacy.key)).toBe(false)
  expect(report.blockers).toEqual([])
})
it('blocks drift after a complete ledger instead of replaying historical SQL', () => {
  const report = compareSchema(
    { ...snapshot(), ledger: plan.map(({ name, checksum }) => ({ name, checksum })) },
    contract,
    plan
  )
  expect(report.pending).toEqual([])
  expect(report.blockers).toContainEqual(
    expect.stringContaining('create a reviewed new forward migration')
  )
})
it('renders only pending allowlisted sources, ordered and gated by schema and ledger snapshots', () => {
  const report = compareSchema(
    { ...snapshot(), ledger: [{ name: plan[0].name, checksum: plan[0].checksum }] },
    contract,
    plan
  )
  const sql = renderUpgradeSql(report, plan)
  expect(sql).not.toContain('SELECT 50;')
  expect(sql).toContain('SELECT 52;')
  expect(sql).toContain('-- SET LOCAL loopy.reviewed_schema_fingerprint=')
  expect(sql).toContain('Schema changed; audit again')
  expect(sql).toContain('Migration ledger changed; audit again')
  expect(sql).toContain("NOTIFY pgrst,'reload schema'")
  expect(sql.trim().endsWith('COMMIT;')).toBe(true)
})
it('rolls back the read-only snapshot even when inventory reading fails', async () => {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('WITH target_roles')) throw new Error('catalog unavailable')
    return { rows: [] }
  })
  await expect(inspectDatabase({ query } as unknown as Client)).rejects.toThrow(
    'catalog unavailable'
  )
  expect(query).toHaveBeenNthCalledWith(1, 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  expect(query).toHaveBeenLastCalledWith('ROLLBACK')
})
