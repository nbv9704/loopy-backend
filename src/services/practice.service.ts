import { validatePracticeQuestions } from './practice/validate-questions'
import { practiceSavedId, readSavedPractice } from './practice/save-result'
import { archiveOwnedPractice } from './practice/archive'
import { readPracticeCatalog, type PracticeCatalogQuery } from './practice/catalog'
import { supabaseAdmin } from '../db/supabase'
import { AppError, errors } from '../middleware/errorHandler'
import { validateContent } from '../utils/contentModeration'
import { readSubmittedExplanation } from './practice/feedback'
import {
  readStartedPractice,
  readSubmittedPractice,
  toPracticeAttempt,
} from './practice/attempt-response'
import { sanitizeQuestion, sanitizeQuestionWithAnswer, toSet } from './practice/model'
import {
  listAdminPracticeSets,
  getAdminPracticeStats,
  patchAdminPracticeSet,
} from './practice/admin'

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
  visibility?: 'public' | 'private' | 'unlisted' | 'official'
  status?: 'draft' | 'published' | 'archived'
  requirements?: Requirement
  questions: PracticeQuestionInput[]
}

export class PracticeService {
  async checkIsAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    if (error || !data)
      throw errors.databaseError('Không xác nhận được quyền tạo/sửa bộ bài. Vui lòng thử lại.')
    return data.is_admin === true
  }

  async listSets(params: PracticeCatalogQuery) {
    return readPracticeCatalog(params)
  }

  async getSet(setId: string, userId?: string) {
    const set = await this.readSet(setId, true)

    if (!this.canViewSet(set, userId)) {
      throw errors.forbidden()
    }

    return {
      ...toSet({ ...set, question_count: set.practice_questions?.length || 0 }),
      questions: (set.practice_questions || []).map(
        userId && set.created_by === userId ? sanitizeQuestionWithAnswer : sanitizeQuestion
      ),
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

    const needle = keyword.toLocaleLowerCase()
    return sets.items
      .flatMap(set =>
        (set.questions || [])
          .filter((question: ReturnType<typeof sanitizeQuestion>) =>
            [set.title, set.description, set.topic, question.title, question.prompt].some(
              value => typeof value === 'string' && value.toLocaleLowerCase().includes(needle)
            )
          )
          .map((question: ReturnType<typeof sanitizeQuestion>) => ({
            set: { ...set, questions: undefined },
            question,
          }))
      )
      .slice(0, limit)
  }

  private async callPracticeRPC(name: string, args: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin.rpc(name, args)
    if (error) {
      if (error.code === 'PGRST202' || error.code === '42883') {
        throw new AppError(
          503,
          'SCHEMA_NOT_READY',
          'Bài luyện tập tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
        )
      }
      if (error.code === '42501') throw errors.forbidden()
      if (error.code === 'P0002') throw errors.notFound('Practice resource')
      if (error.code === '22023') throw errors.badRequest(error.message)
      throw errors.databaseError('Không lưu được dữ liệu Practice. Vui lòng thử lại.')
    }
    if (data === null) throw errors.databaseError('Practice transaction returned no result')
    return data
  }

  private async saveSet(
    input: CreatePracticeSetInput,
    userId: string,
    setId: string | null,
    isAdmin: boolean
  ) {
    if (input.visibility === 'official' && !isAdmin) throw errors.forbidden()
    validatePracticeQuestions(input.questions)
    await validateContent([
      input.title,
      input.description,
      input.topic,
      ...input.questions.flatMap(q => [
        q.title,
        q.prompt,
        q.explanation,
        q.correctAnswer,
        ...(q.options || []),
      ]),
    ])
    const savedId = await this.callPracticeRPC('save_practice_set_atomically', {
      p_actor_id: userId,
      p_set_id: setId,
      p_payload: {
        title: input.title,
        description: input.description,
        topic: input.topic,
        language_id: input.languageId,
        difficulty: input.difficulty || 'easy',
        visibility: input.visibility || 'private',
        status: input.status || 'draft',
        requirements: input.requirements || {},
        questions: input.questions.map((q, index) => ({
          type: q.type,
          title: q.title,
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correctAnswer,
          starter_code: q.starterCode,
          test_cases: q.testCases,
          solution_code: q.solutionCode,
          explanation: q.explanation,
          points: q.points ?? 10,
          order_index: q.orderIndex ?? index,
        })),
      },
    })
    return practiceSavedId(savedId, setId ?? undefined)
  }

  async createSet(input: CreatePracticeSetInput, userId: string, isAdmin = false) {
    const setId = await this.saveSet(input, userId, null, isAdmin)
    return readSavedPractice(setId, () => this.getSet(setId, userId))
  }

  async updateSet(setId: string, input: CreatePracticeSetInput, userId: string, isAdmin = false) {
    const set = await this.getRawSet(setId, userId)
    if (set.created_by !== userId) throw errors.forbidden()
    await this.saveSet(input, userId, setId, isAdmin)
    return readSavedPractice(setId, () => this.getSet(setId, userId))
  }

  async deleteSet(setId: string, userId: string, expectedStatus?: string) {
    const set = await this.getRawSet(setId, userId)
    if (set.created_by !== userId) {
      throw errors.forbidden()
    }

    return archiveOwnedPractice(setId, userId, expectedStatus ?? set.status)
  }

  async startAttempt(setId: string, userId: string) {
    const set = await this.getRawSet(setId, userId)
    if (set.status === 'archived') throw errors.badRequest('Practice set is archived')
    const raw = await this.callPracticeRPC('start_practice_attempt_atomically', {
      p_set_id: setId,
      p_actor_id: userId,
    })
    const result = readStartedPractice(raw, setId, userId)
    return {
      ...toPracticeAttempt(result.attempt),
      questions: result.questions.map(sanitizeQuestion),
    }
  }

  async submit(
    attemptId: string,
    questionId: string,
    userId: string,
    input: { selectedAnswer?: string; code?: string }
  ) {
    if (input.selectedAnswer === undefined) throw errors.badRequest('Selected answer is required')
    const raw = await this.callPracticeRPC('submit_practice_answer_atomically', {
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_actor_id: userId,
      p_answer: input.selectedAnswer,
      p_code: input.code ?? null,
    })
    const result = readSubmittedPractice(raw, attemptId, questionId, userId)
    const submission = result.submission
    const explanation = await readSubmittedExplanation(questionId, result.attempt.set_id)
    return {
      submission: {
        id: submission.id,
        attemptId: submission.attempt_id,
        questionId: submission.question_id,
        isCorrect: submission.is_correct,
        pointsEarned: submission.points_earned,
        testResults: submission.test_results,
        submittedAt: submission.submitted_at,
        explanation,
      },
      attempt: toPracticeAttempt(result.attempt),
    }
  }

  private async getRawSet(setId: string, userId: string) {
    const set = await this.readSet(setId)
    if (!this.canViewSet(set, userId)) throw errors.forbidden()
    return set
  }

  private async readSet(setId: string, includeQuestions = false) {
    const table = supabaseAdmin.from('practice_sets')
    const query = includeQuestions
      ? table
          .select('*, practice_questions(*)')
          .eq('id', setId)
          .order('order_index', { referencedTable: 'practice_questions', ascending: true })
      : table.select('*').eq('id', setId)
    const { data: set, error } = await query.single()
    if (error && error.code !== 'PGRST116')
      throw errors.databaseError('Failed to load practice set')
    if (!set || error) throw errors.notFound('Practice set')
    return set
  }

  private canViewSet(set: any, userId?: string) {
    return (
      (Boolean(userId) && set.created_by === userId) ||
      (set.status === 'published' && ['public', 'unlisted', 'official'].includes(set.visibility))
    )
  }

  /**
   * Admin: List all practice sets with filters (ignores visibility/status restrictions)
   */
  async listAllSets(params: {
    languageId?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    status?: 'active' | 'draft' | 'published' | 'archived' | 'all'
    visibility?: 'public' | 'private' | 'unlisted' | 'official'
    createdBy?: string
    limit?: number
    offset?: number
  }) {
    return listAdminPracticeSets(params)
  }

  /**
   * Admin: Get set details without permission check
   */
  async getSetForAdmin(setId: string) {
    const set = await this.readSet(setId, true)

    return {
      ...toSet({ ...set, question_count: set.practice_questions?.length || 0 }),
      questions: (set.practice_questions || []).map(sanitizeQuestionWithAnswer),
    }
  }

  /**
   * Admin: Update practice set (can edit any set)
   */
  async updateSetForAdmin(setId: string, input: CreatePracticeSetInput, adminId: string) {
    await this.saveSet(input, adminId, setId, true)
    return readSavedPractice(setId, () => this.getSetForAdmin(setId))
  }

  /**
   * Admin: Delete practice set
   */
  async deleteSetForAdmin(setId: string, _adminId: string, expectedStatus: string) {
    const saved = await patchAdminPracticeSet(
      setId,
      { status: 'archived' },
      { status: expectedStatus }
    )
    return { success: true, data: { id: saved.id, status: saved.status } }
  }

  async updateSetStatus(
    setId: string,
    status: 'draft' | 'published' | 'archived',
    _adminId: string,
    expectedStatus: string
  ) {
    return patchAdminPracticeSet(setId, { status }, { status: expectedStatus })
  }

  async updateSetVisibility(
    setId: string,
    visibility: 'public' | 'private' | 'unlisted' | 'official',
    _adminId: string,
    expectedVisibility: string
  ) {
    return patchAdminPracticeSet(
      setId,
      { visibility, owner_type: visibility === 'official' ? 'official' : 'user' },
      { visibility: expectedVisibility }
    )
  }

  async getPracticeStats() {
    return getAdminPracticeStats()
  }
}

export const practiceService = new PracticeService()
