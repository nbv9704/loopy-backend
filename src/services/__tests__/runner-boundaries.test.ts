import { ReadableStream } from 'node:stream/web'
import { TestRunnerService, type TestCase } from '../test-runner.service'
import { PistonExecutorService } from '../piston-executor.service'

jest.mock('../javascript-executor.service', () => ({ JavaScriptExecutor: jest.fn() }))
jest.mock('../../config', () => ({
  config: { piston: { apiUrl: 'https://runner.invalid' }, glot: { apiToken: '' } },
}))
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }))

const testCase: TestCase = {
  id: 'one',
  exerciseId: 'lesson',
  input: '7\n',
  expectedOutput: '14',
  weight: 100,
  timeout: 1000,
  description: 'Double the input',
  isHidden: false,
  orderIndex: 0,
}
afterEach(() => jest.restoreAllMocks())

it('passes case input to stdin when checking a stdout-based program', async () => {
  const execute = jest
    .spyOn(PistonExecutorService.prototype, 'execute')
    .mockImplementation(async (_language, _code, input) => ({
      output: null,
      stdout: input === '7\n' ? '14' : '',
      stderr: '',
      exitCode: 0,
      executionTime: 1,
      error: null,
    }))
  const result = await new TestRunnerService().runTests(
    'print(int(input()) * 2)',
    [testCase],
    'python',
    'stdout'
  )
  expect(result.testScore).toBe(100)
  expect(execute).toHaveBeenCalledWith('python', expect.any(String), '7\n', 1000)
})

it('does not certify a suite by silently skipping its invalid required case', async () => {
  jest.spyOn(PistonExecutorService.prototype, 'execute').mockResolvedValue({
    output: null,
    stdout: '14',
    stderr: '',
    exitCode: 0,
    executionTime: 1,
    error: null,
  })
  await expect(
    new TestRunnerService().runTests(
      'print(14)',
      [testCase, { ...testCase, id: 'broken', timeout: -1 }],
      'python',
      'stdout'
    )
  ).rejects.toThrow('test case')
})

it('keeps the Piston deadline active until the response body is consumed', async () => {
  jest.useFakeTimers()
  const originalFetch = global.fetch
  global.fetch = jest.fn(
    async (_url, options) =>
      new Response(
        new ReadableStream({
          start(controller) {
            options?.signal?.addEventListener('abort', () =>
              controller.error(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            )
          },
        })
      )
  ) as jest.Mock
  try {
    let settled = false
    const pending = new PistonExecutorService().execute('python', 'print(14)').catch(error => {
      settled = true
      return error
    })
    await jest.advanceTimersByTimeAsync(30001)
    expect(settled).toBe(true)
    await expect(pending).resolves.toMatchObject({ code: 'RUNNER_UNAVAILABLE', statusCode: 503 })
  } finally {
    global.fetch = originalFetch
    jest.useRealTimers()
  }
})
