import { z } from 'zod'
import { errors } from '../../middleware/errorHandler'

const id = z.string().min(1)
const count = z.number().int().nonnegative().safe()
const attempt = z
  .object({
    id,
    set_id: id,
    user_id: id,
    status: z.enum(['in_progress', 'completed']),
    score: count,
    max_score: count,
    started_at: id,
    completed_at: z.string().nullish(),
  })
  .refine(row => row.score <= row.max_score)
const question = z.object({
  id,
  set_id: id,
  type: z.enum(['true_false', 'multiple_choice', 'multiple_select', 'fill_blank']),
  title: z.string().nullish(),
  prompt: id,
  options: z.array(z.string()).nullish(),
  starter_code: z.string().nullish(),
  points: count,
  order_index: count,
})
const unavailable = () =>
  errors.databaseError('Không xác nhận được kết quả Practice. Vui lòng thử lại.')

export function readStartedPractice(value: unknown, setId: string, userId: string) {
  const result = z.object({ attempt, questions: z.array(question).min(1).max(30) }).safeParse(value)
  if (!result.success) throw unavailable()
  const data = result.data
  if (
    data.attempt.set_id !== setId ||
    data.attempt.user_id !== userId ||
    data.attempt.status !== 'in_progress' ||
    data.attempt.score !== 0 ||
    data.questions.some(row => row.set_id !== setId) ||
    new Set(data.questions.map(row => row.id)).size !== data.questions.length ||
    data.questions.reduce((sum, row) => sum + row.points, 0) !== data.attempt.max_score
  )
    throw unavailable()
  return data
}

export function readSubmittedPractice(
  value: unknown,
  attemptId: string,
  questionId: string,
  userId: string
) {
  const result = z
    .object({
      attempt,
      submission: z.object({
        id,
        attempt_id: id,
        question_id: id,
        user_id: id,
        is_correct: z.boolean(),
        points_earned: count,
        submitted_at: id,
        test_results: z.unknown().optional(),
      }),
    })
    .safeParse(value)
  if (!result.success) throw unavailable()
  const data = result.data
  if (
    data.attempt.id !== attemptId ||
    data.attempt.user_id !== userId ||
    data.submission.attempt_id !== attemptId ||
    data.submission.question_id !== questionId ||
    data.submission.user_id !== userId ||
    data.submission.points_earned > data.attempt.score ||
    (!data.submission.is_correct && data.submission.points_earned !== 0)
  )
    throw unavailable()
  return data
}

export function toPracticeAttempt(row: z.infer<typeof attempt>) {
  return {
    id: row.id,
    setId: row.set_id,
    userId: row.user_id,
    status: row.status,
    score: row.score,
    maxScore: row.max_score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}
