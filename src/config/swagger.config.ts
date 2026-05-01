import { Options } from 'swagger-jsdoc'
import { config } from './index'
import { generateSchemasFromZod } from '../utils/swaggerHelpers'

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loopy API',
      version: '1.0.0',
      description: 'Interactive multi-language coding playground API for Vietnamese developers',
      contact: {
        name: 'Loopy Team',
        url: 'https://loopy.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production' ? 'https://api.loopy.com' : 'http://localhost:3000',
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /api/auth/login endpoint',
        },
      },
      schemas: {
        // Auto-generated schemas from Zod validation schemas
        ...generateSchemasFromZod(),
        // Manually defined schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                message: {
                  type: 'string',
                },
                details: {
                  type: 'object',
                },
              },
              required: ['code', 'message'],
            },
          },
          required: ['success', 'error'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: {
                    email: 'Email không hợp lệ',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          headers: {
            'X-RateLimit-Limit': {
              schema: {
                type: 'integer',
              },
              description: 'Request limit per time window',
            },
            'X-RateLimit-Remaining': {
              schema: {
                type: 'integer',
              },
              description: 'Remaining requests in current window',
            },
            'X-RateLimit-Reset': {
              schema: {
                type: 'integer',
              },
              description: 'Time when rate limit resets (Unix timestamp)',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Languages',
        description: 'Programming language information',
      },
      {
        name: 'Chapters',
        description: 'Learning chapter management',
      },
      {
        name: 'Lessons',
        description: 'Lesson content and structure',
      },
      {
        name: 'Exercises',
        description: 'Coding exercises and challenges',
      },
      {
        name: 'Progress',
        description: 'User learning progress tracking',
      },
      {
        name: 'Code Execution',
        description: 'In-browser code execution',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
      {
        name: 'Content Management',
        description: 'Public content retrieval',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (requires admin role)',
      },
    ],
  },
  apis: ['./src/routes/*.routes.ts'],
}
