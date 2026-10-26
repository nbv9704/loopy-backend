import { supabaseAdmin } from '../../db/supabase'
import { errors } from '../../middleware/errorHandler'

/** Only persisted, published lesson metadata may describe the exercise to an AI provider. */
export async function readPublishedGradingContext(lessonId: string, language?: string) {
  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, title, description, task_description, insight, starter_code, grading_mode, chapters!inner(language_id)'
    )
    .eq('id', lessonId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw errors.databaseError('Không tải được nội dung bài học. Vui lòng thử lại.')
  if (!lesson) throw errors.notFound('Lesson')
  const chapter = Array.isArray(lesson.chapters) ? lesson.chapters[0] : lesson.chapters
  if (!chapter?.language_id || !['stdout', 'function', null].includes(lesson.grading_mode))
    throw errors.databaseError('Cấu hình bài học chưa sẵn sàng.')
  if (language !== undefined && chapter.language_id !== language)
    throw errors.badRequest('Ngôn ngữ gửi lên không khớp bài học.')

  return {
    exerciseTitle: lesson.title || 'Bài tập',
    exerciseQuestion: lesson.task_description || lesson.description || '',
    starterCode: lesson.starter_code || undefined,
    lessonInsight: lesson.insight || undefined,
    gradingMode: (lesson.grading_mode || 'stdout') as 'stdout' | 'function',
  }
}
