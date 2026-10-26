const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('atomic PvP submissions against the full reviewed schema', async t => {
  const db = new PGlite()
  const actors = [1, 2, 3].map(n => `00000000-0000-4000-8000-00000000000${n}`)
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS 'SELECT current_user::text';`)
    const root = path.join(__dirname, '..')
    const plan = JSON.parse(readFileSync(path.join(root, 'migration-plan.json'), 'utf8'))
    for (const name of [...plan.bootstrap, ...plan.forward]) await db.exec(readFileSync(path.join(root, name), 'utf8'))
    for (const actor of actors) await db.query('INSERT INTO auth.users(id,email) VALUES ($1,$2)', [actor, `${actor}@example.test`])
    const set = (await db.query('SELECT save_practice_set_atomically($1,NULL,$2) AS id', [actors[0], {
      title: 'PvP test', visibility: 'public', status: 'published', questions: [
        { type: 'multiple_choice', prompt: 'Choose two', options: ['one', 'two'], correct_answer: 'two', points: 10 },
        { type: 'true_false', prompt: 'True', correct_answer: 'true', points: 10 },
        { type: 'fill_blank', prompt: 'Fill', correct_answer: 'hello', points: 10 },
      ],
    }])).rows[0].id
    const questions = (await db.query('SELECT id FROM practice_questions WHERE set_id=$1 ORDER BY order_index', [set])).rows.map(q => q.id)
    let serial = 0
    const phase = async (match, index, open) => (await db.query('SELECT set_pvp_question_phase($1,$2,$3) AS data', [match, index, open])).rows[0].data
    const fresh = async (ids = questions) => {
      const match = (await db.query("INSERT INTO pvp_matches(room_code,question_ids,status,time_per_question) VALUES ($1,$2,'in_progress',60) RETURNING id",
        [`p${String(++serial).padStart(5, '0')}`, ids])).rows[0].id
      for (const actor of actors.slice(0, 2)) await db.query('INSERT INTO pvp_participants(match_id,user_id) VALUES ($1,$2)', [match, actor])
      await phase(match, 0, true)
      return match
    }
    const submit = async (match, actor, question, answer, extra = {}) => (await db.query(
      'SELECT submit_pvp_answer_atomically($1,$2,$3,$4) AS data', [match, actor, question,
        { submission_type: 'multiple_choice', selected_answer: answer, ...extra }])).rows[0].data
    const scores = async match => (await db.query('SELECT total_score,questions_answered,correct_answers FROM pvp_participants WHERE match_id=$1 ORDER BY user_id', [match])).rows
    const transition = async (name, match, actor) => (await db.query(`SELECT ${name}($1,$2) AS data`, [match, actor])).rows[0].data
    await t.test('join enforces capacity/eligibility, rejoin is idempotent and ended rooms reject reconnects', async () => {
      await db.exec("INSERT INTO languages(id,name,display_name,icon) VALUES ('javascript','JS','JS','js')")
      const chapter = (await db.query("INSERT INTO chapters(language_id,chapter_number,title,order_index) VALUES ('javascript',1,'Test',0) RETURNING id")).rows[0].id
      const lesson = (await db.query("INSERT INTO lessons(chapter_id,lesson_id,title,order_index,status) VALUES ($1,'eligible','Test',0,'published') RETURNING id", [chapter])).rows[0].id
      for (const actor of actors) {
        await db.query("UPDATE user_profiles SET onboarding_completed=TRUE WHERE id=$1", [actor])
        await db.query("SELECT * FROM complete_lesson_atomically($1,$2,now(),current_date)", [actor, lesson])
      }
      const match = (await db.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('join01',$1) RETURNING id", [[questions[0]]])).rows[0].id
      const first = await transition('join_pvp_match_atomically', match, actors[0])
      assert.equal((await transition('join_pvp_match_atomically', match, actors[0])).id, first.id)
      await transition('join_pvp_match_atomically', match, actors[1])
      await assert.rejects(transition('join_pvp_match_atomically', match, actors[2]), /full/)
      await db.query("UPDATE pvp_matches SET status='cancelled' WHERE id=$1", [match])
      await assert.rejects(transition('join_pvp_match_atomically', match, actors[0]), /ended/)
      const other = (await db.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('join02',$1) RETURNING id", [[questions[0]]])).rows[0].id
      await db.query('UPDATE user_profiles SET onboarding_completed=FALSE WHERE id=$1', [actors[2]])
      await assert.rejects(transition('join_pvp_match_atomically', other, actors[2]), /onboarding/)
      await db.query('UPDATE user_profiles SET onboarding_completed=TRUE WHERE id=$1', [actors[2]])
    })
    await t.test('ready starts once with connected players; disconnect cannot delete an active participant', async () => {
      const match = (await db.query("INSERT INTO pvp_matches(room_code,question_ids) VALUES ('ready1',$1) RETURNING id", [[questions[0]]])).rows[0].id
      await transition('join_pvp_match_atomically', match, actors[0])
      assert.equal((await transition('ready_pvp_match_atomically', match, actors[0])).started, false)
      await transition('join_pvp_match_atomically', match, actors[1])
      assert.equal((await transition('ready_pvp_match_atomically', match, actors[1])).started, true)
      assert.equal((await transition('ready_pvp_match_atomically', match, actors[0])).started, false)
      await transition('disconnect_pvp_participant', match, actors[1])
      assert.equal((await db.query('SELECT count(*)::int AS count FROM pvp_participants WHERE match_id=$1', [match])).rows[0].count, 2)
      await assert.rejects(transition('ready_pvp_match_atomically', match, actors[1]), /Connected/)
      await transition('join_pvp_match_atomically', match, actors[1])
      assert.deepEqual(await transition('finish_pvp_match_atomically', match, actors[1]), { changed: false, forfeited: false })
    })
    await t.test('zero-score forfeit gives the remaining player a win and cannot be replayed or rejoined', async () => {
      const match = await fresh([questions[0]])
      await transition('disconnect_pvp_participant', match, actors[0])
      const before = (await db.query('SELECT total_matches FROM pvp_user_stats WHERE user_id=$1', [actors[1]])).rows[0].total_matches
      assert.deepEqual(await transition('finish_pvp_match_atomically', match, actors[0]), { changed: true, forfeited: true })
      assert.deepEqual((await db.query('SELECT status,winner_id FROM pvp_matches WHERE id=$1', [match])).rows[0], { status: 'completed', winner_id: actors[1] })
      assert.deepEqual((await db.query('SELECT final_rank FROM pvp_participants WHERE match_id=$1 ORDER BY user_id', [match])).rows.map(p => p.final_rank), [2, 1])
      assert.equal((await db.query('SELECT total_matches FROM pvp_user_stats WHERE user_id=$1', [actors[1]])).rows[0].total_matches, before + 1)
      assert.equal((await transition('finish_pvp_match_atomically', match, actors[0])).changed, false)
      assert.equal((await db.query('SELECT total_matches FROM pvp_user_stats WHERE user_id=$1', [actors[1]])).rows[0].total_matches, before + 1)
      await assert.rejects(transition('join_pvp_match_atomically', match, actors[0]), /ended/)
    })
    await t.test('multiple-player forfeit keeps the match open and excludes that player from new submissions', async () => {
      const match = await fresh([questions[0]])
      await db.query("UPDATE pvp_matches SET mode='battle_royale',max_players=3 WHERE id=$1", [match])
      await db.query('INSERT INTO pvp_participants(match_id,user_id) VALUES ($1,$2)', [match, actors[2]])
      await transition('disconnect_pvp_participant', match, actors[0])
      assert.deepEqual(await transition('finish_pvp_match_atomically', match, actors[0]), { changed: false, forfeited: true })
      await assert.rejects(transition('join_pvp_match_atomically', match, actors[0]), /forfeited/)
      await assert.rejects(submit(match, actors[0], questions[0], 'B'), /Not a participant/)
      const beforeLost = (await db.query('SELECT matches_lost FROM pvp_user_stats WHERE user_id=$1', [actors[0]])).rows[0].matches_lost
      const answer = await submit(match, actors[1], questions[0], 'A')
      assert.equal(answer._participant_count, 2)
      assert.equal(answer.points_earned, 0)
      await submit(match, actors[2], questions[0], 'A')
      await phase(match, 0, false)
      await transition('finish_pvp_match_atomically', match, null)
      assert.equal((await db.query('SELECT winner_id FROM pvp_matches WHERE id=$1', [match])).rows[0].winner_id, null)
      assert.equal((await db.query('SELECT matches_lost FROM pvp_user_stats WHERE user_id=$1', [actors[0]])).rows[0].matches_lost, beforeLost + 1)
    })
    await t.test('all disconnected players forfeit into cancellation rather than an offline winner', async () => {
      const match = await fresh([questions[0]])
      for (const actor of actors.slice(0, 2)) await transition('disconnect_pvp_participant', match, actor)
      assert.equal((await transition('finish_pvp_match_atomically', match, actors[0])).changed, false)
      assert.equal((await transition('finish_pvp_match_atomically', match, actors[1])).changed, true)
      assert.deepEqual((await db.query('SELECT status,winner_id FROM pvp_matches WHERE id=$1', [match])).rows[0], { status: 'cancelled', winner_id: null })
    })
    await t.test('normal finish requires the last closed round and preserves draws', async () => {
      const match = await fresh([questions[0]])
      await assert.rejects(transition('finish_pvp_match_atomically', match, null), /Final round/)
      await phase(match, 0, false)
      assert.equal((await transition('finish_pvp_match_atomically', match, null)).changed, true)
      assert.deepEqual((await db.query('SELECT status,winner_id FROM pvp_matches WHERE id=$1', [match])).rows[0], { status: 'completed', winner_id: null })
    })
    await t.test('career answered/correct totals follow saved submissions and completion retry does not add them twice', async () => {
      const match = await fresh([questions[0]])
      const before = (await db.query('SELECT total_questions_answered,correct_answers FROM pvp_user_stats WHERE user_id=$1', [actors[0]])).rows[0]
      await submit(match, actors[0], questions[0], 'B')
      await phase(match, 0, false)
      await transition('finish_pvp_match_atomically', match, null)
      await transition('finish_pvp_match_atomically', match, null)
      assert.deepEqual((await db.query('SELECT total_questions_answered,correct_answers FROM pvp_user_stats WHERE user_id=$1', [actors[0]])).rows[0],
        { total_questions_answered: before.total_questions_answered + 1, correct_answers: before.correct_answers + 1 })
    })
    await t.test('rank/status/career-stat failure rolls back forfeit and every affected record', async () => {
      const match = await fresh([questions[0]])
      await transition('disconnect_pvp_participant', match, actors[0])
      await db.exec(`CREATE FUNCTION fail_career() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected career failure'; END; $$;
        CREATE TRIGGER fail_career BEFORE UPDATE ON pvp_user_stats FOR EACH ROW EXECUTE FUNCTION fail_career();`)
      try { await assert.rejects(transition('finish_pvp_match_atomically', match, actors[0]), /injected career/) }
      finally { await db.exec('DROP TRIGGER fail_career ON pvp_user_stats') }
      assert.equal((await db.query('SELECT status FROM pvp_matches WHERE id=$1', [match])).rows[0].status, 'in_progress')
      assert.ok((await db.query('SELECT left_at,final_rank FROM pvp_participants WHERE match_id=$1', [match])).rows.every(p => p.left_at === null && p.final_rank === null))
    })
    await t.test('lifecycle RPCs are service-only', async () => {
      const match = await fresh([questions[0]])
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`)
        for (const name of ['join_pvp_match_atomically', 'ready_pvp_match_atomically', 'disconnect_pvp_participant', 'finish_pvp_match_atomically']) {
          await assert.rejects(transition(name, match, actors[0]), /permission denied/)
        }
        await db.exec('RESET ROLE')
      }
      await db.exec('SET ROLE service_role')
      await phase(match, 0, false)
      assert.equal((await transition('finish_pvp_match_atomically', match, null)).changed, true)
      await db.exec('RESET ROLE')
    })
    await t.test('maps option IDs, calculates one first-correct bonus and ignores client score/time', async () => {
      const match = await fresh()
      const first = await submit(match, actors[0], questions[0], 'B', { time_taken: 999, points_earned: 999, is_correct: false })
      const second = await submit(match, actors[1], questions[0], 'two')
      assert.equal(first.points_earned, 60)
      assert.equal(first._correct_answer_id, 'B')
      assert.ok(first.time_taken < 60)
      assert.equal(second.points_earned, 50)
      assert.equal(second.submission_rank, 2)
      assert.equal(second._submission_count, 2)
      assert.deepEqual(await scores(match), [
        { total_score: 60, questions_answered: 1, correct_answers: 1 },
        { total_score: 50, questions_answered: 1, correct_answers: 1 },
      ])
    })
    await t.test('returns the same saved result on retry after close, without awarding again', async () => {
      const match = await fresh()
      const first = await submit(match, actors[0], questions[0], 'B')
      await phase(match, 0, false)
      const retried = await submit(match, actors[0], questions[0], 'B')
      assert.equal(retried.id, first.id)
      assert.equal(retried._replayed, true)
      assert.equal((await scores(match))[0].total_score, 60)
      await assert.rejects(submit(match, actors[0], questions[0], 'A'), /different answer/)
    })
    await t.test('blocks future questions, outsiders, code-for-answer exploits and unsupported types', async () => {
      const match = await fresh()
      await assert.rejects(submit(match, actors[0], questions[1], 'true'), /no longer accepting/)
      await assert.rejects(submit(match, actors[2], questions[0], 'B'), /Not a participant/)
      await assert.rejects(submit(match, actors[0], questions[0], undefined, { submission_type: 'code_challenge', code: 'anything', test_results: [{ passed: true }] }), /Invalid code/)
      await assert.rejects(submit(match, actors[0], questions[0], 'B', { submission_type: 'other' }), /Unsupported/)
      assert.equal((await scores(match))[0].questions_answered, 0)
    })
    await t.test('closes the round during cooldown and cannot reopen or close a different round', async () => {
      const match = await fresh()
      assert.equal((await phase(match, 0, false)).changed, true)
      assert.equal((await phase(match, 0, false)).changed, false)
      assert.equal((await phase(match, 0, true)).changed, false)
      await assert.rejects(submit(match, actors[0], questions[0], 'B'), /no longer accepting/)
      await db.query('UPDATE pvp_matches SET current_question_index=1 WHERE id=$1', [match])
      await assert.rejects(submit(match, actors[0], questions[1], 'true'), /no longer accepting/)
      assert.equal((await phase(match, 1, true)).changed, true)
      assert.equal((await phase(match, 0, false)).changed, false)
      const answer = await submit(match, actors[0], questions[1], 'true')
      assert.equal(answer.points_earned, 40)
    })
    await t.test('rejects expired, disconnected and unsupported fill-blank rounds without scoring', async () => {
      const match = await fresh()
      await db.query("UPDATE pvp_matches SET question_started_at=clock_timestamp()-interval '2 minutes' WHERE id=$1", [match])
      await assert.rejects(submit(match, actors[0], questions[0], 'B'), /no longer accepting/)
      await phase(match, 0, true)
      await db.query('UPDATE pvp_participants SET is_connected=false WHERE match_id=$1 AND user_id=$2', [match, actors[1]])
      await assert.rejects(submit(match, actors[0], questions[0], 'B'), /no longer accepting/)
      const blank = await fresh([questions[2]])
      await assert.rejects(submit(blank, actors[0], questions[2], 'hello'), /Invalid answer/)
      assert.equal((await scores(match))[0].total_score, 0)
    })
    await t.test('rolls back the submission if updating participant counters fails', async () => {
      const match = await fresh()
      await db.exec(`CREATE FUNCTION fail_score() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected score failure'; END; $$;
        CREATE TRIGGER fail_score BEFORE UPDATE ON pvp_participants FOR EACH ROW EXECUTE FUNCTION fail_score();`)
      try { await assert.rejects(submit(match, actors[0], questions[0], 'B'), /injected score failure/) }
      finally { await db.exec('DROP TRIGGER fail_score ON pvp_participants') }
      assert.equal((await db.query('SELECT count(*)::int AS count FROM pvp_submissions WHERE match_id=$1', [match])).rows[0].count, 0)
      assert.equal((await scores(match))[0].questions_answered, 0)
    })
    await t.test('grants both phase and submission RPCs only to service_role', async () => {
      const match = await fresh()
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`)
        await assert.rejects(phase(match, 0, true), /permission denied/)
        await assert.rejects(submit(match, actors[0], questions[0], 'B'), /permission denied/)
        await db.exec('RESET ROLE')
      }
      await db.exec('SET ROLE service_role')
      assert.equal((await submit(match, actors[0], questions[0], 'B')).points_earned, 60)
      await db.exec('RESET ROLE')
    })
  } finally { await db.close() }
})
