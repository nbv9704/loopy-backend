/**
 * TestRunnerService for Auto-Grading System
 *
 * Executes test cases against submitted code and calculates test scores.
 * Supports JavaScript, Python, and C++ via respective executors.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8
 */

import { JavaScriptExecutor } from './javascript-executor.service'
import { PistonExecutorService } from './piston-executor.service'
import type { ExecutionResult } from './grading.types'

// ============================================================================
// Types
// ============================================================================

export interface TestCase {
  id: string
  exerciseId: string
  input: unknown
  expectedOutput: unknown
  weight: number // 0-100
  timeout: number // milliseconds
  description: string
  isHidden: boolean
  orderIndex: number
}

export interface TestCaseResult {
  testCaseId: string
  passed: boolean
  actualOutput: unknown
  expectedOutput: unknown
  executionTime: number
  error: string | null
  description: string
}

export interface TestRunResult {
  testScore: number // 0-100
  results: TestCaseResult[]
  totalExecutionTime: number
}

// ============================================================================
// Service
// ============================================================================

export class TestRunnerService {
  private jsExecutor: JavaScriptExecutor
  private pistonExecutor: PistonExecutorService

  constructor() {
    this.jsExecutor = new JavaScriptExecutor()
    this.pistonExecutor = new PistonExecutorService()
  }

  /**
   * Validate a test case configuration
   * Requirement 1.2, 1.6, 1.7
   */
  validateTestCase(testCase: Partial<TestCase>): { valid: boolean; error?: string } {
    if (testCase.weight !== undefined) {
      if (
        typeof testCase.weight !== 'number' ||
        testCase.weight < 0 ||
        testCase.weight > 100 ||
        !Number.isInteger(testCase.weight)
      ) {
        return { valid: false, error: 'Test case weight must be an integer between 0 and 100' }
      }
    }

    if (testCase.timeout !== undefined) {
      if (
        typeof testCase.timeout !== 'number' ||
        testCase.timeout <= 0 ||
        !Number.isInteger(testCase.timeout)
      ) {
        return { valid: false, error: 'Test case timeout must be a positive integer' }
      }
    }

    if (!testCase.description || typeof testCase.description !== 'string') {
      return { valid: false, error: 'Test case description is required' }
    }

    return { valid: true }
  }

  /**
   * Run all test cases against submitted code
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8
   */
  async runTests(code: string, testCases: TestCase[], language: string): Promise<TestRunResult> {
    const startTime = Date.now()
    const results: TestCaseResult[] = []

    // Execute test cases sequentially to prevent resource contention
    for (const testCase of testCases) {
      // Skip invalid test cases (Requirement 14.7)
      const validation = this.validateTestCase(testCase)
      if (!validation.valid) {
        console.warn(`Skipping invalid test case ${testCase.id}: ${validation.error}`)
        continue
      }

      const result = await this.executeTestCase(code, testCase, language)
      results.push(result)
    }

    // Calculate test score as weighted sum (Requirement 2.5)
    const testScore = this.calculateTestScore(results, testCases)

    return {
      testScore,
      results,
      totalExecutionTime: Date.now() - startTime,
    }
  }

  /**
   * Execute a single test case
   */
  private async executeTestCase(
    code: string,
    testCase: TestCase,
    language: string
  ): Promise<TestCaseResult> {
    const startTime = Date.now()

    try {
      // Build executable code that calls the function with test input
      const executableCode = this.buildExecutableCode(code, testCase.input, language)

      // Execute with timeout
      const executionResult = await this.executeCode(
        executableCode,
        testCase.input,
        language,
        testCase.timeout
      )

      // Check for execution errors
      if (executionResult.error) {
        return {
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          expectedOutput: testCase.expectedOutput,
          executionTime: Date.now() - startTime,
          error: executionResult.error,
          description: testCase.description,
        }
      }

      // Compare output (Requirement 2.2)
      const passed = this.deepEqual(executionResult.output, testCase.expectedOutput)

      return {
        testCaseId: testCase.id,
        passed,
        actualOutput: executionResult.output,
        expectedOutput: testCase.expectedOutput,
        executionTime: Date.now() - startTime,
        error: null,
        description: testCase.description,
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error)
      // Handle timeout errors (Requirement 2.4)
      if (errMessage.includes('timeout')) {
        return {
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          expectedOutput: testCase.expectedOutput,
          executionTime: testCase.timeout,
          error: `Execution exceeded timeout of ${testCase.timeout}ms`,
          description: testCase.description,
        }
      }

      return {
        testCaseId: testCase.id,
        passed: false,
        actualOutput: null,
        expectedOutput: testCase.expectedOutput,
        executionTime: Date.now() - startTime,
        error: errMessage || 'Unknown execution error',
        description: testCase.description,
      }
    }
  }

