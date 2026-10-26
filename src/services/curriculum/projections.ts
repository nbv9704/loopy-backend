export const publicLanguageSelect = 'id, name, display_name, icon, can_run_in_browser'
export const publicChapterSelect =
  'id, language_id, learning_path, chapter_number, title, description, order_index'
export const publicPathSelect = `id, language_id, goal_id, title, description, icon, color, is_active, created_at, updated_at, languages(${publicLanguageSelect})`
export const publicLessonSelect = [
  'id',
  'chapter_id',
  'lesson_id',
  'lesson_type',
  'title',
  'description',
  'code',
  'insight',
  'order_index',
  'difficulty',
  'estimated_time',
  'starter_code',
  'task_description',
  'hint',
  'hint_level_1',
  'hint_level_2',
  'hint_level_3',
  'common_mistakes',
  'is_aha_lesson',
  'status',
  'grading_mode',
  'debug_starter_code',
  'debug_task_description',
  'debug_hint',
].join(', ')
