import { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export interface AxiosRequestConfigWithMock<D = any> extends InternalAxiosRequestConfig<D> {
  mock?: boolean | Partial<MockOptions>;
}

/**
 * Options for configuring the mock behavior.
 */
export interface MockOptions {
  /**
   * Specifies whether mocking is enabled.
   *
   * @example
   * enabled: true
   */
  enabled?: boolean

  /**
   * The delay (in milliseconds) to simulate network latency before returning the response.
   *
   * @example
   * delay: 500
   */
  delay?: number

  /**
   * The probability (between 0 and 1) to simulate a random error.
   *
   * @example
   * errorRate: 0.5 // 50% chance of error
   */
  errorRate?: number

  /**
   * Custom headers to include in the response.
   *
   * @example
   * headers: { 'x-mock': 'true' }
   */
  headers?: Record<string, string>

  /**
   * A forced error configuration that, if provided,
   * causes the adapter to throw an error with the specified status, message, and details.
   *
   * @example
   * error: {
   *   status: 400,
   *   message: 'Bad Request',
   *   details: ['Invalid input data']
   * }
   */
  error?: { status?: number; message?: string; details?: any }

  /**
   * A function to dynamically determine the delay for a request.
   * This function is called only when a matching endpoint is found.
   * If a matching endpoint is not found, the configured delay is used instead.
   * It receives the matched endpoint key and the Axios request configuration,
   * and returns a delay (in milliseconds).
   *
   * @example
   * getDelay: (endpoint, config) => endpoint.includes('users') ? 2000 : 500
   */
  getDelay?: (endpoint: string, axiosConfig: AxiosRequestConfigWithMock) => number

  /**
   * Enables logging of request and response details.
   *
   * @example
   * enableLogging: true
   */
  enableLogging?: boolean
}

export interface InternalMockOptions {
  enabled: boolean
  delay: number
  errorRate: number
  headers: Record<string, string>
  error?: { status?: number; message?: string; details?: any }
  getDelay?: (endpoint: string, axiosConfig: AxiosRequestConfigWithMock) => number
  enableLogging: boolean
}

export interface MockRequest<
  P = any,
  Q = any,
  B = any
> {
  params: P;
  query: Q;
  body: B;
}

export interface AxiosMockerConfig {
  endpoints?: EndpointsMap;
  defaultOptions?: Partial<MockOptions>;
}

export type MockEndpoint<
  R = any,
  P = any,
  Q = any,
  B = any
> = (
  request: MockRequest<P, Q, B>,
  axiosConfig: AxiosRequestConfigWithMock
) => R | Promise<R>

export type EndpointsMap = Map<string, MockEndpoint> | { [key: string]: MockEndpoint }

export type RequestHook = (
  request: MockRequest,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>

export type ResponseHook = (
  response: AxiosResponse,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>
