import { practiceSchemas } from '../practice.schemas'
const body = {
  title: 'Quiz',
  questions: [{ type: 'fill_blank', prompt: 'Say hello', correctAnswer: 'hello' }],
}
it.each([
  { type: 'completed_lessons_count' },
  { count: 2 },
  { languageId: 'python' },
  { type: 'completed_lessons_count', languageId: 'python', count: 0 },
  { type: 'completed_lessons_count', languageId: ' ', count: 2 },
  { type: 'completed_lessons_count', languageId: 'python', count: 1000 },
])('rejects a partial or invalid unlock requirement before I/O %#', requirements => {
  expect(practiceSchemas.createSet.safeParse({ body: { ...body, requirements } }).success).toBe(
    false
  )
})
it.each([{}, { type: 'completed_lessons_count', languageId: 'python', count: 1 }])(
  'accepts empty or complete requirements %#',
  requirements => {
    expect(practiceSchemas.createSet.safeParse({ body: { ...body, requirements } }).success).toBe(
      true
    )
  }
)
