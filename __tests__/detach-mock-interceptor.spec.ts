import axios, { AxiosInstance } from 'axios'
import { attachMockInterceptor } from '../src/attach-mock-interceptor'
import { detachMockInterceptor } from '../src/detach-mock-interceptor'

describe('detachMockInterceptor', () => {
  let instance: AxiosInstance

  beforeEach(() => {
    instance = axios.create({
      baseURL: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('should remove the interceptor from the Axios instance', () => {
    const { interceptorId } = attachMockInterceptor(instance, {
      endpoints: {
        'GET /test': () => ({ success: true }),
      },
    })

    const manager = instance.interceptors.request as any
    const initialHandlers = manager.handlers.filter((h: any) => h !== null)
    const initialCount = initialHandlers.length

    detachMockInterceptor(instance, interceptorId)

    const finalHandlers = manager.handlers.filter((h: any) => h !== null)
    const finalCount = finalHandlers.length

    expect(finalCount).toBe(initialCount - 1)
  })
})
