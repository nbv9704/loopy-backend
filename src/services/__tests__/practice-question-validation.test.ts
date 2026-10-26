import { validatePracticeQuestions } from '../practice/validate-questions'
const choice = { type: 'multiple_choice', options: ['a', 'b'], correctAnswer: 'a' }
const multiple = { type: 'multiple_select', options: ['a', 'b', 'c'], correctAnswer: '["a","b"]' }
it.each(
  [
    [],
    Array.from({ length: 31 }, () => choice),
    [{ ...choice, options: ['a', 'a'] }],
    [{ ...choice, options: ['a', ''] }],
    [{ ...choice, correctAnswer: 'missing' }],
    [{ ...multiple, correctAnswer: '["a","a"]' }],
    [{ ...multiple, correctAnswer: '["a",{}]' }],
    [{ ...multiple, correctAnswer: '["a",1]' }],
    [{ ...multiple, correctAnswer: '["a","missing"]' }],
    [{ ...multiple, correctAnswer: '["a","b"' }],
    [{ type: 'true_false', correctAnswer: 'yes' }],
    [{ type: 'fill_blank', correctAnswer: '   ' }],
    [
      { ...choice, orderIndex: 0 },
      { ...choice, orderIndex: 0 },
    ],
    [{ ...choice, orderIndex: 1 }, choice],
    [{ ...choice, orderIndex: -1 }],
    [{ ...choice, orderIndex: 0.5 }],
  ].map(questions => ({ questions }))
)('rejects ambiguous or malformed authored questions before write %#', ({ questions }) => {
  expect(() => validatePracticeQuestions(questions)).toThrow()
})
it.each([
  choice,
  multiple,
  { ...multiple, correctAnswer: 'a|b' },
  { type: 'fill_blank', correctAnswer: 'hello' },
  { type: 'true_false', correctAnswer: 'false' },
])('keeps valid question formats including legacy pipe-separated multiple answers %#', question => {
  expect(() => validatePracticeQuestions([question])).not.toThrow()
})
