/**
 * Unit tests for JavaScriptExecutor Service
 *
 * Tests validate that the JavaScriptExecutor correctly executes JavaScript code
 * in a sandboxed environment with proper timeout, error handling, and output capture.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.4, 2.6, 13.7, 17.1
 */

import { JavaScriptExecutor } from '../javascript-executor.service'
import type { ExecutionResult } from '../grading.types'

describe('JavaScriptExecutor Service', () => {
  let executor: JavaScriptExecutor

  beforeEach(() => {
    executor = new JavaScriptExecutor()
  })

  describe('Successful Execution', () => {
    it('should execute simple JavaScript code and return result', async () => {
      const code = '2 + 2'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(4)
      expect(result.error).toBeNull()
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should execute function definition and return function', async () => {
      const code = 'function sum(a, b) { return a + b }; sum(5, 3)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(8)
      expect(result.error).toBeNull()
    })

    it('should execute arrow function', async () => {
      const code = 'const multiply = (a, b) => a * b; multiply(4, 5)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(20)
      expect(result.error).toBeNull()
    })

    it('should return array output', async () => {
      const code = '[1, 2, 3, 4, 5]'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(Array.isArray(result.output)).toBe(true)
      expect(result.output).toEqual([1, 2, 3, 4, 5])
      expect(result.error).toBeNull()
    })

    it('should return object output', async () => {
      const code = '({ name: "John", age: 30 })'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toEqual({ name: 'John', age: 30 })
      expect(result.error).toBeNull()
    })

    it('should return string output', async () => {
      const code = '"Hello, World!"'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('Hello, World!')
      expect(result.error).toBeNull()
    })

    it('should return boolean output', async () => {
      const code = 'true && false'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(false)
      expect(result.error).toBeNull()
    })

    it('should return null output', async () => {
      const code = 'null'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should return undefined output', async () => {
      const code = 'undefined'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeUndefined()
      expect(result.error).toBeNull()
    })
  })

  describe('Console Output Capture', () => {
    it('should capture console.log output', async () => {
      const code = 'console.log("Hello"); console.log("World"); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.stdout).toBe('Hello\nWorld')
      expect(result.stderr).toBe('')
      expect(result.error).toBeNull()
    })

    it('should capture console.error output', async () => {
      const code = 'console.error("Error message"); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.stdout).toBe('')
      expect(result.stderr).toBe('Error message')
      expect(result.error).toBeNull()
    })

    it('should capture console.warn output', async () => {
      const code = 'console.warn("Warning message"); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.stderr).toContain('Warning: Warning message')
      expect(result.error).toBeNull()
    })

    it('should capture console.info output', async () => {
      const code = 'console.info("Info message"); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.stdout).toBe('Info message')
      expect(result.error).toBeNull()
    })

    it('should capture multiple console outputs', async () => {
      const code = `
        console.log("Step 1");
        console.log("Step 2");
        console.error("Error in step 3");
        console.log("Step 4");
        "done"
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('done')
      expect(result.stdout).toBe('Step 1\nStep 2\nStep 4')
      expect(result.stderr).toBe('Error in step 3')
      expect(result.error).toBeNull()
    })

    it('should format objects in console.log', async () => {
      const code = 'console.log({ x: 1, y: 2 }); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('"x"')
      expect(result.stdout).toContain('"y"')
    })

    it('should format arrays in console.log', async () => {
      const code = 'console.log([1, 2, 3]); 42'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('[1,2,3]')
    })

    it('should handle multiple arguments in console.log', async () => {
      const code = 'console.log("Value:", 42, "is the answer"); 1'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('Value: 42 is the answer')
    })
  })

  describe('Syntax Error Handling', () => {
    it('should handle missing closing brace', async () => {
      const code = 'function sum(a, b) { return a + b'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
      expect(result.stderr).toBeTruthy()
    })

    it('should handle missing closing parenthesis', async () => {
      const code = 'console.log("test"'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })

    it('should handle invalid token', async () => {
      const code = 'const x = @'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })

    it('should handle unexpected token', async () => {
      const code = 'const x = 5 const y = 10'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })
  })

  describe('Runtime Error Handling', () => {
    it('should handle reference error', async () => {
      const code = 'undefinedVariable + 5'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toBeTruthy()
      expect(result.error).toContain('undefinedVariable')
    })

    it('should handle type error', async () => {
      const code = 'null.toString()'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should handle division by zero (returns Infinity)', async () => {
      const code = '1 / 0'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(Infinity)
      expect(result.error).toBeNull()
    })

    it('should handle array index out of bounds (returns undefined)', async () => {
      const code = 'const arr = [1, 2, 3]; arr[10]'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeUndefined()
      expect(result.error).toBeNull()
    })

    it('should handle thrown errors', async () => {
      const code = 'throw new Error("Custom error")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Custom error')
    })

    it('should capture console output before error', async () => {
      const code = `
        console.log("Before error");
        throw new Error("Test error");
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe('Before error')
      expect(result.error).toContain('Test error')
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout infinite loop', async () => {
      const code = 'while(true) {}'
      const result = await executor.execute(code, null, 100)

      expect(result.exitCode).toBe(124) // Standard timeout exit code
      expect(result.output).toBeNull()
      expect(result.error).toContain('timeout')
      expect(result.executionTime).toBeGreaterThanOrEqual(100)
    })

    it('should timeout long-running computation', async () => {
      const code = `
        let sum = 0;
        for (let i = 0; i < 1000000000; i++) {
          sum += i;
        }
        sum
      `
      const result = await executor.execute(code, null, 50)

      expect(result.exitCode).toBe(124)
      expect(result.error).toContain('timeout')
    })

    it('should not timeout fast execution', async () => {
      const code = 'let sum = 0; for (let i = 0; i < 100; i++) { sum += i }; sum'
      const result = await executor.execute(code, null, 1000)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(4950)
      expect(result.error).toBeNull()
      expect(result.executionTime).toBeLessThan(1000)
    })

    it('should respect custom timeout value', async () => {
      const code = 'while(true) {}'
      const result = await executor.execute(code, null, 200)

      expect(result.exitCode).toBe(124)
      expect(result.executionTime).toBeGreaterThanOrEqual(200)
      expect(result.error).toContain('200ms')
    })
  })

  describe('Input Handling', () => {
    it('should pass input to code execution', async () => {
      const code = 'input * 2'
      const result = await executor.execute(code, 21)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.error).toBeNull()
    })

    it('should handle object input', async () => {
      const code = 'input.x + input.y'
      const result = await executor.execute(code, { x: 10, y: 20 })

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(30)
      expect(result.error).toBeNull()
    })

    it('should handle array input', async () => {
      const code = 'input.reduce((sum, n) => sum + n, 0)'
      const result = await executor.execute(code, [1, 2, 3, 4, 5])

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(15)
      expect(result.error).toBeNull()
    })

    it('should handle null input', async () => {
      const code = 'input === null'
      const result = await executor.execute(code, null)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle undefined input', async () => {
      const code = 'typeof input'
      const result = await executor.execute(code, undefined)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('object') // undefined becomes null in sandbox
      expect(result.error).toBeNull()
    })
  })

  describe('Security and Sandboxing', () => {
    it('should not have access to require', async () => {
      const code = 'require("fs")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBeTruthy()
    })

    it('should not have access to process', async () => {
      const code = 'process.exit(0)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBeTruthy()
    })

    it('should have limited global access (vm2 provides safe global)', async () => {
      const code = 'typeof global'
      const result = await executor.execute(code)

      // vm2 provides a safe global object, which is expected behavior
      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('object')
    })

    it('should have access to Math', async () => {
      const code = 'Math.sqrt(16)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(4)
      expect(result.error).toBeNull()
    })

    it('should have access to JSON', async () => {
      const code = 'JSON.stringify({ x: 1 })'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('{"x":1}')
      expect(result.error).toBeNull()
    })

    it('should have access to Array methods', async () => {
      const code = '[1, 2, 3].map(x => x * 2)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toEqual([2, 4, 6])
      expect(result.error).toBeNull()
    })
  })

  describe('Input Validation', () => {
    it('should reject empty code', async () => {
      const result = await executor.execute('')

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid code input')
      expect(result.stderr).toContain('non-empty string')
    })

    it('should reject whitespace-only code', async () => {
      const result = await executor.execute('   \n  \t  ')

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid code input')
    })

    it('should reject non-string code', async () => {
      const result = await executor.execute(null as any)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid code input')
    })

    it('should reject zero timeout', async () => {
      const result = await executor.execute('1 + 1', null, 0)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid timeout value')
      expect(result.stderr).toContain('positive number')
    })

    it('should reject negative timeout', async () => {
      const result = await executor.execute('1 + 1', null, -100)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid timeout value')
    })
  })

  describe('Execution Time Tracking', () => {
    it('should track execution time for successful execution', async () => {
      const code = '2 + 2'
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for failed execution', async () => {
      const code = 'undefinedVariable'
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for syntax errors', async () => {
      const code = 'const x ='
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for timeouts', async () => {
      const code = 'while(true) {}'
      const result = await executor.execute(code, null, 100)

      expect(result.executionTime).toBeGreaterThanOrEqual(100)
    })
  })

  describe('Complex Code Execution', () => {
    it('should execute function with multiple operations', async () => {
      const code = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        fibonacci(10)
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(55)
      expect(result.error).toBeNull()
    })

    it('should execute array manipulation', async () => {
      const code = `
        const numbers = [1, 2, 3, 4, 5];
        numbers
          .filter(n => n % 2 === 0)
          .map(n => n * 2)
          .reduce((sum, n) => sum + n, 0)
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(12) // (2 + 4) * 2 = 12
      expect(result.error).toBeNull()
    })

    it('should execute object manipulation', async () => {
      const code = `
        const person = { name: "John", age: 30 };
        const updated = { ...person, age: 31, city: "NYC" };
        updated
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toEqual({ name: 'John', age: 31, city: 'NYC' })
      expect(result.error).toBeNull()
    })

    it('should execute string manipulation', async () => {
      const code = `
        const text = "Hello World";
        text.toLowerCase().split(' ').reverse().join('-')
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe('world-hello')
      expect(result.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle code with only comments', async () => {
      const code = '// This is a comment\n/* Another comment */'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeUndefined()
      expect(result.error).toBeNull()
    })

    it('should handle very long string output', async () => {
      const code = '"x".repeat(1000)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toHaveLength(1000)
      expect(result.error).toBeNull()
    })

    it('should handle nested function calls', async () => {
      const code = `
        function outer(x) {
          function inner(y) {
            return y * 2;
          }
          return inner(x) + 1;
        }
        outer(5)
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(11)
      expect(result.error).toBeNull()
    })

    it('should handle closures', async () => {
      const code = `
        function makeCounter() {
          let count = 0;
          return function() {
            return ++count;
          };
        }
        const counter = makeCounter();
        counter() + counter() + counter()
      `
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(6) // 1 + 2 + 3
      expect(result.error).toBeNull()
    })
  })
})
