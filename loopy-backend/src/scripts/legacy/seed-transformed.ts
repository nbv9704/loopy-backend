/**
 * Seed Transformed Exercism Data into Loopy Database
 *
 * Reads the transformed JSON files and seeds them into Supabase.
 * This script REPLACES all existing lesson/chapter/exercise/pvp data.
 *
 * Usage: npx ts-node src/scripts/seed-transformed.ts
 *
 * ⚠️  WARNING: This will DELETE all existing learning content data!
 *
 * ❌ LEGACY SCRIPT — DO NOT USE
 * This script was written for the pre-schema-v2 database layout.
 * It references tables that were DROPPED in schema-v2.sql:
 *   - exercises
 *   - test_cases
 *   - exercise_submissions
 *
 * Use `npm run seed:rework` (seed-rework.ts) instead, which targets:
 *   - lessons
 *   - lesson_test_cases
 *   - lesson_submissions
 */

import * as fs from 'fs'
import * as path from 'path'
import { supabaseAdmin } from '../../db/supabase'
import { logger } from '../../utils/logger'

// ============================================================================
// TYPES
// ============================================================================

interface TransformedChapter {
  language_id: string
  chapter_number: number
  title: string
  description: string
  order_index: number
  concept_slugs: string[]
}

interface TransformedLesson {
  chapter_index: number
  lesson_id: string
  title: string
  description: string
  code: string
  insight: string
  order_index: number
  difficulty: string
  estimated_time: number
}

interface TransformedExercise {
  lesson_slug: string
  title: string
  question: string
  hint: string
  starter_code: string
  difficulty: string
  order_index: number
  exercise_number: number
  solution_code: string
  test_cases: {
    description: string
    input: string
    expected_output: string
    weight: number
    timeout: number
    is_hidden: boolean
    order_index: number
  }[]
}

interface TransformedPvPQuestion {
  language_id: string
  type: 'multiple_choice' | 'true_false'
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  difficulty: string
  points: number
  time_limit: number
  tags: string[]
  explanation: string
}

interface TransformedData {
  language: string
  chapters: TransformedChapter[]
  lessons: TransformedLesson[]
  exercises: TransformedExercise[]
  pvpQuestions: TransformedPvPQuestion[]
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function clearExistingData() {
  logger.info('🗑️  Clearing existing data...')

  // Order matters: delete children first (FK constraints)
  const tables = [
    'test_cases',
    'exercise_submissions',
    'exercises',
    'user_progress',
    'lessons',
    'chapters',
    'pvp_submissions',
    'pvp_matches',
    'pvp_questions',
  ]

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      // Some tables might not exist or have different PK names — just warn
      logger.warn(`   ⚠️  Could not clear ${table}: ${error.message}`)
    } else {
      logger.info(`   ✓ Cleared: ${table}`)
    }
  }
}

async function seedLanguages() {
  logger.info('🌐 Seeding languages...')

  const languages = [
    {
      id: 'javascript',
      name: 'JavaScript',
      display_name: 'JavaScript ES6+',
      icon: '🟨',
      can_run_in_browser: true,
    },
    {
      id: 'python',
      name: 'Python',
      display_name: 'Python 3',
      icon: '🐍',
      can_run_in_browser: false,
    },
    {
      id: 'cpp',
      name: 'C++',
      display_name: 'C++',
      icon: '🔵',
      can_run_in_browser: false,
    },
  ]

  for (const lang of languages) {
    const { error } = await supabaseAdmin.from('languages').upsert(lang, { onConflict: 'id' })
    if (error) {
      logger.error(`   ❌ Language ${lang.id}: ${error.message}`)
    } else {
      logger.info(`   ✓ ${lang.display_name}`)
    }
  }
}

