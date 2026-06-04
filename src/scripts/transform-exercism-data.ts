/**
 * Transform Exercism Data → Loopy Format
 *
 * Reads crawled Exercism course JSON files and transforms them into
 * Loopy's database-compatible format.
 *
 * Usage: npx ts-node src/scripts/transform-exercism-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// TYPES — Exercism source format
// ============================================================================

interface ExercismConcept {
  slug: string
  name: string
  aboutMarkdown: string
  introductionMarkdown: string
  links: { url: string; description: string }[]
}

interface ExercismCodingExercise {
  slug: string
  name: string
  type: 'concept' | 'practice'
  difficulty: number
  concepts: string[]
  instructionsMarkdown: string
  solutionCode: string
  testCases: { description: string; input: string; expectedOutput: string }[]
  starterCode: string
}

interface ExercismQuiz {
  id: string
  conceptSlug: string
  type: 'multiple_choice' | 'predict_output' | 'find_bug'
  question: string
  codeSnippet?: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

interface ExercismCourse {
  language: string
  crawledAt: string
  concepts: ExercismConcept[]
  codingExercises: ExercismCodingExercise[]
  quizzes: ExercismQuiz[]
}

// ============================================================================
// TYPES — Loopy output format
// ============================================================================

interface LoopyChapter {
  language_id: string
  chapter_number: number
  title: string
  description: string
  order_index: number
  concept_slugs: string[] // Internal — used for linking lessons
}

interface LoopyLesson {
  chapter_index: number // Reference to chapter order_index
  lesson_id: string
  title: string
  description: string
  code: string
  insight: string
  order_index: number
  difficulty: string
  estimated_time: number
}

interface LoopyExercise {
  lesson_slug: string // Reference to lesson_id
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

interface LoopyPvPQuestion {
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
  chapters: LoopyChapter[]
  lessons: LoopyLesson[]
  exercises: LoopyExercise[]
  pvpQuestions: LoopyPvPQuestion[]
}

// ============================================================================
// CHAPTER GROUPINGS — Progressive learning path
// ============================================================================

const CHAPTER_GROUPINGS: Record<string, { title: string; description: string; concepts: string[] }[]> = {
  javascript: [
    {
      title: 'Nền tảng JavaScript',
      description: 'Biến, hằng số, hàm cơ bản, export/import — những viên gạch đầu tiên để xây dựng chương trình JavaScript.',
      concepts: ['basics'],
    },
    {
      title: 'Kiểu dữ liệu cơ bản',
      description: 'Boolean, Number, String — ba kiểu dữ liệu nguyên thủy quan trọng nhất.',
      concepts: ['booleans', 'numbers', 'strings'],
    },
    {
      title: 'Toán tử & So sánh',
      description: 'Các phép tính, so sánh giá trị, tăng/giảm và chuyển đổi kiểu dữ liệu.',
      concepts: ['arithmetic-operators', 'comparison', 'increment-decrement', 'type-conversion'],
    },
    {
      title: 'Luồng điều khiển',
      description: 'if/else, switch/case, toán tử ba ngôi — điều khiển luồng thực thi chương trình.',
      concepts: ['conditionals', 'conditionals-switch', 'conditionals-ternary'],
    },
    {
      title: 'Vòng lặp',
      description: 'for, while, for...of, forEach — các cách duyệt và lặp qua dữ liệu.',
      concepts: ['for-loops', 'while-loops', 'array-loops'],
    },
    {
      title: 'Hàm nâng cao',
      description: 'Arrow function, callback, closure, đệ quy — nắm vững cách viết và sử dụng hàm linh hoạt.',
      concepts: ['arrow-functions', 'functions', 'callbacks', 'closures', 'recursion'],
    },
    {
      title: 'Mảng & Xử lý dữ liệu',
      description: 'Thao tác mảng, phân tích, biến đổi, destructuring — kỹ năng xử lý dữ liệu cốt lõi.',
      concepts: ['arrays', 'array-analysis', 'array-transformations', 'array-destructuring'],
    },
    {
      title: 'Object & Cấu trúc dữ liệu',
      description: 'Object, destructuring, spread/rest, Set — làm việc với dữ liệu có cấu trúc.',
      concepts: ['objects', 'object-destructuring', 'rest-and-spread', 'sets'],
    },
    {
      title: 'Xử lý giá trị đặc biệt',
      description: 'null, undefined, kiểm tra kiểu, xử lý lỗi — viết code an toàn và đáng tin cậy.',
      concepts: ['null-undefined', 'type-checking', 'errors'],
    },
    {
      title: 'Chuỗi nâng cao',
      description: 'Template literal, biểu thức chính quy, Date, Random — công cụ xử lý chuỗi và tiện ích.',
      concepts: ['template-strings', 'regular-expressions', 'dates', 'randomness'],
    },
    {
      title: 'Lập trình hướng đối tượng',
      description: 'Class, kế thừa — tổ chức code theo mô hình hướng đối tượng.',
      concepts: ['classes', 'inheritance'],
    },
    {
      title: 'Lập trình bất đồng bộ',
      description: 'Promise — xử lý các tác vụ bất đồng bộ trong JavaScript.',
      concepts: ['promises'],
    },
  ],

  python: [
    {
      title: 'Nền tảng Python',
      description: 'Biến, kiểu dữ liệu cơ bản, None — bước đầu tiên với Python.',
      concepts: ['basics', 'bools', 'numbers', 'none'],
    },
    {
      title: 'Chuỗi ký tự',
      description: 'Tạo, thao tác, và định dạng chuỗi trong Python.',
      concepts: ['strings', 'string-methods', 'string-formatting'],
    },
    {
      title: 'Luồng điều khiển',
      description: 'Điều kiện, so sánh, vòng lặp — điều khiển luồng thực thi chương trình.',
      concepts: ['conditionals', 'comparisons', 'loops'],
    },
    {
      title: 'Danh sách & Tuple',
      description: 'List, list methods, tuple — hai cấu trúc dữ liệu tuần tự quan trọng nhất.',
      concepts: ['lists', 'list-methods', 'tuples'],
    },
    {
      title: 'Từ điển & Tập hợp',
      description: 'Dictionary, dict methods, set — cấu trúc dữ liệu key-value và tập hợp.',
      concepts: ['dicts', 'dict-methods', 'sets'],
    },
    {
      title: 'Giải nén & Gán nhiều giá trị',
      description: 'Unpacking, multiple assignment — cú pháp Python gọn gàng và mạnh mẽ.',
      concepts: ['unpacking-and-multiple-assignment'],
    },
    {
      title: 'Lập trình hướng đối tượng',
      description: 'Class, Enum — tổ chức code theo mô hình hướng đối tượng.',
      concepts: ['classes', 'enums'],
    },
    {
      title: 'Generator & Kỹ thuật nâng cao',
      description: 'Generator — tạo iterator hiệu quả cho dữ liệu lớn.',
      concepts: ['generators'],
    },
  ],

  cpp: [
    {
      title: 'Bắt đầu với C++',
      description: '#include, namespace, header — thiết lập môi trường và cấu trúc chương trình C++ đầu tiên.',
      concepts: ['basics', 'includes', 'headers', 'namespaces'],
    },
    {
      title: 'Kiểu dữ liệu & Biến',
      description: 'Number, boolean, string, auto — hệ thống kiểu dữ liệu tĩnh của C++.',
      concepts: ['numbers', 'booleans', 'strings', 'auto'],
    },
    {
      title: 'Luồng điều khiển',
      description: 'So sánh, if/else, switch, vòng lặp — điều khiển luồng thực thi.',
      concepts: ['comparisons', 'if-statements', 'switch', 'loops'],
    },
    {
      title: 'Hàm',
      description: 'Khai báo, định nghĩa, gọi hàm — đơn vị tổ chức code cơ bản.',
      concepts: ['functions'],
    },
    {
      title: 'Mảng & Vector',
      description: 'Vector — container linh hoạt thay thế mảng C truyền thống.',
      concepts: ['vector-arrays'],
    },
    {
      title: 'Lập trình hướng đối tượng',
      description: 'Class, enum, reference — nền tảng OOP trong C++.',
      concepts: ['classes', 'enums', 'references'],
    },
    {
      title: 'Con trỏ & Quản lý bộ nhớ',
      description: 'Pointer, smart pointer — quản lý bộ nhớ thủ công và tự động.',
      concepts: ['pointers', 'smart-pointers'],
    },
  ],
}

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

/**
 * Extract the first N code blocks from markdown content
 */
