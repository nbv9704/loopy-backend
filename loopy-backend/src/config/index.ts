import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Code Execution
  codeExecution: {
    timeout: parseInt(process.env.CODE_EXECUTION_TIMEOUT || '5000', 10),
    maxLength: parseInt(process.env.MAX_CODE_LENGTH || '10000', 10),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // Increased for development
    codeExecutionLimit: parseInt(process.env.RATE_LIMIT_CODE_EXECUTION || '500', 10), // Increased for development
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // Default 5 minutes, set to 0 for development
  },

  // Swagger API Documentation
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV === 'development',
    requireAuth:
      process.env.SWAGGER_REQUIRE_AUTH === 'true' || process.env.NODE_ENV === 'production',
    includeDebug:
      process.env.SWAGGER_INCLUDE_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  },

  // Admin Dashboard Configuration
  admin: {
    sessionSecret: process.env.ADMIN_SESSION_SECRET || 'loopy-admin-secret-change-in-production',
    sessionMaxAge: parseInt(process.env.ADMIN_SESSION_MAX_AGE || '28800000', 10), // 8 hours default
  },

  // Gemini AI Configuration (Auto-Grading System)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '2048', 10),
  },

  // Redis Configuration (optional, for grading cache)
  redis: {
    url: process.env.REDIS_URL || '',
  },

  // Piston API Configuration
  piston: {
    apiUrl: process.env.PISTON_API_URL || '',
    apiKey: process.env.PISTON_API_KEY || '',
  },

  // Glot.io API Configuration (temporary fallback runner)
  glot: {
    apiUrl: process.env.GLOT_API_URL || 'https://glot.io/api/run',
    apiToken: process.env.GLOT_API_TOKEN || '',
  },
} as const

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

if (config.nodeEnv === 'production') {
  if (!process.env.ADMIN_SESSION_SECRET) {
    throw new Error('ADMIN_SESSION_SECRET must be set in production')
  }
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL must be set in production')
  }
}
