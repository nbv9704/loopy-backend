// Unit/in-process tests must never inherit a developer's real services or credentials.
Object.assign(process.env, {
  NODE_ENV: 'test',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'loopy-test-anon-key',
  SUPABASE_SERVICE_KEY: 'loopy-test-service-key',
  REDIS_URL: '',
  GROQ_API_KEY: '',
  GEMINI_API_KEY: '',
  PISTON_API_URL: '',
  GLOT_API_TOKEN: '',
  GLOT_ENABLED: 'false',
})

// Unexpected SDK/provider calls fail immediately; tests that exercise fetch must mock it.
global.fetch = jest.fn().mockRejectedValue(new Error('External fetch is disabled in unit tests'))
