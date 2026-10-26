const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

const tables = ['badges','chapters','languages','learning_paths','path_chapters']
const sql = readFileSync(path.join(__dirname, '../migrations/053-catalog-read-privileges.sql'), 'utf8')
async function fixture() {
  const db = new PGlite()
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;')
  for (const table of tables) await db.exec(`CREATE TABLE ${table}(id int PRIMARY KEY,label text);
    INSERT INTO ${table} VALUES (1,'Original'); ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
    CREATE POLICY public_read ON ${table} FOR SELECT USING(true);
    GRANT ALL ON ${table} TO PUBLIC,anon,authenticated;
    GRANT INSERT(label),UPDATE(label),REFERENCES(id) ON ${table} TO authenticated;`)
  return db
}

test('catalog hardening removes table, PUBLIC and explicit column writes but preserves reads and service CRUD', async () => {
  const db = await fixture()
  try {
    await db.exec(sql)
    await db.exec(sql) // Safe to reapply during a reviewed recovery.
    for (const role of ['anon','authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      for (const table of tables) {
        assert.deepEqual((await db.query(`SELECT * FROM ${table}`)).rows, [{ id: 1, label: 'Original' }])
        for (const statement of [`INSERT INTO ${table}(id,label) VALUES(2,'Forbidden')`,
          `UPDATE ${table} SET label='Forbidden'`, `DELETE FROM ${table}`, `TRUNCATE ${table}`])
          await assert.rejects(db.query(statement), /permission denied/)
      }
      await db.exec('RESET ROLE')
    }
    await db.exec('SET ROLE service_role')
    for (const table of tables) {
      await db.query(`INSERT INTO ${table} VALUES(2,'Backend')`)
      await db.query(`UPDATE ${table} SET label='Updated' WHERE id=2`)
      assert.equal((await db.query(`SELECT label FROM ${table} WHERE id=2`)).rows[0].label, 'Updated')
      await db.query(`DELETE FROM ${table} WHERE id=2`)
      assert.deepEqual((await db.query(`SELECT * FROM ${table}`)).rows, [{ id: 1, label: 'Original' }])
    }
    await db.exec('RESET ROLE')
  } finally { await db.close() }
})

test('unexpected write policies reject the entire permission change instead of breaking a custom writer', async () => {
  const db = await fixture()
  try {
    await db.exec('CREATE POLICY custom_write ON chapters FOR UPDATE USING(true) WITH CHECK(true)')
    const snapshot = async () => (await db.query(`SELECT relname,relacl::text AS acl FROM pg_class
      WHERE relname IN ('badges','chapters','languages','learning_paths','path_chapters') ORDER BY relname`)).rows
    const before = await snapshot()
    await assert.rejects(db.exec(sql), /Review catalog write policies/)
    assert.deepEqual(await snapshot(), before)
  } finally { await db.close() }
})

test('disabled RLS and inherited write roles fail closed without leaving partial grants', async () => {
  const db = await fixture()
  try {
    await db.exec('ALTER TABLE badges DISABLE ROW LEVEL SECURITY')
    await assert.rejects(db.exec(sql), /disabled RLS/)
    await db.exec(`ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
      CREATE ROLE extra_writer; GRANT ALL ON badges TO extra_writer; GRANT extra_writer TO authenticated;`)
    await assert.rejects(db.exec(sql), /Inherited catalog write privilege/)
    assert.equal((await db.query("SELECT has_table_privilege('anon','badges','TRUNCATE') AS permitted")).rows[0].permitted, true)
  } finally { await db.close() }
})
