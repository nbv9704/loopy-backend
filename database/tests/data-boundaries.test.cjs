const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('API data boundary removes both table and column privileges without losing rows', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE TABLE user_profiles(id int, is_admin boolean, points int);
      INSERT INTO user_profiles VALUES (1, false, 10);
      CREATE TABLE lessons(id int, solution_code text);
      INSERT INTO lessons VALUES (1, 'private answer');
      CREATE TABLE practice_questions(id int, correct_answer text);
      CREATE TABLE lesson_submissions(id int, is_correct boolean);
      GRANT ALL ON user_profiles, lessons, practice_questions, lesson_submissions TO anon, authenticated;
      GRANT UPDATE (is_admin, points) ON user_profiles TO authenticated;
      GRANT SELECT (solution_code) ON lessons TO anon;
      CREATE FUNCTION update_lesson_progress_atomically(uuid,uuid,text,int) RETURNS void LANGUAGE sql AS 'SELECT';
      CREATE FUNCTION complete_lesson_atomically(uuid,uuid,timestamptz,date) RETURNS void LANGUAGE sql AS 'SELECT';
      CREATE FUNCTION bulk_import_lessons_atomically(uuid,jsonb) RETURNS void LANGUAGE sql AS 'SELECT';
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
    `)
    const sql = readFileSync(path.join(__dirname, '../migrations/043-api-data-boundaries.sql'), 'utf8')
    await db.exec(sql)
    await db.exec(sql) // Permission migration is repeatable.
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      for (const statement of [
        'SELECT solution_code FROM lessons', 'SELECT correct_answer FROM practice_questions',
        'UPDATE user_profiles SET is_admin = true', 'UPDATE user_profiles SET points = 999',
        'INSERT INTO lesson_submissions VALUES (1, true)',
        'SELECT complete_lesson_atomically(NULL,NULL,NULL,NULL)',
      ]) {
        await assert.rejects(db.query(statement), /permission denied/)
      }
      await db.exec('RESET ROLE')
    }
    await db.exec('SET ROLE service_role')
    assert.deepEqual((await db.query('SELECT * FROM user_profiles')).rows, [{ id: 1, is_admin: false, points: 10 }])
    await db.query('UPDATE user_profiles SET points = 20 WHERE id = 1')
    assert.equal((await db.query('SELECT points FROM user_profiles')).rows[0].points, 20)
  } finally { await db.close() }
})
