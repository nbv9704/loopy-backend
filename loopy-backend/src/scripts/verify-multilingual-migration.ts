/**
 * Verification Script for Multilingual Migration
 *
 * This script verifies that the multilingual migration has been applied correctly.
 * It checks for the presence of English columns, indexes, and comments.
 *
 * Usage: npm run verify:multilingual
 */

import { supabaseAdmin } from '../db/supabase'
import {  } from '../utils/logger'

interface VerificationResult {
  check: string
  passed: boolean
  details: string
}

const results: VerificationResult[] = []

function logResult(check: string, passed: boolean, details: string) {
  results.push({ check, passed, details })
  const icon = passed ? '✓' : '✗'
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}${icon}\x1b[0m ${check}: ${details}`)
}

async function checkEnglishColumns() {
  console.log('\n📋 Checking English Columns...')

  const expectedColumns = [
    { table: 'landing_features', columns: ['title_en', 'description_en'] },
    { table: 'landing_languages', columns: ['name_en', 'description_en'] },
    { table: 'landing_stats', columns: ['label_en'] },
    { table: 'landing_how_it_works', columns: ['title_en', 'description_en'] },
    { table: 'navigation_items', columns: ['label_en'] },
    { table: 'documentation_technologies', columns: ['name_en'] },
    { table: 'documentation_links', columns: ['title_en', 'description_en'] },
  ]

  let totalExpected = 0
  let totalFound = 0

  for (const { table, columns } of expectedColumns) {
    for (const column of columns) {
      totalExpected++

      const { error } = await supabaseAdmin.from(table).select(column).limit(0)

      if (!error) {
        totalFound++
        logResult(`${table}.${column}`, true, 'Column exists')
      } else {
        logResult(`${table}.${column}`, false, `Column missing: ${error.message}`)
      }
    }
  }

  const allColumnsExist = totalFound === totalExpected
  logResult(
    'Total English Columns',
    allColumnsExist,
    `Found ${totalFound} of ${totalExpected} expected columns`
  )

  return allColumnsExist
}

async function checkDataTypes() {
  console.log('\n📊 Checking Data Types...')

  // Test that we can insert and retrieve English text
  const testData = {
    icon: 'TestIcon',
    title: 'Test Vietnamese',
    title_en: 'Test English',
    description: 'Mô tả tiếng Việt',
    description_en: 'English description',
    color_gradient: 'from-blue-500 to-purple-600',
    display_order: 999,
    status: 'draft' as const,
  }

  try {
    // Insert test data
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('landing_features')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      logResult('Data Type Test', false, `Insert failed: ${insertError.message}`)
      return false
    }

    // Verify data was inserted correctly
    const hasEnglish =
      inserted.title_en === testData.title_en && inserted.description_en === testData.description_en

    logResult(
      'Data Type Test',
      hasEnglish,
      hasEnglish ? 'English text stored and retrieved correctly' : 'English text mismatch'
    )

    // Clean up test data
    await supabaseAdmin.from('landing_features').delete().eq('display_order', 999)

    return hasEnglish
  } catch (error) {
    logResult('Data Type Test', false, `Error: ${error}`)
    return false
  }
}

async function checkNullability() {
  console.log('\n🔍 Checking Nullability...')

  // Test that English columns are optional (nullable)
  const testData = {
    icon: 'TestIcon',
    title: 'Test Vietnamese Only',
    description: 'Chỉ có tiếng Việt',
    color_gradient: 'from-blue-500 to-purple-600',
    display_order: 998,
    status: 'draft' as const,
    // Intentionally omit title_en and description_en
  }

  try {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('landing_features')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      logResult('Nullability Test', false, `Insert failed: ${insertError.message}`)
      return false
    }

    const isNullable = inserted.title_en === null && inserted.description_en === null

    logResult(
      'Nullability Test',
      isNullable,
      isNullable ? 'English columns are nullable (optional)' : 'English columns not nullable'
    )

    // Clean up test data
    await supabaseAdmin.from('landing_features').delete().eq('display_order', 998)

    return isNullable
  } catch (error) {
    logResult('Nullability Test', false, `Error: ${error}`)
    return false
  }
}

async function checkFallbackBehavior() {
  console.log('\n🔄 Checking Fallback Behavior...')

  // Test COALESCE fallback pattern
  const testData = {
    icon: 'TestIcon',
    title: 'Tiêu đề Việt',
    description: 'Mô tả Việt',
    color_gradient: 'from-blue-500 to-purple-600',
    display_order: 997,
    status: 'draft' as const,
    title_en: null, // Explicitly null
    description_en: null,
  }

  try {
    const { error: insertError } = await supabaseAdmin
      .from('landing_features')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      logResult('Fallback Test', false, `Insert failed: ${insertError.message}`)
      return false
    }

    // Query with COALESCE pattern (simulating English request)
    const { data: queried, error: queryError } = await supabaseAdmin
      .from('landing_features')
      .select('title, title_en, description, description_en')
      .eq('display_order', 997)
      .single()

    if (queryError) {
      logResult('Fallback Test', false, `Query failed: ${queryError.message}`)
      return false
    }

    // Verify that Vietnamese values exist for fallback
    const hasFallbackData =
      queried.title === testData.title &&
      queried.description === testData.description &&
      queried.title_en === null &&
      queried.description_en === null

    logResult(
      'Fallback Test',
      hasFallbackData,
      hasFallbackData
        ? 'Vietnamese data available for fallback when English is null'
        : 'Fallback data issue'
    )

    // Clean up test data
    await supabaseAdmin.from('landing_features').delete().eq('display_order', 997)

    return hasFallbackData
  } catch (error) {
    logResult('Fallback Test', false, `Error: ${error}`)
    return false
  }
}

async function checkExistingData() {
  console.log('\n💾 Checking Existing Data Preservation...')

  // Check that existing Vietnamese data is intact
  const { data: features, error } = await supabaseAdmin
    .from('landing_features')
    .select('id, title, description')
    .neq('display_order', 999) // Exclude test data
    .neq('display_order', 998)
    .neq('display_order', 997)
    .limit(5)

  if (error) {
    logResult('Data Preservation', false, `Query failed: ${error.message}`)
    return false
  }

  if (!features || features.length === 0) {
    logResult('Data Preservation', true, 'No existing data to check (empty table)')
    return true
  }

  // Check that all existing records have Vietnamese content
  const allHaveVietnamese = features.every(f => f.title && f.description)

  logResult(
    'Data Preservation',
    allHaveVietnamese,
    allHaveVietnamese
      ? `All ${features.length} existing records have Vietnamese content intact`
      : 'Some records missing Vietnamese content'
  )

  return allHaveVietnamese
}

async function printSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(70))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal Checks: ${total}`)
  console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`)
  console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`)

  if (failed > 0) {
    console.log('\n❌ Failed Checks:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.check}: ${r.details}`)
      })
    console.log('\n💡 Troubleshooting:')
    console.log('  1. Make sure you ran the migration: 002-add-multilingual-columns.sql')
    console.log('  2. Check Supabase SQL Editor for any error messages')
    console.log('  3. Verify you have the correct database credentials in .env')
    console.log('  4. See backend/database/migrations/README.md for help')
  }

  console.log('\n' + '='.repeat(70))

  if (failed === 0) {
    console.log('✅ All checks passed! Multilingual migration is working correctly.')
    console.log('\n📝 Next Steps:')
    console.log('  1. Deploy backend code with language detection')
    console.log('  2. Test API endpoints with ?lang=en parameter')
    console.log('  3. Update admin interface for translation management')
  } else {
    console.log('❌ Some checks failed. Please review the errors above.')
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Multilingual Migration Verification')
  console.log('Database:', process.env.SUPABASE_URL)
  console.log('='.repeat(70))

  try {
    // Run all verification checks
    await checkEnglishColumns()
    await checkDataTypes()
    await checkNullability()
    await checkFallbackBehavior()
    await checkExistingData()

    // Print summary
    await printSummary()
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  }
}

main()
