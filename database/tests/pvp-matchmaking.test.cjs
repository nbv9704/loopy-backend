const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PGlite } = require('@electric-sql/pglite')
const { prepareSchema } = require('./fixtures/schema.cjs')

test('matchmaking eligibility, replay, selection, rollback and permissions use real SQL', async t => {
  const db = new PGlite()
  const actors = Array.from({ length: 6 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`)
  try {
    await prepareSchema(db)
    for (const actor of actors) await db.query('INSERT INTO auth.users(id) VALUES ($1)', [actor])
    await db.exec("INSERT INTO languages(id,name,display_name,icon) VALUES ('javascript','JavaScript','JavaScript','js')")
    const chapter = (await db.query("INSERT INTO chapters(language_id,chapter_number,title,order_index) VALUES ('javascript',1,'Test',0) RETURNING id")).rows[0].id
    const lesson = (await db.query("INSERT INTO lessons(chapter_id,lesson_id,title,order_index,status) VALUES ($1,'one','Test',0,'published') RETURNING id", [chapter])).rows[0].id
    const find = async (actor, difficulty = 'medium') => (await db.query("SELECT matchmake_pvp_atomically($1,'1v1','javascript',$2) AS data", [actor, difficulty])).rows[0].data
    const count = async () => (await db.query('SELECT count(*)::int AS count FROM pvp_matches')).rows[0].count
    await t.test('ineligible and empty-bank requests cannot leave rooms or memberships', async () => {
      await assert.rejects(find(actors[0]), /Complete onboarding/)
      await db.exec('UPDATE user_profiles SET onboarding_completed=true')
      await assert.rejects(find(actors[0]), /Complete onboarding/)
      for (const actor of actors) await db.query("INSERT INTO user_progress(user_id,lesson_id,status) VALUES ($1,$2,'completed')", [actor, lesson])
      await assert.rejects(find(actors[0]), /No official questions/)
      assert.equal(await count(), 0)
    })
    const bank = (await db.query("INSERT INTO practice_sets(created_by,title,language_id,difficulty,visibility,status) VALUES ($1,'Official','javascript','medium','official','published') RETURNING id", [actors[0]])).rows[0].id
    const question = (await db.query("INSERT INTO practice_questions(set_id,type,prompt,correct_answer,order_index) VALUES ($1,'true_false','Question','true',0) RETURNING id", [bank])).rows[0].id
    await db.query("INSERT INTO practice_questions(set_id,type,prompt,correct_answer,order_index) VALUES ($1,'fill_blank','Excluded','answer',1)", [bank])
    let first
    await t.test('new room and participant commit together, selecting only supported official questions', async () => {
      first = await find(actors[0])
      assert.equal(first.created, true)
      assert.equal(first.replayed, false)
      assert.match(first.match.room_code, /^[A-Z0-9]{6}$/)
      assert.deepEqual(first.match.question_ids, [question])
      assert.equal(first.match.participants[0].user_id, actors[0])
      assert.equal(first.participant.match_id, first.match.id)
      assert.equal(await count(), 1)
    })
    await t.test('retry resumes the existing membership even if selection changed', async () => {
      const retry = await find(actors[0], 'hard')
      assert.equal(retry.match.id, first.match.id)
      assert.equal(retry.replayed, true)
      assert.equal(retry.created, false)
      assert.equal(retry.match.participants.length, 1)
      assert.equal(await count(), 1)
    })
    await t.test('seekers meet in the same queue and cannot exceed capacity', async () => {
      assert.equal((await find(actors[1])).match.id, first.match.id)
      const next = await find(actors[2])
      assert.notEqual(next.match.id, first.match.id)
      assert.equal(next.created, true)
      assert.equal((await find(actors[3])).match.id, next.match.id)
      assert.equal(await count(), 2)
    })
    await t.test('participant failure rolls back a newly created room', async () => {
      await db.exec(`CREATE FUNCTION reject_matchmaking_join() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected join failure'; END; $$;
        CREATE TRIGGER reject_matchmaking_join BEFORE INSERT ON pvp_participants FOR EACH ROW EXECUTE FUNCTION reject_matchmaking_join();`)
      await assert.rejects(find(actors[4]), /injected join failure/)
      assert.equal(await count(), 2)
      await db.exec('DROP TRIGGER reject_matchmaking_join ON pvp_participants')
      assert.equal((await find(actors[4])).created, true)
    })
    await t.test('missing selection has a domain error, not a partial room or fallback', async () => {
      const before = await count()
      await assert.rejects(find(actors[5], 'hard'), /No official questions/)
      assert.equal(await count(), before)
    })
    await t.test('only service role may execute matchmaking', async () => {
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`)
        await assert.rejects(find(actors[0]), /permission denied/)
        await db.exec('RESET ROLE')
      }
      await db.exec('SET ROLE service_role')
      assert.equal((await find(actors[0])).replayed, true)
      await db.exec('RESET ROLE')
    })
  } finally { await db.close() }
})
