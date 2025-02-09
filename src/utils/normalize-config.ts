import { MockConfig, NormalizedMockConfig } from '../types'

export const DEFAULT_NORMALIZED_MOCK_CONFIG: NormalizedMockConfig = {
  enabled: true,
  delay: 0,
  errorRate: 0,
  headers: {},
  error: undefined,
  getDelay: undefined,
  enableLogging: false
}

export function normalizeMockConfig(config?: Partial<MockConfig>): NormalizedMockConfig {
  return {
    enabled: config?.enabled ?? DEFAULT_NORMALIZED_MOCK_CONFIG.enabled,
    delay: config?.delay ?? DEFAULT_NORMALIZED_MOCK_CONFIG.delay,
    errorRate: config?.errorRate ?? DEFAULT_NORMALIZED_MOCK_CONFIG.errorRate,
    headers: { ...DEFAULT_NORMALIZED_MOCK_CONFIG.headers, ...(config?.headers ?? {}) },
    error: config?.error ?? DEFAULT_NORMALIZED_MOCK_CONFIG.error,
    getDelay: config?.getDelay ?? DEFAULT_NORMALIZED_MOCK_CONFIG.getDelay,
    enableLogging: config?.enableLogging ?? DEFAULT_NORMALIZED_MOCK_CONFIG.enableLogging
  }
}

export function mergeMockConfigs(
  globalConfig: NormalizedMockConfig,
  requestConfig?: boolean | Partial<MockConfig>,
): NormalizedMockConfig {
  if (requestConfig === true) return { ...globalConfig, enabled: true }
  if (typeof requestConfig !== 'object' || requestConfig === null) return globalConfig
  return {
    ...globalConfig,
    ...requestConfig,
    headers: { ...globalConfig.headers, ...(requestConfig.headers ?? {}) },
    enabled: requestConfig.enabled ?? globalConfig.enabled,
    getDelay: requestConfig.getDelay ?? globalConfig.getDelay
  }
}
