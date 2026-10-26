import { z } from 'zod'
import { pvpMatchReference } from '../../schemas/pvp-values'
const matchId = z.guid()
const questionId = z.guid()
export const pvpSocketSchemas = {
  room: pvpMatchReference,
  matchId,
  answer: z.object({ matchId, questionId, answer: z.string().trim().min(1).max(5000) }),
  code: z.object({
    matchId,
    questionId,
    code: z
      .string()
      .min(1)
      .max(10000)
      .refine(value => Boolean(value.trim())),
  }),
  reaction: z.object({
    matchId,
    emoji: z.string().trim().min(1).max(10),
    targetUserId: z.guid().optional(),
  }),
}

/** Validate before I/O. Serialize room lifecycle commands; ignore queued work after disconnect. */
export function createPvPSocketBoundary({
  emitError,
  currentRoom,
  isStopping,
  now = Date.now,
}: {
  emitError: (message: string) => void
  currentRoom: () => string | undefined
  isStopping: () => boolean
  now?: () => number
}) {
  let active = true
  let lifecycle = Promise.resolve()
  let pending = 0
  let tokens = 40
  let refilledAt = now()
  let lastError = -Infinity
  const groups = new Map<string, number>()
  const notify = (message: string) => {
    const time = now()
    if (time - lastError < 1000) return
    lastError = time
    emitError(message)
  }
  return {
    close: () => {
      active = false
    },
    bind<T>(
      schema: z.ZodType<T>,
      handler: (payload: T) => Promise<void>,
      options: {
        serial?: boolean
        room?: (payload: T) => string
        group?: string
        minIntervalMs?: number
      } = {}
    ) {
      const inFlight = new Set<string>()
      let lastAccepted = -Infinity
      return async (payload: unknown): Promise<void> => {
        if (!active || isStopping()) return
        const time = now()
        tokens = Math.min(40, tokens + Math.max(0, time - refilledAt) * 0.02)
        refilledAt = time
        if (tokens < 1) {
          notify('Thao tác PvP quá nhanh. Hãy chờ một chút rồi thử lại.')
          return
        }
        --tokens
        const parsed = schema.safeParse(payload)
        if (!parsed.success) {
          notify('Dữ liệu PvP không hợp lệ. Vui lòng thử lại.')
          return
        }
        const key = JSON.stringify(parsed.data)
        if (inFlight.has(key) || time - lastAccepted < (options.minIntervalMs ?? 0)) return
        if (pending >= 8 || (options.group && groups.has(options.group))) {
          notify('Đang xử lý thao tác PvP trước đó. Hãy chờ xác nhận rồi thử lại.')
          return
        }
        ++pending
        inFlight.add(key)
        lastAccepted = time
        if (options.group) groups.set(options.group, 1)
        const perform = async () => {
          if (!active || isStopping()) return
          if (options.room && options.room(parsed.data) !== currentRoom()) {
            notify('Bạn chưa kết nối vào phòng PvP này.')
            return
          }
          try {
            await handler(parsed.data)
          } catch {
            if (active && !isStopping()) notify('Không thể xử lý thao tác PvP. Vui lòng thử lại.')
          }
        }
        try {
          if (options.serial) {
            lifecycle = lifecycle.then(perform, perform)
            await lifecycle
          } else await perform()
        } finally {
          --pending
          inFlight.delete(key)
          if (options.group) groups.delete(options.group)
        }
      }
    },
  }
}
