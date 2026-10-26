type Environment = Record<string, string | undefined>

function invalid(name: string, rule: string): never {
  // Report names/rules only: process managers often persist startup errors.
  throw new Error(`Invalid environment variable ${name}: ${rule}`)
}

function origin(env: Environment, name: string, fallback: string, production: boolean) {
  const value = env[name]?.trim() || (production ? '' : fallback)
  try {
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      (production && url.protocol !== 'https:')
    )
      return invalid(name, 'use an HTTPS origin in production, without credentials, path or query')
    return url.origin
  } catch {
    return invalid(name, 'a valid HTTP(S) origin is required; production requires HTTPS')
  }
}

/** Pure startup preflight; never connects to any configured service. */
export function validateEnvironment(env: Environment) {
  const nodeEnv = env.NODE_ENV || 'development'
  if (!['development', 'test', 'production'].includes(nodeEnv))
    invalid('NODE_ENV', 'expected development, test or production')
  const production = nodeEnv === 'production'
  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY']) {
    if (!env[name]?.trim()) invalid(name, 'required')
    if (production && /^(your[-_]|loopy-test-|.*_here$)/i.test(env[name]!))
      invalid(name, 'replace the example value before deployment')
  }
  const supabaseUrl = origin(env, 'SUPABASE_URL', '', production)
  const apiUrl = origin(env, 'API_URL', 'http://localhost:3000', production)
  const frontendUrl = origin(env, 'FRONTEND_URL', 'http://localhost:5173', production)
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .filter(value => value.trim())
    .map(value => origin({ ALLOWED_ORIGINS: value }, 'ALLOWED_ORIGINS', '', production))
  const integers: Array<[string, number, number]> = [
    ['PORT', 1, 65535],
    ['CODE_EXECUTION_TIMEOUT', 100, 60000],
    ['MAX_CODE_LENGTH', 1, 1000000],
    ['RATE_LIMIT_WINDOW', 1, 1440],
    ['RATE_LIMIT_MAX_REQUESTS', 1, 1000000],
    ['RATE_LIMIT_CODE_EXECUTION', 1, 1000000],
    ['CACHE_TTL', 0, 86400],
    ['ADMIN_SESSION_MAX_AGE', 60000, 2592000000],
    ['GEMINI_MAX_OUTPUT_TOKENS', 1, 65536],
  ]
  for (const [name, min, max] of integers) {
    if (env[name] === undefined) continue
    const value = env[name]!
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) < min ||
      Number(value) > max
    )
      invalid(name, `expected an integer from ${min} to ${max}`)
  }
  for (const name of [
    'SWAGGER_ENABLED',
    'SWAGGER_REQUIRE_AUTH',
    'SWAGGER_INCLUDE_DEBUG',
    'ENABLE_DEV_LOGIN',
    'GLOT_ENABLED',
    'AI_FALLBACK_ENABLED',
    'ADMIN_CSRF_ENABLED',
    'REDIS_REJECT_UNAUTHORIZED',
  ]) {
    if (env[name] !== undefined && !['true', 'false'].includes(env[name]!))
      invalid(name, 'expected true or false')
  }
  if (
    env.GEMINI_TEMPERATURE !== undefined &&
    (!/^\d+(\.\d+)?$/.test(env.GEMINI_TEMPERATURE) || Number(env.GEMINI_TEMPERATURE) > 2)
  )
    invalid('GEMINI_TEMPERATURE', 'expected a number from 0 to 2')
  if (env.REDIS_URL?.trim()) {
    try {
      const url = new URL(env.REDIS_URL)
      if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname) throw new Error()
    } catch {
      invalid('REDIS_URL', 'expected a redis:// or rediss:// URL')
    }
  } else if (production) invalid('REDIS_URL', 'required in production')
  if (production) {
    const secret = env.ADMIN_SESSION_SECRET || ''
    if (secret.trim().length < 32 || /change-in-production|^your[-_]|^loopy-test-/i.test(secret))
      invalid('ADMIN_SESSION_SECRET', 'use an independent random secret of at least 32 characters')
    if (env.ENABLE_DEV_LOGIN === 'true') invalid('ENABLE_DEV_LOGIN', 'must be false in production')
    if (env.SWAGGER_INCLUDE_DEBUG === 'true')
      invalid('SWAGGER_INCLUDE_DEBUG', 'must be false in production')
  }
  return { apiUrl, frontendUrl, supabaseUrl, allowedOrigins }
}
