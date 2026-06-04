import { supabaseAdmin } from './src/db/supabase'
import { logger } from './src/utils/logger'

async function migrate() {
  console.log('🚀 Starting database migration...')
  
  const queries = [
    // Add is_aha_lesson to lessons
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_aha_lesson BOOLEAN DEFAULT FALSE;`,
    
    // Add other See-Change-Build columns if missing
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS starter_code TEXT;`,
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS task_description TEXT;`,
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS hint TEXT;`,
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS common_mistakes TEXT;`,
    `ALTER TABLE lessons ADD COLUMN IF NOT EXISTS solution_code TEXT;`,
    
    // Update existing records if needed (optional)
    `UPDATE lessons SET is_aha_lesson = true WHERE order_index = 1 AND is_aha_lesson IS NULL;`
  ]

  for (const query of queries) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query })
      if (error) {
        // If RPC is not available, we might need a different approach
        // But for many Supabase setups, a custom exec_sql function is common
        console.error(`Error executing query: ${query}`, error)
      } else {
        console.log(`✅ Success: ${query.substring(0, 50)}...`)
      }
    } catch (err) {
      console.error(`Execution failed for: ${query}`, err)
    }
  }
}

// Note: rpc('exec_sql') requires a Postgres function to be created first:
/*
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

// Since I cannot create the function easily without psql, I'll recommend the user to run it in Supabase Dashboard.
console.log('Please run the following SQL in your Supabase SQL Editor:')
console.log(`
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_aha_lesson BOOLEAN DEFAULT FALSE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS starter_code TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS common_mistakes TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS solution_code TEXT;

-- Seed a sample Aha lesson if none exists
UPDATE lessons SET is_aha_lesson = true WHERE order_index = 0 OR order_index = 1 LIMIT 1;
`)
