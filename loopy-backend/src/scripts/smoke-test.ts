import { testRunnerService } from '../services/test-runner.service'
import { JavaScriptExecutor } from '../services/javascript-executor.service'
import { PistonExecutorService } from '../services/piston-executor.service'
import { config } from '../config'
import { logger } from '../utils/logger'

async function runSmokeTests() {
  logger.info('🚀 Starting Smoke Tests for Auto-Grading & Execution Logic')
  let failures = 0

  try {
    // 1. Test JavaScript execution
    logger.info('--- 1. Testing JavaScript Executor ---')
    const jsExecutor = new JavaScriptExecutor()
    const jsResult = await jsExecutor.execute('console.log("Hello JS"); 42;', undefined, 1000)
    if (jsResult.stdout.trim() === 'Hello JS' && jsResult.output === 42 && !jsResult.error) {
      logger.info('✅ JavaScript Executor: OK')
    } else {
      logger.error('❌ JavaScript Executor: FAILED', jsResult)
      failures++
    }

    // 2. Test Python execution
    logger.info('--- 2. Testing Python Executor ---')
    if (!config.piston.apiUrl) {
      logger.info('ℹ️ PISTON_API_URL is not configured. Skipping Python, C++, and Piston-backed TestRunner smoke tests.')
      logger.info('ℹ️ This is expected for the cost-free MVP: Learn uses deterministic lesson checks, not live Python/C++ execution.')
    } else {
    const pistonExecutor = new PistonExecutorService()
    const pyResult = await pistonExecutor.execute('python', 'print("Hello Python")\n', undefined, 1000)
    
    const isPistonUnauthorized = pyResult.stderr.includes('401') || (pyResult.error && pyResult.error.includes('401'))

    if (isPistonUnauthorized) {
      logger.warn('⚠️ Piston API returned 401 Unauthorized. Access is now whitelist-only since Feb 2026.')
      logger.warn('⚠️ Self-hosting Piston or setting PISTON_API_KEY / PISTON_API_URL in .env is required for Python/C++ code execution.')
      logger.info('ℹ️ Skipping Python & C++ tests (these require a valid self-hosted Piston URL or API key).')
    } else {
      if (pyResult.stdout.trim() === 'Hello Python' && !pyResult.error) {
        logger.info('✅ Python Executor: OK')
      } else {
        logger.error('❌ Python Executor: FAILED', pyResult)
        failures++
      }

      // 3. Test C++ execution
      logger.info('--- 3. Testing C++ Executor ---')
      const cppCode = `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello C++";
    return 0;
}`
      const cppResult = await pistonExecutor.execute('cpp', cppCode, undefined, 2000)
      if (cppResult.stdout.trim() === 'Hello C++' && !cppResult.error) {
        logger.info('✅ C++ Executor: OK')
      } else {
        logger.error('❌ C++ Executor: FAILED', cppResult)
        failures++
      }

      // 4. Test TestRunnerService (stdout grading mode)
      logger.info('--- 4. Testing TestRunner (stdout grading mode) ---')
      const testCasesStdout = [{
        id: 'tc1',
        exerciseId: 'ex1',
        input: [],
        expectedOutput: 'Hello',
        weight: 100,
        timeout: 1000,
        description: 'Test stdout',
        isHidden: false,
        orderIndex: 1
      }]
      const trResultStdout = await testRunnerService.runTests('print("Hello")', testCasesStdout, 'python', 'stdout')
      if (trResultStdout.testScore === 100) {
        logger.info('✅ TestRunner (stdout): OK')
      } else {
        logger.error('❌ TestRunner (stdout): FAILED', trResultStdout)
        failures++
      }

      // 5. Test TestRunnerService (function grading mode)
      logger.info('--- 5. Testing TestRunner (function grading mode) ---')
      const testCasesFunc = [{
        id: 'tc2',
        exerciseId: 'ex2',
        input: [5, 3],
        expectedOutput: 8,
        weight: 100,
        timeout: 1000,
        description: 'Test function',
        isHidden: false,
        orderIndex: 1
      }]
      const funcCode = `
def add(a, b):
    return a + b
`
      const trResultFunc = await testRunnerService.runTests(funcCode, testCasesFunc, 'python', 'function')
      if (trResultFunc.testScore === 100) {
        logger.info('✅ TestRunner (function): OK')
      } else {
        logger.error('❌ TestRunner (function): FAILED', trResultFunc)
        failures++
      }
    }
    }

    if (failures > 0) {
      logger.error(`❌ Smoke tests completed with ${failures} failure(s).`)
      process.exitCode = 1
    } else {
      logger.info('🎉 Smoke tests completed.')
    }
  } catch (err) {
    logger.error('❌ Smoke tests failed with exception:', err)
    process.exitCode = 1
  }
}

runSmokeTests()
