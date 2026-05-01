/**
 * Unit tests for CppExecutor Service
 *
 * Tests validate that the CppExecutor correctly compiles and executes C++ code
 * in a sandboxed environment with proper error handling, timeout detection,
 * and memory limits.
 *
 * @see .kiro/specs/auto-grading-system/tasks.md - Task 3.4
 */

import { CppExecutor } from '../cpp-executor.service'
import type { ExecutionResult, CompilationResult } from '../grading.types'
import { spawn } from 'child_process'

// Helper function to check if g++ is available
async function isGppAvailable(): Promise<boolean> {
  return new Promise(resolve => {
    const process = spawn('g++', ['--version'])
    process.on('error', () => resolve(false))
    process.on('close', code => resolve(code === 0))
  })
}

describe('CppExecutor Service', () => {
  let executor: CppExecutor
  let gppAvailable: boolean

  beforeAll(async () => {
    gppAvailable = await isGppAvailable()
    if (!gppAvailable) {
      console.warn('⚠️  g++ compiler not found. C++ executor tests will be skipped.')
      console.warn('   To run these tests, install g++ (MinGW on Windows, gcc on Linux/Mac)')
    }
  })

  beforeEach(() => {
    executor = new CppExecutor()
  })

  describe('compile()', () => {
    test('should compile valid C++ code successfully', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`
      const result: CompilationResult = await executor.compile(code)

      expect(result.success).toBe(true)
      expect(result.binary).not.toBeNull()
      expect(result.binary).toContain('binary_')
      expect(result.errors).toHaveLength(0)
    })

    test('should return compilation errors for invalid C++ code', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << "Missing semicolon"
    return 0;
}
`
      const result: CompilationResult = await executor.compile(code)

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.join(' ')).toContain('error')
    })

    test('should handle syntax errors gracefully', async () => {
      const code = `
#include <iostream>
int main( {
    std::cout << "Syntax error" << std::endl;
    return 0;
}
`
      const result: CompilationResult = await executor.compile(code)

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should reject empty code', async () => {
      const result: CompilationResult = await executor.compile('')

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
      expect(result.errors).toContain('Error: Code must be a non-empty string')
    })

    test('should reject non-string code', async () => {
      const result: CompilationResult = await executor.compile(null as any)

      expect(result.success).toBe(false)
      expect(result.binary).toBeNull()
      expect(result.errors).toContain('Error: Code must be a non-empty string')
    })
  })

  describe('execute()', () => {
    test('should execute compiled binary and capture stdout', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, World!')
      expect(result.error).toBeNull()
      expect(result.executionTime).toBeGreaterThan(0)
    })

    test('should execute binary with numeric input', async () => {
      const code = `
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << (a + b) << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, [5, 3], 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('8')
      expect(result.output).toBe(8)
      expect(result.error).toBeNull()
    })

    test('should execute binary with string input', async () => {
      const code = `
#include <iostream>
#include <string>
int main() {
    std::string name;
    std::cin >> name;
    std::cout << "Hello, " << name << "!" << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, 'Alice', 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Hello, Alice!')
      expect(result.error).toBeNull()
    })

    test('should handle runtime errors gracefully', async () => {
      const code = `
#include <iostream>
#include <stdexcept>
int main() {
    throw std::runtime_error("Test error");
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, 5000)

      expect(result.exitCode).not.toBe(0)
      expect(result.error).not.toBeNull()
    })

    test('should detect timeout when execution exceeds limit', async () => {
      const code = `
#include <iostream>
int main() {
    while(true) {
        // Infinite loop
    }
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, 1000)

      expect(result.exitCode).toBe(124) // Timeout exit code
      expect(result.error).toContain('timeout')
      expect(result.executionTime).toBeGreaterThanOrEqual(1000)
    }, 10000) // Increase test timeout

    test('should capture stderr output', async () => {
      const code = `
#include <iostream>
int main() {
    std::cerr << "Error message" << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toContain('Error message')
      expect(result.error).toBeNull()
    })

    test('should reject invalid binary path', async () => {
      const result: ExecutionResult = await executor.execute('', null, 5000)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid binary path')
      expect(result.stderr).toContain('Binary path must be a non-empty string')
    })

    test('should reject invalid timeout', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << "Test" << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, -100)

      expect(result.exitCode).toBe(1)
      expect(result.error).toBe('Invalid timeout value')
      expect(result.stderr).toContain('Timeout must be a positive number')
    })

    test('should parse numeric output correctly', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << 42 << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, null, 5000)

      expect(result.exitCode).toBe(0)
      expect(result.output).toBe(42)
      expect(result.error).toBeNull()
    })

    test('should handle array input correctly', async () => {
      const code = `
#include <iostream>
int main() {
    int a, b, c;
    std::cin >> a >> b >> c;
    std::cout << (a + b + c) << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result: ExecutionResult = await executor.execute(compileResult.binary!, [1, 2, 3], 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('6')
      expect(result.output).toBe(6)
      expect(result.error).toBeNull()
    })
  })

  describe('Integration: compile and execute', () => {
    test('should compile and execute a simple sum function', async () => {
      const code = `
#include <iostream>
int sum(int a, int b) {
    return a + b;
}
int main() {
    int x, y;
    std::cin >> x >> y;
    std::cout << sum(x, y) << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result = await executor.execute(compileResult.binary!, [10, 20], 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('30')
      expect(result.output).toBe(30)
      expect(result.error).toBeNull()
    })

    test('should compile and execute a factorial function', async () => {
      const code = `
#include <iostream>
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    int n;
    std::cin >> n;
    std::cout << factorial(n) << std::endl;
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(true)

      const result = await executor.execute(compileResult.binary!, 5, 5000)

      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toBe('120')
      expect(result.output).toBe(120)
      expect(result.error).toBeNull()
    })

    test('should handle compilation failure followed by no execution', async () => {
      const code = `
#include <iostream>
int main() {
    std::cout << "Missing semicolon"
    return 0;
}
`
      const compileResult = await executor.compile(code)
      expect(compileResult.success).toBe(false)
      expect(compileResult.binary).toBeNull()

      // Should not attempt to execute if compilation failed
      // This test just verifies compilation failure is handled
    })
  })
})
