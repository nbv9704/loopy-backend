const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PGlite } = require('@electric-sql/pglite')
const { preparePractice } = require('./fixtures/practice.cjs')
const actor = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const question = (answer = 'true', type = 'true_false') => ({ type, prompt: 'Question', correct_answer: answer, points: 10 })
const payload = questions => ({ title: 'Practice', visibility: 'public', status: 'published', questions })

test('practice PostgreSQL transactions and permissions', async t => {
  const db = new PGlite()
  const save = async (data, id = null, user = actor) => (await db.query('SELECT save_practice_set_atomically($1,$2,$3) AS id', [user, id, data])).rows[0].id
  const start = async (id, user = actor) => (await db.query('SELECT start_practice_attempt_atomically($1,$2) AS result', [id, user])).rows[0].result
  const submit = async (attempt, q, answer, user = actor) => (await db.query('SELECT submit_practice_answer_atomically($1,$2,$3,$4) AS result', [attempt, q, user, answer])).rows[0].result
  try {
    await preparePractice(db)
    await t.test('failed create rolls back the entire set and partial questions', async () => {
      await assert.rejects(save(payload([question(), question('bad', 'invalid-type')])), /check constraint/)
      assert.equal((await db.query('SELECT count(*)::int AS count FROM practice_sets')).rows[0].count, 0)
    })
    await t.test('failed replacement restores old metadata and question IDs', async () => {
      const id = await save(payload([question()]))
      const before = (await db.query('SELECT id FROM practice_questions WHERE set_id=$1', [id])).rows
      await assert.rejects(save({ ...payload([question('bad', 'invalid-type')]), title: 'Should rollback' }, id), /check constraint/)
      assert.deepEqual((await db.query('SELECT id FROM practice_questions WHERE set_id=$1', [id])).rows, before)
      assert.equal((await db.query('SELECT title FROM practice_sets WHERE id=$1', [id])).rows[0].title, 'Practice')
    })
    await t.test('owner/admin checks are also enforced inside the transaction', async () => {
      const id = await save(payload([question()]))
      await assert.rejects(save(payload([question()]), id, other), /Not the owner/)
      await assert.rejects(save({ ...payload([question()]), visibility: 'official' }), /Admin privileges/)
    })
    await t.test('attempt start returns sanitized questions and freezes question history', async () => {
      const id = await save(payload([question()]))
      const result = await start(id)
      for (const field of ['correct_answer', 'solution_code', 'test_cases']) assert.equal(field in result.questions[0], false)
      await assert.rejects(save(payload([question()]), id), /referenced/)
    })
    await t.test('submits aggregate scores and support identical retries after completion', async () => {
      const id = await save(payload([question(), question('answer', 'fill_blank')]))
      const { attempt, questions } = await start(id)
      const first = await submit(attempt.id, questions[0].id, 'true')
      assert.equal(first.attempt.score, 10)
      const final = await submit(attempt.id, questions[1].id, ' ANSWER ')
      assert.equal(final.attempt.score, 20)
      assert.equal(final.attempt.status, 'completed')
      const retry = await submit(attempt.id, questions[1].id, ' ANSWER ')
      assert.equal(retry.submission.id, final.submission.id)
      assert.equal(retry.attempt.score, 20)
      assert.equal((await db.query('SELECT count(*)::int AS count FROM practice_submissions WHERE attempt_id=$1', [attempt.id])).rows[0].count, 2)
      await assert.rejects(submit(attempt.id, questions[0].id, 'false'), /different payload/)
      await assert.rejects(submit(attempt.id, questions[0].id, 'true', other), /not found/)
    })
    await t.test('multiple select comparison is order-independent and preserves pipe compatibility', async () => {
      const id = await save(payload([question('["A","B"]', 'multiple_select'), question('A|B', 'multiple_select')]))
      const { attempt, questions } = await start(id)
      assert.equal((await submit(attempt.id, questions[0].id, '["B","A"]')).submission.is_correct, true)
      assert.equal((await submit(attempt.id, questions[1].id, '["A","C"]')).submission.is_correct, false)
    })
    await t.test('aggregate failure rolls back the submitted answer', async () => {
      const id = await save(payload([question()]))
      const { attempt, questions } = await start(id)
      await db.exec(`CREATE FUNCTION reject_attempt_score() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'score write failed'; END; $$;
        CREATE TRIGGER reject_attempt_score BEFORE UPDATE ON practice_attempts FOR EACH ROW EXECUTE FUNCTION reject_attempt_score();`)
      await assert.rejects(submit(attempt.id, questions[0].id, 'true'), /score write failed/)
      assert.equal((await db.query('SELECT count(*)::int AS count FROM practice_submissions WHERE attempt_id=$1', [attempt.id])).rows[0].count, 0)
      await db.exec('DROP TRIGGER reject_attempt_score ON practice_attempts')
    })
    await t.test('PvP references protect questions and stale question IDs are rejected', async () => {
      const id = await save(payload([question()]))
      const q = (await db.query('SELECT id FROM practice_questions WHERE set_id=$1', [id])).rows[0].id
      await db.query('INSERT INTO pvp_matches(question_ids) VALUES ($1)', [[q]])
      await assert.rejects(save(payload([question()]), id), /referenced/)
      await assert.rejects(db.query('INSERT INTO pvp_matches(question_ids) VALUES ($1)', [['00000000-0000-4000-8000-000000000099']]), /stale/)
    })
  } finally { await db.close() }
})
