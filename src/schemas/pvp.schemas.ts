import { z } from 'zod'

/**
 * PvP System Validation Schemas
 * Request validation for PvP endpoints
 */

// ============================================================================
// Question Schemas
// ============================================================================

export const pvpSchemas = {
  // Create match
  createMatch: z.object({
    body: z.object({
      mode: z.enum(['1v1', 'battle_royale']).default('1v1'),
      language_id: z.string().optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      max_players: z.number().int().min(2).max(10).default(2),
      time_per_question: z.number().int().min(30).max(600).default(300),
      question_count: z.number().int().min(1).max(10).default(5),
    }),
  }),

  // Join match
  joinMatch: z.object({
    params: z.object({
      matchId: z.string().min(6, 'Invalid match ID or room code'),
    }),
  }),

  // Get match details
  getMatch: z.object({
    params: z.object({
      matchId: z.string().min(6, 'Invalid match ID or room code'),
    }),
  }),

  // Submit answer (multiple choice)
  submitAnswer: z.object({
    params: z.object({
      matchId: z.string().uuid('Invalid match ID'),
    }),
    body: z.object({
      question_id: z.string().uuid('Invalid question ID'),
      selected_answer: z.string().min(1, 'Answer is required'),
    }),
  }),

  // Submit code
  submitCode: z.object({
    params: z.object({
      matchId: z.string().uuid('Invalid match ID'),
    }),
    body: z.object({
      question_id: z.string().uuid('Invalid question ID'),
      code: z.string().min(1, 'Code is required').max(10000, 'Code is too long'),
    }),
  }),

  // Get match history
  getMatchHistory: z.object({
    query: z.object({
      limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(100))
        .optional()
        .default('10'),
      offset: z
        .string()
        .transform(Number)
        .pipe(z.number().int().nonnegative())
        .optional()
        .default('0'),
    }),
  }),

  // Get user stats
  getUserStats: z.object({
    params: z.object({
      userId: z.string().uuid('Invalid user ID').optional(),
    }),
  }),

  // Get leaderboard
  getLeaderboard: z.object({
    query: z.object({
      limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(100))
        .optional()
        .default('50'),
      sort_by: z.enum(['rating', 'matches_won', 'accuracy_rate']).optional().default('rating'),
    }),
  }),

  // Find match (matchmaking)
  findMatch: z.object({
    body: z.object({
      language_id: z.string().optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      mode: z.enum(['1v1', 'battle_royale']).default('1v1'),
    }),
  }),

  // Send reaction
  sendReaction: z.object({
    params: z.object({
      matchId: z.string().uuid('Invalid match ID'),
    }),
    body: z.object({
      emoji: z.string().min(1).max(10),
      target_user_id: z.string().uuid('Invalid user ID').optional(),
    }),
  }),

  // Admin: Create question
  createQuestion: z.object({
    body: z
      .object({
        type: z.enum(['multiple_choice', 'code_challenge']),
        language_id: z.string().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']),

        // Multiple choice fields
        question_text: z.string().optional(),
        options: z
          .array(
            z.object({
              id: z.string(),
              text: z.string(),
            })
          )
          .optional(),
        correct_answer: z.string().optional(),

        // Code challenge fields
        problem_title: z.string().optional(),
        problem_description: z.string().optional(),
        starter_code: z.string().optional(),
        test_cases: z
          .array(
            z.object({
              input: z.array(z.any()),
              expected: z.any(),
            })
          )
          .optional(),
        solution_code: z.string().optional(),

        // Metadata
        time_limit: z.number().int().min(10).max(600).default(300),
        points: z.number().int().min(10).max(1000).default(100),
        tags: z.array(z.string()).default([]),
      })
      .refine(
        data => {
          if (data.type === 'multiple_choice') {
            return (
              data.question_text &&
              data.options &&
              data.options.length >= 2 &&
              data.correct_answer
            )
          }
          return true
        },
        {
          message: 'Multiple choice questions require question_text, options, and correct_answer',
        }
      )
      .refine(
        data => {
          if (data.type === 'code_challenge') {
            return (
              data.problem_title &&
              data.problem_description &&
              data.test_cases &&
              data.test_cases.length > 0
            )
          }
          return true
        },
        {
          message:
            'Code challenges require problem_title, problem_description, and at least one test case',
        }
      ),
  }),

  // Admin: Update question
  updateQuestion: z.object({
    params: z.object({
      questionId: z.string().uuid('Invalid question ID'),
    }),
    body: z.object({
      question_text: z.string().optional(),
      options: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
          })
        )
        .optional(),
      correct_answer: z.string().optional(),
      problem_title: z.string().optional(),
      problem_description: z.string().optional(),
      starter_code: z.string().optional(),
      test_cases: z
        .array(
          z.object({
            input: z.array(z.any()),
            expected: z.any(),
          })
        )
        .optional(),
      solution_code: z.string().optional(),
      time_limit: z.number().int().min(10).max(600).optional(),
      points: z.number().int().min(10).max(1000).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  // Admin: Delete question
  deleteQuestion: z.object({
    params: z.object({
      questionId: z.string().uuid('Invalid question ID'),
    }),
  }),
}
