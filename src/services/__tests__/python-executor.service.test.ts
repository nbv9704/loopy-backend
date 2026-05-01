/**
 * Unit tests for PythonExecutor Service
 *
 * Tests validate that the PythonExecutor correctly executes Python code
 * in a sandboxed environment with proper timeout, error handling, and output capture.
 *
 * @see .kiro/specs/auto-grading-system/design.md
 * Validates Requirements: 2.1, 2.4, 2.6, 13.7, 17.2
 */

import { PythonExecutor } from '../python-executor.service'
import type { ExecutionResult } from '../grading.types'

describe('PythonExecutor Service', () => {
  let executor: PythonExecutor

  beforeEach(() => {
    executor = new PythonExecutor()
  })

  describe('Successful Execution', () => {
    it('should execute simple Python code and return result', async () => {
      const code = '2 + 2'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeNull() // exec() returns None for expressions
      expect(result.error).toBeNull()
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('should execute function definition and call', async () => {
      const code = `
def sum(a, b):
    return a + b

result = sum(5, 3)
print(result)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('8')
      expect(result.error).toBeNull()
    })

    it('should execute lambda function', async () => {
      const code = `
multiply = lambda a, b: a * b
result = multiply(4, 5)
print(result)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('20')
      expect(result.error).toBeNull()
    })

    it('should return list output via print', async () => {
      const code = 'print([1, 2, 3, 4, 5])'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('[1, 2, 3, 4, 5]')
      expect(result.error).toBeNull()
    })

    it('should return dict output via print', async () => {
      const code = 'print({"name": "John", "age": 30})'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toContain('name')
      expect(result.stdout.trim()).toContain('John')
      expect(result.error).toBeNull()
    })

    it('should return string output via print', async () => {
      const code = 'print("Hello, World!")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('Hello, World!')
      expect(result.error).toBeNull()
    })

    it('should return boolean output via print', async () => {
      const code = 'print(True and False)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('False')
      expect(result.error).toBeNull()
    })

    it('should return None output via print', async () => {
      const code = 'print(None)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('None')
      expect(result.error).toBeNull()
    })

    it('should handle integer arithmetic', async () => {
      const code = 'print(10 + 20 + 30)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('60')
      expect(result.error).toBeNull()
    })

    it('should handle float arithmetic', async () => {
      const code = 'print(3.14 * 2)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('6.28')
      expect(result.error).toBeNull()
    })
  })

  describe('Console Output Capture', () => {
    it('should capture print output', async () => {
      const code = `
print("Hello")
print("World")
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toContain('Hello')
      expect(result.stdout.trim()).toContain('World')
      expect(result.stderr).toBe('')
      expect(result.error).toBeNull()
    })

    it('should capture stderr output', async () => {
      const code = `
import sys
print("Error message", file=sys.stderr)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toBe('')
      expect(result.stderr.trim()).toBe('Error message')
      expect(result.error).toBeNull()
    })

    it('should capture multiple print statements', async () => {
      const code = `
print("Step 1")
print("Step 2")
print("Step 3")
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Step 1')
      expect(result.stdout).toContain('Step 2')
      expect(result.stdout).toContain('Step 3')
      expect(result.error).toBeNull()
    })

    it('should format lists in print', async () => {
      const code = 'print([1, 2, 3])'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('[1, 2, 3]')
    })

    it('should format dicts in print', async () => {
      const code = 'print({"x": 1, "y": 2})'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toContain('x')
      expect(result.stdout.trim()).toContain('y')
    })

    it('should handle multiple arguments in print', async () => {
      const code = 'print("Value:", 42, "is the answer")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('Value: 42 is the answer')
    })

    it('should handle print with sep parameter', async () => {
      const code = 'print("a", "b", "c", sep="-")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('a-b-c')
    })

    it('should handle print with end parameter', async () => {
      const code = `
print("Hello", end=" ")
print("World")
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('Hello World')
    })
  })

  describe('Syntax Error Handling', () => {
    it('should handle missing colon in function definition', async () => {
      const code = `
def sum(a, b)
    return a + b
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
      expect(result.stderr).toBeTruthy()
    })

    it('should handle invalid indentation', async () => {
      const code = `
def sum(a, b):
return a + b
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })

    it('should handle missing closing parenthesis', async () => {
      const code = 'print("test"'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })

    it('should handle invalid token', async () => {
      const code = 'x = @'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })

    it('should handle unexpected token', async () => {
      const code = 'x = 5 y = 10'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Syntax Error')
    })
  })

  describe('Runtime Error Handling', () => {
    it('should handle name error (undefined variable)', async () => {
      const code = 'print(undefined_variable + 5)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toBeTruthy()
      expect(result.error).toContain('NameError')
    })

    it('should handle type error', async () => {
      const code = 'print(None + 5)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toBeTruthy()
      expect(result.error).toContain('TypeError')
    })

    it('should handle division by zero', async () => {
      const code = 'print(1 / 0)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('ZeroDivisionError')
    })

    it('should handle index error', async () => {
      const code = `
arr = [1, 2, 3]
print(arr[10])
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('IndexError')
    })

    it('should handle key error', async () => {
      const code = `
d = {"a": 1}
print(d["b"])
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('KeyError')
    })

    it('should handle raised exceptions', async () => {
      const code = 'raise Exception("Custom error")'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.output).toBeNull()
      expect(result.error).toContain('Custom error')
    })

    it('should capture print output before error', async () => {
      const code = `
print("Before error")
raise Exception("Test error")
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.stdout.trim()).toBe('Before error')
      expect(result.error).toContain('Test error')
    })

    it('should handle attribute error', async () => {
      const code = `
x = 5
print(x.nonexistent_method())
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(1)
      expect(result.error).toContain('AttributeError')
    })
  })

  describe('Timeout Handling', () => {
    it('should timeout infinite loop', async () => {
      const code = 'while True: pass'
      const result = await executor.execute(code, null, 100)

      expect(result.exitCode).toBe(124) // Standard timeout exit code
      expect(result.output).toBeNull()
      expect(result.error).toContain('timeout')
      expect(result.executionTime).toBeGreaterThanOrEqual(100)
    }, 10000)

    it('should timeout long-running computation', async () => {
      const code = `
sum = 0
for i in range(100000000):
    sum += i
print(sum)
`
      const result = await executor.execute(code, null, 50)

      expect(result.exitCode).toBe(124)
      expect(result.error).toContain('timeout')
    }, 10000)

    it('should not timeout fast execution', async () => {
      const code = `
sum = 0
for i in range(100):
    sum += i
print(sum)
`
      const result = await executor.execute(code, null, 1000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('4950')
      expect(result.error).toBeNull()
      expect(result.executionTime).toBeLessThan(1000)
    })

    it('should respect custom timeout value', async () => {
      const code = 'while True: pass'
      const result = await executor.execute(code, null, 200)

      expect(result.exitCode).toBe(124)
      expect(result.executionTime).toBeGreaterThanOrEqual(200)
      expect(result.error).toContain('200ms')
    }, 10000)
  })

  describe('Input Handling', () => {
    it('should pass input to code execution', async () => {
      const code = 'print(input * 2)'
      const result = await executor.execute(code, 21)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('42')
      expect(result.error).toBeNull()
    })

    it('should handle dict input', async () => {
      const code = 'print(input["x"] + input["y"])'
      const result = await executor.execute(code, { x: 10, y: 20 })

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('30')
      expect(result.error).toBeNull()
    })

    it('should handle list input', async () => {
      const code = 'print(sum(input))'
      const result = await executor.execute(code, [1, 2, 3, 4, 5])

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('15')
      expect(result.error).toBeNull()
    })

    it('should handle null input', async () => {
      const code = 'print(input is None)'
      const result = await executor.execute(code, null)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('True')
      expect(result.error).toBeNull()
    })

    it('should handle string input', async () => {
      const code = 'print(input.upper())'
      const result = await executor.execute(code, 'hello')

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('HELLO')
      expect(result.error).toBeNull()
    })

    it('should handle boolean input', async () => {
      const code = 'print(not input)'
      const result = await executor.execute(code, true)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('False')
      expect(result.error).toBeNull()
    })
  })

  describe('Security and Sandboxing', () => {
    it('should have access to built-in functions', async () => {
      const code = 'print(len([1, 2, 3]))'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('3')
      expect(result.error).toBeNull()
    })

    it('should have access to math operations', async () => {
      const code = 'print(pow(2, 10))'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('1024')
      expect(result.error).toBeNull()
    })

    it('should have access to list methods', async () => {
      const code = `
arr = [1, 2, 3]
arr.append(4)
print(arr)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('[1, 2, 3, 4]')
      expect(result.error).toBeNull()
    })

    it('should have access to string methods', async () => {
      const code = 'print("hello world".title())'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('Hello World')
      expect(result.error).toBeNull()
    })

    it('should have access to dict methods', async () => {
      const code = `
d = {"a": 1, "b": 2}
print(list(d.keys()))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toContain('a')
      expect(result.stdout.trim()).toContain('b')
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
      const result = await executor.execute('print(1 + 1)', null, 0)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid timeout value')
      expect(result.stderr).toContain('positive number')
    })

    it('should reject negative timeout', async () => {
      const result = await executor.execute('print(1 + 1)', null, -100)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid timeout value')
    })
  })

  describe('Execution Time Tracking', () => {
    it('should track execution time for successful execution', async () => {
      const code = 'print(2 + 2)'
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for failed execution', async () => {
      const code = 'print(undefined_variable)'
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for syntax errors', async () => {
      const code = 'x ='
      const result = await executor.execute(code)

      expect(result.executionTime).toBeGreaterThan(0)
      expect(typeof result.executionTime).toBe('number')
    })

    it('should track execution time for timeouts', async () => {
      const code = 'while True: pass'
      const result = await executor.execute(code, null, 100)

      expect(result.executionTime).toBeGreaterThanOrEqual(100)
    }, 10000)
  })

  describe('Complex Code Execution', () => {
    it('should execute function with multiple operations', async () => {
      const code = `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('55')
      expect(result.error).toBeNull()
    })

    it('should execute list comprehension', async () => {
      const code = `
numbers = [1, 2, 3, 4, 5]
result = [n * 2 for n in numbers if n % 2 == 0]
print(sum(result))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('12') // (2 + 4) * 2 = 12
      expect(result.error).toBeNull()
    })

    it('should execute dict manipulation', async () => {
      const code = `
person = {"name": "John", "age": 30}
person["age"] = 31
person["city"] = "NYC"
print(person)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('John')
      expect(result.stdout).toContain('31')
      expect(result.stdout).toContain('NYC')
      expect(result.error).toBeNull()
    })

    it('should execute string manipulation', async () => {
      const code = `
text = "Hello World"
result = "-".join(text.lower().split()[::-1])
print(result)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('world-hello')
      expect(result.error).toBeNull()
    })

    it('should execute class definition and usage', async () => {
      const code = `
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

calc = Calculator()
print(calc.add(5, 3))
print(calc.multiply(4, 5))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('8')
      expect(result.stdout).toContain('20')
      expect(result.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle code with only comments', async () => {
      const code = '# This is a comment\n# Another comment'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should handle very long string output', async () => {
      const code = 'print("x" * 1000)'
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toHaveLength(1000)
      expect(result.error).toBeNull()
    })

    it('should handle nested function calls', async () => {
      const code = `
def outer(x):
    def inner(y):
        return y * 2
    return inner(x) + 1

print(outer(5))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('11')
      expect(result.error).toBeNull()
    })

    it('should handle closures', async () => {
      const code = `
def make_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

counter = make_counter()
print(counter() + counter() + counter())
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('6') // 1 + 2 + 3
      expect(result.error).toBeNull()
    })

    it('should handle generator expressions', async () => {
      const code = `
gen = (x * 2 for x in range(5))
print(list(gen))
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('[0, 2, 4, 6, 8]')
      expect(result.error).toBeNull()
    })

    it('should handle try-except blocks', async () => {
      const code = `
try:
    result = 10 / 0
except ZeroDivisionError:
    result = "Error caught"
print(result)
`
      const result = await executor.execute(code)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('Error caught')
      expect(result.error).toBeNull()
    })
  })
})