function extractCodeBlocks(markdown: string, language: string): string[] {
  const langAliases: Record<string, string[]> = {
    javascript: ['javascript', 'js'],
    python: ['python', 'py'],
    cpp: ['cpp', 'c\\+\\+', 'c'],
  }

  const aliases = langAliases[language] || [language]
  const pattern = new RegExp(
    '```(?:' + aliases.join('|') + ')\\s*\\n([\\s\\S]*?)```',
    'gi'
  )

  const blocks: string[] = []
  let match
  while ((match = pattern.exec(markdown)) !== null) {
    const code = match[1].trim()
    if (code.length > 10) {
      blocks.push(code)
    }
  }

  return blocks
}

/**
 * Build lesson.code field combining theory examples + exercise starter
 */
function buildLessonCode(
  concept: ExercismConcept,
  language: string,
  relatedExercise?: ExercismCodingExercise
): string {
  const parts: string[] = []

  // Extract up to 3 code examples from aboutMarkdown as theory
  const codeBlocks = extractCodeBlocks(concept.aboutMarkdown, language)
  const theoryBlocks = codeBlocks.slice(0, 3)

  if (theoryBlocks.length > 0) {
    parts.push(`// === VÍ DỤ MINH HỌA ===`)
    parts.push('')
    theoryBlocks.forEach((block, i) => {
      if (i > 0) parts.push('')
      parts.push(block)
    })
  }

  // Add exercise section
  parts.push('')
  parts.push(`// === BÀI TẬP ===`)
  parts.push('')

  if (relatedExercise?.starterCode) {
    // Clean up Exercism starter code comments
    const cleaned = relatedExercise.starterCode
      .split('\n')
      .filter(line => !line.startsWith('// @ts-check') && !line.startsWith('// ☝'))
      .join('\n')
      .trim()
    parts.push(cleaned)
  } else {
    // Generate a simple exercise prompt
    parts.push(`// Hãy thực hành kiến thức về "${concept.name}" ở đây`)
    parts.push(`// Viết code của bạn bên dưới:`)
    parts.push('')
  }

  // Add solution section
  if (relatedExercise?.solutionCode) {
    parts.push('')
    parts.push(`// === ĐÁP ÁN ===`)
    parts.push('')
    const cleanedSolution = relatedExercise.solutionCode
      .split('\n')
      .filter(line => !line.startsWith('// @ts-check') && !line.startsWith('// ☝'))
      .join('\n')
      .trim()
    parts.push(cleanedSolution)
  }

  return parts.join('\n')
}

