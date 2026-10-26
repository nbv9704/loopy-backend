// Explicit opt-in only. Never loads .env or falls back to DATABASE_URL/Supabase.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { Client } = require('pg')
const { getMigrationPlan, applyMigrationPlan } = require('../../dist/db/migrations')

const actor = '00000000-0000-4000-8000-000000000001'
const root = path.join(__dirname, '..')

test('PostgreSQL migration runner and transactions with independent connections', { timeout: 30000 }, async t => {
  const url = new URL(process.env.LOOPY_TEST_DATABASE_URL || 'http://unset.invalid')
  assert.equal(process.env.LOOPY_DISPOSABLE_DATABASE, 'true', 'Explicit disposable-database opt-in required')
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol), 'A PostgreSQL test URL is required')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Only a loopback test server is accepted')
  assert.match(url.pathname, /^\/loopy_test_[a-z0-9_]+$/, 'Test database name must start with loopy_test_')
  const clients = [0, 1, 2].map(() => new Client({ connectionString: url.toString(),
    connectionTimeoutMillis: 5000, statement_timeout: 5000, lock_timeout: 4000 }))
  const [control, first, second] = clients
  try {
    await Promise.all(clients.map(client => client.connect()))
    const { rows } = await control.query(`SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema')
      UNION ALL SELECT 1 WHERE to_regnamespace('auth') IS NOT NULL LIMIT 1`)
    assert.equal(rows.length, 0, 'Test refuses an existing schema; create a fresh disposable database')
    await control.query(`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin; END IF;
      END $$;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
    await t.test('bootstraps the reviewed plan using the actual pg runner and ledger', async () => {
      const plan = getMigrationPlan(true)
      await applyMigrationPlan(control, plan, true)
      assert.equal((await control.query('SELECT count(*)::int AS count FROM loopy_schema_migrations')).rows[0].count, plan.length)
      await applyMigrationPlan(control, getMigrationPlan())
      assert.deepEqual((await control.query('SELECT loopy_schema_status() AS status')).rows[0].status,
        { progress: true, import: true, practice: true, pvp: true, pvpSubmissions: true, pvpLifecycle: true, pvpMatchmaking: true, lessonChecks: true, cms: true, dataBoundaries: true })
      await control.query(readFileSync(path.join(root, 'checks/preflight.sql'), 'utf8'))
    })
    await control.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [actor, 'concurrency@example.test'])
    await control.query("INSERT INTO languages(id,name,display_name,icon) VALUES ('javascript','JavaScript','JavaScript','js')")
    const chapter = (await control.query("INSERT INTO chapters(language_id,chapter_number,title,order_index) VALUES ('javascript',1,'Concurrency',0) RETURNING id")).rows[0].id
    const lessons = []
    for (let index = 0; index < 4; index++) lessons.push((await control.query(
      "INSERT INTO lessons(chapter_id,lesson_id,title,order_index,status) VALUES ($1,$2,'Test',$3,'published') RETURNING id",
      [chapter, `test-${index}`, index])).rows[0].id)
    const firstPid = (await first.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
    const secondPid = (await second.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
    const waitForContention = async (getFailure = () => undefined) => {
      const deadline = Date.now() + 2500
      do {
        const failure = getFailure()
        if (failure) throw failure
        const result = await control.query('SELECT $2::int = ANY(pg_blocking_pids($1::int)) AS blocked', [secondPid, firstPid])
        if (result.rows[0].blocked) return
        await new Promise(resolve => setTimeout(resolve, 10))
      } while (Date.now() < deadline)
      assert.fail('The second connection never waited on the first transaction')
    }
    const race = async (heldOperation, waitingOperation, verify) => {
      await first.query('BEGIN')
      let pending
      try {
        const initial = await heldOperation()
        pending = waitingOperation()
        // Install a rejection handler immediately while inspecting pg_blocking_pids.
        let waitingError
        pending.catch(error => { waitingError = error })
        await waitForContention(() => waitingError)
        await first.query('COMMIT')
        await verify(initial, pending)
      } finally {
        await first.query('ROLLBACK')
        if (pending) await pending.catch(() => {})
      }
    }
    const revision = async lesson => (await control.query('SELECT content_revision FROM lessons WHERE id=$1', [lesson])).rows[0].content_revision
    const check = async (client, lesson, passed = true, version) => (await client.query(
      'SELECT record_lesson_check($1,$2,$3,$4,$5,1) AS receipt',
      [actor, lesson, version ?? await revision(lesson), 'saved-code', { passed, score: passed ? 100 : 0, checks: [] }])).rows[0].receipt
    const receipts = new Map()
    for (const lesson of lessons) receipts.set(lesson, (await check(control, lesson)).id)
    const complete = async (client, lesson, receipt = receipts.get(lesson)) => (await client.query(
      "SELECT * FROM complete_checked_lesson_atomically($1,$2,$3,'2026-10-21T08:00:00Z','2026-10-21')", [actor, lesson, receipt])).rows[0]
    const freshLesson = async () => (await control.query(
      "INSERT INTO lessons(chapter_id,lesson_id,title,order_index,status) VALUES ($1,gen_random_uuid()::text,'Check race',0,'published') RETURNING id", [chapter])).rows[0].id
    await t.test('same lesson contention produces exactly one first completion/reward', async () => {
      await race(() => complete(first, lessons[0]), () => complete(second, lessons[0]), async (initial, pending) => {
        assert.equal(initial.was_first_completion, true)
        assert.equal((await pending).was_first_completion, false)
      })
      assert.equal((await control.query('SELECT points FROM user_profiles WHERE id=$1', [actor])).rows[0].points, 100)
    })
    await t.test('different lesson completions do not lose shared points/daily increments', async () => {
      await race(() => complete(first, lessons[1]), () => complete(second, lessons[2]), async (initial, pending) => {
        assert.equal(initial.was_first_completion, true)
        assert.equal((await pending).was_first_completion, true)
      })
      assert.equal((await control.query('SELECT points FROM user_profiles WHERE id=$1', [actor])).rows[0].points, 300)
      assert.deepEqual((await control.query('SELECT lessons_completed,points_earned FROM user_daily_activity WHERE user_id=$1', [actor])).rows[0],
        { lessons_completed: 3, points_earned: 300 })
    })
    await t.test('a late progress update cannot downgrade a concurrently completed lesson', async () => {
      await race(() => complete(first, lessons[3]), async () => (await second.query(
        "SELECT * FROM update_lesson_progress_atomically($1,$2,'in_progress',20)", [actor, lessons[3]])).rows[0],
      async (_initial, pending) => { assert.equal((await pending).status, 'completed') })
    })
    await t.test('a failed check committed before completion invalidates the earlier pass', async () => {
      const lesson = await freshLesson()
      const passed = await check(control, lesson)
      await race(() => check(first, lesson, false), () => complete(second, lesson, passed.id),
        async (_initial, pending) => { await assert.rejects(pending, /Check the current lesson/) })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM user_progress WHERE lesson_id=$1', [lesson])).rows[0].count, 0)
    })
    await t.test('completion committed first remains idempotent after a queued failed check', async () => {
      const lesson = await freshLesson()
      const passed = await check(control, lesson)
      await race(() => complete(first, lesson, passed.id), () => check(second, lesson, false), async (initial, pending) => {
        assert.equal(initial.was_first_completion, true)
        await pending
      })
      assert.equal((await complete(control, lesson, passed.id)).was_first_completion, false)
    })
    await t.test('content update committed first rejects an in-flight old check with no submission', async () => {
      const lesson = await freshLesson()
      const version = await revision(lesson)
      await race(() => first.query("UPDATE lessons SET title='New content' WHERE id=$1", [lesson]),
        () => check(second, lesson, true, version), async (_initial, pending) => { await assert.rejects(pending, /content changed/) })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM lesson_submissions WHERE lesson_id=$1', [lesson])).rows[0].count, 0)
    })
    await t.test('an in-flight check holds the content version until its receipt commits', async () => {
      const lesson = await freshLesson()
      await race(() => check(first, lesson), () => second.query("INSERT INTO lesson_steps(lesson_id,type,prompt,order_index) VALUES ($1,'note','Changed',0)", [lesson]),
        async (initial, pending) => {
          await pending
          await assert.rejects(complete(control, lesson, initial.id), /Check the current lesson/)
        })
    })
    await t.test('a test-case update committed before completion invalidates the passed receipt', async () => {
      const lesson = await freshLesson()
      const testcase = (await control.query("INSERT INTO lesson_test_cases(lesson_id,input,expected_output,description,order_index) VALUES ($1,'null','1','Case',0) RETURNING id", [lesson])).rows[0].id
      const passed = await check(control, lesson)
      await race(() => first.query("UPDATE lesson_test_cases SET expected_output='2' WHERE id=$1", [testcase]),
        () => complete(second, lesson, passed.id), async (_initial, pending) => { await assert.rejects(pending, /Check the current lesson/) })
    })
    await t.test('a content update waits for successful completion and cannot award twice', async () => {
      const lesson = await freshLesson()
      const passed = await check(control, lesson)
      await race(() => complete(first, lesson, passed.id), () => second.query("UPDATE lessons SET title='Edited later' WHERE id=$1", [lesson]),
        async (initial, pending) => { assert.equal(initial.was_first_completion, true); await pending })
      assert.equal((await complete(control, lesson, passed.id)).was_first_completion, false)
    })
    const seekers = [31,32,33,34,35,36].map(n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`)
    for (const seeker of seekers) {
      await control.query('INSERT INTO auth.users(id) VALUES ($1)', [seeker])
      await control.query('UPDATE user_profiles SET onboarding_completed=true WHERE id=$1', [seeker])
      await control.query("INSERT INTO user_progress(user_id,lesson_id,status) VALUES ($1,$2,'completed')", [seeker, lessons[0]])
    }
    const officialBank = (await control.query("INSERT INTO practice_sets(created_by,title,language_id,difficulty,visibility,status) VALUES ($1,'Matchmaking','javascript','medium','official','published') RETURNING id", [actor])).rows[0].id
    await control.query("INSERT INTO practice_questions(set_id,type,prompt,correct_answer,order_index) VALUES ($1,'true_false','Question','true',0)", [officialBank])
    const findMatch = async (client, seeker) => (await client.query("SELECT matchmake_pvp_atomically($1,'1v1','javascript','medium') AS data", [seeker])).rows[0].data
    await t.test('concurrent matchmaking retries for one user share one membership and room', async () => {
      await race(() => findMatch(first, seekers[0]), () => findMatch(second, seekers[0]), async (initial, pending) => {
        const retry = await pending
        assert.equal(initial.created,true)
        assert.equal(retry.replayed,true)
        assert.equal(retry.match.id,initial.match.id)
      })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM pvp_participants WHERE user_id=$1', [seekers[0]])).rows[0].count,1)
    })
    await t.test('two seekers queued behind a transaction fill the same waiting room without overcapacity', async () => {
      await race(() => findMatch(first, seekers[1]), () => findMatch(second, seekers[2]), async (initial, pending) => {
        const next = await pending
        assert.equal(initial.match.participants.length,2)
        assert.notEqual(next.match.id,initial.match.id)
        assert.equal(next.created,true)
      })
      const overfull = await control.query('SELECT id FROM pvp_matches m WHERE (SELECT count(*) FROM pvp_participants p WHERE p.match_id=m.id)>m.max_players')
      assert.equal(overfull.rows.length,0)
    })
    await t.test('a manual join taking the final seat causes matchmaking to create another room', async () => {
      const before = await findMatch(control,seekers[2])
      await race(() => first.query('SELECT join_pvp_match_atomically($1,$2)', [before.match.id,seekers[3]]),
        () => findMatch(second,seekers[4]), async (_initial,pending) => {
          const result = await pending
          assert.notEqual(result.match.id,before.match.id)
          assert.equal(result.created,true)
        })
    })
    await t.test('simultaneous seekers entering an empty queue meet in one newly committed room', async () => {
      await control.query("UPDATE pvp_matches SET status='cancelled' WHERE status='waiting'")
      await race(() => findMatch(first,seekers[4]), () => findMatch(second,seekers[5]), async (initial,pending) => {
        const result = await pending
        assert.equal(initial.created,true)
        assert.equal(result.created,false)
        assert.equal(result.match.id,initial.match.id)
        assert.equal(result.match.participants.length,2)
      })
    })
    const payload = { title: 'Concurrency set', visibility: 'public', status: 'published', questions: [
      { type: 'true_false', prompt: 'First', correct_answer: 'true', points: 10 },
      { type: 'fill_blank', prompt: 'Second', correct_answer: 'answer', points: 10 },
    ] }
    const save = async (client, id = null, data = payload) => (await client.query('SELECT save_practice_set_atomically($1,$2,$3) AS id', [actor, id, data])).rows[0].id
    const start = async (client, id) => (await client.query('SELECT start_practice_attempt_atomically($1,$2) AS data', [id, actor])).rows[0].data
    const submit = async (client, attempt, question, answer) => (await client.query(
      'SELECT submit_practice_answer_atomically($1,$2,$3,$4) AS data', [attempt, question, actor, answer])).rows[0].data
    await t.test('submitting different questions concurrently preserves the total score', async () => {
      const id = await save(control)
      const { attempt, questions } = await start(control, id)
      await race(() => submit(first, attempt.id, questions[0].id, 'true'),
        () => submit(second, attempt.id, questions[1].id, 'answer'), async (initial, pending) => {
          assert.equal(initial.attempt.score, 10)
          const final = await pending
          assert.equal(final.attempt.score, 20)
          assert.equal(final.attempt.status, 'completed')
        })
    })
    await t.test('concurrent identical retries produce one question submission', async () => {
      const id = await save(control)
      const { attempt, questions } = await start(control, id)
      await race(() => submit(first, attempt.id, questions[0].id, 'true'),
        () => submit(second, attempt.id, questions[0].id, 'true'), async (initial, pending) => {
          const retried = await pending
          assert.equal(retried.submission.id, initial.submission.id)
          assert.equal(retried.attempt.score, 10)
        })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM practice_submissions WHERE attempt_id=$1', [attempt.id])).rows[0].count, 1)
    })
    await t.test('an in-flight start protects question history against an edit', async () => {
      const id = await save(control)
      await race(() => start(first, id), () => save(second, id), async (initial, pending) => {
        await assert.rejects(pending, /referenced/)
        const actual = (await control.query('SELECT id FROM practice_questions WHERE set_id=$1 ORDER BY order_index', [id])).rows.map(row => row.id)
        assert.deepEqual(actual, initial.questions.map(q => q.id))
      })
    })
    await t.test('a start waiting for an edit receives the committed new questions', async () => {
      const id = await save(control)
      const before = (await control.query('SELECT id FROM practice_questions WHERE set_id=$1', [id])).rows.map(row => row.id)
      await race(() => save(first, id, { ...payload, title: 'Edited' }), () => start(second, id), async (_initial, pending) => {
        const result = await pending
        assert.equal(result.questions.length, 2)
        assert.ok(result.questions.every(q => !before.includes(q.id)))
      })
    })
    await t.test('an in-flight PvP reference prevents replacing its questions', async () => {
      const id = await save(control)
      const ids = (await control.query('SELECT id FROM practice_questions WHERE set_id=$1 ORDER BY order_index', [id])).rows.map(row => row.id)
      await race(() => first.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('race01',$1)", [ids]),
        () => save(second, id), async (_initial, pending) => { await assert.rejects(pending, /referenced/) })
      assert.deepEqual((await control.query('SELECT id FROM practice_questions WHERE set_id=$1 ORDER BY order_index', [id])).rows.map(row => row.id), ids)
    })
    await t.test('a PvP insert waiting for an edit rejects stale question IDs', async () => {
      const id = await save(control)
      const ids = (await control.query('SELECT id FROM practice_questions WHERE set_id=$1', [id])).rows.map(row => row.id)
      await race(() => save(first, id),
        () => second.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('race02',$1)", [ids]),
        async (_initial, pending) => { await assert.rejects(pending, /stale/) })
      assert.equal((await control.query("SELECT count(*)::int AS count FROM pvp_matches WHERE room_code='race02'")).rows[0].count, 0)
    })
    const rival = '00000000-0000-4000-8000-000000000002'
    await control.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [rival, 'rival@example.test'])
    let pvpSerial = 0
    const phase = async (client, match, open) => (await client.query('SELECT set_pvp_question_phase($1,0,$2) AS data', [match, open])).rows[0].data
    const freshPvP = async () => {
      const set = await save(control)
      const question = (await control.query('SELECT id FROM practice_questions WHERE set_id=$1 AND order_index=0', [set])).rows[0].id
      const match = (await control.query("INSERT INTO pvp_matches(room_code,question_ids,status,time_per_question) VALUES ($1,$2,'in_progress',60) RETURNING id",
        [`pv${String(++pvpSerial).padStart(4, '0')}`, [question]])).rows[0].id
      for (const user of [actor, rival]) await control.query('INSERT INTO pvp_participants(match_id,user_id) VALUES ($1,$2)', [match, user])
      await phase(control, match, true)
      return { match, question }
    }
    const pvpSubmit = async (client, match, question, user = actor) => (await client.query(
      'SELECT submit_pvp_answer_atomically($1,$2,$3,$4) AS data',
      [match, user, question, { submission_type: 'multiple_choice', selected_answer: 'true' }])).rows[0].data
    await t.test('simultaneous correct PvP answers award the first-answer bonus exactly once', async () => {
      const { match, question } = await freshPvP()
      await race(() => pvpSubmit(first, match, question), () => pvpSubmit(second, match, question, rival), async (initial, pending) => {
        assert.equal(initial.points_earned, 40)
        assert.equal((await pending).points_earned, 30)
      })
      assert.equal((await control.query('SELECT sum(total_score)::int AS score FROM pvp_participants WHERE match_id=$1', [match])).rows[0].score, 70)
    })
    await t.test('concurrent PvP retries return one saved submission and one score increment', async () => {
      const { match, question } = await freshPvP()
      await race(() => pvpSubmit(first, match, question), () => pvpSubmit(second, match, question), async (initial, pending) => {
        const retried = await pending
        assert.equal(retried.id, initial.id)
        assert.equal(retried._replayed, true)
      })
      assert.deepEqual((await control.query('SELECT total_score,questions_answered FROM pvp_participants WHERE match_id=$1 AND user_id=$2', [match, actor])).rows[0],
        { total_score: 40, questions_answered: 1 })
    })
    await t.test('closing a PvP round wins against a queued new submission', async () => {
      const { match, question } = await freshPvP()
      await race(() => phase(first, match, false), () => pvpSubmit(second, match, question),
        async (initial, pending) => {
          assert.equal(initial.changed, true)
          await assert.rejects(pending, /no longer accepting/)
        })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM pvp_submissions WHERE match_id=$1', [match])).rows[0].count, 0)
    })
    await t.test('a queued close waits for the accepted PvP submission and score to commit', async () => {
      const { match, question } = await freshPvP()
      await race(() => pvpSubmit(first, match, question), () => phase(second, match, false),
        async (initial, pending) => { assert.equal(initial.points_earned, 40); assert.equal((await pending).changed, true) })
      const retried = await pvpSubmit(control, match, question)
      assert.equal(retried._replayed, true)
      assert.equal((await control.query('SELECT total_score FROM pvp_participants WHERE match_id=$1 AND user_id=$2', [match, actor])).rows[0].total_score, 40)
    })
    const third = '00000000-0000-4000-8000-000000000003'
    await control.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [third, 'third@example.test'])
    for (const user of [actor, rival, third]) {
      await control.query('UPDATE user_profiles SET onboarding_completed=TRUE WHERE id=$1', [user])
      await control.query('SELECT * FROM complete_lesson_atomically($1,$2,now(),current_date)', [user, lessons[0]])
    }
    const transition = async (client, name, match, user) => (await client.query(`SELECT ${name}($1,$2) AS data`, [match, user])).rows[0].data
    const waitingPvP = async () => {
      const { match, question } = await freshPvP()
      await control.query("UPDATE pvp_matches SET status='waiting',question_started_at=NULL,question_closed_at=NULL,question_started_index=NULL WHERE id=$1", [match])
      await control.query('DELETE FROM pvp_participants WHERE match_id=$1', [match])
      return { match, question }
    }
    await t.test('two concurrent joins cannot take the same last seat', async () => {
      const { match } = await waitingPvP()
      await transition(control, 'join_pvp_match_atomically', match, actor)
      await race(() => transition(first, 'join_pvp_match_atomically', match, rival),
        () => transition(second, 'join_pvp_match_atomically', match, third), async (_initial, pending) => { await assert.rejects(pending, /full/) })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM pvp_participants WHERE match_id=$1', [match])).rows[0].count, 2)
    })
    await t.test('simultaneous ready requests start a match exactly once', async () => {
      const { match } = await waitingPvP()
      for (const user of [actor, rival]) await transition(control, 'join_pvp_match_atomically', match, user)
      await race(() => transition(first, 'ready_pvp_match_atomically', match, actor),
        () => transition(second, 'ready_pvp_match_atomically', match, rival), async (initial, pending) => {
          assert.equal(initial.started, false)
          assert.equal((await pending).started, true)
        })
      assert.equal((await transition(control, 'ready_pvp_match_atomically', match, actor)).started, false)
    })
    await t.test('disconnect waiting for start preserves the active participant record', async () => {
      const { match } = await waitingPvP()
      for (const user of [actor, rival]) await transition(control, 'join_pvp_match_atomically', match, user)
      await transition(control, 'ready_pvp_match_atomically', match, actor)
      await race(() => transition(first, 'ready_pvp_match_atomically', match, rival),
        () => transition(second, 'disconnect_pvp_participant', match, actor), async (initial, pending) => {
          assert.equal(initial.started, true)
          assert.equal((await pending).status, 'in_progress')
        })
      assert.equal((await control.query('SELECT count(*)::int AS count FROM pvp_participants WHERE match_id=$1', [match])).rows[0].count, 2)
    })
    await t.test('concurrent finish callbacks persist ranks and career totals exactly once', async () => {
      const { match } = await freshPvP()
      await phase(control, match, false)
      const before = (await control.query('SELECT total_matches FROM pvp_user_stats WHERE user_id=$1', [actor])).rows[0].total_matches
      await race(() => transition(first, 'finish_pvp_match_atomically', match, null),
        () => transition(second, 'finish_pvp_match_atomically', match, null), async (initial, pending) => {
          assert.equal(initial.changed, true)
          assert.equal((await pending).changed, false)
        })
      assert.equal((await control.query('SELECT total_matches FROM pvp_user_stats WHERE user_id=$1', [actor])).rows[0].total_matches, before + 1)
    })
    await t.test('a reconnect committed before forfeit prevents a stale timeout from ending the match', async () => {
      const { match } = await freshPvP()
      await transition(control, 'disconnect_pvp_participant', match, actor)
      await race(() => transition(first, 'join_pvp_match_atomically', match, actor),
        () => transition(second, 'finish_pvp_match_atomically', match, actor), async (_initial, pending) => {
          assert.deepEqual(await pending, { changed: false, forfeited: false })
        })
      assert.equal((await control.query('SELECT status FROM pvp_matches WHERE id=$1', [match])).rows[0].status, 'in_progress')
    })
    await t.test('a forfeit committed first rejects a late reconnect and preserves the zero-score winner', async () => {
      const { match } = await freshPvP()
      await transition(control, 'disconnect_pvp_participant', match, actor)
      await race(() => transition(first, 'finish_pvp_match_atomically', match, actor),
        () => transition(second, 'join_pvp_match_atomically', match, actor), async (initial, pending) => {
          assert.equal(initial.changed, true)
          await assert.rejects(pending, /ended/)
        })
      assert.equal((await control.query('SELECT winner_id FROM pvp_matches WHERE id=$1', [match])).rows[0].winner_id, rival)
    })
    await control.query('UPDATE user_profiles SET is_admin=true WHERE id=$1', [actor])
    const cmsImport = (client, group, value, rich = false) => client.query('SELECT import_cms_content_atomically($1,$2,$3) AS result', [actor, 'vi', JSON.stringify([
      { category: group, key: 'title', value, ...(rich ? { type: 'markdown', description: 'Keep metadata' } : {}) },
    ])])
    const cmsRow = async group => (await control.query("SELECT i.* FROM content_items i JOIN content_categories c ON c.id=i.category_id WHERE c.name=$1 AND i.key='title'", [group])).rows[0]
    await t.test('simultaneous CMS edits using the same revision cannot overwrite the committed winner', async () => {
      await cmsImport(control, 'cms-cas', 'Original')
      const item = await cmsRow('cms-cas')
      await race(() => first.query('UPDATE content_items SET value=$1 WHERE id=$2 AND revision=$3 RETURNING revision', ['Winner', item.id, item.revision]),
        () => second.query('UPDATE content_items SET value=$1 WHERE id=$2 AND revision=$3 RETURNING revision', ['Stale', item.id, item.revision]), async (initial, pending) => {
          assert.equal(initial.rows[0].revision, item.revision + 1)
          assert.equal((await pending).rowCount, 0)
        })
      assert.equal((await cmsRow('cms-cas')).value, 'Winner')
    })
    await t.test('concurrent CMS imports serialize new categories and preserve rich metadata on v1 retry', async () => {
      await race(() => cmsImport(first, 'cms-new-category', 'First', true),
        () => cmsImport(second, 'cms-new-category', 'Second'), async (initial, pending) => {
          assert.equal(initial.rows[0].result.imported, 1)
          assert.equal((await pending).rows[0].result.imported, 1)
        })
      const item = await cmsRow('cms-new-category')
      assert.equal(item.value, 'Second'); assert.equal(item.revision, 1)
      assert.equal(item.description, 'Keep metadata'); assert.equal(item.type, 'markdown')
      assert.equal((await control.query("SELECT count(*)::int AS n FROM content_categories WHERE name='cms-new-category'")).rows[0].n, 1)
    })
    await t.test('a stale CMS delete queued behind an import cannot delete the newly imported value', async () => {
      await cmsImport(control, 'cms-delete-race', 'Original')
      const item = await cmsRow('cms-delete-race')
      await race(() => cmsImport(first, 'cms-delete-race', 'Updated'),
        () => second.query('DELETE FROM content_items WHERE id=$1 AND revision=$2 RETURNING id', [item.id, item.revision]), async (_initial, pending) => {
          assert.equal((await pending).rowCount, 0)
        })
      assert.equal((await cmsRow('cms-delete-race')).value, 'Updated')
    })
  } finally { await Promise.allSettled(clients.map(client => client.end())) }
})
