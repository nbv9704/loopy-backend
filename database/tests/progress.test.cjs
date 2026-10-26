const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PGlite } = require('@electric-sql/pglite')
const { migration } = require('./fixtures/practice.cjs')
const user = '00000000-0000-4000-8000-000000000001'
const lessons = [2, 3, 4].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`)

test('progress completion, retries, late updates and rollback use the real SQL functions', async () => {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE service_role;
      CREATE TABLE user_profiles(id uuid PRIMARY KEY, points integer DEFAULT 0);
      CREATE TABLE user_progress(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, lesson_id uuid NOT NULL,
        status text DEFAULT 'not_started', completed_at timestamptz, time_spent integer DEFAULT 0,
        updated_at timestamptz DEFAULT now(), UNIQUE(user_id,lesson_id));
      CREATE TABLE user_daily_activity(user_id uuid NOT NULL, activity_date date NOT NULL,
        lessons_completed integer DEFAULT 0, points_earned integer DEFAULT 0, UNIQUE(user_id,activity_date));`)
    await db.exec(migration('041-atomic-progress.sql'))
    await db.query('INSERT INTO user_profiles(id) VALUES ($1)', [user])
    const update = async (lesson, status, time) => (await db.query('SELECT * FROM update_lesson_progress_atomically($1,$2,$3,$4)', [user, lesson, status, time])).rows[0]
    const complete = async lesson => (await db.query("SELECT * FROM complete_lesson_atomically($1,$2,'2026-10-21T08:00:00Z','2026-10-21')", [user, lesson])).rows[0]
    assert.equal((await update(lessons[0], 'in_progress', 2)).time_spent, 2)
    assert.equal((await update(lessons[0], 'in_progress', 3)).time_spent, 5)
    assert.equal((await complete(lessons[0])).was_first_completion, true)
    assert.equal((await complete(lessons[0])).was_first_completion, false)
    assert.equal((await update(lessons[0], 'not_started', 99)).status, 'completed')
    assert.equal((await complete(lessons[1])).was_first_completion, true)
    assert.equal((await db.query('SELECT points FROM user_profiles')).rows[0].points, 200)
    assert.deepEqual((await db.query('SELECT lessons_completed,points_earned FROM user_daily_activity')).rows, [{ lessons_completed: 2, points_earned: 200 }])
    await db.exec(`CREATE FUNCTION reject_reward() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END; $$;
      CREATE TRIGGER reject_reward BEFORE INSERT ON user_daily_activity FOR EACH ROW EXECUTE FUNCTION reject_reward();`)
    await assert.rejects(complete(lessons[2]), /injected failure/)
    assert.equal((await db.query('SELECT count(*)::int AS count FROM user_progress WHERE lesson_id=$1', [lessons[2]])).rows[0].count, 0)
    assert.equal((await db.query('SELECT points FROM user_profiles')).rows[0].points, 200)
  } finally { await db.close() }
})
