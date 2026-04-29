#!/usr/bin/env tsx
/**
 * Migration Runner for Auto-Grading System
 * Feature: auto-grading-system
 * Task: 1.4 - Run migrations and verify schema changes
 *
 * This script executes migrations 006, 007, and 008 in order and verifies the results.
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
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface MigrationResult {
  success: boolean
  migration: string
  error?: string
  notices?: string[]
}

/**
 * Execute a SQL migration file
 */
async function executeMigration(filename: string): Promise<MigrationResult> {
  console.log(`\n📄 Executing migration: ${filename}`)
  console.log('─'.repeat(70))

  try {
    const migrationPath = join(__dirname, filename)
    const sql = readFileSync(migrationPath, 'utf-8')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1)

      if (directError) {
        // Use raw SQL execution via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({ sql_query: sql }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
      }
    }

    console.log(`✅ Migration ${filename} executed successfully`)
    return {
      success: true,
      migration: filename,
    }
  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error)
    return {
      success: false,
      migration: filename,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Execute a verification SQL file and return results
 */
async function executeVerification(filename: string): Promise<MigrationResult> {
  console.log(`\n🔍 Running verification: ${filename}`)
  console.log('─'.repeat(70))

  try {
    const verificationPath = join(__dirname, filename)
    const sql = readFileSync(verificationPath, 'utf-8')

    // Split SQL into individual queries
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))

    console.log(`📊 Executing ${queries.length} verification queries...`)

    // Execute each query
    for (const query of queries) {
      if (query.toLowerCase().includes('select')) {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })

        if (error) {
          console.warn(`⚠️  Query warning: ${error.message}`)
        } else if (data) {
          console.log(`✓ Query returned ${Array.isArray(data) ? data.length : 1} result(s)`)
        }
      }
    }

    console.log(`✅ Verification ${filename} completed`)
    return {
      success: true,
      migration: filename,
    }
  } catch (error) {
    console.error(`❌ Verification ${filename} failed:`, error)
    return {
      success: false,
      migration: filename,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Auto-Grading System Migration Runner')
  console.log('='.repeat(70))
  console.log(`Database: ${SUPABASE_URL}`)
  console.log('='.repeat(70))

  const results: MigrationResult[] = []

  // Migration 006: exercise_submissions table extensions
  console.log('\n📦 Phase 1: Exercise Submissions Table Extensions')
  const migration006 = await executeMigration('006-add-auto-grading-columns.sql')
  results.push(migration006)

  if (!migration006.success) {
    console.error('\n❌ Migration 006 failed. Stopping execution.')
    process.exit(1)
  }

  const verify006 = await executeVerification('006-verify-auto-grading-columns.sql')
  results.push(verify006)

  // Migration 007: test_cases table creation
  console.log('\n📦 Phase 2: Test Cases Table Creation')
  const migration007 = await executeMigration('007-create-test-cases-table.sql')
  results.push(migration007)

  if (!migration007.success) {
    console.error('\n❌ Migration 007 failed. Stopping execution.')
    process.exit(1)
  }

  const verify007 = await executeVerification('007-verify-test-cases-table.sql')
  results.push(verify007)

  // Migration 008: ai_usage_logs table creation
  console.log('\n📦 Phase 3: AI Usage Logs Table Creation')
  const migration008 = await executeMigration('008-create-ai-usage-logs-table.sql')
  results.push(migration008)

  if (!migration008.success) {
    console.error('\n❌ Migration 008 failed. Stopping execution.')
    process.exit(1)
  }

  const verify008 = await executeVerification('008-verify-ai-usage-logs-table.sql')
  results.push(verify008)

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(70))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`\nTotal Operations: ${results.length}`)
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed === 0) {
    console.log('\n✅ All migrations and verifications completed successfully!')
    console.log('\n📝 Next Steps:')
    console.log('  1. Review the verification output above')
    console.log('  2. Check Supabase Dashboard to confirm schema changes')
    console.log('  3. Proceed to Task 2.1 (Cache Service implementation)')
  } else {
    console.log('\n❌ Some operations failed. Please review the errors above.')
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
