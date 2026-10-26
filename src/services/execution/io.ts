export function formatRunnerInput(input: unknown): string {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string') return input
  if (Array.isArray(input)) return input.map(formatRunnerInput).join(' ')
  return JSON.stringify(input)
}

export function parseRunnerOutput(stdout: string): unknown {
  const value = stdout.trim()
  if (!value) return ''
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
