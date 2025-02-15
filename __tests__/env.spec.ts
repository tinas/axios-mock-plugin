import { isDevelopment } from '../src/utils/env'

describe('env utils', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('should return true in development', () => {
    process.env.NODE_ENV = 'development'

    expect(isDevelopment()).toBe(true)
  })

  it('should return false in production', () => {
    process.env.NODE_ENV = 'production'

    expect(isDevelopment()).toBe(false)
  })
})
