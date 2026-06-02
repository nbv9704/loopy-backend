import { normalizeCode } from './normalize-code'

export interface SubCheck {
  label: string
  regex?: string
  exact?: string
  required?: string[]
  forbidden?: string[]
  message?: string
  passed?: boolean
}

export interface ValidationRules {
  exact?: string
  regex?: string
  required?: string[]
  forbidden?: string[]
  checks?: SubCheck[]
}

export interface ValidationResult {
  passed: boolean
  score: number
  checks: Array<{
    label: string
    passed: boolean
    message?: string
  }>
}

/**
 * Validate code against deterministic rules.
 */
export function validateRules(
  code: string,
  rules: ValidationRules,
  language: string
): ValidationResult {
  const normalized = normalizeCode(code, language)
  const checks: Array<{ label: string; passed: boolean; message?: string }> = []
  let overallPassed = true

  // Helper to validate a single rule set
  const checkRuleMatch = (
    c: string,
    norm: string,
    exactVal?: string,
    regexVal?: string,
    reqVal?: string[],
    forbVal?: string[]
  ): { passed: boolean; message?: string } => {
    // 1. Exact Match Check (on normalized code)
    if (exactVal) {
      const normExact = normalizeCode(exactVal, language)
      if (norm !== normExact) {
        return { 
          passed: false, 
          message: `Code does not match the expected pattern.` 
        }
      }
    }

    // 2. Regex Check
    if (regexVal) {
      try {
        const re = new RegExp(regexVal)
        // Check raw code first, if fails try normalized code
        if (!re.test(c) && !re.test(norm)) {
          return { 
            passed: false, 
            message: `Code does not match the required regex pattern.` 
          }
        }
      } catch (err) {
        return { 
          passed: false, 
          message: `Invalid regex rule configuration.` 
        }
      }
    }

    // 3. Required Tokens Check
    if (reqVal && reqVal.length > 0) {
      for (const token of reqVal) {
        if (!c.includes(token) && !norm.includes(token)) {
          return { 
            passed: false, 
            message: `Missing required keyword/symbol: "${token}"` 
          }
        }
      }
    }

    // 4. Forbidden Tokens Check
    if (forbVal && forbVal.length > 0) {
      for (const token of forbVal) {
        if (c.includes(token) || norm.includes(token)) {
          return { 
            passed: false, 
            message: `Used forbidden keyword/symbol: "${token}"` 
          }
        }
      }
    }

    return { passed: true }
  }

  // A. Check top-level rules if present
  const topLevelResult = checkRuleMatch(
    code,
    normalized,
    rules.exact,
    rules.regex,
    rules.required,
    rules.forbidden
  )

  if (!topLevelResult.passed) {
    overallPassed = false
  }

  // B. Process granular sub-checks if present
  if (rules.checks && rules.checks.length > 0) {
    for (const sub of rules.checks) {
      const subResult = checkRuleMatch(
        code,
        normalized,
        sub.exact,
        sub.regex,
        sub.required,
        sub.forbidden
      )

      checks.push({
        label: sub.label,
        passed: subResult.passed,
        message: subResult.passed ? undefined : sub.message || subResult.message,
      })

      if (!subResult.passed) {
        overallPassed = false
      }
    }
  } else {
    // If no granular sub-checks are defined, create a default checklist item
    checks.push({
      label: 'Kiểm tra cú pháp và yêu cầu bài học',
      passed: topLevelResult.passed,
      message: topLevelResult.message,
    })
  }

  return {
    passed: overallPassed,
    score: overallPassed ? 100 : 0,
    checks,
  }
}
