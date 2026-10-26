import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'
import { readAllRows, readRowsForIds } from '../read-all-rows'
import { confirmEmptyRange } from '../empty-range'
import { toSet } from './model'

export interface PracticeCatalogQuery {
  userId?: string
  languageId?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  topic?: string
  keyword?: string
  includeQuestions?: boolean
  mine?: boolean
  official?: boolean
  limit?: number
  offset?: number
}
interface SetRow {
  id: string
  created_by?: string
  updated_at: string
  practice_questions: Array<{ count: number }>
}
interface QuestionRow {
  id: string
  set_id: string
  order_index: number
}
const unavailable = 'Không tải đủ dữ liệu Practice. Vui lòng thử lại.'
// Match literal text, preserving punctuation inside PostgREST's quoted filter value.
const pattern = (value: string) => JSON.stringify(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const search = (columns: string[], value: string) =>
  columns.map(column => `${column}.imatch.${pattern(value)}`).join(',')

export async function readPracticeCatalog(params: PracticeCatalogQuery) {
  const limit = params.limit ?? 20,
    offset = params.offset ?? 0
  const includeQuestions = Boolean(params.includeQuestions || params.keyword)
  if (params.mine && !params.userId) return { items: [], total: 0, limit, offset }
  const queryFor = (head = false) => {
    let query = supabaseAdmin
      .from('practice_sets')
      .select('*,practice_questions(count)', { count: 'exact', ...(head ? { head: true } : {}) })
    if (params.mine) query = query.eq('created_by', params.userId!).neq('status', 'archived')
    else if (params.official) query = query.eq('visibility', 'official').eq('status', 'published')
    else if (includeQuestions && params.userId)
      query = query.or(
        `and(status.eq.published,visibility.in.(public,unlisted)),and(created_by.eq.${params.userId},status.neq.archived)`
      )
    else
      query = query
        .eq('status', 'published')
        .in('visibility', includeQuestions ? ['public', 'unlisted'] : ['public'])
    if (params.languageId) query = query.eq('language_id', params.languageId)
    if (params.difficulty) query = query.eq('difficulty', params.difficulty)
    if (params.topic) query = query.or(search(['topic'], params.topic))
    return query
  }
  let rows: SetRow[], total: number
  if (params.keyword) {
    // Do not concatenate an unbounded question-match ID list into one URL.
    const matches = await readAllRows<{ id: string; set_id: string }>(
      (start, end) =>
        supabaseAdmin
          .from('practice_questions')
          .select('id,set_id', { count: 'exact' })
          .or(search(['title', 'prompt'], params.keyword!))
          .order('id')
          .range(start, end),
      unavailable
    )
    const metadata = await readAllRows<SetRow>(
      (start, end) =>
        queryFor()
          .or(search(['title', 'description', 'topic'], params.keyword!))
          .order('id')
          .range(start, end),
      unavailable
    )
    const byQuestion = await readRowsForIds<SetRow>(
      matches.map(row => row.set_id),
      (ids, start, end) => queryFor().in('id', ids).order('id').range(start, end),
      unavailable
    )
    const merged = new Map([...metadata, ...byQuestion].map(row => [row.id, row]))
    const sorted = [...merged.values()].sort((a, b) => {
      const timeA = Date.parse(a.updated_at),
        timeB = Date.parse(b.updated_at)
      if (!Number.isFinite(timeA) || !Number.isFinite(timeB))
        throw errors.databaseError(unavailable)
      return timeB - timeA || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
    })
    total = sorted.length
    rows = sorted.slice(offset, offset + limit)
  } else {
    const result = await queryFor()
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1)
    if (result.error?.code === 'PGRST103')
      return {
        items: [],
        total: await confirmEmptyRange(offset, () => queryFor(true), unavailable),
        limit,
        offset,
      }
    if (
      result.error ||
      !Array.isArray(result.data) ||
      result.count === null ||
      !Number.isSafeInteger(result.count) ||
      result.count < 0 ||
      (!result.data.length && offset < result.count) ||
      result.data.length > Math.min(limit, Math.max(0, result.count - offset))
    )
      throw errors.databaseError(unavailable)
    rows = result.data
    total = result.count
  }
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw errors.databaseError(unavailable)
  for (const row of rows)
    if (
      !Number.isSafeInteger(row.practice_questions?.[0]?.count) ||
      row.practice_questions[0].count < 0
    )
      throw errors.databaseError(unavailable)
  const questions = includeQuestions
    ? await readRowsForIds<QuestionRow>(
        rows.map(row => row.id),
        (ids, start, end) =>
          supabaseAdmin
            .from('practice_questions')
            .select('*', { count: 'exact' })
            .in('set_id', ids)
            .order('id')
            .range(start, end),
        unavailable
      )
    : []
  const bySet = new Map<string, QuestionRow[]>()
  const setIds = new Set(rows.map(row => row.id))
  for (const question of questions) {
    if (
      !setIds.has(question.set_id) ||
      !Number.isSafeInteger(question.order_index) ||
      question.order_index < 0
    )
      throw errors.databaseError(unavailable)
    const group = bySet.get(question.set_id) || []
    group.push(question)
    bySet.set(question.set_id, group)
  }
  const items = rows.map(row => {
    const group = bySet.get(row.id) || []
    if (includeQuestions && group.length !== row.practice_questions[0].count)
      throw errors.databaseError(unavailable)
    group.sort((a, b) => a.order_index - b.order_index || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    return toSet(
      includeQuestions ? { ...row, question_count: group.length, practice_questions: group } : row,
      {
        includeQuestions,
        includeAnswers: Boolean(params.mine && params.userId && row.created_by === params.userId),
      }
    )
  })
  return { items, total, limit, offset }
}
