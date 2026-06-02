/**
 * Seed Script - Migrate lessons from frontend to Supabase
 *
 * This script reads lessons from the frontend data files and inserts them into Supabase.
 * Run this after setting up the database schema.
 *
 * Usage: npm run seed
 */

import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'

// Import lesson data from frontend (you'll need to copy these files or import them)
// For now, we'll define the structure

interface Lesson {
  id: string
  chapter: number
  title: string
  description: string
  code: string
  insight: string
}

interface Chapter {
  chapter: number
  title: string
  description: string
}

const javascriptChapters: Chapter[] = [
  {
    chapter: 1,
    title: 'Nền tảng Biến số & Chuỗi',
    description: 'Học về let, const, template literals',
  },
  { chapter: 2, title: 'Arrow Function', description: 'Cú pháp arrow function và implicit return' },
  {
    chapter: 3,
    title: 'Phân luồng Logic Ngắn Gọn',
    description: 'Ternary, logical operators, nullish coalescing',
  },
  {
    chapter: 4,
    title: 'Thao tác Object',
    description: 'Object shorthand, optional chaining, destructuring',
  },
  {
    chapter: 5,
    title: 'Thao tác Mảng & Spread',
    description: 'Array destructuring, spread operator, rest parameters',
  },
  {
    chapter: 6,
    title: 'Duyệt và Biến đổi Mảng',
    description: 'map, filter, reduce, và các array methods',
  },
  {
    chapter: 7,
    title: 'Lập trình Bất đồng bộ',
    description: 'Promises, async/await, error handling',
  },
  { chapter: 8, title: 'ES Modules', description: 'Import/export, module organization' },
  {
    chapter: 9,
    title: 'Cơ chế JavaScript Engine',
    description: 'Parsing, compilation, execution context',
  },
  { chapter: 10, title: 'Logic Bộ Nhớ', description: 'Primitive vs reference, shallow/deep copy' },
  {
    chapter: 11,
    title: 'Scope & Closures',
    description: 'Lexical scope, closures, practical applications',
  },
  { chapter: 12, title: 'Event Loop', description: 'Call stack, callback queue, microtask queue' },
  {
    chapter: 13,
    title: 'Data Flow Pipeline',
    description: 'Function composition, data transformation',
  },
]

const cppChapters: Chapter[] = [
  {
    chapter: 1,
    title: 'Kiến trúc Vận hành',
    description: 'Compiled vs interpreted, preprocessor, compiler, linker',
  },
  {
    chapter: 2,
    title: 'Quản lý Dữ liệu & Môi trường Biến',
    description: 'Static typing, memory size, scope, casting',
  },
  {
    chapter: 3,
    title: 'Điều hướng Luồng Thực thi',
    description: 'Control flow, loops, break/continue',
  },
  {
    chapter: 4,
    title: 'Giao tiếp giữa các Hàm & Stack Memory',
    description: 'Functions, call stack, pass by value/reference',
  },
  {
    chapter: 5,
    title: 'Con trỏ (Pointers)',
    description: 'Pointers, dereferencing, nullptr, references',
  },
  {
    chapter: 6,
    title: 'Mảng tĩnh & Số học Con trỏ',
    description: 'Arrays, pointer arithmetic, C-strings',
  },
  {
    chapter: 7,
    title: 'Cấp phát động & Heap',
    description: 'Dynamic memory, new/delete, memory leaks, smart pointers',
  },
  {
    chapter: 8,
    title: 'Gói ghém Dữ liệu',
    description: 'Structs, classes, encapsulation, constructors/destructors',
  },
]

async function seedLanguages() {
  logger.info('Seeding languages...')

  const languages = [
    {
      id: 'javascript',
      name: 'JavaScript',
      display_name: 'JavaScript ES6+',
      icon: '🟨',
      can_run_in_browser: true,
    },
    { id: 'cpp', name: 'C++', display_name: 'C++', icon: '🔵', can_run_in_browser: false },
    {
      id: 'python',
      name: 'Python',
      display_name: 'Python 3',
      icon: '🐍',
      can_run_in_browser: false,
    },
  ]

  for (const lang of languages) {
    const { error } = await supabaseAdmin.from('languages').upsert(lang, { onConflict: 'id' })

    if (error) {
      logger.error(`Error seeding language ${lang.id}:`, error)
    } else {
      logger.info(`✓ Seeded language: ${lang.display_name}`)
    }
  }
}

async function seedChapters(languageId: string, chapters: Chapter[]) {
  logger.info(`Seeding chapters for ${languageId}...`)

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
      const { error } = await supabaseAdmin
      .from('chapters')
      .upsert(
        {
          language_id: languageId,
          chapter_number: chapter.chapter,
          title: chapter.title,
          description: chapter.description,
          order_index: i,
        },
        { onConflict: 'language_id,chapter_number' }
      )
      .select()
      .single()

    if (error) {
      logger.error(`Error seeding chapter ${chapter.chapter}:`, error)
    } else {
      logger.info(`✓ Seeded chapter ${chapter.chapter}: ${chapter.title}`)
    }
  }
}

async function seedLessons(languageId: string, lessons: Lesson[]) {
  logger.info(`Seeding lessons for ${languageId}...`)

  // Get chapters for this language
  const { data: chapters } = await supabaseAdmin
    .from('chapters')
    .select('id, chapter_number')
    .eq('language_id', languageId)

  if (!chapters) {
    logger.error('No chapters found')
    return
  }

  const chapterMap = new Map(chapters.map(c => [c.chapter_number, c.id]))

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    const chapterId = chapterMap.get(lesson.chapter)

    if (!chapterId) {
      logger.error(`Chapter ${lesson.chapter} not found for lesson ${lesson.id}`)
      continue
    }

    const { error } = await supabaseAdmin.from('lessons').upsert(
      {
        chapter_id: chapterId,
        lesson_id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        code: lesson.code,
        insight: lesson.insight,
        order_index: i,
        difficulty: 'beginner',
        estimated_time: 10,
      },
      { onConflict: 'chapter_id,lesson_id' }
    )

    if (error) {
      logger.error(`Error seeding lesson ${lesson.id}:`, error)
    } else {
      logger.info(`✓ Seeded lesson: ${lesson.title}`)
    }
  }
}

async function loadLessonsFromJSON() {

  const jsonPath = path.join(__dirname, '../../data/lessons-export.json')

  if (!fs.existsSync(jsonPath)) {
    logger.warn('⚠️  lessons-export.json not found. Run: node scripts/export-lessons.js')
    return null
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  return data.lessons
}

async function main() {
  try {
    logger.info('🌱 Starting database seed...')

    // Seed languages
    await seedLanguages()

    // Seed chapters
    await seedChapters('javascript', javascriptChapters)
    await seedChapters('cpp', cppChapters)

    // Load and seed lessons
    logger.info('📚 Loading lessons from JSON...')
    const lessons = await loadLessonsFromJSON()

    if (lessons) {
      if (lessons.javascript) {
        await seedLessons('javascript', lessons.javascript)
      }
      if (lessons.cpp) {
        await seedLessons('cpp', lessons.cpp)
      }
      logger.info('✅ Database seed completed!')
    } else {
      logger.info('⚠️  Lessons not seeded. Run export script first:')
      logger.info('   node scripts/export-lessons.js')
    }

    logger.info('')
    logger.info('🎉 Setup complete!')
  } catch (error) {
    logger.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run seed
main()
