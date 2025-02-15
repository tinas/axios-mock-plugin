import { AxiosResponse } from 'axios'
import { match } from 'path-to-regexp'

import {
  AxiosRequestConfigWithMock,
  MockEndpoint,
  EndpointsMap,
  MockRequest,
  InternalMockOptions,
  RequestHook,
  ResponseHook,
  AxiosMockerConfig,
  MockOptions
} from './types'

import { mergeOptions } from './utils/normalize-config'
import { createError, createLog, createWarning } from './utils/logger'
import { isDevelopment } from './utils/env'

export const DEFAULT_MOCK_OPTIONS: InternalMockOptions = {
  enabled: true,
  delay: 0,
  errorRate: 0,
  headers: {},
  error: undefined,
  getDelay: undefined,
  enableLogging: false
}

export class AxiosMocker {
  private endpoints: Map<string, MockEndpoint>
  private defaultOptions: InternalMockOptions
  private requestHooks: Array<RequestHook>
  private responseHooks: Array<ResponseHook>

  constructor(config?: AxiosMockerConfig) {
    this.defaultOptions = mergeOptions(DEFAULT_MOCK_OPTIONS, config?.defaultOptions)
    this.endpoints = new Map<string, MockEndpoint>()
    this.requestHooks = []
    this.responseHooks = []
    this.loadEndpoints(config?.endpoints)
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

  public getDefaultOptions(): InternalMockOptions {
    return this.defaultOptions
  }

  public updateDefaultOptions(options: Partial<MockOptions>): void {
    this.defaultOptions = mergeOptions(this.getDefaultOptions(), options)
  }

  public addRequestHook(hook: (request: MockRequest) => void | Promise<void>): void {
    this.requestHooks.push(hook)
  }

  public addResponseHook(hook: (response: AxiosResponse) => void | Promise<void>): void {
    this.responseHooks.push(hook)
  }

  public async handleRequest(axiosConfig: AxiosRequestConfigWithMock): Promise<AxiosResponse> {
    const mergedConfig = mergeOptions(this.getDefaultOptions(), axiosConfig.mock)

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

    for (const hook of this.requestHooks) {
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

    for (const hook of this.responseHooks) {
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
