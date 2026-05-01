/**
 * Unit tests for Auto-Grading System common types
 *
 * Tests validate that ExecutionResult and CompilationResult interfaces
 * meet the requirements specified in the design document.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.3, 2.6
 */

import type { ExecutionResult, CompilationResult } from '../grading.types'

describe('Auto-Grading System Types', () => {
  describe('ExecutionResult Interface', () => {
    it('should accept valid ExecutionResult with all required fields', () => {
      const result: ExecutionResult = {
        output: 42,
        stdout: 'Hello, World!',
        stderr: '',
        exitCode: 0,
        executionTime: 150,
        error: null,
      }

      expect(result.output).toBe(42)
      expect(result.stdout).toBe('Hello, World!')
      expect(result.stderr).toBe('')
      expect(result.exitCode).toBe(0)
      expect(result.executionTime).toBe(150)
      expect(result.error).toBeNull()
    })

    it('should accept ExecutionResult with error', () => {
      const result: ExecutionResult = {
        output: null,
        stdout: '',
        stderr: 'ReferenceError: x is not defined',
        exitCode: 1,
        executionTime: 50,
        error: 'ReferenceError: x is not defined',
      }

      expect(result.error).toBe('ReferenceError: x is not defined')
      expect(result.exitCode).toBe(1)
    })

    it('should accept ExecutionResult with complex output types', () => {
      const arrayResult: ExecutionResult = {
        output: [1, 2, 3, 4, 5],
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 100,
        error: null,
      }

      const objectResult: ExecutionResult = {
        output: { name: 'John', age: 30 },
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 100,
        error: null,
      }

      expect(Array.isArray(arrayResult.output)).toBe(true)
      expect(typeof objectResult.output).toBe('object')
    })

    it('should accept ExecutionResult with stdout and stderr content', () => {
      const result: ExecutionResult = {
        output: 'result',
        stdout: 'Processing...\nDone!',
        stderr: 'Warning: deprecated function',
        exitCode: 0,
        executionTime: 200,
        error: null,
      }

      expect(result.stdout).toContain('Processing')
      expect(result.stderr).toContain('Warning')
    })

    it('should track execution time in milliseconds', () => {
      const result: ExecutionResult = {
        output: 'test',
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 1500,
        error: null,
      }

      expect(result.executionTime).toBe(1500)
      expect(typeof result.executionTime).toBe('number')
    })
  })

  describe('CompilationResult Interface', () => {
    it('should accept successful CompilationResult', () => {
      const result: CompilationResult = {
        success: true,
        binary: '/tmp/compiled_program_12345',
        errors: [],
      }

      expect(result.success).toBe(true)
      expect(result.binary).toBe('/tmp/compiled_program_12345')
      expect(result.errors).toHaveLength(0)
    })

    it('should accept failed CompilationResult with errors', () => {
      const result: CompilationResult = {
        success: false,
        binary: null,
        errors: [
          "error: expected ';' before '}' token",
          "error: 'x' was not declared in this scope",
        ],
      }

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('expected')
    })

    it('should accept CompilationResult with multiple compilation errors', () => {
      const result: CompilationResult = {
        success: false,
        binary: null,
        errors: [
          'main.cpp:5:10: error: use of undeclared identifier',
          'main.cpp:8:15: error: expected expression',
          'main.cpp:12:1: error: expected }',
        ],
      }

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.every(err => typeof err === 'string')).toBe(true)
    })

    it('should have null binary when compilation fails', () => {
      const result: CompilationResult = {
        success: false,
        binary: null,
        errors: ['Compilation failed'],
      }

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
    })

    it('should have non-null binary when compilation succeeds', () => {
      const result: CompilationResult = {
        success: true,
        binary: '/tmp/output.exe',
        errors: [],
      }

      expect(result.success).toBe(true)
      expect(result.binary).not.toBeNull()
      expect(typeof result.binary).toBe('string')
    })
  })

  describe('Type Consistency', () => {
    it('should ensure ExecutionResult fields have correct types', () => {
      const result: ExecutionResult = {
        output: 'any type',
        stdout: 'string',
        stderr: 'string',
        exitCode: 0,
        executionTime: 100,
        error: null,
      }

      expect(typeof result.stdout).toBe('string')
      expect(typeof result.stderr).toBe('string')
      expect(typeof result.exitCode).toBe('number')
      expect(typeof result.executionTime).toBe('number')
      expect(result.error === null || typeof result.error === 'string').toBe(true)
    })

    it('should ensure CompilationResult fields have correct types', () => {
      const result: CompilationResult = {
        success: true,
        binary: '/path/to/binary',
        errors: [],
      }

      expect(typeof result.success).toBe('boolean')
      expect(result.binary === null || typeof result.binary === 'string').toBe(true)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle ExecutionResult with empty strings', () => {
      const result: ExecutionResult = {
        output: '',
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 0,
        error: null,
      }

      expect(result.stdout).toBe('')
      expect(result.stderr).toBe('')
      expect(result.executionTime).toBe(0)
    })

    it('should handle ExecutionResult with very long execution time', () => {
      const result: ExecutionResult = {
        output: 'timeout',
        stdout: '',
        stderr: '',
        exitCode: 124,
        executionTime: 5000,
        error: 'Execution timeout',
      }

      expect(result.executionTime).toBe(5000)
      expect(result.error).toContain('timeout')
    })

    it('should handle CompilationResult with empty errors array on success', () => {
      const result: CompilationResult = {
        success: true,
        binary: '/tmp/program',
        errors: [],
      }

      expect(result.errors).toEqual([])
      expect(result.errors.length).toBe(0)
    })

    it('should handle ExecutionResult with undefined output', () => {
      const result: ExecutionResult = {
        output: undefined,
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 50,
        error: null,
      }

      expect(result.output).toBeUndefined()
    })
  })
})
