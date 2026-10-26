import { z } from 'zod'

/** REST and socket transports accept the same canonical room reference. */
export const pvpMatchReference = z.union([
  z.guid(),
  z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
])
