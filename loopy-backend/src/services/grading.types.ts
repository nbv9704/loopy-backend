/**
 * Common types for the Auto-Grading System
 *
 * These interfaces are used by all code executor services (JavaScript, Python, C++)
 * to provide consistent execution results.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.3, 2.6
 */

/**
 * ExecutionResult captures the output and metadata from code execution.
 * Used by all language executors to return consistent execution results.
 */
export interface ExecutionResult {
  /** The primary output/return value from the code execution */
  output: any

  /** Standard output stream content (console.log, print, cout, etc.) */
  stdout: string

  /** Standard error stream content (console.error, stderr, etc.) */
  stderr: string

  /** Exit code from the execution (0 = success, non-zero = error) */
  exitCode: number

  /** Execution time in milliseconds */
  executionTime: number

  /** Error message if execution failed, null if successful */
  error: string | null
}

/**
 * CompilationResult is specifically for compiled languages like C++.
 * Captures compilation success/failure before execution.
 */
export interface CompilationResult {
  /** Whether compilation was successful */
  success: boolean

  /** Path to the compiled binary if successful, null if compilation failed */
  binary: string | null

  /** Array of compilation error messages (empty if successful) */
  errors: string[]
}
