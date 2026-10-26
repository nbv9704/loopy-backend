import { config } from '../config'

export const getAllowedOrigins = (): string[] => [
  config.frontendUrl,
  ...(config.allowedOrigins || []),
]
