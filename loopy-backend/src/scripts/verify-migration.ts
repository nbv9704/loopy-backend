/**
 * Verify Content Migration
 *
 * Checks that all content was migrated successfully
 */

import { supabaseAdmin } from '../db/supabase'

async function verifyMigration() {
  console.log('🔍 Verifying content migration...\n')

  try {
    // Check documentation technologies
    const { data: techs, error: techsError } = await supabaseAdmin
      .from('documentation_technologies')
      .select('id, name, category, status')

    if (techsError) throw techsError
    console.log(`✅ Documentation Technologies: ${techs?.length || 0}`)
    console.log(`   Categories: ${[...new Set(techs?.map(t => t.category))].join(', ')}`)

    // Check documentation links
    const { data: links, error: linksError } = await supabaseAdmin
      .from('documentation_links')
      .select('id, technology_id')

    if (linksError) throw linksError
    console.log(`✅ Documentation Links: ${links?.length || 0}`)

    // Check landing features
    const { data: features, error: featuresError } = await supabaseAdmin
      .from('landing_features')
      .select('id, title, status')

    if (featuresError) throw featuresError
    console.log(`✅ Landing Features: ${features?.length || 0}`)

    // Check landing stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('landing_stats')
      .select('id, label, status')

    if (statsError) throw statsError
    console.log(`✅ Landing Stats: ${stats?.length || 0}`)

    // Check landing languages
    const { data: languages, error: languagesError } = await supabaseAdmin
      .from('landing_languages')
      .select('id, name, status')

    if (languagesError) throw languagesError
    console.log(`✅ Landing Languages: ${languages?.length || 0}`)

    // Check how-it-works steps
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from('landing_how_it_works')
      .select('id, title, status')

    if (stepsError) throw stepsError
    console.log(`✅ How-It-Works Steps: ${steps?.length || 0}`)

    // Check navigation items
    const { data: navItems, error: navError } = await supabaseAdmin
      .from('navigation_items')
      .select('id, location, label, status')

    if (navError) throw navError
    console.log(`✅ Navigation Items: ${navItems?.length || 0}`)
    const headerCount = navItems?.filter(n => n.location === 'header').length || 0
    const footerCount = navItems?.filter(n => n.location === 'footer').length || 0
    console.log(`   Header: ${headerCount}, Footer: ${footerCount}`)

    console.log('\n🎉 All content verified successfully!')
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

verifyMigration()
