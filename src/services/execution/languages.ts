import { config } from '../../config'
import { errors } from '../../middleware/errorHandler'
import { RunnerUnavailableError } from './errors'

export const PISTON_LANGUAGE_CONFIG = {
  python: { pistonLanguage: 'python', filename: 'main.py' },
  cpp: { pistonLanguage: 'cpp', filename: 'main.cpp' },
  java: { pistonLanguage: 'java', filename: 'Main.java' },
  go: { pistonLanguage: 'go', filename: 'main.go' },
  rust: { pistonLanguage: 'rust', filename: 'main.rs' },
} as const
export type PistonLanguageId = keyof typeof PISTON_LANGUAGE_CONFIG
export const PISTON_LANGUAGE_ALIASES: Record<string, PistonLanguageId> = {
  python: 'python',
  py: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
}
export const normalizePistonLanguage = (language: string): PistonLanguageId | null =>
  Object.prototype.hasOwnProperty.call(PISTON_LANGUAGE_ALIASES, language.toLowerCase())
    ? PISTON_LANGUAGE_ALIASES[language.toLowerCase()]
    : null
export const isPistonLanguage = (language: string) => normalizePistonLanguage(language) !== null

export function selectExecutionRunner(language: string): 'local' | 'piston' | 'glot' {
  if (language === 'javascript' || language === 'js') return 'local'
  if (!isPistonLanguage(language)) throw errors.badRequest('Ngôn ngữ chưa được hỗ trợ chạy thử.')
  if (config.piston.apiUrl) return 'piston'
  if (config.glot.enabled) return 'glot'
  throw new RunnerUnavailableError(
    'Runner cho ngôn ngữ này chưa sẵn sàng. Bạn có thể chọn JavaScript để chạy thử.'
  )
}

export function executionCapabilities() {
  const external = config.piston.apiUrl ? 'piston' : config.glot.enabled ? 'glot' : null
  return Object.fromEntries(
    ['javascript', ...Object.keys(PISTON_LANGUAGE_CONFIG)].map(language => [
      language,
      {
        supported: language === 'javascript' || external !== null,
        runner: language === 'javascript' ? 'local' : external,
        requiresRunner: language !== 'javascript',
        reason:
          language === 'javascript' || external
            ? null
            : 'Runner cho ngôn ngữ này chưa sẵn sàng. Hãy chọn JavaScript hoặc thử lại sau.',
      },
    ])
  )
}
