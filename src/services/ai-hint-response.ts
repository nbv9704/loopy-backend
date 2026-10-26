/** Invalid provider output is a failure, never a fabricated successful hint. */
export function confirmAIHint(value: unknown): { hint: string } {
  const hint = (value as { hint?: unknown } | null)?.hint
  if (typeof hint !== 'string' || !hint.trim() || hint.length > 2000)
    throw new Error('AI hint response is invalid')
  return { hint: hint.trim() }
}
