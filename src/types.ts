import { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export interface AxiosRequestConfigWithMock extends InternalAxiosRequestConfig<any> {
  mock?: boolean | Partial<MockConfig>;
}

export interface MockConfig {
  enabled?: boolean
  delay?: number
  errorRate?: number
  headers?: Record<string, string>
  error?: { status?: number; message?: string; details?: unknown[] }
  getDelay?: (config: AxiosRequestConfigWithMock, endpoint: string) => number
  enableLogging?: boolean
}

export interface NormalizedMockConfig {
  enabled: boolean
  delay: number
  errorRate: number
  headers: Record<string, string>
  error?: { status?: number; message?: string; details?: unknown[] }
  getDelay?: (config: AxiosRequestConfigWithMock, endpoint: string) => number
  enableLogging: boolean
}

export interface MockRequest<
  Params = Record<string, unknown>,
  Query = Record<string, unknown>,
  Body = unknown
> {
  params: Params;
  query: Query;
  body: Body;
}

export interface AxiosMockerOptions {
  endpoints?: EndpointsMap;
  config?: Partial<MockConfig>;
}

export type MockEndpoint<
  Params = Record<string, unknown>,
  Query = Record<string, unknown>,
  Body = unknown
> = (
  request: MockRequest<Params, Query, Body>,
  axiosConfig: AxiosRequestConfigWithMock
) => unknown | Promise<unknown>

export type EndpointsMap = Map<string, MockEndpoint> | { [key: string]: MockEndpoint }

export type RequestHook = (
  request: MockRequest,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>

export type ResponseHook = (
  response: AxiosResponse,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>
