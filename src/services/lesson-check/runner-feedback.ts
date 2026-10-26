import type { TestRunResult } from '../test-runner.service'

/** Never return hidden-case diagnostics, even when code deliberately echoes its input. */
export function toPublicRunnerFeedback(result: TestRunResult) {
  const checks = result.results.map(test => ({
    label: test.isHidden ? 'Kiểm thử ẩn' : test.description || 'Kiểm thử',
    passed: test.passed,
    message: test.isHidden ? undefined : test.error || undefined,
  }))
  const visible = result.results.find(test => !test.isHidden)
  const output = visible
    ? visible.passed
      ? `Output: ${visible.actualOutput}`
      : `Lỗi: ${visible.error || 'Output không khớp với kết quả mong đợi.'}`
    : 'Kết quả kiểm thử ẩn đã được ghi nhận. Hãy xem gợi ý nếu bài chưa đạt.'
  return { checks, output }
}
