import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration016() {
  console.log('🔄 Running migration 016 (Gamification schema)...')
  
  const migrationPath = path.join(__dirname, '../../database/migrations/016-ensure-gamification-schema.sql')
  const query = fs.readFileSync(migrationPath, 'utf8')

  const { error } = await supabase.rpc('pgmigrate', { query })

  if (error) {
    console.error('❌ Failed to run migration via pgmigrate RPC:', error.message)
    console.log('\nPlease run the following SQL query in your Supabase SQL Editor manually. It is safe to run because of IF NOT EXISTS.')
  } else {
    console.log('✅ Migration 016 applied successfully!')
  }
}

runMigration016().catch(console.error)
