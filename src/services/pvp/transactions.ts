import { z } from 'zod'
import { supabaseAdmin } from '../../db/supabase'
import { AppError, errors } from '../../middleware/errorHandler'
import type { PvPParticipant, PvPSubmission } from '../../types/pvp.types'

type Procedure =
  | 'matchmake_pvp_atomically'
  | 'join_pvp_match_atomically'
  | 'ready_pvp_match_atomically'
  | 'disconnect_pvp_participant'
  | 'finish_pvp_match_atomically'
  | 'submit_pvp_answer_atomically'
  | 'set_pvp_question_phase'

const id = z.string().min(1)
const count = z.number().int().nonnegative()
const optionalText = z
  .string()
  .nullish()
  .transform(value => value ?? undefined)
const optionalCount = count.nullish().transform(value => value ?? undefined)
const participant = z.object({
  id,
  match_id: id,
  user_id: id,
  is_ready: z
    .boolean()
    .nullish()
    .transform(value => value ?? false),
  is_connected: z.boolean(),
  total_score: count.nullish().transform(value => value ?? 0),
  questions_answered: count.nullish().transform(value => value ?? 0),
  correct_answers: count.nullish().transform(value => value ?? 0),
  final_rank: optionalCount,
  joined_at: id,
  left_at: optionalText,
})
const submission = z.object({
  id,
  match_id: id,
  user_id: id,
  question_id: id,
  submission_type: z.enum(['multiple_choice', 'true_false', 'code_challenge']),
  is_correct: z.boolean(),
  points_earned: count,
  time_taken: count,
  submission_rank: optionalCount,
  submitted_at: id,
  _replayed: z.boolean(),
  _question_index: count,
  _participant_count: count,
  _submission_count: count,
  _correct_answer_id: optionalText,
})
const match = z.object({
  id,
  room_code: z.string().regex(/^[A-Z0-9]{6}$/),
  mode: z.enum(['1v1', 'battle_royale']),
  status: z.enum(['waiting', 'starting', 'in_progress', 'completed', 'cancelled']),
  language_id: z.string().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_ids: z.array(id).min(1),
  current_question_index: count,
  max_players: z.number().int().min(2).max(10),
  time_per_question: z.number().int().positive(),
  started_at: optionalText,
  ended_at: optionalText,
  winner_id: optionalText,
  created_at: id,
  updated_at: id,
  participants: z.array(participant),
})
const matchmaking = z.object({ match, participant, created: z.boolean(), replayed: z.boolean() })
const phase = z.discriminatedUnion('changed', [
  z.object({ changed: z.literal(false) }),
  z.object({ changed: z.literal(true), started_at: z.string().datetime({ offset: true }) }),
])

/** One boundary for privileged PvP RPC errors and runtime result validation. No fallback writes. */
async function execute<T>(
  name: Procedure,
  args: Record<string, unknown>,
  schema: z.ZodType<T>
): Promise<T> {
  const { data, error } = await supabaseAdmin.rpc(name, args)
  if (error) {
    if (['PGRST202', '42883'].includes(error.code))
      throw new AppError(503, 'SCHEMA_NOT_READY', 'Phòng PvP tạm thời chưa sẵn sàng.')
    if (error.code === '42501') throw errors.forbidden()
    if (error.code === 'P0002') throw errors.notFound('Match or question')
    if (error.code === 'P0511')
      throw new AppError(
        409,
        'PVP_NO_QUESTIONS',
        'Chưa có bộ câu hỏi phù hợp. Hãy thử độ khó khác hoặc quay lại sau.'
      )
    if (['22023', '22P02'].includes(error.code)) {
      if (name === 'submit_pvp_answer_atomically')
        throw new AppError(400, 'VALIDATION_ERROR', 'Câu hỏi đã đóng hoặc đáp án không hợp lệ.')
      throw new AppError(
        400,
        'PVP_TRANSITION_REJECTED',
        error.code === '22023' ? error.message : 'Phòng PvP không hợp lệ.'
      )
    }
    throw errors.databaseError('Không lưu được trạng thái PvP. Vui lòng thử lại.')
  }
  const parsed = schema.safeParse(data)
  if (!parsed.success)
    throw errors.databaseError('Không xác nhận được kết quả PvP. Vui lòng thử lại.')
  return parsed.data
}

const actorArgs = (matchId: string, userId: string) => ({ p_match_id: matchId, p_actor_id: userId })
export const pvpTransactions = {
  async matchmake(
    userId: string,
    selection: {
      mode?: '1v1' | 'battle_royale'
      language_id?: string
      difficulty?: 'easy' | 'medium' | 'hard'
    }
  ) {
    const result = await execute(
      'matchmake_pvp_atomically',
      {
        p_actor_id: userId,
        p_mode: selection.mode || '1v1',
        p_language_id: selection.language_id || null,
        p_difficulty: selection.difficulty || 'medium',
      },
      matchmaking
    )
    if (
      result.participant.user_id !== userId ||
      result.participant.match_id !== result.match.id ||
      !result.match.participants.some(
        player => player.id === result.participant.id && player.user_id === userId
      ) ||
      result.match.participants.some(player => player.match_id !== result.match.id) ||
      result.match.participants.length > result.match.max_players ||
      result.match.current_question_index >= result.match.question_ids.length
    )
      throw errors.databaseError('Không xác nhận được phòng PvP. Vui lòng thử lại.')
    return result
  },
  join(matchId: string, userId: string): Promise<PvPParticipant> {
    return execute('join_pvp_match_atomically', actorArgs(matchId, userId), participant)
  },
  async ready(matchId: string, userId: string): Promise<boolean> {
    const result = await execute(
      'ready_pvp_match_atomically',
      actorArgs(matchId, userId),
      z.object({ started: z.boolean() })
    )
    return result.started
  },
  disconnect(matchId: string, userId: string) {
    return execute(
      'disconnect_pvp_participant',
      actorArgs(matchId, userId),
      z.object({ changed: z.boolean(), status: z.string().optional() })
    )
  },
  finish(matchId: string, forfeitActor?: string) {
    return execute(
      'finish_pvp_match_atomically',
      { p_match_id: matchId, p_forfeit_actor: forfeitActor || null },
      z.object({ changed: z.boolean(), forfeited: z.boolean() })
    )
  },
  submit(
    matchId: string,
    userId: string,
    questionId: string,
    payload: Record<string, unknown>
  ): Promise<PvPSubmission> {
    return execute(
      'submit_pvp_answer_atomically',
      { ...actorArgs(matchId, userId), p_question_id: questionId, p_payload: payload },
      submission
    )
  },
  setPhase(matchId: string, index: number, open: boolean) {
    return execute(
      'set_pvp_question_phase',
      { p_match_id: matchId, p_question_index: index, p_open: open },
      phase
    )
  },
}
