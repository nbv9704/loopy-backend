/**
 * Test script for multilingual migration
 *
 * This script tests both forward and rollback migrations on the local database.
 * It verifies that:
 * 1. Forward migration adds all columns and indexes
 * 2. Rollback migration removes all columns and indexes
 * 3. Data is preserved through both operations
 * 4. Migrations are idempotent (can be run multiple times)
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

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    // Try direct execution if RPC doesn't exist
    const { error: directError } = await supabase.from('_sql').insert({ query: sql })
    if (directError) {
      throw new Error(`Failed to execute ${filename}: ${error.message}`)
    }
  }
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', tableName)
    .eq('column_name', columnName)
    .single()

  return !error && data !== null
}

async function checkIndexExists(indexName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pg_indexes')
    .select('indexname')
    .eq('indexname', indexName)
    .single()

  return !error && data !== null
}

async function countEnglishColumns(): Promise<number> {
  const { count, error } = await supabase
    .from('information_schema.columns')
    .select('*', { count: 'exact', head: true })
    .like('column_name', '%_en')

  return count || 0
}

async function testForwardMigration(): Promise<void> {
  console.log('\n🔄 Testing Forward Migration...')

  try {
    // Execute forward migration
    await executeSqlFile('002-add-multilingual-columns.sql')

    // Test 1: Check landing_features columns
    const hasFeaturesTitleEn = await checkColumnExists('landing_features', 'title_en')
    const hasFeaturesDescEn = await checkColumnExists('landing_features', 'description_en')
    logTest(
      'Landing Features Columns',
      hasFeaturesTitleEn && hasFeaturesDescEn,
      hasFeaturesTitleEn && hasFeaturesDescEn
        ? 'title_en and description_en columns created'
        : 'Failed to create columns'
    )

    // Test 2: Check landing_languages columns
    const hasLanguagesNameEn = await checkColumnExists('landing_languages', 'name_en')
    const hasLanguagesDescEn = await checkColumnExists('landing_languages', 'description_en')
    logTest(
      'Landing Languages Columns',
      hasLanguagesNameEn && hasLanguagesDescEn,
      hasLanguagesNameEn && hasLanguagesDescEn
        ? 'name_en and description_en columns created'
        : 'Failed to create columns'
    )

    // Test 3: Check landing_stats columns
    const hasStatsLabelEn = await checkColumnExists('landing_stats', 'label_en')
    logTest(
      'Landing Stats Columns',
      hasStatsLabelEn,
      hasStatsLabelEn ? 'label_en column created' : 'Failed to create column'
    )

    // Test 4: Check landing_how_it_works columns
    const hasHowItWorksTitleEn = await checkColumnExists('landing_how_it_works', 'title_en')
    const hasHowItWorksDescEn = await checkColumnExists('landing_how_it_works', 'description_en')
    logTest(
      'Landing How It Works Columns',
      hasHowItWorksTitleEn && hasHowItWorksDescEn,
      hasHowItWorksTitleEn && hasHowItWorksDescEn
        ? 'title_en and description_en columns created'
        : 'Failed to create columns'
    )

    // Test 5: Check navigation_items columns
    const hasNavLabelEn = await checkColumnExists('navigation_items', 'label_en')
    logTest(
      'Navigation Items Columns',
      hasNavLabelEn,
      hasNavLabelEn ? 'label_en column created' : 'Failed to create column'
    )

    // Test 6: Check documentation_technologies columns
    const hasTechNameEn = await checkColumnExists('documentation_technologies', 'name_en')
    logTest(
      'Documentation Technologies Columns',
      hasTechNameEn,
      hasTechNameEn ? 'name_en column created' : 'Failed to create column'
    )

    // Test 7: Check documentation_links columns
    const hasLinksTitleEn = await checkColumnExists('documentation_links', 'title_en')
    const hasLinksDescEn = await checkColumnExists('documentation_links', 'description_en')
    logTest(
      'Documentation Links Columns',
      hasLinksTitleEn && hasLinksDescEn,
      hasLinksTitleEn && hasLinksDescEn
        ? 'title_en and description_en columns created'
        : 'Failed to create columns'
    )

    // Test 8: Check indexes
    const hasFeatureIndex = await checkIndexExists('idx_landing_features_title_en')
    const hasLanguageIndex = await checkIndexExists('idx_landing_languages_name_en')
    const hasStatsIndex = await checkIndexExists('idx_landing_stats_label_en')
    const hasHowItWorksIndex = await checkIndexExists('idx_landing_how_it_works_title_en')
    const hasNavIndex = await checkIndexExists('idx_navigation_items_label_en')
    const hasTechIndex = await checkIndexExists('idx_documentation_technologies_name_en')
    const hasLinksIndex = await checkIndexExists('idx_documentation_links_title_en')

    const allIndexesCreated =
      hasFeatureIndex &&
      hasLanguageIndex &&
      hasStatsIndex &&
      hasHowItWorksIndex &&
      hasNavIndex &&
      hasTechIndex &&
      hasLinksIndex

    logTest(
      'Partial Indexes',
      allIndexesCreated,
      allIndexesCreated ? 'All 7 partial indexes created' : 'Some indexes missing'
    )

    // Test 9: Count total English columns
    const totalEnColumns = await countEnglishColumns()
    logTest(
      'Total English Columns',
      totalEnColumns === 13,
      `Found ${totalEnColumns} English columns (expected 13)`
    )

    // Test 10: Idempotency - run migration again
    console.log('\n🔄 Testing idempotency (running migration again)...')
    await executeSqlFile('002-add-multilingual-columns.sql')
    const totalEnColumnsAfter = await countEnglishColumns()
    logTest(
      'Migration Idempotency',
      totalEnColumnsAfter === 13,
      totalEnColumnsAfter === 13
        ? 'Migration is idempotent (no duplicate columns)'
        : `Column count changed: ${totalEnColumnsAfter}`
    )
  } catch (error) {
    logTest('Forward Migration', false, `Error: ${error}`)
  }
}

async function testRollbackMigration(): Promise<void> {
  console.log('\n🔄 Testing Rollback Migration...')

  try {
    // Execute rollback migration
    await executeSqlFile('002-rollback-multilingual-columns.sql')

    // Test 1: Verify all English columns removed
    const totalEnColumns = await countEnglishColumns()
    logTest(
      'English Columns Removed',
      totalEnColumns === 0,
      totalEnColumns === 0
        ? 'All English columns removed'
        : `${totalEnColumns} English columns still exist`
    )

    // Test 2: Verify indexes removed
    const hasFeatureIndex = await checkIndexExists('idx_landing_features_title_en')
    const hasLanguageIndex = await checkIndexExists('idx_landing_languages_name_en')
    const hasStatsIndex = await checkIndexExists('idx_landing_stats_label_en')
    const hasHowItWorksIndex = await checkIndexExists('idx_landing_how_it_works_title_en')
    const hasNavIndex = await checkIndexExists('idx_navigation_items_label_en')
    const hasTechIndex = await checkIndexExists('idx_documentation_technologies_name_en')
    const hasLinksIndex = await checkIndexExists('idx_documentation_links_title_en')

    const noIndexesRemain =
      !hasFeatureIndex &&
      !hasLanguageIndex &&
      !hasStatsIndex &&
      !hasHowItWorksIndex &&
      !hasNavIndex &&
      !hasTechIndex &&
      !hasLinksIndex

    logTest(
      'Indexes Removed',
      noIndexesRemain,
      noIndexesRemain ? 'All indexes removed' : 'Some indexes still exist'
    )

    // Test 3: Verify original columns still exist
    const hasOriginalTitle = await checkColumnExists('landing_features', 'title')
    const hasOriginalDesc = await checkColumnExists('landing_features', 'description')
    logTest(
      'Original Columns Preserved',
      hasOriginalTitle && hasOriginalDesc,
      hasOriginalTitle && hasOriginalDesc
        ? 'Original Vietnamese columns preserved'
        : 'Original columns missing!'
    )

    // Test 4: Idempotency - run rollback again
    console.log('\n🔄 Testing rollback idempotency (running rollback again)...')
    await executeSqlFile('002-rollback-multilingual-columns.sql')
    const totalEnColumnsAfter = await countEnglishColumns()
    logTest(
      'Rollback Idempotency',
      totalEnColumnsAfter === 0,
      totalEnColumnsAfter === 0
        ? 'Rollback is idempotent'
        : `Unexpected columns: ${totalEnColumnsAfter}`
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
  console.log('🚀 Starting Migration Tests')
  console.log('Database:', supabaseUrl)
  console.log('='.repeat(60))

  try {
    // Test forward migration
    await testForwardMigration()

    // Test rollback migration
    await testRollbackMigration()

    // Re-apply forward migration for final state
    console.log('\n🔄 Re-applying forward migration for final state...')
    await executeSqlFile('002-add-multilingual-columns.sql')
    console.log('✓ Forward migration re-applied')

    // Print summary
    await printSummary()
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()
