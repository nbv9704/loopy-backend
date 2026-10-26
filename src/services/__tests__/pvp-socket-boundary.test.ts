import { createPvPSocketBoundary, pvpSocketSchemas } from '../pvp/socket-boundary'
import { pvpSchemas } from '../../schemas/pvp.schemas'

const match = '11111111-1111-4111-8111-111111111111'
const question = '22222222-2222-4222-8222-222222222222'
const validAnswer = { matchId: match, questionId: question, answer: 'A' }
function fixture() {
  const error = jest.fn()
  const boundary = createPvPSocketBoundary({
    emitError: error,
    currentRoom: () => match,
    isStopping: () => false,
  })
  const operation = jest.fn().mockResolvedValue(undefined)
  return { error, boundary, operation }
}

it.each([
  null,
  {},
  'room',
  { ...validAnswer, matchId: 'bad' },
  { ...validAnswer, questionId: null },
  { ...validAnswer, answer: ' ' },
  { ...validAnswer, answer: 'a'.repeat(5001) },
])('rejects malformed answer payloads before any I/O (%j)', async payload => {
  const state = fixture()
  await state.boundary.bind(pvpSocketSchemas.answer, state.operation)(payload)
  expect(state.operation).not.toHaveBeenCalled()
  expect(state.error).toHaveBeenCalledTimes(1)
})

it('strips untrusted score/time fields and refuses another room', async () => {
  const state = fixture()
  const handle = state.boundary.bind(pvpSocketSchemas.answer, state.operation, {
    room: value => value.matchId,
  })
  await handle({ ...validAnswer, score: 99999, timeTaken: -1 })
  expect(state.operation).toHaveBeenCalledWith(validAnswer)
  await handle({ ...validAnswer, matchId: question })
  expect(state.operation).toHaveBeenCalledTimes(1)
  expect(state.error).toHaveBeenCalledWith('Bạn chưa kết nối vào phòng PvP này.')
})

it('serializes join then leave and does not start queued commands after disconnect', async () => {
  const state = fixture()
  let release!: () => void
  const join = jest.fn(
    () =>
      new Promise<void>(resolve => {
        release = resolve
      })
  )
  const first = state.boundary.bind(pvpSocketSchemas.room, join, { serial: true })('room01')
  const second = state.boundary.bind(pvpSocketSchemas.room, state.operation, { serial: true })(
    'ROOM01'
  )
  await Promise.resolve()
  expect(join).toHaveBeenCalledWith('ROOM01')
  expect(state.operation).not.toHaveBeenCalled()
  state.boundary.close()
  release()
  await Promise.all([first, second])
  expect(state.operation).not.toHaveBeenCalled()
})

it('catches async errors without leaking private details or breaking the next lifecycle command', async () => {
  const state = fixture()
  state.operation.mockRejectedValueOnce(new Error('private SQL detail'))
  const handle = state.boundary.bind(pvpSocketSchemas.room, state.operation, { serial: true })
  await handle('ROOM01')
  await handle('ROOM02')
  expect(state.operation).toHaveBeenCalledTimes(2)
  expect(JSON.stringify(state.error.mock.calls)).not.toContain('private')
})

it.each([
  ['code', { matchId: match, questionId: question, code: 'a'.repeat(10001) }],
  ['reaction', { matchId: match, emoji: 'a'.repeat(11) }],
  ['reaction', { matchId: match, emoji: '🙂', targetUserId: 'not-a-user-id' }],
] as const)('bounds %s payloads consistently with REST', async (kind, payload) => {
  const schema = pvpSocketSchemas[kind]
  expect(schema.safeParse(payload).success).toBe(false)
})

it.each(['invalid-seven', '../matches', '------'])(
  'REST rejects invalid room references before database reads (%s)',
  matchId => {
    expect(pvpSchemas.getMatch.safeParse({ params: { matchId } }).success).toBe(false)
  }
)

it('bounds a flooded lifecycle queue to eight pending operations and silences error storms', async () => {
  const state = fixture()
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const operation = jest.fn(() => gate)
  const handle = state.boundary.bind(pvpSocketSchemas.room, operation, { serial: true })
  const requests = Array.from({ length: 100 }, (_, index) =>
    handle(`R${String(index).padStart(5, '0')}`)
  )
  await Promise.resolve()
  expect(operation).toHaveBeenCalledTimes(1)
  expect(state.error).toHaveBeenCalledTimes(1)
  release()
  await Promise.all(requests)
  expect(operation).toHaveBeenCalledTimes(8)
})

it('deduplicates an in-flight command and shares a single submission slot across answer and code', async () => {
  const state = fixture()
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const operation = jest.fn(() => gate)
  const answer = state.boundary.bind(pvpSocketSchemas.answer, operation, { group: 'submission' })
  const code = state.boundary.bind(pvpSocketSchemas.code, state.operation, { group: 'submission' })
  const first = answer(validAnswer)
  await answer(validAnswer)
  await code({ matchId: match, questionId: question, code: 'console.log(1)' })
  expect(operation).toHaveBeenCalledTimes(1)
  expect(state.operation).not.toHaveBeenCalled()
  release()
  await first
  await code({ matchId: match, questionId: question, code: 'console.log(1)' })
  expect(state.operation).toHaveBeenCalledTimes(1)
})

it('refills a bounded command budget with time without keeping timers alive', async () => {
  let time = 1000
  const error = jest.fn(),
    operation = jest.fn().mockResolvedValue(undefined)
  const boundary = createPvPSocketBoundary({
    emitError: error,
    currentRoom: () => match,
    isStopping: () => false,
    now: () => time,
  })
  const handle = boundary.bind(pvpSocketSchemas.matchId, operation)
  for (let index = 0; index < 80; index++) await handle(match)
  expect(operation).toHaveBeenCalledTimes(40)
  expect(error).toHaveBeenCalledTimes(1)
  time += 1000
  for (let index = 0; index < 25; index++) await handle(match)
  expect(operation).toHaveBeenCalledTimes(60)
  expect(error).toHaveBeenCalledTimes(2)
})

it('limits reactions/typing before database I/O and releases a failed submission slot', async () => {
  let time = 1000
  const operation = jest.fn().mockResolvedValue(undefined)
  const boundary = createPvPSocketBoundary({
    emitError: jest.fn(),
    currentRoom: () => match,
    isStopping: () => false,
    now: () => time,
  })
  const reaction = boundary.bind(pvpSocketSchemas.reaction, operation, { minIntervalMs: 750 })
  const payload = { matchId: match, emoji: '🙂' }
  await reaction(payload)
  await reaction(payload)
  expect(operation).toHaveBeenCalledTimes(1)
  time += 750
  await reaction(payload)
  expect(operation).toHaveBeenCalledTimes(2)
  operation.mockRejectedValueOnce(new Error('private'))
  const submit = boundary.bind(pvpSocketSchemas.answer, operation, { group: 'submission' })
  await submit(validAnswer)
  await submit(validAnswer)
  expect(operation).toHaveBeenCalledTimes(4)
})
