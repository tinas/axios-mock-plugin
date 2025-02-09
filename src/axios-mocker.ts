import { AxiosResponse } from 'axios'
import { match } from 'path-to-regexp'

import {
  AxiosRequestConfigWithMock,
  MockConfig,
  MockEndpoint,
  EndpointsMap,
  MockRequest,
  NormalizedMockConfig,
  PreHook,
  PostHook,
  AxiosMockerOptions
} from './types'

import { mergeMockConfigs, normalizeMockConfig } from './utils/normalize-config'
import { createError, createLog, createWarning } from './utils/logger'
import { isDevelopment } from './utils/env'

export class AxiosMocker {
  private config: NormalizedMockConfig
  private endpoints: Map<string, MockEndpoint>
  private preHooks: Array<PreHook>
  private postHooks: Array<PostHook>

  constructor(options?: AxiosMockerOptions) {
    this.config = normalizeMockConfig(options?.config)
    this.endpoints = new Map<string, MockEndpoint>()
    this.preHooks = []
    this.postHooks = []
    this.loadEndpoints(options?.endpoints)
  }

  private loadEndpoints(endpoints?: EndpointsMap): void {
    if (!endpoints) return
    if (endpoints instanceof Map) {
      for (const [key, handler] of endpoints.entries()) {
        this.addEndpoint(key, handler)
      }
    } else if (typeof endpoints === 'object') {
      for (const key of Object.keys(endpoints)) {
        this.addEndpoint(key, endpoints[key])
      }
    } else if (isDevelopment()) {
      createWarning('Invalid endpoints map. Expected Map or object.')
    }
  }

  public clearEndpoints(): void {
    this.endpoints.clear()
  }

  public setEndpoints(endpoints: EndpointsMap): void {
    this.clearEndpoints()
    this.loadEndpoints(endpoints)
  }

  public addEndpoints(endpoints: EndpointsMap): void {
    this.loadEndpoints(endpoints)
  }

  public addEndpoint(endpoint: string, handler: MockEndpoint): void {
    if (isDevelopment() && this.endpoints.has(endpoint))
      createWarning(`Duplicate endpoint: ${endpoint}`)

    this.endpoints.set(endpoint, handler)
  }

  public removeEndpoint(endpoint: string): void {
    this.endpoints.delete(endpoint)
  }

  public listEndpoints(): string[] {
    return [...this.endpoints.keys()]
  }

  public getConfig(): NormalizedMockConfig {
    return this.config
  }

  public updateConfig(config: Partial<MockConfig>): void {
    this.config = normalizeMockConfig(config)
  }

  public addPreHook(hook: (request: MockRequest) => void | Promise<void>): void {
    this.preHooks.push(hook)
  }

  public addPostHook(hook: (res: AxiosResponse) => void | Promise<void>): void {
    this.postHooks.push(hook)
  }

  public async handleRequest(axiosConfig: AxiosRequestConfigWithMock): Promise<AxiosResponse> {
    const mergedConfig = mergeMockConfigs(this.config, axiosConfig.mock)

    if (!mergedConfig.enabled) {
      createError(`Mocking is disabled for this request: ${axiosConfig.url}`)
    }

    if (mergedConfig.error && typeof mergedConfig.error === 'object') {
      const { message, status = 500 } = mergedConfig.error
      createError(`${message} (status: ${status})`)
    }

    if (mergedConfig.errorRate > 0 && Math.random() < mergedConfig.errorRate) {
      createError('Random mock error (status: 500)')
    }

    const method = (axiosConfig.method || 'GET').toUpperCase()
    const url = axiosConfig.url || ''
    let path = url
    if (axiosConfig.baseURL && url.startsWith(axiosConfig.baseURL)) {
      path = url.slice(axiosConfig.baseURL.length)
    }

    let matchedKey: string | undefined = undefined
    let parameters: Record<string, string> = {}
    for (const [key] of this.endpoints) {
      const [endpointMethod, endpointPath] = key.split(' ')
      if (endpointMethod.toUpperCase() !== method) continue
      try {
        const matcher = match(endpointPath, { decode: decodeURIComponent })
        const result = matcher(path)
        if (result) {
          matchedKey = key
          parameters = result.params as Record<string, string>
          break
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `The endpoint "${method} ${path}" is invalid.`
        createError(`Path matching failed: ${errorMessage}`)
      }
    }

    if (!matchedKey) {
      createError(`No mock endpoint found for "${method} ${path}"`)
    }

    const delay = mergedConfig.getDelay && typeof mergedConfig.getDelay === 'function'
      ? mergedConfig.getDelay(axiosConfig, matchedKey)
      : mergedConfig.delay

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    const mockRequest: MockRequest = {
      params: parameters,
      query: (axiosConfig.params as Record<string, unknown>) || {},
      body: typeof axiosConfig.data === 'string' ? JSON.parse(axiosConfig.data) : axiosConfig.data
    }

    if (mergedConfig.enableLogging) {
      createLog(
        `Mock Request: Received ${method} request for "${axiosConfig.url}".` +
        `Processed path: "${path}". Matched endpoint: "${matchedKey}". ` +
        `Extracted parameters: ${JSON.stringify(parameters)}.`
      )
    }

    for (const hook of this.preHooks) {
      await hook(mockRequest, axiosConfig)
    }

    let responseData: unknown
    try {
      const handler = this.endpoints.get(matchedKey)!
      responseData = await handler(mockRequest, axiosConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      createError(`Handler for ${matchedKey} failed: ${errorMessage}`)
    }

    const response: AxiosResponse = {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: mergedConfig.headers,
      config: axiosConfig
    }

    for (const hook of this.postHooks) {
      await hook(response, axiosConfig)
    }

    if (mergedConfig.enableLogging) {
      createLog(
        `Mock Response: For endpoint "${matchedKey}", returning response: ${JSON.stringify(responseData)}.`
      )
    }

    return response
  }
}
