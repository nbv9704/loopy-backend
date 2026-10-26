// NODE_ENV describes the process, not whether the connected database is disposable.
export const isDevelopmentDatabase = () => process.env.NODE_ENV === 'development'
  && process.env.LOOPY_DATABASE_KIND === 'development'

export const isDevLoginEnabled = () => isDevelopmentDatabase()
  && process.env.ENABLE_DEV_LOGIN === 'true'
