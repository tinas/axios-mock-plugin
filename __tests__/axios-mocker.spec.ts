import { AxiosHeaders } from 'axios'
import { AxiosMocker } from '../src/axios-mocker'
import { isDevelopment } from '../src/utils/env'
import { AxiosRequestConfigWithMock } from '../src/types'

vi.mock('../src/utils/env', () => ({
  isDevelopment: vi.fn()
}))

const getDefaultAxiosConfig = () => ({
  baseURL: 'http://localhost:3000',
  method: 'GET',
  url: '',
  headers: new AxiosHeaders(),
})

describe('AxiosMocker class', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const axiosMocker = new AxiosMocker()

      expect(axiosMocker).toBeDefined()
      expect(axiosMocker.listEndpoints()).toEqual([])
      expect(axiosMocker['requestHooks']).toEqual([])
      expect(axiosMocker['responseHooks']).toEqual([])
      expect(axiosMocker['config']).toEqual({
        enabled: true,
        delay: 0,
        errorRate: 0,
        headers: {},
        enableLogging: false
      })
    })

    it('should initialize with custom values', () => {
      const axiosMocker = new AxiosMocker({
        config: {
          enabled: false,
          delay: 1000,
          errorRate: 0.5,
          headers: { 'X-Custom-Header': 'custom' },
          error: { status: 500, message: 'Internal Server Error' },
          getDelay: () => 1000,
          enableLogging: true
        },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      expect(axiosMocker).toBeDefined()
      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
      expect(axiosMocker['requestHooks']).toEqual([])
      expect(axiosMocker['responseHooks']).toEqual([])
      expect(axiosMocker['config']).toEqual({
        enabled: false,
        delay: 1000,
        errorRate: 0.5,
        headers: { 'X-Custom-Header': 'custom' },
        error: { status: 500, message: 'Internal Server Error' },
        getDelay: expect.any(Function),
        enableLogging: true
      })
    })
  })

  describe('endpoints', () => {
    it('should load endpoints', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
    })

    it('should load endpoints from object', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: {
          'GET /api/users': () => Promise.resolve({ data: [] })
        }
      })

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
    })

    it('should console warn if endpoints is not a Map or object', () => {
      vi.mocked(isDevelopment).mockReturnValue(true)
      vi.spyOn(console, 'warn').mockImplementation(() => { })

      new AxiosMocker({
        // @ts-expect-error Testing invalid type
        endpoints: 'invalid'
      })

      expect(console.warn).toHaveBeenCalledWith('[axios-mock-plugin] Invalid endpoints map. Expected Map or object.')
    })

    it('should clear endpoints', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      axiosMocker.clearEndpoints()

      expect(axiosMocker.listEndpoints()).toEqual([])
    })

    it('should set endpoints', () => {
      const axiosMocker = new AxiosMocker()

      expect(axiosMocker.listEndpoints()).toEqual([])

      axiosMocker.setEndpoints(new Map([
        ['GET /api/users', () => Promise.resolve({ data: [] })]
      ]))

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
    })

    it('should add endpoints', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])

      axiosMocker.addEndpoints(new Map([
        ['GET /api/posts', () => Promise.resolve({ data: [] })]
      ]))

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users', 'GET /api/posts'])
    })

    describe('addEndpoint', () => {
      it('should add endpoint', () => {
        const axiosMocker = new AxiosMocker()

        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))

        expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
      })

      it('should not add duplicate endpoint', () => {
        const axiosMocker = new AxiosMocker()

        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))
        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))

        expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users'])
      })

      it('should throw warning in development mode', () => {
        vi.mocked(isDevelopment).mockReturnValue(true)
        vi.spyOn(console, 'warn').mockImplementation(() => { })

        const axiosMocker = new AxiosMocker()
        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))
        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))

        expect(console.warn).toHaveBeenCalledWith('[axios-mock-plugin] Duplicate endpoint: GET /api/users')
      })

      it('should not throw warning in production mode', () => {
        vi.mocked(isDevelopment).mockReturnValue(false)
        vi.spyOn(console, 'warn').mockImplementation(() => { })

        const axiosMocker = new AxiosMocker()
        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))
        axiosMocker.addEndpoint('GET /api/users', () => Promise.resolve({ data: [] }))

        expect(console.warn).not.toHaveBeenCalled()
      })
    })

    it('should remove endpoint', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      axiosMocker.removeEndpoint('GET /api/users')

      expect(axiosMocker.listEndpoints()).toEqual([])
    })

    it('should list all endpoints', () => {
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })],
          ['GET /api/posts', () => Promise.resolve({ data: [] })]
        ])
      })

      expect(axiosMocker.listEndpoints()).toEqual(['GET /api/users', 'GET /api/posts'])
    })

    it('should get default global config', () => {
      const axiosMocker = new AxiosMocker()

      expect(axiosMocker.getConfig()).toEqual({
        enabled: true,
        delay: 0,
        errorRate: 0,
        headers: {},
        enableLogging: false
      })
    })

    it('should update global config', () => {
      const axiosMocker = new AxiosMocker()

      axiosMocker.updateConfig({
        enabled: false,
        delay: 1000,
        errorRate: 0.5,
        headers: { 'X-Custom-Header': 'custom' },
        error: { status: 500, message: 'Internal Server Error' },
        getDelay: () => 1000,
        enableLogging: true
      })

      expect(axiosMocker.getConfig()).toEqual({
        enabled: false,
        delay: 1000,
        errorRate: 0.5,
        headers: { 'X-Custom-Header': 'custom' },
        error: { status: 500, message: 'Internal Server Error' },
        getDelay: expect.any(Function),
        enableLogging: true
      })
    })

    it('should add request-hook', () => {
      const axiosMocker = new AxiosMocker()

      const preHook = () => { }
      axiosMocker.addRequestHook(preHook)

      expect(axiosMocker['requestHooks']).toEqual([preHook])
    })

    it('should modify the request via a request-hook override', async() => {
      const mocker = new AxiosMocker({
        endpoints: {
          'GET /test': (req) => {
            return { modified: req.params.customProperty == 'overridden' }
          },
        },
        config: { enabled: true, delay: 0 },
      })

      mocker.addRequestHook((request) => {
        request.params.customProperty = 'overridden'
      })

      const config = {
        headers: new AxiosHeaders(),
        method: 'GET',
        url: '/test',
        mock: true,
      }

      const response = await mocker.handleRequest(config)

      expect(response.data).toEqual({ modified: true })
    })

    it('should add response-hook', () => {
      const axiosMocker = new AxiosMocker()

      const postHook = () => { }
      axiosMocker.addResponseHook(postHook)

      expect(axiosMocker['responseHooks']).toEqual([postHook])
    })

    it('should modify the response via a response-hook override', async() => {
      const mocker = new AxiosMocker({
        endpoints: {
          'GET /test': () => {
            return { message: 'original' }
          },
        },
        config: { enabled: true, delay: 0 },
      })

      mocker.addResponseHook((response) => {
        response.data.modifiedPost = 'overridden'
      })

      const config = {
        headers: new AxiosHeaders(),
        method: 'GET',
        url: '/test',
        mock: true,
      }

      const response = await mocker.handleRequest(config)
      expect(response.data).toEqual({ message: 'original', modifiedPost: 'overridden' })
    })
  })

  describe('handleRequest', () => {
    it('should throw error if mocking is disabled', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker()

      axiosMocker.updateConfig({ enabled: false })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('[axios-mock-plugin] Mocking is disabled for this request: /api/users')
    })

    it('should throw error if error is defined', async() => {
      const config = getDefaultAxiosConfig()
      const axiosMocker = new AxiosMocker()

      axiosMocker.updateConfig({ error: { status: 500, message: 'Internal Server Error' } })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('Internal Server Error (status: 500)')
    })

    it('should throw error based on error rate', async() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      const config = getDefaultAxiosConfig()
      const axiosMocker = new AxiosMocker()

      axiosMocker.updateConfig({ errorRate: 0.5 })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('Random mock error (status: 500)')
    })

    it('should set GET as default method', async() => {
      const config = getDefaultAxiosConfig()
      // @ts-expect-error Testing undefined method
      config.method = undefined
      // @ts-expect-error Testing undefined method
      config.url = undefined
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('No mock endpoint found for "GET "')
    })

    it('should slice baseURL from url', async() => {
      const config = getDefaultAxiosConfig()
      config.baseURL = 'http://api.example.com'
      config.url = 'http://api.example.com/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      const response = await axiosMocker.handleRequest(config)

      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ data: [] })
    })

    describe('path matching', () => {
      it('should match endpoint', async() => {
        const config = getDefaultAxiosConfig()
        config.url = '/api/users'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['POST /api/posts', () => Promise.resolve({ data: [] })],
            ['GET /api/users', () => Promise.resolve({ data: [] })]
          ])
        })

        const response = await axiosMocker.handleRequest(config)

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({ data: [] })
      })

      it('should match endpoint with parameters', async() => {
        const config = getDefaultAxiosConfig()
        config.url = '/api/users/1'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['GET /api/users/:id', (request) => Promise.resolve({ data: request.params })]
          ])
        })

        const response = await axiosMocker.handleRequest(config)

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({ data: { id: '1' } })
      })

      it('should throw error if no endpoint found', async() => {
        const config = getDefaultAxiosConfig()
        config.url = '/api/posts'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['GET /api/users', () => Promise.resolve({ data: [] })]
          ])
        })

        await expect(axiosMocker.handleRequest(config))
          .rejects.toThrow('No mock endpoint found for "GET /api/posts"')
      })

      it('should throw error if path matching failed', async() => {
        const config = getDefaultAxiosConfig()
        config.url = '/api/users/1'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['GET /api/posts/?id', () => Promise.resolve({ data: [] })]
          ])
        })

        await expect(axiosMocker.handleRequest(config))
          .rejects.toThrow('Path matching failed:')
      })

      it('should throw error if no matching endpoint found', async() => {
        const config = getDefaultAxiosConfig()
        config.url = '/api/posts/1'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['GET /api/users/:id', () => Promise.resolve({ data: [] })]
          ])
        })

        await expect(axiosMocker.handleRequest(config))
          .rejects.toThrow('No mock endpoint found for "GET /api/posts/1"')
      })

      it('should throws a meaningful error message when path-to-regexp.match throws an error', async() => {
        const pathToRegexp = await import('path-to-regexp')
        vi.spyOn(pathToRegexp, 'match').mockImplementation(() => {
          throw 'Forced error message'
        })

        const config = getDefaultAxiosConfig()
        config.url = '/api/posts/1'
        const axiosMocker = new AxiosMocker({
          config: { enabled: true },
          endpoints: new Map([
            ['GET /api/users/:id', () => Promise.resolve({ data: [] })]
          ])
        })

        await expect(axiosMocker.handleRequest(config))
          .rejects.toThrow('Path matching failed: The endpoint "GET /api/posts/1" is invalid.')

        vi.restoreAllMocks()
      })
    })

    it('should delay response', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true, delay: 300 },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      const start = Date.now()
      await axiosMocker.handleRequest(config)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(300)
    })

    it('should get delay from function', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      axiosMocker.updateConfig({ getDelay: () => 300 })

      const start = Date.now()
      await axiosMocker.handleRequest(config)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(300)
    })

    it('should parse request data', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      // @ts-expect-error Testing invalid data type
      config.data = JSON.stringify({ name: 'John Doe' })
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', (request) => Promise.resolve({ data: request.body })]
        ])
      })

      const response = await axiosMocker.handleRequest(config)

      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ data: { name: 'John Doe' } })
    })

    it('should not parse request data if it is already an object', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      // @ts-expect-error Testing invalid data type
      config.data = { name: 'John Doe' }
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', (request) => Promise.resolve({ data: request.body })]
        ])
      })

      const response = await axiosMocker.handleRequest(config)

      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ data: { name: 'John Doe' } })
    })

    it('should log request and response', async() => {
      vi.spyOn(console, 'log').mockImplementation(() => { })
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enableLogging: true },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      await axiosMocker.handleRequest(config)

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[axios-mock-plugin] Mock Request:')
      )
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[axios-mock-plugin] Mock Response:')
      )
    })

    it('should call request-hook', async() => {
      const hook = vi.fn()
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      axiosMocker.addRequestHook(hook)
      await axiosMocker.handleRequest(config)

      expect(hook).toHaveBeenCalled()
    })

    it('should call post-hook', async() => {
      const hook = vi.fn()
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      axiosMocker.addResponseHook(hook)
      await axiosMocker.handleRequest(config)

      expect(hook).toHaveBeenCalled()
    })

    it('should throw error if handler failed', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', () => {
            throw new Error('Internal Server Error')
          }]
        ])
      })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('Handler for GET /api/users failed: Internal Server Error')
    })

    it('should throw string error if handler failed', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', () => {
            throw 'String error'
          }]
        ])
      })

      await expect(axiosMocker.handleRequest(config))
        .rejects.toThrow('Handler for GET /api/users failed: String error')
    })

    it('should return response', async() => {
      const config = getDefaultAxiosConfig()
      config.url = '/api/users'
      const axiosMocker = new AxiosMocker({
        config: { enabled: true },
        endpoints: new Map([
          ['GET /api/users', () => Promise.resolve({ data: [] })]
        ])
      })

      const response = await axiosMocker.handleRequest(config)

      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ data: [] })
    })

    describe('for all HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      methods.forEach((method) => {
        it(`should return response for ${method} request`, async() => {
          const config = getDefaultAxiosConfig()
          config.method = method
          config.url = '/api/test'

          const expectedData = { data: `${method} response` }

          const endpoints = new Map<string, any>([
            [`${method} /api/test`, () => Promise.resolve(expectedData)]
          ])

          const axiosMocker = new AxiosMocker({
            config: { enabled: true, delay: 0 },
            endpoints,
          })

          const response = await axiosMocker.handleRequest(config)
          expect(response.status).toEqual(200)
          expect(response.data).toEqual(expectedData)
        })
      })
    })
  })

  describe('Edge Cases', () => {
    let mocker: AxiosMocker
    let config: AxiosRequestConfigWithMock

    beforeEach(() => {
      mocker = new AxiosMocker({
        endpoints: {
          'GET /test': () => {
            return { success: true }
          },
        },
        config: { enabled: true, delay: 0 },
      })

      config = {
        headers: new AxiosHeaders(),
        method: 'GET',
        url: '/test',
        mock: true,
      }
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should wrap a synchronous return value in a promise and return the correct response', async() => {
      const mocker = new AxiosMocker({
        endpoints: new Map([
          ['GET /api/users', () => ({ data: ['value1', 'value2'] })]
        ]),
        config: { enabled: true, delay: 0 }
      })

      const config = {
        headers: new AxiosHeaders(),
        method: 'GET',
        url: '/api/users',
        mock: true,
      }

      const response = await mocker.handleRequest(config)

      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ data: ['value1', 'value2'] })
    })

    it('should throw an error if a request-hook fails', async() => {
      mocker.addRequestHook(() => {
        throw new Error('Pre-hook error')
      })

      await expect(mocker.handleRequest(config))
        .rejects.toThrow('Pre-hook error')
    })

    it('should throw an error if a response-hook fails', async() => {
      mocker.addResponseHook(() => {
        throw new Error('Post-hook error')
      })

      await expect(mocker.handleRequest(config))
        .rejects.toThrow('Post-hook error')
    })

    it('should not throw a random error when errorRate is 0', async() => {
      mocker.updateConfig({ errorRate: 0 })
      const response = await mocker.handleRequest(config)
      expect(response.status).toEqual(200)
      expect(response.data).toEqual({ success: true })
    })

    it('should throw an error if no endpoint matches the request', async() => {
      const noMatchConfig: AxiosRequestConfigWithMock = {
        headers: new AxiosHeaders(),
        method: 'GET',
        url: '/non-existent',
        mock: true,
      }
      await expect(mocker.handleRequest(noMatchConfig))
        .rejects.toThrow('[axios-mock-plugin] No mock endpoint found for "GET /non-existent"')
    })
  })
})
