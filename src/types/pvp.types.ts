/**
 * PvP System Type Definitions
 * Shared types for real-time competitive coding
 */

export type MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'
export type QuestionType = 'multiple_choice' | 'code_challenge' | 'true_false'
export type MatchMode = '1v1' | 'battle_royale'

export interface PvPQuestion {
  id: string
  type: QuestionType
  language_id: string | null
  difficulty: 'easy' | 'medium' | 'hard'

  // Multiple choice fields
  question_text?: string
  options?: Array<{ id: string; text: string }>
  correct_answer?: string

  // Code challenge fields
  problem_title?: string
  problem_description?: string
  starter_code?: string
  test_cases?: Array<{ input: any[]; expected: any }>
  solution_code?: string

  // Metadata
  time_limit: number
  points: number
  tags: string[]

  // Stats
  times_used: number
  average_solve_time?: number

  created_at: string
  updated_at: string
}

export interface PvPMatch {
  id: string
  mode: MatchMode
  status: MatchStatus
  language_id: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  room_code: string

  // Questions
  question_ids: string[]
  current_question_index: number

  // Configuration
  max_players: number
  time_per_question: number

  // Timing
  started_at?: string
  ended_at?: string

  // Winner
  winner_id?: string

  created_at: string
  updated_at: string
}

export interface PvPParticipant {
  id: string
  match_id: string
  user_id: string

  // Status
  is_ready: boolean
  is_connected: boolean

  // Score
  total_score: number
  questions_answered: number
  correct_answers: number

  // Placement
  final_rank?: number

  // Timing
  joined_at: string
  left_at?: string

  // User info (joined from user_profiles)
  display_name?: string
  avatar_url?: string
}

export interface PvPSubmission {
  id: string
  match_id: string
  user_id: string
  question_id: string

  // Submission content
  submission_type: QuestionType

  // For multiple choice
  selected_answer?: string

  // For code challenge
  code?: string
  execution_output?: string
  execution_error?: string
  test_results?: Array<{ passed: boolean; input: any[]; expected: any; actual: any }>

  // Evaluation
  is_correct: boolean
  points_earned: number
  time_taken: number

  // Ranking
  submission_rank?: number

  _correct_answer_id?: string // Internal use for socket feedback

  submitted_at: string
}

export interface PvPReaction {
  id: string
  match_id: string
  user_id: string
  emoji: string
  target_user_id?: string
  created_at: string

  // User info (joined)
  display_name?: string
}

export interface PvPUserStats {
  user_id: string

  // Match stats
  total_matches: number
  matches_won: number
  matches_lost: number

  // Performance
  total_score: number
  average_rank?: number
  best_rank?: number

  // Question stats
  total_questions_answered: number
  correct_answers: number
  accuracy_rate?: number

  // Timing
  average_answer_time?: number
  fastest_answer_time?: number

  // Streaks
  current_win_streak: number
  longest_win_streak: number

  // Rating
  rating: number
  peak_rating: number

  updated_at: string
}

// ============================================================================
// Socket.io Event Payloads
// ============================================================================

export interface SocketUser {
  userId: string
  socketId: string
}

// Client -> Server Events
export interface ClientToServerEvents {
  // Match lifecycle
  'match:join': (matchId: string) => void
  'match:leave': (matchId: string) => void
  'match:ready': (matchId: string) => void

  // Submissions
  'submission:answer': (payload: { matchId: string; questionId: string; answer: string }) => void
  'submission:code': (payload: { matchId: string; questionId: string; code: string }) => void

  // Reactions
  'reaction:send': (payload: { matchId: string; emoji: string; targetUserId?: string }) => void

  // Typing indicator (for code challenges)
  'typing:start': (matchId: string) => void
  'typing:stop': (matchId: string) => void

  // Safety trigger from client when timer reaches 0
  'match:timer_expired': (payload: { matchId: string }) => void
}

// Server -> Client Events
export interface ServerToClientEvents {
  // Match updates
  'match:updated': (match: PvPMatch) => void
  'match:started': (match: PvPMatch) => void
  'match:question_changed': (payload: {
    match: PvPMatch
    question: PvPQuestion
    timeRemaining: number
  }) => void
  'match:completed': (payload: {
    match: PvPMatch
    finalScores: Array<{
      userId: string
      displayName: string
      score: number
      rank: number
    }>
  }) => void
  'match:cooldown': (payload: {
    duration: number
    isMatchOver: boolean
    nextQuestionIndex?: number
  }) => void
  'match:paused': (payload: {
    disconnectedUserId: string
    displayName: string
    timeoutSeconds: number
  }) => void
  'match:resumed': (payload: { reconnectedUserId: string; displayName: string }) => void
  'match:forfeit': (payload: {
    forfeitUserId: string
    displayName: string
    reason: 'disconnect_timeout'
  }) => void

  // Participant updates
  'participant:joined': (participant: PvPParticipant) => void
  'participant:left': (participant: PvPParticipant) => void
  'participant:ready': (participant: PvPParticipant) => void
  'participant:disconnected': (userId: string) => void
  'participant:reconnected': (userId: string) => void

  // Submission updates
  'submission:received': (submission: Omit<PvPSubmission, 'code' | 'selected_answer'>) => void
  'submission:ranked': (payload: {
    userId: string
    questionId: string
    rank: number
    pointsEarned: number
  }) => void
  'submission:feedback': (payload: {
    questionId: string
    correctAnswerId?: string
  }) => void

  // Reactions
  'reaction:received': (reaction: PvPReaction) => void

  // Typing indicators
  'typing:user_started': (payload: { userId: string; displayName: string }) => void
  'typing:user_stopped': (payload: { userId: string }) => void

  // Errors
  error: (error: { message: string; code?: string }) => void
}

// Inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void
}

// Socket data
export interface SocketData {
  userId: string
  matchId?: string
}