async function seedCourseData(data: TransformedData) {
  const lang = data.language
  logger.info(`\n📚 Seeding ${lang}...`)

  // ── Chapters ──
  logger.info(`   📖 Seeding ${data.chapters.length} chapters...`)
  const chapterDbIds: Map<number, string> = new Map() // order_index → DB uuid

  for (const chapter of data.chapters) {
    const { data: inserted, error } = await supabaseAdmin
      .from('chapters')
      .upsert(
        {
          language_id: chapter.language_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          description: chapter.description,
          order_index: chapter.order_index,
        },
        { onConflict: 'language_id,chapter_number' }
      )
      .select('id, order_index')
      .single()

    if (error || !inserted) {
      logger.error(`   ❌ Chapter "${chapter.title}": ${error?.message}`)
      continue
    }

    chapterDbIds.set(chapter.order_index, inserted.id)
    logger.info(`   ✓ Ch${chapter.chapter_number}: ${chapter.title}`)
  }

  // ── Lessons ──
  logger.info(`   📝 Seeding ${data.lessons.length} lessons...`)
  const lessonDbIds: Map<string, string> = new Map() // lesson_id slug → DB uuid

  for (const lesson of data.lessons) {
    const chapterId = chapterDbIds.get(lesson.chapter_index)
    if (!chapterId) {
      logger.error(`   ❌ Lesson "${lesson.lesson_id}": chapter_index ${lesson.chapter_index} not found`)
      continue
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('lessons')
      .upsert(
        {
          chapter_id: chapterId,
          lesson_id: lesson.lesson_id,
          title: lesson.title,
          description: lesson.description,
          code: lesson.code,
          insight: lesson.insight,
          order_index: lesson.order_index,
          difficulty: lesson.difficulty,
          estimated_time: lesson.estimated_time,
        },
        { onConflict: 'chapter_id,lesson_id' }
      )
      .select('id')
      .single()

    if (error || !inserted) {
      logger.error(`   ❌ Lesson "${lesson.lesson_id}": ${error?.message}`)
      continue
    }

    lessonDbIds.set(lesson.lesson_id, inserted.id)
  }

  logger.info(`   ✓ ${lessonDbIds.size} lessons seeded`)

  // ── Exercises + Test Cases ──
  logger.info(`   🏋️ Seeding ${data.exercises.length} exercises...`)
  let exerciseCount = 0
  let testCaseCount = 0

  for (const exercise of data.exercises) {
    const lessonDbId = lessonDbIds.get(exercise.lesson_slug)
    if (!lessonDbId) {
      // Exercise concept not in our chapter grouping — skip silently
      continue
    }

    const { data: inserted, error: exErr } = await supabaseAdmin
      .from('exercises')
      .insert({
        lesson_id: lessonDbId,
        question: exercise.question,
        hint: exercise.hint,
        difficulty: exercise.difficulty,
        order_index: exercise.order_index,
        exercise_number: exercise.exercise_number,
        solution: exercise.solution_code || '',
      })
      .select('id')
      .single()

    if (exErr || !inserted) {
      logger.warn(`   ⚠️  Exercise "${exercise.title}": ${exErr?.message}`)
      continue
    }

    exerciseCount++

    // Insert test cases
    if (exercise.test_cases.length > 0) {
      const tcRows = exercise.test_cases.map(tc => ({
        exercise_id: inserted.id,
        description: tc.description,
        input: tc.input,
        expected_output: tc.expected_output,
        weight: tc.weight,
        timeout: tc.timeout,
        is_hidden: tc.is_hidden,
        order_index: tc.order_index,
      }))

      const { error: tcErr } = await supabaseAdmin.from('test_cases').insert(tcRows)
      if (tcErr) {
        logger.warn(`   ⚠️  Test cases for "${exercise.title}": ${tcErr.message}`)
      } else {
        testCaseCount += tcRows.length
      }
    }
  }

  logger.info(`   ✓ ${exerciseCount} exercises, ${testCaseCount} test cases`)

  // ── PvP Questions ──
  logger.info(`   🎮 Seeding ${data.pvpQuestions.length} PvP questions...`)

  const pvpRows = data.pvpQuestions.map(q => ({
    language_id: q.language_id,
    type: q.type,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty,
    points: q.points,
    time_limit: q.time_limit,
    tags: q.tags,
  }))

  // Batch insert in chunks of 50
  let pvpCount = 0
  for (let i = 0; i < pvpRows.length; i += 50) {
    const chunk = pvpRows.slice(i, i + 50)
    const { error } = await supabaseAdmin.from('pvp_questions').insert(chunk)
    if (error) {
      logger.warn(`   ⚠️  PvP questions batch ${i}: ${error.message}`)
    } else {
      pvpCount += chunk.length
    }
  }

  logger.info(`   ✓ ${pvpCount} PvP questions`)

  return { chapterCount: chapterDbIds.size, lessonCount: lessonDbIds.size, exerciseCount, testCaseCount, pvpCount }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  logger.info('🌱 Loopy Data Seeder — Transformed Exercism Data')
  logger.info('================================================')

  const transformedDir = path.join(__dirname, '../../docs/data/transformed')
  const combinedPath = path.join(transformedDir, 'all_transformed.json')

  if (!fs.existsSync(combinedPath)) {
    logger.error('❌ Transformed data not found. Run transform script first:')
    logger.error('   npx ts-node src/scripts/transform-exercism-data.ts')
    process.exit(1)
  }

  const allData: TransformedData[] = JSON.parse(fs.readFileSync(combinedPath, 'utf-8'))

  // Clear existing data
  await clearExistingData()

  // Seed languages first
  await seedLanguages()

  // Seed each language
  const totals = { chapters: 0, lessons: 0, exercises: 0, testCases: 0, pvp: 0 }

  for (const courseData of allData) {
    const result = await seedCourseData(courseData)
    totals.chapters += result.chapterCount
    totals.lessons += result.lessonCount
    totals.exercises += result.exerciseCount
    totals.testCases += result.testCaseCount
    totals.pvp += result.pvpCount
  }

  // Summary
  logger.info('\n📊 Seed Complete!')
  logger.info('─────────────────')
  logger.info(`Chapters:      ${totals.chapters}`)
  logger.info(`Lessons:       ${totals.lessons}`)
  logger.info(`Exercises:     ${totals.exercises}`)
  logger.info(`Test Cases:    ${totals.testCases}`)
  logger.info(`PvP Questions: ${totals.pvp}`)
  logger.info('\n🎉 Done!')
}

main().catch(err => {
  logger.error('❌ Seed failed:', err)
  process.exit(1)
})
