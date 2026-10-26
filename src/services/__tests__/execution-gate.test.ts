jest.mock('../../config', () => ({
  config: { piston: { apiUrl: 'https://runner.invalid' }, glot: { apiToken: '' } },
}))
import { ExecutionGate } from '../execution/gate'
import { PistonExecutorService } from '../piston-executor.service'
import { TestRunnerService } from '../test-runner.service'
import { RunnerUnavailableError } from '../execution/errors'
import { EventEmitter } from 'node:events'
import { concurrencyLimiter, resetActiveExecutions } from '../../middleware/concurrencyLimiter'

it('holds jobs until their promises settle even when the caller abandons the result', async () => {
  const gate = new ExecutionGate(1)
  let release!: () => void
  const job = gate.run(
    () =>
      new Promise<void>(resolve => {
        release = resolve
      })
  )
  await expect(gate.run(async () => 2)).rejects.toMatchObject({ statusCode: 429 })
  release()
  await job
  await expect(gate.run(async () => 2)).resolves.toBe(2)
})
it('releases a slot after synchronous setup throws or an asynchronous job fails', async () => {
  const gate = new ExecutionGate(1)
  await expect(
    gate.run(() => {
      throw new Error('Setup')
    })
  ).rejects.toThrow('Setup')
  await expect(
    gate.run(async () => {
      throw new Error('Network')
    })
  ).rejects.toThrow('Network')
  await expect(gate.run(async () => 0)).resolves.toBe(0)
})
it('does not turn a runner outage/busy slot into a deterministic wrong answer', async () => {
  const execute = jest
    .spyOn(PistonExecutorService.prototype, 'execute')
    .mockRejectedValue(new RunnerUnavailableError())
  try {
    await expect(
      new TestRunnerService().runTests(
        'print(1)',
        [
          {
            id: 'case',
            exerciseId: 'lesson',
            input: [],
            expectedOutput: '1',
            weight: 100,
            timeout: 1000,
            description: 'Check',
            isHidden: false,
            orderIndex: 0,
          },
        ],
        'python',
        'stdout'
      )
    ).rejects.toMatchObject({ statusCode: 503 })
  } finally {
    execute.mockRestore()
  }
})

it('HTTP close releases request bookkeeping but cannot admit more than five actual adapter jobs', async () => {
  resetActiveExecutions()
  const previous = global.fetch
  const releases: Array<(response: Response) => void> = []
  global.fetch = jest.fn(() => new Promise<Response>(resolve => releases.push(resolve)))
  const response = () =>
    Object.assign(new EventEmitter(), { status: jest.fn().mockReturnThis(), json: jest.fn() })
  const requests = Array.from({ length: 5 }, () => response())
  const jobs = requests.map(res => {
    concurrencyLimiter({} as never, res as never, jest.fn())
    return new PistonExecutorService().execute('python', 'print(0)')
  })
  try {
    requests.forEach(res => res.emit('close'))
    const next = jest.fn()
    const newResponse = response()
    concurrencyLimiter({} as never, newResponse as never, next)
    expect(next).toHaveBeenCalledTimes(1)
    await expect(new PistonExecutorService().execute('python', 'print(0)')).rejects.toMatchObject({
      statusCode: 429,
    })
    expect(global.fetch).toHaveBeenCalledTimes(5)
    newResponse.emit('finish')
  } finally {
    releases.forEach(resolve =>
      resolve(
        new Response(JSON.stringify({ run: { code: 0, signal: null, stdout: '0', stderr: '' } }))
      )
    )
    await Promise.all(jobs)
    global.fetch = previous
    resetActiveExecutions()
  }
})
