const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('empty-schema bootstrap plus reviewed forward migrations preserve signup and role boundaries', async () => {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE ROLE supabase_auth_admin;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';
      GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
      GRANT INSERT, SELECT ON auth.users TO supabase_auth_admin;
      BEGIN;`)
    const root = path.join(__dirname, '..')
    const plan = JSON.parse(readFileSync(path.join(root, 'migration-plan.json'), 'utf8'))
    for (const name of [...plan.bootstrap, ...plan.forward]) {
      await db.exec(readFileSync(path.join(root, name), 'utf8'))
      if (name.endsWith('046-audit-and-signup-trigger.sql')) {
        assert.equal((await db.query('SELECT loopy_schema_status() AS status')).rows[0].status.pvp, false)
      }
    }
    await db.exec('COMMIT')
    const schema = (await db.query('SELECT loopy_schema_status() AS status')).rows[0].status
    assert.deepEqual(schema, { progress: true, import: true, practice: true, pvp: true, pvpSubmissions: true, pvpLifecycle: true, pvpMatchmaking: true, lessonChecks: true, cms: true, dataBoundaries: true })
    // Parse and execute the exact read-only production preflight against this fixture only.
    await db.exec(readFileSync(path.join(root, 'checks/preflight.sql'), 'utf8'))
    await db.exec('SET ROLE supabase_auth_admin')
    await db.query("INSERT INTO auth.users(id, email) VALUES ('00000000-0000-4000-8000-000000000001', 'demo@example.test')")
    await db.exec('RESET ROLE')
    assert.equal((await db.query('SELECT count(*)::int AS count FROM user_profiles')).rows[0].count, 1)
    assert.equal((await db.query('SELECT count(*)::int AS count FROM pvp_user_stats')).rows[0].count, 1)
    await db.exec("INSERT INTO languages(id,name,display_name,icon) VALUES ('javascript','JavaScript','JavaScript','js')")
    const chapter = (await db.query("INSERT INTO chapters(language_id,chapter_number,title,order_index) VALUES ('javascript',1,'Test',0) RETURNING id")).rows[0].id
    const item = { lesson_id: 'one', order_index: 0, title: 'Original', lesson_type: 'concept',
      test_cases: [{ order_index: 0, expected_output: 'ok' }],
      steps: [{ type: 'note', prompt: 'Original step', order_index: 0 }] }
    const imported = (await db.query('SELECT * FROM bulk_import_lessons_atomically($1,$2)', [chapter, [item]])).rows[0]
    assert.equal(imported.lessons_created, 1)
    assert.equal(imported.steps_created, 1)
    const snapshot = async () => (await db.query(`SELECT jsonb_build_object(
      'lessons',(SELECT jsonb_agg(to_jsonb(l)) FROM lessons l),
      'steps',(SELECT jsonb_agg(to_jsonb(s)) FROM lesson_steps s),
      'tests',(SELECT jsonb_agg(to_jsonb(t)) FROM lesson_test_cases t)) AS data`)).rows[0].data
    const before = await snapshot()
    await assert.rejects(db.query('SELECT * FROM bulk_import_lessons_atomically($1,$2)', [chapter, [
      { ...item, title: 'Must rollback' },
      { ...item, lesson_id: 'two', order_index: 1, steps: [{ type: 'note', order_index: 0 }] },
    ]]), /Every lesson step requires/)
    assert.deepEqual(await snapshot(), before)
    const match = (await db.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('rpc001','{}'::uuid[]) RETURNING id")).rows[0].id
    const actor = '00000000-0000-4000-8000-000000000001'
    await db.query('INSERT INTO pvp_participants(match_id,user_id) VALUES ($1,$2)', [match, actor])
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      await assert.rejects(db.query('SELECT increment_participant_score($1,$2,10,true)', [match, actor]), /permission denied/)
      await db.exec('RESET ROLE')
    }
    await db.exec('SET ROLE service_role')
    await db.query('SELECT increment_participant_score($1,$2,10,true)', [match, actor])
    assert.deepEqual((await db.query('SELECT total_score,questions_answered,correct_answers FROM pvp_participants WHERE match_id=$1', [match])).rows[0],
      { total_score: 10, questions_answered: 1, correct_answers: 1 })
    await db.exec('RESET ROLE')
    await db.exec('SET ROLE authenticated')
    await assert.rejects(db.query('UPDATE user_profiles SET is_admin=true'), /permission denied/)
  } finally { await db.close() }
})
