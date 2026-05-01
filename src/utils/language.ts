import { Request } from 'express'

/**
 * Supported languages for the Loopy platform
 */
export type SupportedLanguage = 'vi' | 'en'

/**
 * List of all supported language codes
 */
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['vi', 'en']

/**
 * Default language for the platform (Vietnamese)
 */
const DEFAULT_LANGUAGE: SupportedLanguage = 'vi'

/**
 * Detects the user's preferred language from the request.
 *
 * Priority order:
 * 1. Query parameter (?lang=en or ?lang=vi)
 * 2. Accept-Language header
 * 3. User session (if authenticated)
 * 4. Default to Vietnamese
 *
 * @param req - Express request object
 * @returns The detected language code ('vi' or 'en')
 *
 * @example
 * // With query parameter
 * const lang = detectLanguage(req); // ?lang=en -> 'en'
 *
 * @example
 * // With Accept-Language header
 * const lang = detectLanguage(req); // Accept-Language: en-US -> 'en'
 */
export function detectLanguage(req: Request): SupportedLanguage {
  // Priority 1: Query parameter
  const queryLang = req.query.lang as string
  if (queryLang && isValidLanguage(queryLang)) {
    return queryLang
  }

  // Priority 2: Accept-Language header
  const acceptLang = req.headers['accept-language']
  if (acceptLang) {
    // Check if English is preferred
    if (acceptLang.includes('en')) {
      return 'en'
    }
    // Check if Vietnamese is preferred
    if (acceptLang.includes('vi')) {
      return 'vi'
    }
  }

  // Priority 3: User session (if authenticated)
  const user = (req as any).user
  if (user?.preferredLanguage && isValidLanguage(user.preferredLanguage)) {
    return user.preferredLanguage
  }

  // Priority 4: Default to Vietnamese
  return DEFAULT_LANGUAGE
}

/**
 * Validates if a language code is supported.
 *
 * @param lang - Language code to validate
 * @returns True if the language is supported, false otherwise
 *
 * @example
 * isValidLanguage('en'); // true
 * isValidLanguage('fr'); // false
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
}

/**
 * Returns the default language for the platform.
 *
 * @returns The default language code ('vi')
 *
 * @example
 * const defaultLang = getDefaultLanguage(); // 'vi'
 */
export function getDefaultLanguage(): SupportedLanguage {
  return DEFAULT_LANGUAGE
}
