interface CategorizedContent {
  key: string
  content_categories?: unknown
}

/** Namespace owns its public key: nav.logout belongs to category nav.
 * Keep unique legacy keys readable; unresolved duplicates remain conflicts.
 */
export function selectPublicContent<T extends CategorizedContent>(key: string, rows: T[]) {
  const separator = key.indexOf('.')
  const namespace = separator > 0 ? key.slice(0, separator) : null
  const owned = namespace
    ? rows.filter(row => {
        const category = row.content_categories
        return (
          category &&
          typeof category === 'object' &&
          'name' in category &&
          category.name === namespace
        )
      })
    : []
  const candidates = owned.length ? owned : rows
  return {
    item: candidates.length === 1 ? candidates[0] : null,
    ambiguous: candidates.length > 1,
  }
}
