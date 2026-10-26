import { config } from '../../config'
import { GlotExecutorService } from '../glot-executor.service'
import { parseGlotMuxResult } from '../execution/provider-results'

jest.mock('../../config', () => ({ config: {
  glot: { enabled: true, apiUrl: 'https://glot.io/api/run', apiToken: 'private-legacy-token' },
} }))

beforeEach(() => jest.clearAllMocks())
afterEach(() => jest.restoreAllMocks())

it.each(['https://glot.io/api/run', 'https://glot.io/api/mux/'])(
  'uses the current official endpoint for %s and never forwards the old token', async apiUrl => {
    jest.replaceProperty(config.glot, 'apiUrl', apiUrl)
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: { duration: 1, stdout: '14\n', stderr: '', error: '' },
    })))
    const result = await new GlotExecutorService().execute('py', 'print(int(input()) * 2)', '7\n')
    expect(result).toMatchObject({ stdout: '14\n', output: 14, error: null, exitCode: 0 })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, request] = fetch.mock.calls[0]
    expect(url).toBe('https://glot.io/api/mux')
    expect(request?.headers).not.toHaveProperty('Authorization')
    expect(request?.body).not.toContain('private-legacy-token')
    expect(JSON.parse(request?.body as string)).toEqual({ action: 'run', data: {
      image: 'glot/python:latest', payload: {
        runInstructions: { buildCommands: [], runCommand: 'python main.py' },
        files: [{ name: 'main.py', content: 'print(int(input()) * 2)' }], stdin: '7\n',
      },
    } })
  }
)

it('builds C++ only with server-owned commands and keeps student code in a file', async () => {
  const code = '#include <iostream>\nint main(){std::cout << 42;}'
  const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    data: { stdout: '42', stderr: '', error: '' },
  })))
  expect(await new GlotExecutorService().execute('c++', code)).toMatchObject({ output: 42, exitCode: 0 })
  const body = JSON.parse(fetch.mock.calls[0][1]?.body as string)
  expect(body.data.image).toBe('glot/clang:latest')
  expect(body.data.payload.files).toEqual([{ name: 'main.cpp', content: code }])
  expect(body.data.payload.runInstructions).toEqual({
    buildCommands: ['clang++ -std=c++11 -o a.out main.cpp'], runCommand: './a.out',
  })
})

it('preserves a custom legacy runner protocol and its authentication', async () => {
  jest.replaceProperty(config.glot, 'apiUrl', 'https://private-runner.invalid/languages/')
  const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    stdout: '0', stderr: 'warning', error: '',
  })))
  expect(await new GlotExecutorService().execute('python', 'print(0)')).toMatchObject({
    output: 0, stderr: 'warning', error: null, exitCode: 0,
  })
  expect(fetch.mock.calls[0][0]).toBe('https://private-runner.invalid/languages/python/latest')
  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Token private-legacy-token' })
  expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toEqual({
    files: [{ name: 'main.py', content: 'print(0)' }], stdin: '',
  })
})

it('runs the enabled public provider without a token and rejects disabled execution before I/O', async () => {
  jest.replaceProperty(config.glot, 'apiToken', '')
  const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    data: { stdout: '', stderr: '', error: '' },
  })))
  await new GlotExecutorService().execute('python', 'pass')
  jest.replaceProperty(config.glot, 'enabled', false)
  await expect(new GlotExecutorService().execute('python', 'pass')).rejects.toMatchObject({ statusCode: 503 })
  expect(fetch).toHaveBeenCalledTimes(1)
})

it.each([{}, { data: { message: 'Upstream offline' } }, { data: { stdout: '', stderr: '' } }])(
  'keeps malformed or failed mux envelopes as infrastructure errors (%j)', response => {
    expect(() => parseGlotMuxResult(response)).toThrow(expect.objectContaining({ code: 'RUNNER_UNAVAILABLE' }))
  }
)

it('preserves a student runtime failure as a program error rather than an outage', () => {
  expect(parseGlotMuxResult({ data: { stdout: '', stderr: 'Traceback', error: 'RuntimeError' } }))
    .toMatchObject({ exitCode: 1, error: 'RuntimeError', stderr: 'Traceback' })
})

it('does not replay execution on the new endpoint when the provider returns an HTTP failure', async () => {
  const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('not found', { status: 404 }))
  await expect(new GlotExecutorService().execute('python', 'print(42)')).rejects.toMatchObject({ statusCode: 503 })
  expect(fetch).toHaveBeenCalledTimes(1)
})
