import { profileSchemas } from '../profile.schemas'

const parse = (body: unknown) => profileSchemas.update.safeParse({ body })
it.each([
  {},
  { isAdmin: true },
  { points: 999 },
  { displayName: ' ' },
  { displayName: 'x'.repeat(51) },
  { avatarUrl: 'javascript:alert(1)' },
  { avatarUrl: 'data:image/svg+xml;base64,PHN2Zz4=' },
  { avatarUrl: 'https://user:password@example.test/image' },
  { avatarUrl: 'x'.repeat(205000) },
  { learningGoal: 'a', learningPath: 'b' },
])('rejects invalid or ambiguous profile write (%#)', body => {
  expect(parse(body).success).toBe(false)
})
it.each([
  '',
  '/images/avatar/fox.webp',
  'preset:fox',
  'https://avatars.example.test/user/1',
  'data:image/webp;base64,ZmFrZQ==',
])('accepts supported avatar representation %s', avatarUrl => {
  expect(parse({ avatarUrl }).success).toBe(true)
})
it('normalizes display names and permits a matching legacy learning goal', () => {
  expect(
    profileSchemas.update.parse({
      body: { displayName: ' Name ', learningGoal: 'beginner', learningPath: 'beginner' },
    }).body.displayName
  ).toBe('Name')
})
