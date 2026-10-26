import { supabaseAdmin } from '../db/supabase'
import { errors } from '../middleware/errorHandler'
import { publicLessonStepSelect } from './lesson-check/public-content'
import { readAllRows, readRowsForIds } from './read-all-rows'
import { publicChapterSelect, publicLessonSelect } from './curriculum/projections'
import { readActivePath, readPathMapping } from './curriculum/path-read'

interface ChapterRow {
  id: string
  order_index: number
  language_id: string
}
interface LessonRow {
  id: string
  chapter_id: string
  order_index: number
  status: string
}
interface StepRow {
  id: string
  lesson_id: string
  order_index: number
}
const byOrder = (a: { order_index: number; id: string }, b: { order_index: number; id: string }) =>
  a.order_index - b.order_index || a.id.localeCompare(b.id)

/** Read each level independently: embedded one-to-many rows can be capped too. */
export async function getCurriculum(
  languageId: string,
  options: { pathId?: string; legacyGoal?: string } = {}
) {
  if (options.pathId) await readActivePath(options.pathId, languageId)
  const mapping = options.pathId ? await readPathMapping(options.pathId) : undefined
  if (mapping?.length === 0) return { chapters: [], lessons: [] }

  const chapterPage = (ids: string[] | undefined, offset: number, end: number) => {
    let query = supabaseAdmin
      .from('chapters')
      .select(publicChapterSelect, { count: 'exact' })
      .eq('language_id', languageId)
    if (ids) query = query.in('id', ids)
    if (options.legacyGoal) query = query.eq('learning_path', options.legacyGoal)
    return query.order('order_index').order('id').range(offset, end)
  }
  const chapters = mapping
    ? await readRowsForIds<ChapterRow>(
        mapping.map(row => row.chapter_id),
        chapterPage,
        'Không tải đủ chương của lộ trình.'
      )
    : await readAllRows<ChapterRow>(
        (offset, end) => chapterPage(undefined, offset, end),
        'Không tải đủ chương học.'
      )
  const chaptersById = new Map(chapters.map(chapter => [chapter.id, chapter]))
  if (mapping?.some(row => !chaptersById.has(row.chapter_id)))
    throw errors.databaseError('Lộ trình tham chiếu chương không hợp lệ. Vui lòng thử lại.')
  const ordered = mapping
    ? mapping.map(row => ({ ...chaptersById.get(row.chapter_id)!, order_index: row.order_index }))
    : chapters.sort(byOrder)

  const lessons = await readRowsForIds<LessonRow>(
    ordered.map(chapter => chapter.id),
    (ids, offset, end) =>
      supabaseAdmin
        .from('lessons')
        .select(publicLessonSelect, { count: 'exact' })
        .in('chapter_id', ids)
        .eq('status', 'published')
        .order('order_index')
        .order('id')
        .range(offset, end)
        .returns<LessonRow[]>(),
    'Không tải đủ bài học. Vui lòng thử lại.'
  )
  const steps = await readRowsForIds<StepRow>(
    lessons.map(lesson => lesson.id),
    (ids, offset, end) =>
      supabaseAdmin
        .from('lesson_steps')
        .select(publicLessonStepSelect, { count: 'exact' })
        .in('lesson_id', ids)
        .order('order_index')
        .order('id')
        .range(offset, end),
    'Không tải đủ bước học. Vui lòng thử lại.'
  )
  const stepsByLesson = new Map<string, StepRow[]>()
  for (const step of steps) {
    const items = stepsByLesson.get(step.lesson_id) || []
    items.push(step)
    stepsByLesson.set(step.lesson_id, items)
  }
  const lessonsByChapter = new Map<string, LessonRow[]>()
  for (const lesson of lessons) {
    const items = lessonsByChapter.get(lesson.chapter_id) || []
    items.push(lesson)
    lessonsByChapter.set(lesson.chapter_id, items)
  }
  return {
    chapters: ordered,
    lessons: ordered.flatMap(chapter =>
      (lessonsByChapter.get(chapter.id) || [])
        .sort(byOrder)
        .map(lesson => ({
          ...lesson,
          lesson_steps: (stepsByLesson.get(lesson.id) || []).sort(byOrder),
        }))
    ),
  }
}
