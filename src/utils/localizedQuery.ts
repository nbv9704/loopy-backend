import { SupportedLanguage } from './language'

/**
 * Configuration for a database field indicating whether it's translatable.
 *
 * Used to specify which fields should use language-specific columns and COALESCE fallback.
 *
 * @property field - The base field name (e.g., 'title', 'description')
 * @property translatable - Whether this field has language-specific columns (e.g., title_en)
 *
 * @example
 * const fields: LocalizedFieldConfig[] = [
 *   { field: 'id', translatable: false },        // Non-translatable: always use 'id'
 *   { field: 'title', translatable: true },      // Translatable: use 'title' or 'title_en'
 *   { field: 'icon', translatable: false },      // Non-translatable: always use 'icon'
 *   { field: 'description', translatable: true } // Translatable: use 'description' or 'description_en'
 * ];
 */
export interface LocalizedFieldConfig {
  field: string
  translatable: boolean
}

/**
 * Builds a SQL SELECT clause with localized field selection.
 *
 * For Vietnamese queries: Returns direct column selection (e.g., "title, description")
 * For English queries: Returns COALESCE pattern for translatable fields (e.g., "COALESCE(title_en, title) as title")
 * Non-translatable fields are always selected directly regardless of language.
 *
 * @param fields - Array of field configurations specifying which fields are translatable
 * @param language - Target language ('vi' or 'en')
 * @returns SQL SELECT clause string
 *
 * @example
 * // Vietnamese query
 * buildLocalizedSelect([
 *   { field: 'id', translatable: false },
 *   { field: 'title', translatable: true }
 * ], 'vi');
 * // Returns: "id, title"
 *
 * @example
 * // English query
 * buildLocalizedSelect([
 *   { field: 'id', translatable: false },
 *   { field: 'title', translatable: true }
 * ], 'en');
 * // Returns: "id, COALESCE(title_en, title) as title"
 */
export function buildLocalizedSelect(
  fields: LocalizedFieldConfig[],
  language: SupportedLanguage
): string {
  // Track seen fields to handle duplicates - use the first occurrence's translatable setting
  const seenFields = new Map<string, boolean>()

  return fields
    .filter(({ field }) => {
      if (seenFields.has(field)) {
        return false // Skip duplicate fields
      }
      seenFields.set(field, true)
      return true
    })
    .map(({ field, translatable }) => {
      if (!translatable) {
        return field
      }

      if (language === 'vi') {
        return field
      }

      // For English, use COALESCE to fallback to Vietnamese
      return `COALESCE(${field}_en, ${field}) as ${field}`
    })
    .join(', ')
}

/**
 * Returns the appropriate column name for a field based on the language.
 *
 * For Vietnamese: Returns the base field name
 * For English: Returns the field name with _en suffix
 *
 * @param field - Base field name
 * @param language - Target language ('vi' or 'en')
 * @returns Column name for the specified language
 *
 * @example
 * getLocalizedFieldName('title', 'vi'); // Returns: "title"
 * getLocalizedFieldName('title', 'en'); // Returns: "title_en"
 */
export function getLocalizedFieldName(field: string, language: SupportedLanguage): string {
  return language === 'en' ? `${field}_en` : field
}

/**
 * Builds a COALESCE expression for a translatable field.
 *
 * For Vietnamese: Returns the base field name (no COALESCE needed)
 * For English: Returns COALESCE expression that falls back to Vietnamese
 *
 * @param field - Base field name
 * @param language - Target language ('vi' or 'en')
 * @returns SQL expression for the field
 *
 * @example
 * buildCoalesceExpression('title', 'vi'); // Returns: "title"
 * buildCoalesceExpression('title', 'en'); // Returns: "COALESCE(title_en, title)"
 */
export function buildCoalesceExpression(field: string, language: SupportedLanguage): string {
  if (language === 'vi') {
    return field
  }
  return `COALESCE(${field}_en, ${field})`
}