/**
 * Strip markdown formatting and extract first N sentences for description
 */
function extractDescription(markdown: string, maxSentences: number = 3): string {
  // Remove markdown headers
  let text = markdown.replace(/^#+\s+.*$/gm, '')
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')
  // Remove inline code
  text = text.replace(/`[^`]+`/g, match => match.slice(1, -1))
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Remove images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '')
  // Remove bold/italic markers
  text = text.replace(/[*_]{1,3}/g, '')
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  // Remove blockquotes markers
  text = text.replace(/^>\s*/gm, '')
  // Collapse whitespace
  text = text.replace(/\n{2,}/g, '\n').trim()

  // Get first N sentences
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10)
  return sentences.slice(0, maxSentences).join(' ').trim()
}

/**
 * Map Exercism difficulty number to Loopy difficulty string
 */
function mapDifficulty(diff: number): string {
  if (diff <= 2) return 'easy'
  if (diff <= 5) return 'medium'
  return 'hard'
}

/**
 * Estimate reading/practice time in minutes based on content length
 */
function estimateTime(concept: ExercismConcept): number {
  const totalLength = (concept.aboutMarkdown?.length || 0) + (concept.introductionMarkdown?.length || 0)
  if (totalLength < 2000) return 5
  if (totalLength < 5000) return 10
  if (totalLength < 10000) return 15
  return 20
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

// ============================================================================
// MAIN TRANSFORM
// ============================================================================

function transformCourse(course: ExercismCourse): TransformedData {
  const lang = course.language
  const groupings = CHAPTER_GROUPINGS[lang]

  if (!groupings) {
    throw new Error(`No chapter groupings defined for language: ${lang}`)
  }

  console.log(`\n📦 Transforming ${lang}...`)
  console.log(`   Concepts: ${course.concepts.length}`)
  console.log(`   Exercises: ${course.codingExercises.length}`)
  console.log(`   Quizzes: ${course.quizzes.length}`)

  // Build concept lookup
  const conceptMap = new Map<string, ExercismConcept>()
  course.concepts.forEach(c => conceptMap.set(c.slug, c))

  // Build exercise lookup by concept
  const exercisesByConceptMap = new Map<string, ExercismCodingExercise[]>()
  course.codingExercises.forEach(ex => {
    for (const conceptSlug of ex.concepts) {
      if (!exercisesByConceptMap.has(conceptSlug)) {
        exercisesByConceptMap.set(conceptSlug, [])
      }
      exercisesByConceptMap.get(conceptSlug)!.push(ex)
    }
  })

  // Transform chapters
  const chapters: LoopyChapter[] = groupings.map((group, i) => ({
    language_id: lang,
    chapter_number: i + 1,
    title: group.title,
    description: group.description,
    order_index: i,
    concept_slugs: group.concepts,
  }))

  // Transform lessons
  const lessons: LoopyLesson[] = []
  let globalLessonIndex = 0

  chapters.forEach((chapter, chapterIdx) => {
    chapter.concept_slugs.forEach((slug) => {
      const concept = conceptMap.get(slug)
      if (!concept) {
        console.warn(`   ⚠️  Concept "${slug}" not found in data, skipping`)
        return
      }

      // Find the first "concept" type exercise for this concept
      const relatedExercises = exercisesByConceptMap.get(slug) || []
      const conceptExercise = relatedExercises.find(e => e.type === 'concept')

      lessons.push({
        chapter_index: chapterIdx,
        lesson_id: `${lang}-${slug}`,
        title: capitalizeWords(concept.name),
        description: extractDescription(concept.introductionMarkdown || concept.aboutMarkdown),
        code: buildLessonCode(concept, lang, conceptExercise),
        insight: concept.aboutMarkdown,
        order_index: globalLessonIndex,
        difficulty: 'beginner',
        estimated_time: estimateTime(concept),
      })

      globalLessonIndex++
    })
  })

  // Transform exercises — link to lessons via concept slugs
  const exercises: LoopyExercise[] = []

  course.codingExercises.forEach(ex => {
    // Find which lesson this exercise belongs to (via first concept)
    const primaryConcept = ex.concepts[0]
    if (!primaryConcept) return

    const lessonSlug = `${lang}-${primaryConcept}`
    const existingForLesson = exercises.filter(e => e.lesson_slug === lessonSlug)

    exercises.push({
      lesson_slug: lessonSlug,
      title: ex.name,
      question: ex.instructionsMarkdown,
      hint: '',
      starter_code: ex.starterCode || '',
      difficulty: mapDifficulty(ex.difficulty),
      order_index: existingForLesson.length,
      exercise_number: existingForLesson.length + 1,
      solution_code: ex.solutionCode || '',
      test_cases: (ex.testCases || []).map((tc, i) => ({
        description: tc.description,
        input: tc.input,
        expected_output: tc.expectedOutput,
        weight: Math.floor(100 / Math.max(ex.testCases.length, 1)),
        timeout: 5000,
        is_hidden: false,
        order_index: i,
      })),
    })
  })

  // Transform quizzes → PvP questions
  const pvpQuestions: LoopyPvPQuestion[] = course.quizzes.map(quiz => {
    // Build question text (include code snippet if present)
    let questionText = quiz.question
    if (quiz.codeSnippet) {
      questionText += `\n\n\`\`\`${lang}\n${quiz.codeSnippet}\n\`\`\``
    }

    // Build options with IDs
    const options = quiz.options.map((text, i) => ({
      id: String.fromCharCode(65 + i), // A, B, C, D
      text,
    }))

    // Determine correct answer ID
    const correctAnswer = String.fromCharCode(65 + quiz.correctAnswerIndex)

    // Map quiz type to difficulty
    let difficulty: string = 'easy'
    if (quiz.type === 'predict_output') difficulty = 'medium'
    if (quiz.type === 'find_bug') difficulty = 'hard'

    return {
      language_id: lang,
      type: 'multiple_choice' as const,
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
      difficulty,
      points: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 150 : 200,
      time_limit: 30,
      tags: [quiz.conceptSlug, quiz.type],
      explanation: quiz.explanation || '',
    }
  })

  // Report unmapped concepts
  const mappedSlugs = new Set(chapters.flatMap(c => c.concept_slugs))
  const unmapped = course.concepts.filter(c => !mappedSlugs.has(c.slug))
  if (unmapped.length > 0) {
    console.warn(`   ⚠️  Unmapped concepts: ${unmapped.map(c => c.slug).join(', ')}`)
  }

  console.log(`   ✅ Chapters: ${chapters.length}`)
  console.log(`   ✅ Lessons: ${lessons.length}`)
  console.log(`   ✅ Exercises: ${exercises.length}`)
  console.log(`   ✅ PvP Questions: ${pvpQuestions.length}`)

  return { language: lang, chapters, lessons, exercises, pvpQuestions }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔄 Exercism → Loopy Data Transformer')
  console.log('=====================================')

  const dataDir = path.join(__dirname, '../../docs/data')
  const outputDir = path.join(dataDir, 'transformed')

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const files = [
    'javascript_full_course.json',
    'python_full_course.json',
    'cpp_full_course.json',
  ]

  const allResults: TransformedData[] = []

  for (const file of files) {
    const filePath = path.join(dataDir, file)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      continue
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const course: ExercismCourse = JSON.parse(raw)
    const result = transformCourse(course)
    allResults.push(result)

    // Write individual transformed file
    const outPath = path.join(outputDir, `${course.language}_transformed.json`)
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8')
    console.log(`   📁 Written: ${outPath}`)
  }

  // Write combined file
  const combinedPath = path.join(outputDir, 'all_transformed.json')
  fs.writeFileSync(combinedPath, JSON.stringify(allResults, null, 2), 'utf-8')
  console.log(`\n📁 Combined: ${combinedPath}`)

  // Summary
  console.log('\n📊 Summary')
  console.log('──────────')
  for (const r of allResults) {
    console.log(`${r.language}: ${r.chapters.length} chapters, ${r.lessons.length} lessons, ${r.exercises.length} exercises, ${r.pvpQuestions.length} PvP questions`)
  }

  const totals = allResults.reduce(
    (acc, r) => ({
      chapters: acc.chapters + r.chapters.length,
      lessons: acc.lessons + r.lessons.length,
      exercises: acc.exercises + r.exercises.length,
      pvp: acc.pvp + r.pvpQuestions.length,
    }),
    { chapters: 0, lessons: 0, exercises: 0, pvp: 0 }
  )
  console.log(`\nTOTAL: ${totals.chapters} chapters, ${totals.lessons} lessons, ${totals.exercises} exercises, ${totals.pvp} PvP questions`)
}

main().catch(console.error)
