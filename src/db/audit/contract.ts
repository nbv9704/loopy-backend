import { PGlite } from '@electric-sql/pglite'
import { getMigrationPlan, Migration } from '../migrations'
import { inventorySql } from './inventory'
import { canonical, Contract, ExpectedObject, Inventory, objectId } from './model'

/** Build the expected contract from immutable source SQL in a disposable in-memory PostgreSQL. */
export async function buildContract(plan: Migration[] = getMigrationPlan()): Promise<Contract> {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
    const baselineMigration = getMigrationPlan(true)[0]
    await db.exec(baselineMigration.sql)
    await db.exec('SET search_path=pg_catalog,public')
    const capture = async () => (await db.query<Inventory>(inventorySql)).rows[0].objects
    const baseline = await capture()
    const serverVersion = (await db.query<Inventory>(inventorySql)).rows[0].serverVersion
    const state = new Map<string, ExpectedObject>(
      baseline.map(item => [
        objectId(item),
        {
          ...item,
          introducedBy: baselineMigration.name,
          changedBy: baselineMigration.name,
          fieldMigrations: Object.fromEntries(
            Object.keys(item.shape).map(key => [key, baselineMigration.name])
          ),
        },
      ])
    )
    for (const migration of plan) {
      // Source migrations use unqualified public objects; do not put pg_catalog first for DDL.
      await db.exec('SET search_path=public')
      await db.exec(migration.sql)
      await db.exec('SET search_path=pg_catalog,public')
      const objects = await capture()
      const present = new Set(objects.map(objectId))
      for (const key of state.keys()) if (!present.has(key)) state.delete(key)
      for (const item of objects) {
        const previous = state.get(objectId(item))
        state.set(objectId(item), {
          ...item,
          introducedBy: previous?.introducedBy ?? migration.name,
          fieldMigrations: Object.fromEntries(
            Object.keys(item.shape).map(key => [
              key,
              previous && canonical(previous.shape[key]) === canonical(item.shape[key])
                ? (previous.fieldMigrations?.[key] ?? previous.changedBy)
                : migration.name,
            ])
          ),
          changedBy:
            !previous || canonical(previous.shape) !== canonical(item.shape)
              ? migration.name
              : previous.changedBy,
        })
      }
    }
    return { baseline, objects: [...state.values()], serverVersion }
  } finally {
    await db.close()
  }
}
