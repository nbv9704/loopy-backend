import { AIAnalyzerService, type AIAnalysisParams } from '../ai-analyzer.service'
import { GradingCacheService } from '../grading-cache.service'
import { GroqAnalyzerService } from '../groq-analyzer.service'
import { buildGradingPrompt, buildHintPrompt } from '../ai-prompt-builder'
import { confirmAIHint } from '../ai-hint-response'

jest.mock('../../db/supabase', () => ({
  supabaseAdmin: { from: () => ({ insert: jest.fn().mockResolvedValue({ error: null }) }) },
}))
jest.mock('../groq-analyzer.service', () => ({
  GroqAnalyzerService: jest.fn(),
  groqAnalyzerService: {},
}))
const params: AIAnalysisParams = {
  code: 'console.log(1)',
  language: 'javascript',
  exerciseTitle: 'Same title',
  exerciseQuestion: 'Task A',
  starterCode: '// start',
  lessonInsight: 'A',
}

it('includes the persisted task in grading and hint prompts, including the hint language', () => {
  expect(buildGradingPrompt(params)).toContain('Task A')
  expect(buildHintPrompt(params)).toContain('Task A')
  expect(buildHintPrompt(params)).toContain('javascript')
})
it.each([null, {}, { hint: false }, { hint: ' ' }, { hint: 'x'.repeat(2001) }])(
  'does not fabricate a hint from malformed provider output (%j)',
  value => {
    expect(() => confirmAIHint(value)).toThrow()
  }
)
it('normalizes a valid hint', () =>
  expect(confirmAIHint({ hint: '  Think?  ' })).toEqual({ hint: 'Think?' }))
it('isolates cached analysis after task, insight, source, starter, language and depth changes', async () => {
  const cache = new GradingCacheService()
  const analyzeCode = jest.fn().mockResolvedValue({ aiScore: 80 })
  const analyzer = new AIAnalyzerService(cache, {
    canAnalyze: () => true,
    analyzeCode,
  } as unknown as GroqAnalyzerService)
  try {
    await analyzer.analyzeCode(params)
    await analyzer.analyzeCode({ ...params })
    expect(analyzeCode).toHaveBeenCalledTimes(1)
    for (const change of [
      { exerciseQuestion: 'Task B' },
      { lessonInsight: 'B' },
      { code: 'console.log(2)' },
      { starterCode: '// other' },
      { language: 'python' },
      { gradingDepth: 'thorough' as const },
    ])
      await analyzer.analyzeCode({ ...params, ...change })
    expect(analyzeCode).toHaveBeenCalledTimes(7)
    expect(analyzeCode.mock.calls[1][1]).toContain('Task B')
  } finally {
    await cache.disconnect()
  }
})
it('does not collide when input strings contain the old cache delimiter', async () => {
  const cache = new GradingCacheService()
  try {
    expect(cache.generateCacheKey('a:b', 'c', 'd')).not.toBe(
      cache.generateCacheKey('a', 'b:c', 'd')
    )
  } finally {
    await cache.disconnect()
  }
})
