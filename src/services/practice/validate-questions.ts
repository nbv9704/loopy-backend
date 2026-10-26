import { errors } from '../../middleware/errorHandler'

interface QuestionInput {
  type: string
  correctAnswer?: string
  options?: string[]
  orderIndex?: number
}
function answerValues(value: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    parsed = value.includes('|') ? value.split('|').map(item => item.trim()) : null
  }
  if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string' || !item.trim()))
    return []
  return parsed.map(item => (item as string).trim())
}

/** Validate newly authored questions; legacy duplicate option labels remain readable. */
export function validatePracticeQuestions(questions: QuestionInput[]) {
  if (!questions.length || questions.length > 30)
    throw errors.badRequest('Practice sets require 1-30 questions')
  const orders = new Set<number>()
  for (const [index, question] of questions.entries()) {
    const order = question.orderIndex ?? index
    if (!Number.isSafeInteger(order) || order < 0 || orders.has(order))
      throw errors.badRequest('Practice question order must be distinct nonnegative integers')
    orders.add(order)
    if (!['true_false', 'multiple_choice', 'multiple_select', 'fill_blank'].includes(question.type))
      throw errors.badRequest('Unsupported Practice question type')
    if (!question.correctAnswer?.trim())
      throw errors.badRequest('Practice questions require correctAnswer')
    if (question.type === 'true_false' && !['true', 'false'].includes(question.correctAnswer))
      throw errors.badRequest('True/false questions require true or false correctAnswer')
    if (question.type === 'multiple_choice' || question.type === 'multiple_select') {
      const options = question.options || []
      if (
        options.length < 2 ||
        options.length > 4 ||
        options.some(option => !option.trim() || option !== option.trim()) ||
        new Set(options).size !== options.length
      )
        throw errors.badRequest('Choice questions require 2-4 distinct, nonempty options')
      if (question.type === 'multiple_choice' && !options.includes(question.correctAnswer))
        throw errors.badRequest('Multiple choice questions require a matching correctAnswer')
      if (question.type === 'multiple_select') {
        const answers = answerValues(question.correctAnswer)
        if (
          answers.length < 2 ||
          new Set(answers).size !== answers.length ||
          answers.some(answer => !options.includes(answer))
        )
          throw errors.badRequest(
            'Multiple select questions require at least 2 distinct matching correct answers'
          )
      }
    }
  }
}
