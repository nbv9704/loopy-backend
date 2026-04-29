/**
 * Test script for test_cases table migration
 *
 * This script tests both forward and rollback migrations on the local database.
 * It verifies that:
 * 1. Forward migration creates the test_cases table with all columns
 * 2. All CHECK constraints are properly enforced
 * 3. Foreign key constraint with CASCADE delete works correctly
 * 4. Indexes are created properly
 * 5. Rollback migration removes the table and indexes
 * 6. Migrations are idempotent (can be run multiple times)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message })
  const icon = passed ? '✓' : '✗'
  const color = passed ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}${icon}\x1b[0m ${name}: ${message}`)
}

async function executeSqlFile(filename: string): Promise<void> {
  const filePath = path.join(__dirname, filename)
  const sql = fs.readFileSync(filePath, 'utf-8')

  console.log(`\n📄 Executing ${filename}...`)

  // Split SQL into individual statements and execute them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
    if (error) {
      console.warn(`Warning executing statement: ${error.message}`)
    }
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single()

  return !error && data !== null
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .eq('column_name', columnName)
    .single()

  return !error && data !== null
}

async function checkIndexExists(indexName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pg_indexes')
    .select('indexname')
    .eq('schemaname', 'public')
    .eq('indexname', indexName)
    .single()

  return !error && data !== null
}

async function countTableColumns(tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from('information_schema.columns')
    .select('*', { count: 'exact', head: true })
    .eq('table_schema', 'public')
    .eq('table_name', tableName)

  return count || 0
}

async function testForwardMigration(): Promise<void> {
  console.log('\n🔄 Testing Forward Migration...')

  try {
    // Execute forward migration
    await executeSqlFile('007-create-test-cases-table.sql')

    // Test 1: Check table exists
    const tableExists = await checkTableExists('test_cases')
    logTest(
      'Table Creation',
      tableExists,
      tableExists ? 'test_cases table created' : 'Table not found'
    )

    // Test 2: Check all columns exist
    const expectedColumns = [
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

    let allColumnsExist = true
    for (const column of expectedColumns) {
      const exists = await checkColumnExists('test_cases', column)
      if (!exists) {
        allColumnsExist = false
        console.log(`  ❌ Missing column: ${column}`)
      }
    }

    const columnCount = await countTableColumns('test_cases')
    logTest(
      'Column Creation',
      allColumnsExist && columnCount === 11,
      allColumnsExist
        ? `All 11 columns created (found ${columnCount})`
        : `Missing columns (found ${columnCount}/11)`
    )

    // Test 3: Check indexes
    const hasExerciseOrderIndex = await checkIndexExists('idx_test_cases_exercise_order')
    const hasExerciseHiddenIndex = await checkIndexExists('idx_test_cases_exercise_hidden')

    logTest(
      'Index Creation',
      hasExerciseOrderIndex && hasExerciseHiddenIndex,
      hasExerciseOrderIndex && hasExerciseHiddenIndex
        ? 'Both indexes created'
        : 'Some indexes missing'
    )

    // Test 4: Test weight CHECK constraint (valid value)
    console.log('\n🧪 Testing CHECK constraints...')

    // Get a test exercise ID
    const { data: exercises } = await supabase.from('exercises').select('id').limit(1)

    if (exercises && exercises.length > 0) {
      const testExerciseId = exercises[0].id

      // Test valid weight
      const { error: validWeightError } = await supabase.from('test_cases').insert({
        exercise_id: testExerciseId,
        input: { test: 'data' },
        expected_output: { result: 'expected' },
        weight: 50,
        timeout: 1000,
        description: 'Test valid weight',
        order_index: 1,
      })

      logTest(
        'Valid Weight Constraint',
        !validWeightError,
        !validWeightError ? 'Valid weight (50) accepted' : `Error: ${validWeightError.message}`
      )

      // Test invalid weight (> 100)
      const { error: invalidWeightError } = await supabase.from('test_cases').insert({
        exercise_id: testExerciseId,
        input: { test: 'data' },
        expected_output: { result: 'expected' },
        weight: 150,
        timeout: 1000,
        description: 'Test invalid weight',
        order_index: 2,
      })

      logTest(
        'Invalid Weight Constraint',
        !!invalidWeightError,
        invalidWeightError
          ? 'Invalid weight (150) rejected correctly'
          : 'ERROR: Invalid weight was accepted!'
      )

      // Test invalid timeout (<= 0)
      const { error: invalidTimeoutError } = await supabase.from('test_cases').insert({
        exercise_id: testExerciseId,
        input: { test: 'data' },
        expected_output: { result: 'expected' },
        weight: 10,
        timeout: 0,
        description: 'Test invalid timeout',
        order_index: 3,
      })

      logTest(
        'Invalid Timeout Constraint',
        !!invalidTimeoutError,
        invalidTimeoutError
          ? 'Invalid timeout (0) rejected correctly'
          : 'ERROR: Invalid timeout was accepted!'
      )

      // Clean up test data
      await supabase
        .from('test_cases')
        .delete()
        .eq('exercise_id', testExerciseId)
        .eq('description', 'Test valid weight')
    } else {
      logTest('CHECK Constraints', false, 'No exercises found to test constraints')
    }

    // Test 5: Idempotency - run migration again
    console.log('\n🔄 Testing idempotency (running migration again)...')
    await executeSqlFile('007-create-test-cases-table.sql')
    const columnCountAfter = await countTableColumns('test_cases')
    logTest(
      'Migration Idempotency',
      columnCountAfter === 11,
      columnCountAfter === 11
        ? 'Migration is idempotent (no duplicate columns)'
        : `Column count changed: ${columnCountAfter}`
    )
  } catch (error) {
    logTest('Forward Migration', false, `Error: ${error}`)
  }
}

async function testCascadeDelete(): Promise<void> {
  console.log('\n🔄 Testing CASCADE Delete...')

  try {
    // Create a test exercise
    const testExerciseId = 'test-cascade-' + Date.now()
    const { error: exerciseError } = await supabase.from('exercises').insert({
      id: testExerciseId,
      title: 'Test Exercise for CASCADE',
      question: 'Test question',
      language: 'javascript',
      difficulty: 'easy',
    })

    if (exerciseError) {
      logTest(
        'CASCADE Delete Setup',
        false,
        `Failed to create test exercise: ${exerciseError.message}`
      )
      return
    }

    // Create test cases for this exercise
    const { error: testCaseError } = await supabase.from('test_cases').insert([
      {
        exercise_id: testExerciseId,
        input: { test: 1 },
        expected_output: { result: 1 },
        weight: 10,
        timeout: 1000,
        description: 'Test case 1',
        order_index: 1,
      },
      {
        exercise_id: testExerciseId,
        input: { test: 2 },
        expected_output: { result: 2 },
        weight: 10,
        timeout: 1000,
        description: 'Test case 2',
        order_index: 2,
      },
    ])

    if (testCaseError) {
      logTest(
        'CASCADE Delete Setup',
        false,
        `Failed to create test cases: ${testCaseError.message}`
      )
      return
    }

    // Verify test cases were created
    const { count: beforeCount } = await supabase
      .from('test_cases')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', testExerciseId)

    // Delete the exercise
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('id', testExerciseId)

    if (deleteError) {
      logTest('CASCADE Delete', false, `Failed to delete exercise: ${deleteError.message}`)
      return
    }

    // Verify test cases were cascade deleted
    const { count: afterCount } = await supabase
      .from('test_cases')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', testExerciseId)

    logTest(
      'CASCADE Delete',
      beforeCount === 2 && afterCount === 0,
      beforeCount === 2 && afterCount === 0
        ? 'Test cases cascade deleted correctly'
        : `Before: ${beforeCount}, After: ${afterCount}`
    )
  } catch (error) {
    logTest('CASCADE Delete', false, `Error: ${error}`)
  }
}

async function testRollbackMigration(): Promise<void> {
  console.log('\n🔄 Testing Rollback Migration...')

  try {
    // Execute rollback migration
    await executeSqlFile('007-rollback-test-cases-table.sql')

    // Test 1: Verify table removed
    const tableExists = await checkTableExists('test_cases')
    logTest(
      'Table Removal',
      !tableExists,
      !tableExists ? 'test_cases table removed' : 'ERROR: Table still exists!'
    )

    // Test 2: Verify indexes removed
    const hasExerciseOrderIndex = await checkIndexExists('idx_test_cases_exercise_order')
    const hasExerciseHiddenIndex = await checkIndexExists('idx_test_cases_exercise_hidden')

    const noIndexesRemain = !hasExerciseOrderIndex && !hasExerciseHiddenIndex

    logTest(
      'Indexes Removed',
      noIndexesRemain,
      noIndexesRemain ? 'All indexes removed' : 'Some indexes still exist'
    )

    // Test 3: Idempotency - run rollback again
    console.log('\n🔄 Testing rollback idempotency (running rollback again)...')
    await executeSqlFile('007-rollback-test-cases-table.sql')
    const tableExistsAfter = await checkTableExists('test_cases')
    logTest(
      'Rollback Idempotency',
      !tableExistsAfter,
      !tableExistsAfter ? 'Rollback is idempotent' : 'ERROR: Table reappeared!'
    )
  } catch (error) {
    logTest('Rollback Migration', false, `Error: ${error}`)
  }
}

async function printSummary(): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`)
  console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))

  if (failed === 0) {
    console.log('✅ All tests passed! Migrations are working correctly.')
  } else {
    console.log('❌ Some tests failed. Please review the errors above.')
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Starting test_cases Table Migration Tests')
  console.log('Database:', supabaseUrl)
  console.log('='.repeat(60))

  try {
    // Test forward migration
    await testForwardMigration()

    // Test CASCADE delete
    await testCascadeDelete()

    // Test rollback migration
    await testRollbackMigration()

    // Re-apply forward migration for final state
    console.log('\n🔄 Re-applying forward migration for final state...')
    await executeSqlFile('007-create-test-cases-table.sql')
    console.log('✓ Forward migration re-applied')

    // Print summary
    await printSummary()
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()
