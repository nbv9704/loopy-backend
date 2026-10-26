export const sanitizeQuestion = (row: any) => ({
  id: row.id,
  setId: row.set_id,
  type: row.type,
  title: row.title,
  prompt: row.prompt,
  options: row.options,
  starterCode: row.starter_code,
  points: row.points,
  orderIndex: row.order_index,
})

export const sanitizeQuestionWithAnswer = (row: any) => ({
  ...sanitizeQuestion(row),
  correctAnswer: row.correct_answer,
  explanation: row.explanation,
})

export const toSet = (
  row: any,
  options: { includeQuestions?: boolean; includeAnswers?: boolean } = {}
) => {
  const questions = Array.isArray(row.practice_questions) ? row.practice_questions : []
  const countFromAggregate =
    questions.length === 1 && typeof questions[0]?.count === 'number'
      ? questions[0].count
      : undefined

  return {
    id: row.id,
    ownerType: row.owner_type,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    topic: row.topic,
    languageId: row.language_id,
    difficulty: row.difficulty,
    visibility: row.visibility,
    status: row.status,
    requirements: row.requirements || {},
    questionCount: countFromAggregate ?? row.question_count ?? questions.length,
    questions: options.includeQuestions
      ? questions.map(options.includeAnswers ? sanitizeQuestionWithAnswer : sanitizeQuestion)
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
