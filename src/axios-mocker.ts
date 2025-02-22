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

import {
  createError,
  createLog,
  createWarning,
  delayPromise,
  isDevelopment,
  mergeObjects,
  mergeOptions,
  parseUrl
} from './utils'

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

  public addEndpoint<
    R = any,
    P = any,
    Q = any,
    B = any
  >(endpoint: string, handler: MockEndpoint<R, P, Q, B>): void {
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

  public addRequestHook<
    P = any,
    Q = any,
    B = any
  >(hook: (request: MockRequest<P, Q, B>) => void | Promise<void>): void {
    this.requestHooks.push(hook)
  }

  public addResponseHook<R = any>(hook: (response: AxiosResponse<R>) => void | Promise<void>): void {
    this.responseHooks.push(hook)
  }

  public async handleRequest<R = any>(axiosConfig: AxiosRequestConfigWithMock): Promise<AxiosResponse<R>> {
    const mergedConfig = mergeOptions(this.getDefaultOptions(), axiosConfig.mock)

    if (!mergedConfig.enabled) {
      createError(`Mocking is disabled for this request: ${axiosConfig.url}`)
    }

    if (mergedConfig.error && typeof mergedConfig.error === 'object') {
      await delayPromise(mergedConfig.delay)
      const { message, status = 500 } = mergedConfig.error
      createError(`${message} (status: ${status})`)
    }

    if (mergedConfig.errorRate > 0 && Math.random() < mergedConfig.errorRate) {
      await delayPromise(mergedConfig.delay)
      createError('Random mock error (status: 500)')
    }

    const method = (axiosConfig.method || 'GET').toUpperCase()
    const url = axiosConfig.url || ''
    const { pathname, searchParams } = parseUrl(url, axiosConfig.baseURL)

    let matchedKey: string | undefined = undefined
    let parameters: Record<string, unknown> = {}
    for (const [key] of this.endpoints) {
      const [endpointMethod, endpointPath] = key.split(' ')
      if (endpointMethod.toUpperCase() !== method) continue
      try {
        const matcher = match(endpointPath, { decode: decodeURIComponent })
        const result = matcher(pathname)
        if (result) {
          matchedKey = key
          parameters = result.params as Record<string, unknown>
          break
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `The endpoint "${method} ${pathname}" is invalid.`
        createError(`Path matching failed: ${errorMessage}`)
      }
    }

    if (!matchedKey) {
      createError(`No mock endpoint found for "${method} ${pathname}"`)
    }

    const delay = mergedConfig.getDelay && typeof mergedConfig.getDelay === 'function'
      ? mergedConfig.getDelay(matchedKey, axiosConfig)
      : mergedConfig.delay

    if (delay > 0) {
      await delayPromise(delay)
    }

    const axiosSearchParams = axiosConfig.params || {}
    const mergedQuery: Record<string, unknown> = mergeObjects(axiosSearchParams, searchParams)
    const mockRequest: MockRequest = {
      params: parameters,
      query: mergedQuery,
      body: typeof axiosConfig.data === 'string' ? JSON.parse(axiosConfig.data) : axiosConfig.data
    }

    if (mergedConfig.enableLogging) {
      createLog(
        `Mock Request: Received ${method} request for "${axiosConfig.url}".` +
        `Processed path: "${pathname}". Matched endpoint: "${matchedKey}". ` +
        `Extracted parameters: ${JSON.stringify(parameters)}.`
      )
    }

    for (const hook of this.requestHooks) {
      await hook(mockRequest, axiosConfig)
    }

    let responseData: R
    try {
      const handler = this.endpoints.get(matchedKey)!
      responseData = await handler(mockRequest, axiosConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      createError(`Handler for ${matchedKey} failed: ${errorMessage}`)
    }

    const response: AxiosResponse<R> = {
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
