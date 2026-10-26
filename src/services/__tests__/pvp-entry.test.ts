import { pvpService } from '../pvp.service'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('../test-runner.service', () => ({ testRunnerService: { runTests: jest.fn() } }))
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}))

function query(result: Record<string, unknown>) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
}
beforeEach(() => jest.resetAllMocks())

it('does not misreport a profile database outage as an ineligible learner', async () => {
  jest
    .mocked(supabaseAdmin.from)
    .mockReturnValue(query({ data: null, error: { code: '08006' } }) as never)
  await expect(pvpService.assertEligible('actor')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})

it('does not misreport a match read outage as an invalid room code', async () => {
  jest
    .mocked(supabaseAdmin.from)
    .mockReturnValue(query({ data: null, error: { code: '08006' } }) as never)
  await expect(pvpService.getMatch('ROOM01')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})

it.each(['pvp_matches', 'practice_questions'])(
  'does not misreport a %s read outage as a missing question',
  async failedTable => {
    jest
      .mocked(supabaseAdmin.from)
      .mockImplementation(
        table =>
          query(
            table === failedTable
              ? { data: null, error: { code: '08006' } }
              : { data: { question_ids: ['question'], current_question_index: 0 }, error: null }
          ) as never
      )
    await expect(pvpService.getCurrentQuestion('match')).rejects.toMatchObject({
      code: 'DATABASE_ERROR',
    })
  }
)

it.each([
  [true, 1, true],
  [true, 0, false],
  [false, 1, false],
  [false, 0, false],
])(
  'derives eligibility from onboarding=%s and completed published count=%s',
  async (onboarding, completed, eligible) => {
    const progress = query({ data: null, count: completed, error: null })
    jest
      .mocked(supabaseAdmin.from)
      .mockImplementation(
        table =>
          (table === 'user_profiles'
            ? query({ data: { onboarding_completed: onboarding }, error: null })
            : progress) as never
      )
    await expect(pvpService.getEligibility('actor')).resolves.toEqual({
      eligible,
      onboardingCompleted: onboarding,
      hasCompletedLesson: Boolean(completed),
    })
    expect(progress.eq).toHaveBeenCalledWith('lessons.status', 'published')
    expect(progress.eq).toHaveBeenCalledWith('status', 'completed')
  }
)

it('does not fabricate an unlocked/locked state when progress count is unavailable', async () => {
  jest
    .mocked(supabaseAdmin.from)
    .mockImplementation(
      table =>
        query(
          table === 'user_profiles'
            ? { data: { onboarding_completed: true }, error: null }
            : { data: null, count: null, error: null }
        ) as never
    )
  await expect(pvpService.getEligibility('actor')).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
})

const savedPlayer = {
  id: 'player',
  match_id: 'match',
  user_id: 'actor',
  is_ready: false,
  is_connected: true,
  total_score: 0,
  questions_answered: 0,
  correct_answers: 0,
  joined_at: 'today',
}
const savedMatch = {
  id: 'match',
  room_code: 'ROOM01',
  mode: '1v1',
  status: 'waiting',
  language_id: 'javascript',
  difficulty: 'medium',
  question_ids: ['question'],
  current_question_index: 0,
  max_players: 2,
  time_per_question: 30,
  created_at: 'today',
  updated_at: 'today',
  participants: [savedPlayer],
}
const receipt = { match: savedMatch, participant: savedPlayer, created: true, replayed: false }

it('delegates selection and actor to one atomic matcher and requires its committed membership', async () => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: receipt, error: null } as never)
  await expect(
    pvpService.findMatch('actor', { mode: '1v1', language_id: 'javascript', difficulty: 'medium' })
  ).resolves.toMatchObject({ created: true, participant: savedPlayer })
  expect(supabaseAdmin.rpc).toHaveBeenCalledWith('matchmake_pvp_atomically', {
    p_actor_id: 'actor',
    p_mode: '1v1',
    p_language_id: 'javascript',
    p_difficulty: 'medium',
  })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})

it.each([
  null,
  {},
  { ...receipt, participant: { ...savedPlayer, user_id: 'other' } },
  { ...receipt, match: { ...savedMatch, participants: [] } },
  { ...receipt, match: { ...savedMatch, current_question_index: 1 } },
])('rejects an incomplete or foreign matchmaking acknowledgement (%j)', async data => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data, error: null } as never)
  await expect(pvpService.findMatch('actor', {})).rejects.toMatchObject({ code: 'DATABASE_ERROR' })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
})

it.each([
  ['PGRST202', 'SCHEMA_NOT_READY'],
  ['42501', 'FORBIDDEN'],
  ['P0511', 'PVP_NO_QUESTIONS'],
])('does not create/join through a fallback after matcher error %s', async (code, expected) => {
  jest.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: null, error: { code } } as never)
  await expect(pvpService.findMatch('actor', {})).rejects.toMatchObject({ code: expected })
  expect(supabaseAdmin.from).not.toHaveBeenCalled()
  expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(1)
})
