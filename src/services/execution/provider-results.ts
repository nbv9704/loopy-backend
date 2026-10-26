import { z } from 'zod'
import { RunnerUnavailableError } from './errors'
import { parseRunnerOutput } from './io'

const stageSchema = z.object({
  code: z.number().int().nullable(),
  signal: z.string().nullable().optional(),
  stdout: z.string(),
  stderr: z.string(),
  status: z.enum(['RE', 'SG', 'TO', 'OL', 'EL', 'XX']).nullable().optional(),
  message: z.string().nullable().optional(),
})
const pistonSchema = z.object({ compile: stageSchema.optional(), run: stageSchema.optional() })
const glotSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().nullable(),
})
const glotMuxSchema = z.object({ data: glotSchema })

export function parseGlotMuxResult(value: unknown) {
  const result = glotMuxSchema.safeParse(value)
  // HTTP 200 with data.message is an infrastructure failure, not a student error.
  if (!result.success) throw new RunnerUnavailableError()
  return parseGlotResult(result.data.data)
}

export function parsePistonResult(value: unknown) {
  const result = pistonSchema.safeParse(value)
  if (!result.success) throw new RunnerUnavailableError()
  const failed = (stage: z.infer<typeof stageSchema>) =>
    stage.code !== 0 || Boolean(stage.signal) || Boolean(stage.status)
  const compileFailed = result.data.compile && failed(result.data.compile)
  const stage = compileFailed ? result.data.compile! : result.data.run
  if (!stage || stage.status === 'XX') throw new RunnerUnavailableError()
  const error = failed(stage)
    ? stage.status === 'TO'
      ? 'Execution Timeout'
      : stage.status === 'OL' || stage.status === 'EL'
        ? 'Output limit exceeded'
        : stage.stderr.trim() ||
          stage.message ||
          (compileFailed
            ? 'Compilation Error'
            : `Program exited with code ${stage.code ?? 'unknown'}`)
    : null
  return {
    output: parseRunnerOutput(stage.stdout),
    stdout: stage.stdout,
    stderr: stage.stderr,
    error,
    exitCode:
      stage.status === 'TO' || stage.signal === 'SIGKILL' ? 124 : error ? stage.code || 1 : 0,
  }
}

export function parseGlotResult(value: unknown) {
  const result = glotSchema.safeParse(value)
  if (!result.success) throw new RunnerUnavailableError()
  const error = result.data.error?.trim() || null
  return {
    ...result.data,
    output: parseRunnerOutput(result.data.stdout),
    error,
    exitCode: error ? 1 : 0,
  }
}
