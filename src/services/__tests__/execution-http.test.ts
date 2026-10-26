import { ReadableStream } from 'node:stream/web'
import { postRunnerJson, MAX_RUNNER_RESPONSE_BYTES } from '../execution/http'

const originalFetch = global.fetch
afterEach(() => {
  global.fetch = originalFetch
  jest.useRealTimers()
})
it('reads JSON from a bounded streamed response and sends the adapter payload once', async () => {
  global.fetch = jest.fn().mockResolvedValue(new Response('{"stdout":"0"}'))
  await expect(
    postRunnerJson('https://runner.invalid', { Authorization: 'test' }, { code: 'source' }, 5000)
  ).resolves.toEqual({ stdout: '0' })
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith(
    'https://runner.invalid',
    expect.objectContaining({ method: 'POST', body: '{"code":"source"}' })
  )
})
it('rejects and cancels a chunked response exceeding the byte budget', async () => {
  const cancel = jest.fn()
  global.fetch = jest.fn().mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_RUNNER_RESPONSE_BYTES + 1))
        },
        cancel,
      })
    )
  )
  await expect(postRunnerJson('https://runner.invalid', {}, {}, 5000)).rejects.toMatchObject({
    statusCode: 503,
  })
  expect(cancel).toHaveBeenCalledTimes(1)
})
it('does not trust a small content-length when the body exceeds the budget', async () => {
  global.fetch = jest.fn().mockResolvedValue(
    new Response('x'.repeat(MAX_RUNNER_RESPONSE_BYTES + 1), {
      headers: { 'content-length': '1' },
    })
  )
  await expect(postRunnerJson('https://runner.invalid', {}, {}, 5000)).rejects.toMatchObject({
    code: 'RUNNER_UNAVAILABLE',
  })
})
it.each([new Response('{}', { status: 503 }), new Response('not json')])(
  'sanitizes invalid provider/transport responses without retries',
  async response => {
    global.fetch = jest.fn().mockResolvedValue(response)
    await expect(
      postRunnerJson('https://private-runner.invalid', {}, {}, 5000)
    ).rejects.toMatchObject({
      statusCode: 503,
      message: expect.not.stringContaining('private-runner'),
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  }
)
it('keeps the HTTP deadline active before headers arrive', async () => {
  jest.useFakeTimers()
  global.fetch = jest.fn(
    (_url, options) =>
      new Promise((_resolve, reject) =>
        options?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      )
  )
  const pending = postRunnerJson('https://runner.invalid', {}, {}, 5000).catch(error => error)
  await jest.advanceTimersByTimeAsync(30001)
  await expect(pending).resolves.toMatchObject({ statusCode: 503, code: 'RUNNER_UNAVAILABLE' })
})
