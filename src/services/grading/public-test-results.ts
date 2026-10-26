function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Historical JSON may lack visibility flags. Only explicitly public runner cases are safe. */
export function toPublicTestResults(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.results)) return null
  return {
    testScore: typeof value.testScore === 'number' ? value.testScore : undefined,
    totalExecutionTime:
      typeof value.totalExecutionTime === 'number' ? value.totalExecutionTime : undefined,
    results: value.results
      .filter(isRecord)
      .filter(result => result.isHidden === false)
      .map(result => ({
        testCaseId: result.testCaseId,
        passed: result.passed,
        actualOutput: result.actualOutput,
        expectedOutput: result.expectedOutput,
        executionTime: result.executionTime,
        error: result.error,
        description: result.description,
        isHidden: false,
      })),
  }
}
