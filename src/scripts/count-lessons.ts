import { supabaseAdmin } from '../db/supabase'

async function countLessons() {
  // Count JavaScript lessons
  const { data: jsLessons, error: jsError } = await supabaseAdmin
    .from('lessons')
    .select('id, chapter_id, chapters!inner(language_id)')
    .eq('chapters.language_id', 'javascript')

  if (jsError) {
    console.error('Error counting JS lessons:', jsError)
  } else {
    console.log(`JavaScript lessons: ${jsLessons?.length || 0}`)
  }

  // Count C++ lessons
  const { data: cppLessons, error: cppError } = await supabaseAdmin
    .from('lessons')
    .select('id, chapter_id, chapters!inner(language_id)')
    .eq('chapters.language_id', 'cpp')

  if (cppError) {
    console.error('Error counting C++ lessons:', cppError)
  } else {
    console.log(`C++ lessons: ${cppLessons?.length || 0}`)
  }

  // Count total
  const { count, error: countError } = await supabaseAdmin
    .from('lessons')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error counting total lessons:', countError)
  } else {
    console.log(`Total lessons in database: ${count}`)
  }

  process.exit(0)
}

countLessons()
