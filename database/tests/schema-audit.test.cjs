const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')
const { buildContract } = require('../../dist/db/audit/contract')
const { inspectDatabase } = require('../../dist/db/audit/inventory')
const { compareSchema } = require('../../dist/db/audit/compare')
const { renderUpgradeSql } = require('../../dist/db/audit/render')
const { getMigrationPlan } = require('../../dist/db/migrations')

test('read-only schema audit and proposed upgrade in disposable PostgreSQL', async t => {
  const db = new PGlite()
  const plan = getMigrationPlan()
  const root = path.join(__dirname, '..')
  const enable = sql =>
    sql.replace(
      '-- SET LOCAL loopy.reviewed_schema_fingerprint=',
      'SET LOCAL loopy.reviewed_schema_fingerprint='
    )
  try {
    const contract = await buildContract(plan)
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
    await db.exec(getMigrationPlan(true)[0].sql)
    await t.test(
      'the exact SQL preflight works when CMS RPC and revision do not exist',
      async () => {
        await db.exec(readFileSync(path.join(root, 'checks/preflight.sql'), 'utf8'))
        assert.equal(
          (
            await db.query(
              "SELECT to_regprocedure('public.import_cms_content_atomically(uuid,text,jsonb)') IS NULL AS absent"
            )
          ).rows[0].absent,
          true
        )
      }
    )
    const before = await inspectDatabase(db)
    const report = compareSchema(before, contract, plan)
    assert.deepEqual(report.blockers, [])
    assert.equal(report.pending.length, plan.length)
    const sql = renderUpgradeSql(report, plan)
    await t.test(
      'default SQL gate refuses execution without creating a ledger or changing catalog',
      async () => {
        await assert.rejects(db.exec(sql), /explicitly enable/)
        await db.exec('ROLLBACK')
        assert.equal((await inspectDatabase(db)).fingerprint, before.fingerprint)
        assert.equal((await inspectDatabase(db)).ledger, null)
      }
    )
    await t.test('a stale schema fingerprint fails before any application DDL', async () => {
      await db.exec('CREATE TABLE audit_external_fixture(id integer)')
      await assert.rejects(db.exec(enable(sql)), /Schema changed/)
      await db.exec('ROLLBACK; DROP TABLE audit_external_fixture')
      assert.equal((await inspectDatabase(db)).ledger, null)
    })
    await db.exec("INSERT INTO content_categories(name) VALUES ('existing-content')")
    await db.exec(
      "INSERT INTO content_items(category_id,key,language,value) SELECT id,'existing.title','vi','Keep existing value' FROM content_categories WHERE name='existing-content'"
    )
    await t.test(
      'capability postcheck failure rolls back the proposed upgrade and its ledger',
      async () => {
        const broken = enable(sql).replace(
          'DO $loopy_postcheck$',
          'REVOKE EXECUTE ON FUNCTION public.import_cms_content_atomically(uuid,text,jsonb) FROM service_role;\nDO $loopy_postcheck$'
        )
        await assert.rejects(db.exec(broken), /capabilities are not ready/)
        await db.exec('ROLLBACK')
        assert.equal((await inspectDatabase(db)).ledger, null)
        assert.equal(
          (await db.query("SELECT value FROM content_items WHERE key='existing.title'")).rows[0]
            .value,
          'Keep existing value'
        )
      }
    )
    await t.test(
      'review-enabled SQL applies the full dependency chain, preserves rows and writes correct history',
      async () => {
        await db.exec(enable(sql))
        assert.equal(
          (await db.query("SELECT value FROM content_items WHERE key='existing.title'")).rows[0]
            .value,
          'Keep existing value'
        )
        const after = await inspectDatabase(db)
        assert.deepEqual(
          after.ledger,
          plan.map(({ name, checksum }) => ({ name, checksum }))
        )
        assert.deepEqual(compareSchema(after, contract, plan).findings, [])
        const status = (await db.query('SELECT loopy_schema_status() AS status')).rows[0].status
        assert.equal(status.cms, true)
        assert.equal(Object.values(status).every(Boolean), true)
      }
    )
    await t.test(
      'column grants bypassing a revoked table grant are detected as drift',
      async () => {
        await db.exec('GRANT UPDATE(is_admin) ON user_profiles TO authenticated')
        const changed = compareSchema(await inspectDatabase(db), contract, plan)
        assert.ok(
          changed.findings.some(
            item =>
              item.key === 'public.user_profiles.is_admin' && item.changedFields.includes('grants')
          )
        )
        assert.ok(changed.blockers.length > 0)
      }
    )
    await t.test(
      'CLI rejects an apply flag before loading credentials or opening any connection',
      () => {
        const result = spawnSync(
          process.execPath,
          [path.join(__dirname, '../../dist/scripts/audit-database.js'), '--apply'],
          { encoding: 'utf8', env: { ...process.env, DATABASE_URL: '', SUPABASE_URL: '' } }
        )
        assert.equal(result.status, 1)
        assert.match(result.stderr, /cannot apply SQL/)
        assert.doesNotMatch(result.stdout, /Building expected schema/)
      }
    )
  } finally {
    await db.close()
  }
})
