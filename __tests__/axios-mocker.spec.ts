import { AxiosHeaders } from 'axios'
import { AxiosMocker } from '../src/axios-mocker'
import { isDevelopment } from '../src/utils/env'

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
      expect(axiosMocker['preHooks']).toEqual([])
      expect(axiosMocker['postHooks']).toEqual([])
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
      expect(axiosMocker['preHooks']).toEqual([])
      expect(axiosMocker['postHooks']).toEqual([])
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

    it('should add pre-hook', () => {
      const axiosMocker = new AxiosMocker()

      const preHook = () => { }
      axiosMocker.addPreHook(preHook)

      expect(axiosMocker['preHooks']).toEqual([preHook])
    })

    it('should add post-hook', () => {
      const axiosMocker = new AxiosMocker()

      const postHook = () => { }
      axiosMocker.addPostHook(postHook)

      expect(axiosMocker['postHooks']).toEqual([postHook])
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

      it('should call pre-hook', async() => {
        const preHook = vi.fn()
        const config = getDefaultAxiosConfig()
        config.url = '/api/users'
        const axiosMocker = new AxiosMocker({
          endpoints: new Map([
            ['GET /api/users', () => Promise.resolve({ data: [] })]
          ])
        })

        axiosMocker.addPreHook(preHook)
        await axiosMocker.handleRequest(config)

        expect(preHook).toHaveBeenCalled()
      })

      it('should call post-hook', async() => {
        const postHook = vi.fn()
        const config = getDefaultAxiosConfig()
        config.url = '/api/users'
        const axiosMocker = new AxiosMocker({
          endpoints: new Map([
            ['GET /api/users', () => Promise.resolve({ data: [] })]
          ])
        })

        axiosMocker.addPostHook(postHook)
        await axiosMocker.handleRequest(config)

        expect(postHook).toHaveBeenCalled()
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
    })
  })
})
