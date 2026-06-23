import { logger } from '../utils/logger'

/**
 * Deprecated seed script.
 *
 * The original rework seed targeted legacy PvP schema, including the dropped
 * `pvp_questions` table. Current PvP questions must come from official
 * `practice_sets` / `practice_questions` instead.
 *
 * Do not re-enable this file by partially editing the old implementation.
 * Create a new explicit seed script for official practice sets instead.
 */
async function main() {
  logger.error(
    'seed-rework.ts is deprecated: it references the legacy pvp_questions architecture. ' +
      'Use seed.ts or create a new official-practice seed script.'
  )
  process.exitCode = 1
}

main().catch((error) => {
  logger.error('Deprecated seed-rework script failed unexpectedly:', error)
  process.exitCode = 1
})
