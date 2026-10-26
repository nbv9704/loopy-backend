import { readStartedPractice, readSubmittedPractice } from '../practice/attempt-response'

const attempt = {
  id: 'attempt',
  set_id: 'set',
  user_id: 'learner',
  status: 'in_progress',
  score: 0,
  max_score: 10,
  started_at: '2026-10-24T00:00:00Z',
}
const question = {
  id: 'question',
  set_id: 'set',
  type: 'fill_blank',
  prompt: 'Hello',
  points: 10,
  order_index: 0,
}
const start = { attempt, questions: [question] }
const submission = {
  id: 'saved',
  attempt_id: 'attempt',
  question_id: 'question',
  user_id: 'learner',
  is_correct: true,
  points_earned: 10,
  submitted_at: '2026-10-24T00:00:00Z',
}
const saved = { attempt: { ...attempt, score: 10, status: 'completed' }, submission }

it('accepts only the projected public question fields, dropping private answers and explanations', () => {
  const result = readStartedPractice(
    {
      ...start,
      questions: [
        { ...question, correct_answer: 'secret', explanation: 'secret', test_cases: ['secret'] },
      ],
    },
    'set',
    'learner'
  )
  expect(JSON.stringify(result)).not.toContain('secret')
})
it.each([
  null,
  { ...start, attempt: { ...attempt, user_id: 'other' } },
  { ...start, attempt: { ...attempt, set_id: 'other' } },
  { ...start, attempt: { ...attempt, max_score: 100 } },
  { ...start, attempt: { ...attempt, score: 1 } },
  { ...start, questions: [] },
  { ...start, questions: [question, question] },
  { ...start, questions: [{ ...question, set_id: 'other' }] },
])('rejects a malformed or foreign start result %#', value => {
  expect(() => readStartedPractice(value, 'set', 'learner')).toThrow('Practice')
})
it.each([
  { ...saved, submission: { ...submission, user_id: 'other' } },
  { ...saved, submission: { ...submission, question_id: 'other' } },
  { ...saved, submission: { ...submission, is_correct: 'true' } },
  { ...saved, submission: { ...submission, points_earned: 11 } },
  { ...saved, submission: { ...submission, is_correct: false } },
  { ...saved, attempt: { ...saved.attempt, score: -1 } },
  { ...saved, attempt: { ...saved.attempt, max_score: 1 } },
])('rejects malformed submission metrics or identity %#', value => {
  expect(() => readSubmittedPractice(value, 'attempt', 'question', 'learner')).toThrow('Practice')
})
it('preserves committed zero values and does not project the submitted answer', () => {
  const result = readSubmittedPractice(
    {
      attempt,
      submission: { ...submission, points_earned: 0, is_correct: false, selected_answer: 'secret' },
    },
    'attempt',
    'question',
    'learner'
  )
  expect(result.submission.points_earned).toBe(0)
  expect(result.attempt.score).toBe(0)
  expect(JSON.stringify(result)).not.toContain('secret')
})
