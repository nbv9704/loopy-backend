const questionTypes = new Set(['multiple_choice', 'true_false', 'fill_blank', 'short_answer'])

interface AnswerStep {
  id?: string
  type: string
  order_index?: number
}

/** Selection depends only on public fields, so the learner and checker see the same question. */
export function selectPrimaryAnswerStep<T extends AnswerStep>(
  steps: T[],
  lessonType: string
): T | undefined {
  const ordered = [...steps].sort(
    (a, b) =>
      (a.order_index ?? 0) - (b.order_index ?? 0) || (a.id || '').localeCompare(b.id || '', 'en')
  )
  return (
    ordered.find(step => questionTypes.has(step.type)) ||
    (lessonType === 'code_output' ? ordered.find(step => step.type === 'code_prompt') : undefined)
  )
}

export function normalizeAnswer(value: string, caseSensitive = false) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return caseSensitive ? normalized : normalized.toLowerCase()
}

const isScalarAnswer = (value: unknown) =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))

export function isAnswerKeyShape(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (Array.isArray(value) ? value.every(isScalarAnswer) : isScalarAnswer(value))
  )
}

export function parseCorrectAnswers(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  if (!values.every(isScalarAnswer)) return []
  return values.map(item => String(item).trim()).filter(Boolean)
}

export function matchesAnswer(key: unknown, submitted: string | undefined, caseSensitive = false) {
  const answer = normalizeAnswer(submitted || '', caseSensitive)
  return (
    answer.length > 0 &&
    parseCorrectAnswers(key).some(value => normalizeAnswer(value, caseSensitive) === answer)
  )
}
