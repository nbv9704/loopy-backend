import { parsePistonResult, parseGlotResult } from '../execution/provider-results'
import { formatRunnerInput, parseRunnerOutput } from '../execution/io'
const run = { code: 0, signal: null, stdout: '0', stderr: '', status: null }

it('preserves successful stderr and a genuine zero output', () => {
  expect(parsePistonResult({ run: { ...run, stderr: 'warning' } })).toMatchObject({
    error: null,
    stdout: '0',
    stderr: 'warning',
    output: 0,
  })
  expect(parseGlotResult({ stdout: '', stderr: 'warning', error: '' })).toMatchObject({
    error: null,
    exitCode: 0,
  })
})
it.each(['RE', 'SG', 'TO', 'OL', 'EL'])(
  'cannot certify a Piston process with status %s even if code is zero',
  status => {
    expect(parsePistonResult({ run: { ...run, status } }).error).not.toBeNull()
  }
)
it('handles compile failures without a run object and does not ignore compile signals', () => {
  expect(
    parsePistonResult({ compile: { ...run, code: 1, stderr: 'Compile failed' } })
  ).toMatchObject({ error: 'Compile failed', exitCode: 1 })
  expect(parsePistonResult({ compile: { ...run, signal: 'SIGTERM' }, run })).toMatchObject({
    exitCode: 1,
  })
})
it('treats null exit and a termination signal as a failed program', () => {
  expect(parsePistonResult({ run: { ...run, code: null, signal: 'SIGKILL' } })).toMatchObject({
    exitCode: 124,
  })
  expect(parsePistonResult({ run: { ...run, code: null } }).error).not.toBeNull()
})
it.each([
  {},
  { run: {} },
  { run: { ...run, stdout: false } },
  { run: { ...run, code: '0' } },
  { run: { ...run, status: 'XX' } },
])('rejects malformed or internal-error Piston responses (%j)', value => {
  expect(() => parsePistonResult(value)).toThrow(
    expect.objectContaining({ code: 'RUNNER_UNAVAILABLE' })
  )
})
it.each([{}, { stdout: '', stderr: '' }, { stdout: {}, stderr: '', error: '' }])(
  'rejects malformed Glot responses (%j)',
  value => {
    expect(() => parseGlotResult(value)).toThrow()
  }
)
it('keeps explicit Glot failure distinct from stderr text', () => {
  expect(
    parseGlotResult({ stdout: 'before', stderr: 'Traceback', error: 'RuntimeError' })
  ).toMatchObject({ stdout: 'before', error: 'RuntimeError', exitCode: 1 })
})
it('preserves false/null/zero JSON output and literal string stdin', () => {
  expect(['false', 'null', '0'].map(parseRunnerOutput)).toEqual([false, null, 0])
  expect(formatRunnerInput('7\n')).toBe('7\n')
  expect(formatRunnerInput([0, false])).toBe('0 false')
})
