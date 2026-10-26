import { Client } from 'pg'
import { applyMigrationPlan, getMigrationPlan } from '../migrations'

describe('reviewed migration runner', () => {
  const migration = { name: 'migrations/test.sql', sql: 'SELECT 1', checksum: 'current' }
  const client = (handler?: (sql: string) => unknown) => ({
    query: jest.fn(async (sql: string) => handler?.(sql) || { rows: [] }),
  })

  it('uses a manifest rather than globbing rollback/drop/seed scripts', () => {
    const plan = getMigrationPlan()
    expect(plan.length).toBe(13)
    expect(plan.every(item => !/rollback|999|seed|baseline/.test(item.name))).toBe(true)
    expect(getMigrationPlan(true)[0].name).toBe('baseline/001-current.sql')
  })
  it('refuses to bootstrap a non-empty public schema', async () => {
    const db = client(sql =>
      sql.includes('SELECT tablename') ? { rows: [{ tablename: 'user_profiles' }] } : undefined
    )
    await expect(applyMigrationPlan(db as unknown as Client, [migration], true)).rejects.toThrow(
      'not empty'
    )
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.query).not.toHaveBeenCalledWith(migration.sql)
  })
  it('rejects checksum changes to already applied migrations', async () => {
    const db = client(sql =>
      sql === 'SELECT name, checksum FROM public.loopy_schema_migrations'
        ? { rows: [{ name: migration.name, checksum: 'old' }] }
        : undefined
    )
    await expect(applyMigrationPlan(db as unknown as Client, [migration])).rejects.toThrow(
      'Applied migration changed'
    )
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
  })
  it('rolls back when a statement fails and does not commit history', async () => {
    const db = client(sql => {
      if (sql === migration.sql) throw new Error('injected failure')
    })
    await expect(applyMigrationPlan(db as unknown as Client, [migration])).rejects.toThrow(
      'injected failure'
    )
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK')
    expect(db.query).not.toHaveBeenCalledWith('COMMIT')
  })
  it('skips an identical applied migration and commits a no-op retry', async () => {
    const db = client(sql =>
      sql === 'SELECT name, checksum FROM public.loopy_schema_migrations'
        ? { rows: [{ name: migration.name, checksum: migration.checksum }] }
        : undefined
    )
    await applyMigrationPlan(db as unknown as Client, [migration])
    expect(db.query).not.toHaveBeenCalledWith(migration.sql)
    expect(db.query).toHaveBeenLastCalledWith('COMMIT')
  })
})
