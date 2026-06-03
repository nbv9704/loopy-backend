import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'

type Requirement = {
  type?: 'completed_lessons_count'
  languageId?: string
  count?: number
}

type PracticeQuestionInput = {
  type: 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
  title?: string
  prompt: string
  options?: string[]
  correctAnswer?: string
  starterCode?: string
  testCases?: Record<string, unknown>[]
  solutionCode?: string
  explanation?: string
  points?: number
  orderIndex?: number
}

type CreatePracticeSetInput = {
  title: string
  description?: string
  topic?: string
  languageId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  visibility?: 'public' | 'private' | 'unlisted'
  status?: 'draft' | 'published'
  requirements?: Requirement
  questions: PracticeQuestionInput[]
}

const sanitizeQuestion = (row: any) => ({
  id: row.id,
  setId: row.set_id,
  type: row.type,
  title: row.title,
  prompt: row.prompt,
  options: row.options,
  starterCode: row.starter_code,
  explanation: row.explanation,
  points: row.points,
  orderIndex: row.order_index,
})

const sanitizeQuestionWithAnswer = (row: any) => ({
  ...sanitizeQuestion(row),
  correctAnswer: row.correct_answer,
})

const toSet = (row: any, options: { includeQuestions?: boolean } = {}) => {
  const questions = Array.isArray(row.practice_questions) ? row.practice_questions : []
  const countFromAggregate = questions.length === 1 && typeof questions[0]?.count === 'number'
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
    questions: options.includeQuestions ? questions.map(sanitizeQuestionWithAnswer) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class PracticeService {
  async listSets(params: {
    userId: string
    languageId?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    topic?: string
    keyword?: string
    includeQuestions?: boolean
    mine?: boolean
    limit?: number
    offset?: number
  }) {
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    const includeQuestions = Boolean(params.includeQuestions || params.keyword)

    let query = supabaseAdmin
      .from('practice_sets')
      .select('*, practice_questions(count)', { count: 'exact' })

    if (params.mine) {
      query = query.eq('created_by', params.userId)
    } else if (includeQuestions) {
      query = query.or(`and(status.eq.published,visibility.in.(public,unlisted)),created_by.eq.${params.userId}`)
    } else {
      query = query.eq('status', 'published').eq('visibility', 'public')
    }

    if (params.languageId) query = query.eq('language_id', params.languageId)
    if (params.difficulty) query = query.eq('difficulty', params.difficulty)
    if (params.topic) query = query.ilike('topic', `%${params.topic}%`)
    if (params.keyword) {
      const keyword = params.keyword.trim()
      const { data: questionMatches, error: questionSearchError } = await supabaseAdmin
        .from('practice_questions')
        .select('set_id')
        .or(`title.ilike.%${keyword}%,prompt.ilike.%${keyword}%`)

      if (questionSearchError) throw errors.databaseError('Failed to search practice questions', questionSearchError)

      const setIds = Array.from(new Set((questionMatches || []).map(row => row.set_id).filter(Boolean)))
      const metadataSearch = `title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%`
      query = query.or(setIds.length ? `${metadataSearch},id.in.(${setIds.join(',')})` : metadataSearch)
    }

    query = query.order('updated_at', { ascending: false })

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) throw errors.databaseError('Failed to fetch practice sets', error)

    let rows = data || []
    if (includeQuestions && rows.length) {
      const setIds = rows.map(row => row.id)
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from('practice_questions')
        .select('*')
        .in('set_id', setIds)
        .order('order_index', { ascending: true })

      if (questionsError) throw errors.databaseError('Failed to fetch practice questions', questionsError)

      const questionsBySetId = new Map<string, any[]>()
      for (const question of questions || []) {
        const current = questionsBySetId.get(question.set_id) || []
        current.push(question)
        questionsBySetId.set(question.set_id, current)
      }

      rows = rows.map(row => ({
        ...row,
        practice_questions: questionsBySetId.get(row.id) || [],
        question_count: questionsBySetId.get(row.id)?.length ?? row.question_count,
      }))
    }

    return {
      items: rows.map((row) => toSet(row, { includeQuestions })),
      total: count || 0,
      limit,
      offset,
    }
  }

  async getSet(setId: string, userId: string) {
    const { data: set, error } = await supabaseAdmin
      .from('practice_sets')
      .select('*, practice_questions(*)')
      .eq('id', setId)
      .order('order_index', { referencedTable: 'practice_questions', ascending: true })
      .single()

    if (error || !set) throw errors.notFound('Practice set')

    if (!this.canViewSet(set, userId)) {
      throw errors.forbidden()
    }

    return {
      ...toSet({ ...set, question_count: set.practice_questions?.length || 0 }),
      questions: (set.practice_questions || []).map(sanitizeQuestion),
    }
  }

  async searchQuestions(params: { userId: string; keyword: string; limit?: number }) {
    const keyword = params.keyword.trim()
    const limit = params.limit ?? 20

    const sets = await this.listSets({
      userId: params.userId,
      keyword,
      includeQuestions: true,
      limit: 20,
      offset: 0,
    })

    return sets.items
      .flatMap(set => (set.questions || []).map((question: ReturnType<typeof sanitizeQuestionWithAnswer>) => ({
        set: { ...set, questions: undefined },
        question,
      })))
      .slice(0, limit)
  }

  async createSet(input: CreatePracticeSetInput, userId: string) {
    this.validateQuestions(input.questions)

    const { data: set, error } = await supabaseAdmin
      .from('practice_sets')
      .insert({
        owner_type: 'user',
        created_by: userId,
        title: input.title,
        description: input.description,
        topic: input.topic,
        language_id: input.languageId,
        difficulty: input.difficulty || 'easy',
        visibility: input.visibility || 'private',
        status: input.status || 'draft',
        requirements: input.requirements || {},
      })
      .select('*')
      .single()

    if (error || !set) throw errors.databaseError('Failed to create practice set', error)

    const questions = input.questions.map((question, index) => ({
      set_id: set.id,
      type: question.type,
      title: question.title,
      prompt: question.prompt,
      options: question.options,
      correct_answer: question.correctAnswer,
      starter_code: question.starterCode,
      test_cases: question.testCases,
      solution_code: question.solutionCode,
      explanation: question.explanation,
      points: question.points || 10,
      order_index: question.orderIndex ?? index,
    }))

    const { error: questionError } = await supabaseAdmin.from('practice_questions').insert(questions)
    if (questionError) {
      await supabaseAdmin.from('practice_sets').delete().eq('id', set.id)
      throw errors.databaseError('Failed to create practice questions', questionError)
    }

    return this.getSet(set.id, userId)
  }

  async startAttempt(setId: string, userId: string) {
    const set = await this.getRawSet(setId, userId)
    await this.assertRequirementsMet(set.requirements || {}, userId)

    const { data: questions, error: questionError } = await supabaseAdmin
      .from('practice_questions')
      .select('*')
      .eq('set_id', setId)
      .order('order_index', { ascending: true })

    if (questionError) throw errors.databaseError('Failed to fetch practice questions', questionError)
    if (!questions?.length) throw errors.badRequest('Practice set has no questions')

    const maxScore = questions.reduce((sum, question) => sum + (question.points || 0), 0)

    const { data: attempt, error } = await supabaseAdmin
      .from('practice_attempts')
      .insert({
        set_id: setId,
        user_id: userId,
        max_score: maxScore,
      })
      .select('*')
      .single()

    if (error || !attempt) throw errors.databaseError('Failed to start practice attempt', error)

    return {
      ...this.toAttempt(attempt),
      questions: questions.map(sanitizeQuestion),
    }
  }

  async submit(attemptId: string, questionId: string, userId: string, input: { selectedAnswer?: string; code?: string }) {
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('practice_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single()

    if (attemptError || !attempt) throw errors.notFound('Practice attempt')
    if (attempt.status === 'completed') throw errors.badRequest('Practice attempt is already completed')

    const { data: question, error: questionError } = await supabaseAdmin
      .from('practice_questions')
      .select('*')
      .eq('id', questionId)
      .eq('set_id', attempt.set_id)
      .single()

    if (questionError || !question) throw errors.notFound('Practice question')

    let isCorrect = false
    let pointsEarned = 0
    const executionOutput: string | null = null
    const executionError: string | null = null
    const testResults: any = null

    if (input.selectedAnswer === undefined) throw errors.badRequest('Selected answer is required')
    isCorrect = this.isAnswerCorrect(question.type, input.selectedAnswer, question.correct_answer)
    pointsEarned = isCorrect ? question.points || 0 : 0

    const { data: submission, error } = await supabaseAdmin
      .from('practice_submissions')
      .insert({
        attempt_id: attemptId,
        question_id: questionId,
        user_id: userId,
        selected_answer: input.selectedAnswer,
        code: input.code,
        execution_output: executionOutput,
        execution_error: executionError,
        test_results: testResults,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      })
      .select('*')
      .single()

    if (error || !submission) throw errors.databaseError('Failed to submit practice answer', error)

    const { data: submissions, error: countError } = await supabaseAdmin
      .from('practice_submissions')
      .select('points_earned')
      .eq('attempt_id', attemptId)

    if (countError) throw errors.databaseError('Failed to refresh practice attempt score', countError)

    const score = (submissions || []).reduce((sum, row) => sum + (row.points_earned || 0), 0)

    const { count: questionCount, error: questionCountError } = await supabaseAdmin
      .from('practice_questions')
      .select('id', { count: 'exact', head: true })
      .eq('set_id', attempt.set_id)

    if (questionCountError) throw errors.databaseError('Failed to count practice questions', questionCountError)

    const completed = (submissions?.length || 0) >= (questionCount || 0)
    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('practice_attempts')
      .update({
        score,
        status: completed ? 'completed' : 'in_progress',
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', attemptId)
      .select('*')
      .single()

    if (updateError || !updatedAttempt) throw errors.databaseError('Failed to update practice attempt', updateError)

    return {
      submission: {
        id: submission.id,
        attemptId: submission.attempt_id,
        questionId: submission.question_id,
        isCorrect: submission.is_correct,
        pointsEarned: submission.points_earned,
        testResults: submission.test_results,
        submittedAt: submission.submitted_at,
      },
      attempt: this.toAttempt(updatedAttempt),
    }
  }

  private async getRawSet(setId: string, userId: string) {
    const { data: set, error } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('id', setId)
      .single()

    if (error || !set) throw errors.notFound('Practice set')
    if (!this.canViewSet(set, userId)) throw errors.forbidden()
    return set
  }

  private canViewSet(set: any, userId: string) {
    return set.created_by === userId || (set.status === 'published' && ['public', 'unlisted'].includes(set.visibility))
  }

  private validateQuestions(questions: PracticeQuestionInput[]) {
    if (questions.length > 30) throw errors.badRequest('Practice sets can contain at most 30 questions')

    questions.forEach((question) => {
      if (!question.correctAnswer) {
        throw errors.badRequest('Practice questions require correctAnswer')
      }

      if (question.type === 'true_false' && !['true', 'false'].includes(question.correctAnswer)) {
        throw errors.badRequest('True/false questions require true or false correctAnswer')
      }

      if (question.type === 'multiple_choice') {
        const options = question.options || []
        if (options.length < 2 || options.length > 4 || !options.includes(question.correctAnswer)) {
          throw errors.badRequest('Multiple choice questions require 2-4 options and a matching correctAnswer')
        }
      }

      if (question.type === 'multiple_select') {
        const options = question.options || []
        const correctAnswers = this.parseAnswerArray(question.correctAnswer)
        if (
          options.length < 2 ||
          options.length > 4 ||
          correctAnswers.length < 2 ||
          correctAnswers.some(answer => !options.includes(answer))
        ) {
          throw errors.badRequest('Multiple select questions require 2-4 options and at least 2 matching correct answers')
        }
      }
    })
  }

  private isAnswerCorrect(type: string, selectedAnswer: string, correctAnswer: string | null) {
    if (!correctAnswer) return false

    if (type === 'multiple_select') {
      const selected = this.parseAnswerArray(selectedAnswer).map(answer => answer.trim()).sort()
      const correct = this.parseAnswerArray(correctAnswer).map(answer => answer.trim()).sort()
      return selected.length === correct.length && selected.every((answer, index) => answer === correct[index])
    }

    if (type === 'fill_blank') {
      return selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    }

    return selectedAnswer.trim() === correctAnswer.trim()
  }

  private parseAnswerArray(value: string) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item)).filter(Boolean)
      }
    } catch {
      return value.split('|').map(item => item.trim()).filter(Boolean)
    }
    return []
  }

  private async assertRequirementsMet(requirements: Requirement, userId: string) {
    if (!requirements?.type) return

    if (requirements.type === 'completed_lessons_count') {
      if (!requirements.languageId || !requirements.count) {
        throw errors.badRequest('Invalid completed lessons requirement')
      }

      const { count, error } = await supabaseAdmin
        .from('user_progress')
        .select('lesson_id, lessons!inner(chapters!inner(language_id))', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('lessons.chapters.language_id', requirements.languageId)

      if (error) throw errors.databaseError('Failed to check practice requirements', error)

      if ((count || 0) < requirements.count) {
        throw errors.forbidden()
      }
    }
  }

  private toAttempt(row: any) {
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
}

export const practiceService = new PracticeService()
