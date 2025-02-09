import { mergeMockConfigs, normalizeMockConfig } from '../src/utils/normalize-config'

describe('normalize config utils', () => {
  it('should return default values', () => {
    const normalizedConfig = normalizeMockConfig()

    expect(normalizedConfig).toEqual({
      enabled: true,
      delay: 0,
      errorRate: 0,
      headers: {},
      error: undefined,
      getDelay: undefined,
      enableLogging: false
    })
  })

  it('should return custom values', () => {
    const normalizedConfig = normalizeMockConfig({
      enabled: false,
      delay: 1000,
      errorRate: 0.5,
      headers: { 'X-Custom-Header': 'custom' },
      error: { status: 500, message: 'Internal Server Error' },
      getDelay: () => 1000,
      enableLogging: true
    })

    expect(normalizedConfig).toEqual({
      enabled: false,
      delay: 1000,
      errorRate: 0.5,
      headers: { 'X-Custom-Header': 'custom' },
      error: { status: 500, message: 'Internal Server Error' },
      getDelay: expect.any(Function),
      enableLogging: true
    })
  })

  it('should merge global and request configs', () => {
    const globalConfig = normalizeMockConfig({
      enabled: false,
      delay: 1000,
      errorRate: 0.5,
      headers: { 'X-Custom-Header': 'global' },
      error: { status: 500, message: 'Internal Server Error' },
      getDelay: () => 1000,
      enableLogging: true
    })

    const requestConfig = {
      enabled: true,
      delay: 2000,
      errorRate: 0.75,
      headers: { 'X-Custom-Header': 'request' },
      error: { status: 404, message: 'Not Found' },
      getDelay: () => 2000,
      enableLogging: false
    }

    const mergedConfig = mergeMockConfigs(globalConfig, requestConfig)

    expect(mergedConfig).toEqual({
      enabled: true,
      delay: 2000,
      errorRate: 0.75,
      headers: { 'X-Custom-Header': 'request' },
      error: { status: 404, message: 'Not Found' },
      getDelay: expect.any(Function),
      enableLogging: false
    })
  })
})
