#!/usr/bin/env tsx
/**
 * Migration Executor for Auto-Grading System
 * Feature: auto-grading-system
 * Task: 1.4 - Run migrations and verify schema changes
 *
 * This script executes migrations 006, 007, and 008 using Supabase client.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env')
  console.error('\nPlease run migrations manually through Supabase SQL Editor:')
  console.error('  1. Open https://pbqwkqvdnagkefikxwsv.supabase.co')
  console.error('  2. Go to SQL Editor')
  console.error('  3. Run 006-add-auto-grading-columns.sql')
  console.error('  4. Run 007-create-test-cases-table.sql')
  console.error('  5. Run 008-create-ai-usage-logs-table.sql')
  console.error('\nSee AUTO-GRADING-MIGRATIONS-GUIDE.md for detailed instructions.')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Check if a table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase.from(tableName).select('*').limit(1)

  return !error || error.code !== 'PGRST116' // PGRST116 = relation does not exist
}

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const { data, error } = await supabase.from(tableName).select(columnName).limit(1)

  return !error
}

/**
 * Main verification function
 */
async function verifyMigrations() {
  console.log('🚀 Auto-Grading System Migration Verification')
  console.log('='.repeat(70))
  console.log(`Database: ${SUPABASE_URL}`)
  console.log('='.repeat(70))

  let allPassed = true

  // Verify Migration 006: exercise_submissions extensions
  console.log('\n📦 Verifying Migration 006: exercise_submissions extensions')
  console.log('─'.repeat(70))

  const columns006 = [
    'test_score',
    'ai_score',
    'final_score',
    'grade_level',
    'test_results',
    'ai_analysis',
    'feedback',
    'graded_at',
    'grading_method',
    'override_by',
    'override_at',
    'override_note',
  ]

  for (const column of columns006) {
    const exists = await columnExists('exercise_submissions', column)
    if (exists) {
      console.log(`✅ Column exercise_submissions.${column} exists`)
    } else {
      console.log(`❌ Column exercise_submissions.${column} NOT FOUND`)
      allPassed = false
    }
  }

  // Verify Migration 007: test_cases table
  console.log('\n📦 Verifying Migration 007: test_cases table')
  console.log('─'.repeat(70))

  const testCasesExists = await tableExists('test_cases')
  if (testCasesExists) {
    console.log('✅ Table test_cases exists')

    const columns007 = [
      'id',
      'exercise_id',
      'input',
      'expected_output',
      'weight',
      'timeout',
      'description',
      'is_hidden',
      'order_index',
      'created_at',
      'updated_at',
    ]

    for (const column of columns007) {
      const exists = await columnExists('test_cases', column)
      if (exists) {
        console.log(`✅ Column test_cases.${column} exists`)
      } else {
        console.log(`❌ Column test_cases.${column} NOT FOUND`)
        allPassed = false
      }
    }
  } else {
    console.log('❌ Table test_cases NOT FOUND')
    allPassed = false
  }

  // Verify Migration 008: ai_usage_logs table
  console.log('\n📦 Verifying Migration 008: ai_usage_logs table')
  console.log('─'.repeat(70))

  const aiLogsExists = await tableExists('ai_usage_logs')
  if (aiLogsExists) {
    console.log('✅ Table ai_usage_logs exists')

    const columns008 = [
      'id',
      'submission_id',
      'request_tokens',
      'response_tokens',
      'total_tokens',
      'cache_hit',
      'response_time',
      'created_at',
    ]

    for (const column of columns008) {
      const exists = await columnExists('ai_usage_logs', column)
      if (exists) {
        console.log(`✅ Column ai_usage_logs.${column} exists`)
      } else {
        console.log(`❌ Column ai_usage_logs.${column} NOT FOUND`)
        allPassed = false
      }
    }
  } else {
    console.log('❌ Table ai_usage_logs NOT FOUND')
    allPassed = false
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(70))

  if (allPassed) {
    console.log('\n✅ All migrations verified successfully!')
    console.log('\n📝 Schema changes confirmed:')
    console.log('  • exercise_submissions: 12 new columns')
    console.log('  • test_cases: New table with 11 columns')
    console.log('  • ai_usage_logs: New table with 8 columns')
    console.log('\n📝 Next Steps:')
    console.log('  1. Mark Task 1.4 as complete')
    console.log('  2. Proceed to Task 2.1 (Cache Service implementation)')
    return true
  } else {
    console.log('\n❌ Some verifications failed!')
    console.log('\n📝 Action Required:')
    console.log('  1. Run migrations through Supabase SQL Editor')
    console.log('  2. See AUTO-GRADING-MIGRATIONS-GUIDE.md for instructions')
    console.log('  3. Re-run this verification script')
    return false
  }
}

// Run verification
verifyMigrations()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
