/**
 * Content Rollback Script
 *
 * Deletes all migrated content from the database.
 * Requirement 7.7: Rollback mechanism in case migration fails
 */

import { supabaseAdmin } from '../db/supabase'

interface RollbackReport {
  documentationTechnologies: number
  documentationLinks: number
  landingFeatures: number
  landingStats: number
  landingLanguages: number
  landingHowItWorks: number
  navigationItems: number
  errors: string[]
}

/**
 * Main rollback function
 */
async function rollbackContent(): Promise<RollbackReport> {
  const report: RollbackReport = {
    documentationTechnologies: 0,
    documentationLinks: 0,
    landingFeatures: 0,
    landingStats: 0,
    landingLanguages: 0,
    landingHowItWorks: 0,
    navigationItems: 0,
    errors: [],
  }

  console.log('🔄 Starting content rollback...\n')

  try {
    // Delete Documentation Links (must be deleted before technologies due to foreign key)
    console.log('🗑️  Deleting documentation links...')
    const { data: links, error: linksError } = await supabaseAdmin
      .from('documentation_links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (linksError) {
      report.errors.push(`Failed to delete documentation links: ${linksError.message}`)
    } else {
      report.documentationLinks = links?.length || 0
      console.log(`✅ Deleted ${report.documentationLinks} documentation links`)
    }

    // Delete Documentation Technologies
    console.log('🗑️  Deleting documentation technologies...')
    const { data: techs, error: techsError } = await supabaseAdmin
      .from('documentation_technologies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (techsError) {
      report.errors.push(`Failed to delete documentation technologies: ${techsError.message}`)
    } else {
      report.documentationTechnologies = techs?.length || 0
      console.log(`✅ Deleted ${report.documentationTechnologies} documentation technologies`)
    }

    // Delete Landing Features
    console.log('🗑️  Deleting landing features...')
    const { data: features, error: featuresError } = await supabaseAdmin
      .from('landing_features')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (featuresError) {
      report.errors.push(`Failed to delete landing features: ${featuresError.message}`)
    } else {
      report.landingFeatures = features?.length || 0
      console.log(`✅ Deleted ${report.landingFeatures} landing features`)
    }

    // Delete Landing Stats
    console.log('🗑️  Deleting landing stats...')
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('landing_stats')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (statsError) {
      report.errors.push(`Failed to delete landing stats: ${statsError.message}`)
    } else {
      report.landingStats = stats?.length || 0
      console.log(`✅ Deleted ${report.landingStats} landing stats`)
    }

    // Delete Landing Languages
    console.log('🗑️  Deleting landing languages...')
    const { data: languages, error: languagesError } = await supabaseAdmin
      .from('landing_languages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (languagesError) {
      report.errors.push(`Failed to delete landing languages: ${languagesError.message}`)
    } else {
      report.landingLanguages = languages?.length || 0
      console.log(`✅ Deleted ${report.landingLanguages} landing languages`)
    }

    // Delete How It Works Steps
    console.log('🗑️  Deleting how-it-works steps...')
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from('landing_how_it_works')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (stepsError) {
      report.errors.push(`Failed to delete how-it-works steps: ${stepsError.message}`)
    } else {
      report.landingHowItWorks = steps?.length || 0
      console.log(`✅ Deleted ${report.landingHowItWorks} how-it-works steps`)
    }

    // Delete Navigation Items
    console.log('🗑️  Deleting navigation items...')
    const { data: navItems, error: navError } = await supabaseAdmin
      .from('navigation_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select()

    if (navError) {
      report.errors.push(`Failed to delete navigation items: ${navError.message}`)
    } else {
      report.navigationItems = navItems?.length || 0
      console.log(`✅ Deleted ${report.navigationItems} navigation items`)
    }
  } catch (error: any) {
    console.error('\n❌ Rollback failed with critical error:', error.message)
    report.errors.push(`Critical error: ${error.message}`)
  }

  return report
}

/**
 * Print rollback report
 */
function printReport(report: RollbackReport) {
  console.log('\n' + '='.repeat(60))
  console.log('📋 ROLLBACK REPORT')
  console.log('='.repeat(60))
  console.log(`🗑️  Documentation Technologies: ${report.documentationTechnologies}`)
  console.log(`🗑️  Documentation Links: ${report.documentationLinks}`)
  console.log(`🗑️  Landing Features: ${report.landingFeatures}`)
  console.log(`🗑️  Landing Stats: ${report.landingStats}`)
  console.log(`🗑️  Landing Languages: ${report.landingLanguages}`)
  console.log(`🗑️  How-It-Works Steps: ${report.landingHowItWorks}`)
  console.log(`🗑️  Navigation Items: ${report.navigationItems}`)
  console.log('='.repeat(60))

  const totalItems =
    report.documentationTechnologies +
    report.documentationLinks +
    report.landingFeatures +
    report.landingStats +
    report.landingLanguages +
    report.landingHowItWorks +
    report.navigationItems

  console.log(`📦 Total Items Deleted: ${totalItems}`)

  if (report.errors.length > 0) {
    console.log(`\n⚠️  Errors (${report.errors.length}):`)
    report.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`)
    })
  } else {
    console.log('\n🎉 Rollback completed successfully with no errors!')
  }

  console.log('='.repeat(60) + '\n')
}

/**
 * Main execution
 */
async function main() {
  // Confirmation prompt
  console.log('⚠️  WARNING: This will delete ALL content from the database!')
  console.log('⚠️  This action cannot be undone.\n')

  // In a production environment, you might want to add a confirmation prompt here
  // For now, we'll proceed with the rollback

  try {
    const report = await rollbackContent()
    printReport(report)

    if (report.errors.length > 0) {
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run rollback
main()
