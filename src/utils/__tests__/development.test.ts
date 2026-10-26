import { isDevelopmentDatabase, isDevLoginEnabled } from '../development'

describe('development account helpers require an explicitly disposable database', () => {
  const original = { ...process.env }
  afterEach(() => { process.env = { ...original } })
  it.each([
    ['development', undefined, 'true', false, false],
    ['development', 'production', 'true', false, false],
    ['production', 'development', 'true', false, false],
    ['test', 'development', 'true', false, false],
    ['development', 'development', 'false', true, false],
    ['development', 'development', 'true', true, true],
  ])('%s process / %s database / dev login %s', (nodeEnv, kind, enabled, disposable, login) => {
    process.env.NODE_ENV = nodeEnv
    if (kind === undefined) delete process.env.LOOPY_DATABASE_KIND
    else process.env.LOOPY_DATABASE_KIND = kind
    process.env.ENABLE_DEV_LOGIN = enabled
    expect(isDevelopmentDatabase()).toBe(disposable)
    expect(isDevLoginEnabled()).toBe(login)
  })
})
