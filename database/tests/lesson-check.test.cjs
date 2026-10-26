const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('checked completion uses current content, saved proof, role boundaries and atomic rewards', async t => {
  const db = new PGlite()
  const actor = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
    const root = path.join(__dirname, '..')
    const plan = JSON.parse(readFileSync(path.join(root, 'migration-plan.json'), 'utf8'))
    for (const name of [...plan.bootstrap, ...plan.forward]) await db.exec(readFileSync(path.join(root, name), 'utf8'))
    await db.query('INSERT INTO auth.users(id) VALUES ($1),($2)', [actor, other])
    await db.exec("INSERT INTO languages(id,name,display_name,icon) VALUES ('javascript','JavaScript','JavaScript','js'),('python','Python','Python','py')")
    const chapter = (await db.query("INSERT INTO chapters(language_id,chapter_number,title,order_index) VALUES ('javascript',1,'Test',0) RETURNING id")).rows[0].id
    let serial = 0
    const fresh = async () => (await db.query("INSERT INTO lessons(chapter_id,lesson_id,title,order_index,status) VALUES ($1,$2,'Test',0,'published') RETURNING id", [chapter, `lesson-${++serial}`])).rows[0].id
    const revision = async lesson => (await db.query('SELECT content_revision FROM lessons WHERE id=$1', [lesson])).rows[0].content_revision
    const check = async (lesson, passed = true, user = actor, version) => (await db.query('SELECT record_lesson_check($1,$2,$3,$4,$5,1) AS receipt',
      [user, lesson, version ?? await revision(lesson), 'saved-code', { passed, score: passed ? 100 : 0, checks: [] }])).rows[0].receipt
    const complete = async (lesson, receipt, user = actor) => (await db.query("SELECT * FROM complete_checked_lesson_atomically($1,$2,$3,'2026-10-22T08:00:00Z','2026-10-22')", [user, lesson, receipt])).rows[0]
    const counts = async () => (await db.query('SELECT (SELECT count(*)::int FROM user_progress) AS progress, (SELECT COALESCE(sum(points),0)::int FROM user_profiles) AS points')).rows[0]

    await t.test('missing/failed/stale/foreign proofs never create progress or rewards', async () => {
      const lesson = await fresh()
      const second = await fresh()
      await assert.rejects(complete(lesson, null), /Check the current lesson/)
      const first = await check(lesson)
      await assert.rejects(complete(second, first.id), /Check the current lesson/)
      await assert.rejects(complete(lesson, first.id, other), /Check the current lesson/)
      const failed = await check(lesson, false)
      await db.query('UPDATE lesson_submissions SET is_correct=true WHERE id=$1', [failed.id])
      await assert.rejects(complete(lesson, failed.id), /Check the current lesson/)
      await assert.rejects(complete(lesson, first.id), /Check the current lesson/)
      assert.deepEqual(await counts(), { progress: 0, points: 0 })
    })
    await t.test('legacy/direct passing submissions cannot authorize completion', async () => {
      const lesson = await fresh()
      const submission = (await db.query("INSERT INTO lesson_submissions(user_id,lesson_id,code,is_correct,grading_method) VALUES ($1,$2,'legacy',true,'test') RETURNING id", [actor, lesson])).rows[0].id
      await assert.rejects(complete(lesson, submission), /Check the current lesson/)
    })
    await t.test('lesson/step/test-case changes invalidate prior checks, including moving details', async () => {
      const lesson = await fresh()
      const target = await fresh()
      const first = await check(lesson)
      await db.query("UPDATE lessons SET title='Edited' WHERE id=$1", [lesson])
      await assert.rejects(complete(lesson, first.id), /Check the current lesson/)
      await assert.rejects(check(lesson, true, actor, first.content_revision), /content changed/)
      const step = (await db.query("INSERT INTO lesson_steps(lesson_id,type,prompt,order_index) VALUES ($1,'short_answer','Question',0) RETURNING id", [lesson])).rows[0].id
      const before = [await check(lesson), await check(target)]
      await db.query('UPDATE lesson_steps SET lesson_id=$1 WHERE id=$2', [target, step])
      await assert.rejects(complete(lesson, before[0].id), /Check the current lesson/)
      await assert.rejects(complete(target, before[1].id), /Check the current lesson/)
      const checked = await check(lesson)
      const testcase = (await db.query("INSERT INTO lesson_test_cases(lesson_id,input,expected_output,description,order_index) VALUES ($1,'null','1','Case',0) RETURNING id", [lesson])).rows[0].id
      await assert.rejects(complete(lesson, checked.id), /Check the current lesson/)
      const checkedAgain = await check(lesson)
      await db.query('DELETE FROM lesson_test_cases WHERE id=$1', [testcase])
      await assert.rejects(complete(lesson, checkedAgain.id), /Check the current lesson/)
    })
    await t.test('changing chapter language invalidates lesson checks', async () => {
      const lesson = await fresh()
      const checked = await check(lesson)
      await db.query("UPDATE chapters SET language_id='python' WHERE id=$1", [chapter])
      await assert.rejects(complete(lesson, checked.id), /Check the current lesson/)
    })
    await t.test('reward failure rolls back progress and retry succeeds exactly once', async () => {
      const lesson = await fresh()
      const checked = await check(lesson)
      await db.exec(`CREATE FUNCTION reject_reward() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected reward failure'; END; $$;
        CREATE TRIGGER reject_reward BEFORE INSERT ON user_daily_activity FOR EACH ROW EXECUTE FUNCTION reject_reward();`)
      await assert.rejects(complete(lesson, checked.id), /injected reward failure/)
      assert.deepEqual(await counts(), { progress: 0, points: 0 })
      await db.exec('DROP TRIGGER reject_reward ON user_daily_activity')
      assert.equal((await complete(lesson, checked.id)).was_first_completion, true)
      await db.query("UPDATE lessons SET title='Later edit' WHERE id=$1", [lesson])
      await check(lesson, false)
      assert.equal((await complete(lesson, checked.id)).was_first_completion, false)
      assert.deepEqual(await counts(), { progress: 1, points: 100 })
    })
    await t.test('archive cannot be completed and receipt failure cannot leave a submission behind', async () => {
      const lesson = await fresh()
      const checked = await check(lesson)
      await db.query("UPDATE lessons SET status='archived' WHERE id=$1", [lesson])
      await assert.rejects(complete(lesson, checked.id), /Lesson not found/)
      const next = await fresh()
      await db.exec(`CREATE FUNCTION reject_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected receipt failure'; END; $$;
        CREATE TRIGGER reject_receipt BEFORE INSERT ON lesson_check_receipts FOR EACH ROW EXECUTE FUNCTION reject_receipt();`)
      await assert.rejects(check(next), /injected receipt failure/)
      assert.equal((await db.query('SELECT count(*)::int AS count FROM lesson_submissions WHERE lesson_id=$1', [next])).rows[0].count, 0)
    })
    await t.test('completed legacy progress keeps unknown timestamps/counters without invented history or rewards', async () => {
      const lesson = await fresh()
      const before = await counts()
      await db.query("INSERT INTO user_progress(user_id,lesson_id,status,time_spent) VALUES ($1,$2,'completed',NULL)", [actor, lesson])
      const saved = await complete(lesson, null)
      assert.equal(saved.was_first_completion, false)
      assert.equal(saved.time_spent, null)
      assert.equal(saved.completed_at, null)
      assert.equal((await counts()).points, before.points)
    })
    await t.test('only service role can issue/consume receipts; unchecked completion is internal', async () => {
      const lesson = await fresh()
      for (const role of ['anon', 'authenticated', 'service_role']) {
        await db.exec(`SET ROLE ${role}`)
        await assert.rejects(db.query("SELECT * FROM complete_lesson_atomically($1,$2,now(),current_date)", [actor, lesson]), /permission denied/)
        if (role !== 'service_role') {
          await assert.rejects(check(lesson, true, actor, 1), /permission denied/)
          await assert.rejects(complete(lesson, null), /permission denied/)
          await assert.rejects(db.query('SELECT * FROM lesson_check_receipts'), /permission denied/)
        }
        await db.exec('RESET ROLE')
      }
      await db.exec('DROP TRIGGER reject_receipt ON lesson_check_receipts; SET ROLE service_role')
      const checked = await check(lesson, true, actor, 1)
      assert.equal((await complete(lesson, checked.id)).was_first_completion, true)
      await db.exec('RESET ROLE')
    })
  } finally { await db.close() }
})