  /**
   * Build executable code that wraps user code with test input
   */
  private buildExecutableCode(code: string, input: unknown, language: string): string {
    switch (language) {
      case 'javascript': {
        // Wrap code to capture the return value of the last defined function
        const inputStr = JSON.stringify(input)

        return `
${code}

// Auto-detect and call the defined function
;(function() {
  const __input = ${inputStr};
  // Find the last defined function in the code
  const __funcNames = Object.keys(this).filter(k => typeof this[k] === 'function');
  if (__funcNames.length > 0) {
    const __fn = this[__funcNames[__funcNames.length - 1]];
    if (Array.isArray(__input)) {
      return __fn(...__input);
    }
    return __fn(__input);
  }
  return undefined;
})();
`
      }

      case 'python': {
        const inputStr = JSON.stringify(input)
        return `
import json

${code}

# Auto-detect and call the last defined function
__input = json.loads('${inputStr.replace(/'/g, "\\'")}')
import types
__funcs = [v for k, v in list(locals().items()) if isinstance(v, types.FunctionType) and not k.startswith('_')]
if __funcs:
    __fn = __funcs[-1]
    if isinstance(__input, list):
        __result = __fn(*__input)
    else:
        __result = __fn(__input)
    print(json.dumps(__result) if __result is not None else 'null')
`
      }

      default:
        return code
    }
  }

  /**
   * Execute code using the appropriate executor
   */
  private async executeCode(
    code: string,
    input: unknown,
    language: string,
    timeout: number
  ): Promise<ExecutionResult> {
    switch (language) {
      case 'javascript':
        return this.jsExecutor.execute(code, input, timeout)

      case 'python':
      case 'cpp':
      case 'c++':
        return this.pistonExecutor.execute(language, code, input, timeout)

      default:
        return {
          output: null,
          stdout: '',
          stderr: `Unsupported language: ${language}`,
          exitCode: 1,
          executionTime: 0,
          error: `Unsupported language: ${language}`,
        }
    }
  }

  /**
   * Calculate test score as weighted sum (Requirement 2.5, 2.7, 2.8)
   * Score = (passed weight / total weight) × 100
   */
  private calculateTestScore(results: TestCaseResult[], testCases: TestCase[]): number {
    if (results.length === 0) return 0

    // Build a map of testCaseId → weight
    const weightMap = new Map<string, number>()
    for (const tc of testCases) {
      weightMap.set(tc.id, tc.weight)
    }

    let totalWeight = 0
    let passedWeight = 0

    for (const result of results) {
      const weight = weightMap.get(result.testCaseId) ?? 0
      totalWeight += weight
      if (result.passed) {
        passedWeight += weight
      }
    }

    if (totalWeight === 0) return 0

    return Math.round((passedWeight / totalWeight) * 100)
  }

  /**
   * Deep equality comparison for test output
   */
  private deepEqual(actual: unknown, expected: unknown): boolean {
    // Handle nulls/undefined
    if (actual === expected) return true
    if (actual === null || expected === null) return false
    if (actual === undefined || expected === undefined) return false

    // Handle numbers (with floating point tolerance)
    if (typeof actual === 'number' && typeof expected === 'number') {
      if (Number.isNaN(actual) && Number.isNaN(expected)) return true
      return Math.abs(actual - expected) < 1e-9
    }

    // Handle strings
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.trim() === expected.trim()
    }

    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false
      return actual.every((item, index) => this.deepEqual(item, expected[index]))
    }

    // Handle objects
    if (typeof actual === 'object' && typeof expected === 'object') {
      const actualKeys = Object.keys(actual).sort()
      const expectedKeys = Object.keys(expected).sort()
      if (actualKeys.length !== expectedKeys.length) return false
      const actualObj = actual as Record<string, unknown>
      const expectedObj = expected as Record<string, unknown>
      return actualKeys.every(
        (key, index) => key === expectedKeys[index] && this.deepEqual(actualObj[key], expectedObj[key])
      )
    }

    // Fallback: coerce to string and compare
    return String(actual).trim() === String(expected).trim()
  }
}

// Export singleton
export const testRunnerService = new TestRunnerService()
