/**
 * Code Normalizer Helper
 * Standardizes source code for deterministic validation by stripping comments and excessive whitespaces.
 */
export function normalizeCode(code: string, language: string): string {
  if (!code) return ''

  let normalized = code

  // 1. Remove comments based on language
  if (language === 'javascript' || language === 'cpp' || language === 'c++') {
    // Remove multi-line comments /* ... */
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single-line comments // ...
    normalized = normalized.replace(/\/\/.*$/gm, '')
  } else if (language === 'python') {
    // Remove single-line comments # ...
    normalized = normalized.replace(/#.*$/gm, '')
    // Note: multi-line strings used as comments (triple quotes) are left as-is 
    // unless they are isolated, but usually simple regex handles them.
  }

  // 2. Normalize whitespace
  return normalized
    .split('\n')
    .map(line => line.trim()) // Trim whitespaces from both ends of each line
    .filter(line => line.length > 0) // Remove empty lines
    .join('\n')
}
