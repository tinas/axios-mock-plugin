import { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export interface AxiosRequestConfigWithMock<D = any> extends InternalAxiosRequestConfig<D> {
  mock?: boolean | Partial<MockOptions>;
}

export interface MockOptions {
  enabled?: boolean
  delay?: number
  errorRate?: number
  headers?: Record<string, string>
  error?: { status?: number; message?: string; details?: any }
  getDelay?: (endpoint: string, axiosConfig: AxiosRequestConfigWithMock) => number
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
