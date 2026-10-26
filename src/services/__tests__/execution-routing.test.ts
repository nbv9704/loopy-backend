import { config } from '../../config'
import {
  executionCapabilities,
  normalizePistonLanguage,
  selectExecutionRunner,
} from '../execution/languages'
jest.mock('../../config', () => ({ config: { piston: { apiUrl: '' }, glot: { enabled: false, apiToken: '' } } }))
afterEach(() => jest.restoreAllMocks())
it('advertises unavailable external runners without implying an unconfigured provider exists', () => {
  expect(executionCapabilities().javascript).toMatchObject({ supported: true, runner: 'local' })
  expect(executionCapabilities().python).toMatchObject({ supported: false, runner: null })
  expect(() => selectExecutionRunner('python')).toThrow(
    expect.objectContaining({ statusCode: 503 })
  )
})
it('uses the same configured provider in capability metadata and execution selection', () => {
  jest.replaceProperty(config.glot, 'enabled', true)
  expect(executionCapabilities().python.runner).toBe('glot')
  expect(selectExecutionRunner('py')).toBe('glot')
  jest.replaceProperty(config.piston, 'apiUrl', 'https://runner.invalid')
  expect(executionCapabilities().python.runner).toBe('piston')
  expect(selectExecutionRunner('python')).toBe('piston')
})
it('normalizes only explicit aliases, including hostile prototype property names', () => {
  expect(normalizePistonLanguage('C++')).toBe('cpp')
  expect(normalizePistonLanguage('__proto__')).toBeNull()
  expect(normalizePistonLanguage('constructor')).toBeNull()
  expect(() => selectExecutionRunner('unsupported')).toThrow(
    expect.objectContaining({ statusCode: 400 })
  )
})
