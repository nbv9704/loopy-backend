import { config } from '../config'

// Importing config validates settings without importing database, Redis, runner or server modules.
console.log(`Configuration valid (${config.nodeEnv}); no external connection was opened.`)
