import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration026() {
  console.log('🔄 Running migration 026 (Fix admin_audit_logs constraint)...')
  
  const migrationPath = path.join(__dirname, '../../database/migrations/026-fix-audit-logs-constraint.sql')
  const query = fs.readFileSync(migrationPath, 'utf8')

  const { error } = await supabase.rpc('pgmigrate', { query })

  if (error) {
    console.error('❌ Failed to run migration via pgmigrate RPC:', error.message)
    console.log('\nPlease run the following SQL query in your Supabase SQL Editor manually:')
    console.log(query)
  } else {
    console.log('✅ Migration 026 applied successfully!')
  }
}

runMigration026().catch(console.error)
