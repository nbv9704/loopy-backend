import { Response } from 'express'
import { updateProfile } from '../profile.controller'
import { AuthRequest } from '../../middleware/auth'
import { supabaseAdmin } from '../../db/supabase'

jest.mock('../../db/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }))
jest.mock('../../utils/contentModeration', () => ({ validateContent: jest.fn() }))
jest.mock('../../services/progress.service', () => ({ getFreshUserStreak: jest.fn() }))

const profile = {
  preferred_language: 'python',
  learning_path: 'beginner',
  current_path_id: 'path',
  onboarding_completed: true,
}
const path = { id: 'path', language_id: 'python', goal_id: 'beginner', is_active: true }

function fixture(options: { profileError?: unknown; pathError?: unknown; active?: boolean } = {}) {
  const profileRead = {
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options.profileError ? null : profile,
      error: options.profileError || null,
    }),
  }
  const saved = {
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'learner' }, error: null }),
  }
  const profiles = { select: jest.fn(() => profileRead), update: jest.fn(() => saved) }
  const paths = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: options.pathError ? null : { ...path, is_active: options.active !== false },
      error: options.pathError || null,
    }),
  }
  const from = supabaseAdmin.from as jest.Mock
  from.mockImplementation(table => (table === 'user_profiles' ? profiles : paths))
  const next = jest.fn()
  const res = { json: jest.fn() } as unknown as Response
  const run = (body: Record<string, unknown>) =>
    updateProfile({ user: { id: 'learner' }, body } as AuthRequest, res, next)
  return { profiles, paths, next, res, run }
}

beforeEach(() => jest.resetAllMocks())

it.each([
  { currentPathId: null },
  { learningPath: '' },
  { currentPathId: null, onboardingCompleted: true },
])('rejects clearing required fields while onboarding stays complete (%j)', async body => {
  const state = fixture()
  await state.run(body)
  expect(state.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  expect(state.profiles.update).not.toHaveBeenCalled()
})

it.each(['profileError', 'pathError'] as const)(
  'reports a failed %s read as a database failure',
  async field => {
    const state = fixture({ [field]: { code: '08006' } })
    await state.run({ onboardingCompleted: true })
    expect(state.next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DATABASE_ERROR', statusCode: 500 })
    )
    expect(state.profiles.update).not.toHaveBeenCalled()
  }
)

it('permits an explicit reset and does not validate the path being cleared', async () => {
  const state = fixture()
  await state.run({ onboardingCompleted: false, currentPathId: null })
  expect(state.next).not.toHaveBeenCalled()
  expect(state.paths.select).not.toHaveBeenCalled()
  expect(state.profiles.update).toHaveBeenCalledWith({
    onboarding_completed: false,
    current_path_id: null,
  })
})

it('does not read onboarding data for a personal-only profile edit', async () => {
  const state = fixture()
  await state.run({ displayName: 'Learner' })
  expect(state.profiles.select).not.toHaveBeenCalled()
  expect(state.paths.select).not.toHaveBeenCalled()
  expect(state.profiles.update).toHaveBeenCalledWith({ display_name: 'Learner' })
})

it('still rejects a disabled path before writing the profile', async () => {
  const state = fixture({ active: false })
  await state.run({ onboardingCompleted: true })
  expect(state.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  expect(state.profiles.update).not.toHaveBeenCalled()
})

it.each([{ preferredLanguage: 'javascript' }, { learningGoal: 'another-goal' }])(
  'still rejects language/goal mismatches (%j)',
  async body => {
    const state = fixture()
    await state.run(body)
    expect(state.next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
    expect(state.profiles.update).not.toHaveBeenCalled()
  }
)

it('keeps the legacy learningGoal input compatible while saving its normalized selection', async () => {
  const state = fixture()
  await state.run({ learningGoal: 'beginner', onboardingCompleted: true, currentPathId: 'path' })
  expect(state.next).not.toHaveBeenCalled()
  expect(state.profiles.update).toHaveBeenCalledWith({
    learning_path: 'beginner',
    onboarding_completed: true,
    current_path_id: 'path',
  })
})

it('allows an explicit onboarding reset even when the previously selected path is now inactive', async () => {
  const state = fixture({ active: false })
  await state.run({ onboardingCompleted: false })
  expect(state.next).not.toHaveBeenCalled()
  expect(state.paths.select).not.toHaveBeenCalled()
})
