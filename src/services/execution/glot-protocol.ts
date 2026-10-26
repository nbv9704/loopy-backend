import { RunnerUnavailableError } from './errors'
import { formatRunnerInput } from './io'
import { PISTON_LANGUAGE_CONFIG, type PistonLanguageId } from './languages'

const muxLanguages: Record<PistonLanguageId, {
  image: string
  buildCommands: string[]
  runCommand: string
}> = {
  python: { image: 'glot/python:latest', buildCommands: [], runCommand: 'python main.py' },
  cpp: { image: 'glot/clang:latest', buildCommands: ['clang++ -std=c++11 -o a.out main.cpp'], runCommand: './a.out' },
  java: { image: 'glot/java:latest', buildCommands: ['javac Main.java'], runCommand: 'java Main' },
  go: { image: 'glot/golang:latest', buildCommands: ['go build -o a.out main.go'], runCommand: './a.out' },
  rust: { image: 'glot/rust:latest', buildCommands: ['rustc -o a.out main.rs'], runCommand: './a.out' },
}

/** Official Glot now uses /api/mux; retain the legacy protocol for custom deployments. */
export function glotRequest(
  baseUrl: string,
  token: string,
  language: PistonLanguageId,
  code: string,
  input: unknown
) {
  let base: URL
  try { base = new URL(baseUrl) } catch { throw new RunnerUnavailableError() }
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
    throw new RunnerUnavailableError()
  const pathname = base.pathname.replace(/\/$/, '')
  const mux = base.origin === 'https://glot.io' && ['/api/run', '/api/mux'].includes(pathname)
  const files = [{ name: PISTON_LANGUAGE_CONFIG[language].filename, content: code }]
  const stdin = formatRunnerInput(input)
  if (mux) {
    const { image, buildCommands, runCommand } = muxLanguages[language]
    return {
      protocol: 'mux' as const,
      url: 'https://glot.io/api/mux',
      // The current public endpoint does not use the legacy API token.
      headers: {} as Record<string, string>,
      payload: { action: 'run', data: { image, payload: {
        runInstructions: { buildCommands, runCommand }, files, stdin,
      } } },
    }
  }
  if (!token) throw new RunnerUnavailableError('Runner Glot riêng cần cấu hình token hợp lệ.')
  return {
    protocol: 'legacy' as const,
    url: `${baseUrl.replace(/\/$/, '')}/${language}/latest`,
    headers: { Authorization: `Token ${token}` },
    payload: { files, stdin },
  }
}
