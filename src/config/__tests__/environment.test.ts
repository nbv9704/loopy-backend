import { validateEnvironment } from '../environment'

const development = () => ({
  NODE_ENV: 'development',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'local-anon',
  SUPABASE_SERVICE_KEY: 'local-service',
})
const production = () => ({
  NODE_ENV: 'production',
  SUPABASE_URL: 'https://project.example.test',
  SUPABASE_ANON_KEY: 'configured-anon-key',
  SUPABASE_SERVICE_KEY: 'configured-service-key',
  API_URL: 'https://api.example.test/',
  FRONTEND_URL: 'https://app.example.test/',
  ADMIN_SESSION_SECRET: 'configured-independent-secret-at-least-32-characters',
  REDIS_URL: 'redis://127.0.0.1:6379',
})
it('normalizes deployment origins without making any service call', () => {
  expect(validateEnvironment(production())).toEqual({
    apiUrl: 'https://api.example.test',
    frontendUrl: 'https://app.example.test',
    supabaseUrl: 'https://project.example.test',
    allowedOrigins: [],
  })
  expect(validateEnvironment(development()).frontendUrl).toBe('http://localhost:5173')
})
it.each([
  ['PORT', '3000abc'],
  ['PORT', '0'],
  ['PORT', '65536'],
  ['PORT', ''],
  ['RATE_LIMIT_WINDOW', '1.5'],
  ['CACHE_TTL', '-1'],
  ['ADMIN_SESSION_MAX_AGE', 'NaN'],
  ['CODE_EXECUTION_TIMEOUT', '1e3'],
  ['GEMINI_TEMPERATURE', 'invalid'],
  ['NODE_ENV', 'staging'],
  ['SWAGGER_ENABLED', 'yes'],
  ['GLOT_ENABLED', 'yes'],
  ['REDIS_URL', 'https://private:password@example.test'],
])('rejects malformed %s instead of partially parsing it', (name, value) => {
  expect(() => validateEnvironment({ ...development(), [name]: value })).toThrow(name)
})
it.each([
  ['ADMIN_SESSION_SECRET', 'loopy-admin-secret-change-in-production'],
  ['ADMIN_SESSION_SECRET', 'short'],
  ['REDIS_URL', ''],
  ['API_URL', ''],
  ['FRONTEND_URL', 'http://app.example.test'],
  ['SUPABASE_SERVICE_KEY', 'your-service-key'],
  ['ENABLE_DEV_LOGIN', 'true'],
  ['SWAGGER_INCLUDE_DEBUG', 'true'],
])('stops production startup with unusable %s', (name, value) => {
  expect(() => validateEnvironment({ ...production(), [name]: value })).toThrow(name)
})
it('keeps diagnostics free of values and normalizes only explicit CORS origins', () => {
  const privateValue = 'https://user:private-password@api.example.test'
  try {
    validateEnvironment({ ...production(), API_URL: privateValue })
  } catch (error) {
    expect(String(error)).not.toContain('private-password')
  }
  expect(
    validateEnvironment({
      ...production(),
      ALLOWED_ORIGINS: ' https://preview.example.test/,https://another.example.test ',
    }).allowedOrigins
  ).toEqual(['https://preview.example.test', 'https://another.example.test'])
})
