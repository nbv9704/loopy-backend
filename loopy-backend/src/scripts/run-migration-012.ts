import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration012() {
  console.log('🔄 Running migration 012 (deterministic validation columns)...')
  
  const query = `
    ALTER TABLE lessons 
    ADD COLUMN IF NOT EXISTS validation_type TEXT DEFAULT 'rule' CHECK (validation_type IN ('rule', 'exact', 'regex', 'stdout', 'function')),
    ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS success_output TEXT,
    ADD COLUMN IF NOT EXISTS failure_hint TEXT,
    ADD COLUMN IF NOT EXISTS grading_mode TEXT DEFAULT 'stdout' CHECK (grading_mode IN ('stdout', 'function'));

    ALTER TABLE lessons 
    ALTER COLUMN code DROP NOT NULL,
    ALTER COLUMN insight DROP NOT NULL;
  `

  const { error } = await supabase.rpc('pgmigrate', { query })

  if (error) {
    console.error('❌ Failed to run migration via pgmigrate RPC:', error.message)
    console.log('\nPlease run the following SQL query in your Supabase SQL Editor manually:\n')
    console.log('--- COPY SQL ---')
    console.log(query.trim())
    console.log('--- END SQL ---\n')
  } else {
    console.log('✅ Migration 012 applied successfully!')
  }
}

runMigration012().catch(console.error)
