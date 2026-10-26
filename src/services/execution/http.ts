import type { ReadableStreamDefaultReader } from 'node:stream/web'
import { RunnerUnavailableError } from './errors'

export const MAX_RUNNER_RESPONSE_BYTES = 256 * 1024

/** A deadline and byte budget cover headers AND the response body. No automatic retries. */
export async function postRunnerJson(
  url: string,
  headers: Record<string, string>,
  payload: unknown,
  timeout: number
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(30000, Math.min(120000, timeout * 2)))
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!response.ok || !response.body) throw new RunnerUnavailableError()
    const declared = response.headers.get('content-length')
    if (declared !== null && Number(declared) > MAX_RUNNER_RESPONSE_BYTES)
      throw new RunnerUnavailableError(
        'Phản hồi runner vượt giới hạn. Hãy giảm output rồi thử lại.'
      )
    reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let bytes = 0
    for (;;) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.byteLength
      if (bytes > MAX_RUNNER_RESPONSE_BYTES)
        throw new RunnerUnavailableError(
          'Phản hồi runner vượt giới hạn. Hãy giảm output rồi thử lại.'
        )
      chunks.push(part.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (cause) {
    if (cause instanceof RunnerUnavailableError) throw cause
    if (controller.signal.aborted)
      throw new RunnerUnavailableError('Runner phản hồi quá lâu. Vui lòng thử lại.')
    throw new RunnerUnavailableError()
  } finally {
    clearTimeout(timer)
    if (reader) {
      void reader.cancel().catch(() => undefined)
      reader.releaseLock()
    }
    controller.abort()
  }
}
