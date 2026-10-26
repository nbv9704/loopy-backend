import { validateRules, ValidationRules } from '../validators/rule-validator'

describe('deterministic rules', () => {
  it.each([
    {}, { exact: '' }, { regex: '  ' }, { required: [], forbidden: [] },
    { checks: [{ label: 'Checklist without a predicate' }] },
    { checks: [{ label: 'Empty', required: [''] }] },
    { required: 'print' }, { required: [''] }, { forbidden: [null] },
    { unknown: 'ignored condition' }, null, [],
  ])('fails closed for missing or malformed configuration: %j', rules => {
    const result = validateRules('anything', rules as unknown as ValidationRules, 'javascript')
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.checks).toEqual([expect.objectContaining({ passed: false })])
  })

  it.each([
    { exact: 'console.log(1)' }, { regex: '^console\\.log\\(1\\)$' },
    { required: ['console.log'] }, { forbidden: ['eval('] },
    { checks: [{ label: 'Print', required: ['console.log'] }] },
    { required: [], checks: [{ label: 'Print', required: ['console.log'] }] },
  ])('keeps configured predicates working: %j', rules => {
    expect(validateRules('console.log(1)', rules, 'javascript').passed).toBe(true)
  })

  it('requires both top-level and checklist predicates to pass', () => {
    const result = validateRules('console.log(1)', {
      forbidden: ['console'], checks: [{ label: 'Print', required: ['console.log'] }],
    }, 'javascript')
    expect(result.passed).toBe(false)
  })

  it('rejects invalid regex and mismatching predicates', () => {
    for (const rules of [{ regex: '[' }, { exact: 'other' }, { required: ['missing'] }, { forbidden: ['console'] }]) {
      expect(validateRules('console.log(1)', rules, 'javascript').passed).toBe(false)
    }
  })
})
