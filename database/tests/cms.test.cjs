const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PGlite } = require('@electric-sql/pglite')
const { prepareSchema } = require('./fixtures/schema.cjs')

test('CMS import transactions, revisions and role boundaries', async t => {
  const db = new PGlite()
  const actor = '00000000-0000-4000-8000-000000000052'
  try {
    await prepareSchema(db)
    await db.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [actor, 'cms@example.test'])
    await db.query('UPDATE user_profiles SET is_admin=true WHERE id=$1', [actor])
    const item = { category: 'cms-fixture', key: 'title', value: 'Original', type: 'markdown', description: 'Preserved' }
    const run = (items, who = actor) => db.query('SELECT import_cms_content_atomically($1,$2,$3) AS result', [who, 'vi', JSON.stringify(items)])
    const row = async () => (await db.query("SELECT i.* FROM content_items i JOIN content_categories c ON c.id=i.category_id WHERE c.name='cms-fixture' AND i.key='title'")).rows[0]
    await t.test('commits metadata, starts revision zero and returns exact counters', async () => {
      assert.deepEqual((await run([item])).rows[0].result, { imported: 1, language: 'vi' })
      assert.equal((await row()).revision, 0)
      assert.equal((await row()).type, 'markdown')
    })
    await t.test('v1 value-only updates retain rich metadata and invalidate the old revision', async () => {
      await run([{ category: item.category, key: item.key, value: 'V1' }])
      const saved = await row()
      assert.equal(saved.value, 'V1'); assert.equal(saved.description, 'Preserved'); assert.equal(saved.type, 'markdown'); assert.equal(saved.revision, 1)
    })
    await t.test('v2 updates explicitly clear description and preserve item identity', async () => {
      const before = await row()
      await run([{ ...item, value: 'V2', type: 'html', description: null }])
      const after = await row()
      assert.equal(after.id, before.id); assert.equal(after.description, null); assert.equal(after.revision, 2)
    })
    await t.test('a later invalid entry rolls back earlier content and category changes', async () => {
      const before = await row()
      await assert.rejects(run([{ ...item, value: 'Must rollback' }, { category: 'zz-new', key: 'bad', value: '' }]), /Invalid CMS entry/)
      assert.deepEqual(await row(), before)
      assert.equal((await db.query("SELECT count(*)::int AS n FROM content_categories WHERE name='zz-new'")).rows[0].n, 0)
    })
    await t.test('an inserted category is rolled back when a following item fails', async () => {
      await assert.rejects(run([{ ...item, category: 'aaa-new' }, { ...item, category: 'zzz-bad', type: 'unknown' }]))
      assert.equal((await db.query("SELECT count(*)::int AS n FROM content_categories WHERE name='aaa-new'")).rows[0].n, 0)
    })
    await t.test('stale conditional updates/deletes cannot replace a newer revision', async () => {
      const before = await row()
      const update = await db.query('UPDATE content_items SET value=$1 WHERE id=$2 AND revision=$3 RETURNING revision', ['Winner', before.id, before.revision])
      assert.equal(update.rows[0].revision, before.revision + 1)
      assert.equal((await db.query('UPDATE content_items SET value=$1 WHERE id=$2 AND revision=$3 RETURNING id', ['Stale', before.id, before.revision])).rows.length, 0)
      assert.equal((await db.query('DELETE FROM content_items WHERE id=$1 AND revision=$2 RETURNING id', [before.id, before.revision])).rows.length, 0)
      assert.equal((await row()).value, 'Winner')
    })
    await t.test('duplicate entries and non-admin actors do not write', async () => {
      await assert.rejects(run([item, item]), /Duplicate CMS entry/)
      await db.query('UPDATE user_profiles SET is_admin=false WHERE id=$1', [actor])
      await assert.rejects(run([item]), /Admin required/)
      await db.query('UPDATE user_profiles SET is_admin=true WHERE id=$1', [actor])
    })
    await t.test('only service role may call the import function', async () => {
      for (const role of ['anon','authenticated']) {
        await db.exec(`SET ROLE ${role}`)
        await assert.rejects(run([item]), /permission denied/)
        await db.exec('RESET ROLE')
      }
      await db.exec('SET ROLE service_role')
      await run([item])
      await db.exec('RESET ROLE')
      assert.equal((await db.query('SELECT loopy_schema_status() AS status')).rows[0].status.cms, true)
    })
  } finally { await db.close() }
})
