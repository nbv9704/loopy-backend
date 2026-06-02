const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pbqwkqvdnagkefikxwsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicXdrcXZkbmFna2VmaWt4d3N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwNzA1OSwiZXhwIjoyMDkwMDgzMDU5fQ.VA8zqO3B6x0W_IGjUOHI7HmGYC4hN_oHnOlOExf3GBA';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedContent() {
  try {
    console.log('📝 Reading seed file...');
    const seedPath = path.join(__dirname, 'database', 'scripts', 'SEED_CONTENT_ITEMS.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');
    
    console.log('🚀 Seeding content items...');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: seedSQL });
    
    if (error) {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Content items seeded successfully!');
    
    // Verify the seed
    console.log('\n📊 Verifying seeded content...');
    const { data, error: verifyError } = await supabaseAdmin
      .from('content_items')
      .select('id, key, language, value')
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }
    
    console.log(`✅ Found ${data?.length || 0} content items`);
    if (data && data.length > 0) {
      console.log('\nSample content items:');
      data.slice(0, 5).forEach(item => {
        console.log(`  - ${item.key} (${item.language}): ${item.value.substring(0, 50)}...`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedContent();
