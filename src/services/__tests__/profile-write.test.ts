import { supabaseAdmin } from '../../db/supabase'
import { saveProfileUpdate } from '../profile/update-profile'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))

function fixture(concurrent = false) {
  const initial = {
    id: 'learner',
    preferred_language: 'python',
    learning_path: 'beginner',
    current_path_id: 'path',
    onboarding_completed: true,
  }
  let current = { ...initial }
  const writes: unknown[] = []
  const filters: Array<[string, unknown]> = []
  const saved: { eq: jest.Mock; is: jest.Mock; select: jest.Mock; maybeSingle: jest.Mock } = {
    eq: jest.fn((key: string, value: unknown) => {
      filters.push([key, value])
      return saved
    }),
    is: jest.fn((key: string, value: unknown) => {
      filters.push([key, value])
      return saved
    }),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => {
      const matches = filters.every(
        ([key, value]) => current[key as keyof typeof current] === value
      )
      if (matches) writes.push(current)
      return { data: matches ? current : null, error: null }
    }),
  }
  const profiles = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => ({ data: { ...initial }, error: null })),
    update: jest.fn(() => {
      if (concurrent) current = { ...current, current_path_id: 'new-path' }
      return saved
    }),
  }
  const paths = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => ({
      data: { id: 'path', language_id: 'python', goal_id: 'beginner', is_active: true },
      error: null,
    })),
  }
  jest
    .mocked(supabaseAdmin.from)
    .mockImplementation(((table: string) => (table === 'user_profiles' ? profiles : paths)) as any)
  return { writes, filters, profiles, saved }
}

beforeEach(() => jest.resetAllMocks())
it('cannot commit a selection validated before another request changed the current path', async () => {
  const state = fixture(true)
  await expect(saveProfileUpdate('learner', { preferredLanguage: 'python' })).rejects.toMatchObject(
    { code: 'PROFILE_CHANGED', statusCode: 409 }
  )
  expect(state.writes).toHaveLength(0)
  expect(state.filters).toContainEqual(['current_path_id', 'path'])
})
it('applies every validated selection predicate to the write', async () => {
  const state = fixture()
  await expect(
    saveProfileUpdate('learner', { preferredLanguage: 'python' })
  ).resolves.toHaveProperty('id', 'learner')
  expect(state.filters).toEqual(
    expect.arrayContaining([
      ['id', 'learner'],
      ['preferred_language', 'python'],
      ['learning_path', 'beginner'],
      ['current_path_id', 'path'],
      ['onboarding_completed', true],
    ])
  )
})
it('preserves personal-only writes without an extra onboarding read', async () => {
  const state = fixture()
  await saveProfileUpdate('learner', { displayName: 'Name' })
  expect(state.profiles.select).not.toHaveBeenCalled()
  expect(state.filters).toEqual([['id', 'learner']])
})
it('rejects conflicting aliases before any write', async () => {
  const state = fixture()
  await expect(
    saveProfileUpdate('learner', { learningGoal: 'a', learningPath: 'b' })
  ).rejects.toMatchObject({ statusCode: 400 })
  expect(state.profiles.update).not.toHaveBeenCalled()
})

it('reports database failures without returning provider details or a success acknowledgement', async () => {
  const state = fixture()
  state.saved.maybeSingle.mockResolvedValue({
    data: null,
    error: { message: 'private database details' },
  })
  await expect(saveProfileUpdate('learner', { displayName: 'Name' })).rejects.toMatchObject({
    code: 'DATABASE_ERROR',
    statusCode: 500,
  })
})
