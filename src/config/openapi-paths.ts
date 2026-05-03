/**
 * Manual OpenAPI paths for key endpoints
 * Quick solution for Swagger documentation
 */

export const openApiPaths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      responses: {
        '200': {
          description: 'Server is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/signup': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignupRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'User created successfully',
        },
        '400': {
          $ref: '#/components/responses/ValidationError',
        },
      },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { type: 'object' },
                      token: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },
  '/api/pvp/matches': {
    post: {
      tags: ['PvP'],
      summary: 'Create a new PvP match',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                mode: { type: 'string', enum: ['1v1', 'battle_royale'] },
                languageId: { type: 'string', format: 'uuid' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Match created successfully',
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
  },
  '/api/pvp/matches/{matchId}': {
    get: {
      tags: ['PvP'],
      summary: 'Get match details',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'matchId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Match details',
        },
        '404': {
          $ref: '#/components/responses/NotFoundError',
        },
      },
    },
  },
  '/api/pvp/matchmaking': {
    post: {
      tags: ['PvP'],
      summary: 'Find or create a match (matchmaking)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                mode: { type: 'string', enum: ['1v1', 'battle_royale'] },
                languageId: { type: 'string', format: 'uuid' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Match found or created',
        },
      },
    },
  },
}
