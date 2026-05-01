import { supabaseAdmin } from '../db/supabase'
import * as fs from 'fs'
import * as path from 'path'

async function verifyLessons() {
  // Load export file
  const exportPath = path.join(__dirname, '../../data/lessons-export.json')
  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'))

  console.log('=== EXPORT FILE ===')
  console.log(`Total in export: ${exportData.metadata.totalLessons}`)
  console.log(`JavaScript: ${exportData.metadata.languages.javascript}`)
  console.log(`C++: ${exportData.metadata.languages.cpp}`)
  console.log('')

  // Check JavaScript lessons
  console.log('=== JAVASCRIPT LESSONS ===')
  const jsLessonsExport = exportData.lessons.javascript
  console.log(`Lessons in export file: ${jsLessonsExport.length}`)

  const { data: jsChapters } = await supabaseAdmin
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('language_id', 'javascript')
    .order('chapter_number')

  console.log(`Chapters in DB: ${jsChapters?.length || 0}`)

  for (const chapter of jsChapters || []) {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, lesson_id, title')
      .eq('chapter_id', chapter.id)
      .order('order_index')

    const exportLessonsForChapter = jsLessonsExport.filter(
      (l: any) => l.chapter === chapter.chapter_number
    )

    console.log(`\nChapter ${chapter.chapter_number}: ${chapter.title}`)
    console.log(`  Export: ${exportLessonsForChapter.length} lessons`)
    console.log(`  DB: ${lessons?.length || 0} lessons`)

    if (exportLessonsForChapter.length !== lessons?.length) {
      console.log(`  ⚠️  MISMATCH!`)
      console.log(
        `  Export lesson IDs:`,
        exportLessonsForChapter.map((l: any) => l.id)
      )
      console.log(
        `  DB lesson IDs:`,
        lessons?.map(l => l.lesson_id)
      )
    }
  }

  // Check C++ lessons
  console.log('\n=== C++ LESSONS ===')
  const cppLessonsExport = exportData.lessons.cpp
  console.log(`Lessons in export file: ${cppLessonsExport.length}`)

  const { data: cppChapters } = await supabaseAdmin
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('language_id', 'cpp')
    .order('chapter_number')

  console.log(`Chapters in DB: ${cppChapters?.length || 0}`)

  for (const chapter of cppChapters || []) {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, lesson_id, title')
      .eq('chapter_id', chapter.id)
      .order('order_index')

    const exportLessonsForChapter = cppLessonsExport.filter(
      (l: any) => l.chapter === chapter.chapter_number
    )

    console.log(`\nChapter ${chapter.chapter_number}: ${chapter.title}`)
    console.log(`  Export: ${exportLessonsForChapter.length} lessons`)
    console.log(`  DB: ${lessons?.length || 0} lessons`)

    if (exportLessonsForChapter.length !== lessons?.length) {
      console.log(`  ⚠️  MISMATCH!`)
      console.log(
        `  Export lesson IDs:`,
        exportLessonsForChapter.map((l: any) => l.id)
      )
      console.log(
        `  DB lesson IDs:`,
        lessons?.map(l => l.lesson_id)
      )
    }
  }

  process.exit(0)
}

verifyLessons()
