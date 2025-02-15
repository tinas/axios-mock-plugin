import axios, { AxiosAdapter, AxiosHeaders, AxiosInstance } from 'axios'
import { AxiosRequestConfigWithMock } from '../src/types'
import { attachMockInterceptor } from '../src/attach-mock-interceptor'

describe('attachMockInterceptor', () => {
  let axiosInstance: AxiosInstance

  beforeEach(() => {
    axiosInstance = axios.create({
      baseURL: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('attaches the mock adapter when config.mock is true', async () => {
    attachMockInterceptor(axiosInstance, {
      endpoints: {
        'GET /test': () => ({ success: true }),
      },
    })

    const manager = axiosInstance.interceptors.request as any
    const handler = manager.handlers[manager.handlers.length - 1].fulfilled

    expect(handler).toBeDefined()

    const config: AxiosRequestConfigWithMock = {
      headers: new AxiosHeaders(),
      method: 'GET',
      url: '/test',
      mock: true,
    }

    const result = await handler(config)

    expect(typeof result.adapter).toBe('function')
  })

  it('does not modify config when config.mock is false', async () => {
    attachMockInterceptor(axiosInstance, {
      endpoints: {
        'GET /test': () => ({ success: true }),
      },
    })

    const manager = axiosInstance.interceptors.request as any
    const handler = manager.handlers[manager.handlers.length - 1].fulfilled
    const defaultAdapter = () => 'default'
    const config: AxiosRequestConfigWithMock = {
      headers: new AxiosHeaders(),
      method: 'GET',
      url: '/test',
      mock: false,
      adapter: defaultAdapter as unknown as AxiosAdapter,
    }

    const result = await handler(config)

    expect(result.adapter).toBe(defaultAdapter)
  })

  it('attaches the mock adapter when config.mock is an object with enabled true', async () => {
    attachMockInterceptor(axiosInstance, {
      endpoints: {
        'GET /test': () => ({ success: true }),
      },
    })

    const manager = axiosInstance.interceptors.request as any
    const handler = manager.handlers[manager.handlers.length - 1].fulfilled
    const config: AxiosRequestConfigWithMock = {
      headers: new AxiosHeaders(),
      method: 'GET',
      url: '/test',
      mock: { enabled: true },
    }

    const result = await handler(config)

    expect(typeof result.adapter).toBe('function')
  })

  it('does not attach the mock adapter when config.mock is an object with enabled false', async () => {
    attachMockInterceptor(axiosInstance, {
      endpoints: {
        'GET /test': () => ({ success: true }),
      },
    })

    const manager = axiosInstance.interceptors.request as any
    const handler = manager.handlers[manager.handlers.length - 1].fulfilled
    const defaultAdapter = () => 'default'
    const config: AxiosRequestConfigWithMock = {
      headers: new AxiosHeaders(),
      method: 'GET',
      url: '/test',
      mock: { enabled: false },
      adapter: defaultAdapter as unknown as AxiosAdapter,
    }

    const result = await handler(config)

    expect(result.adapter).toBe(defaultAdapter)
  })
})
