import { pvpSchemas } from '../pvp.schemas'
import { practiceSchemas } from '../practice.schemas'

it('keeps query defaults as validated numbers after Zod4 migration', () => {
  expect(pvpSchemas.getMatchHistory.parse({ query: {} })).toEqual({
    query: { limit: 10, offset: 0 },
  })
  expect(pvpSchemas.getLeaderboard.parse({ query: {} })).toEqual({
    query: { limit: 50, sort_by: 'rating' },
  })
})
it('preserves legacy UUID-shaped references while rejecting arbitrary paths', () => {
  expect(
    practiceSchemas.getSet.safeParse({ params: { setId: '11111111-1111-1111-1111-111111111111' } })
      .success
  ).toBe(true)
  expect(practiceSchemas.getSet.safeParse({ params: { setId: '../private' } }).success).toBe(false)
})
