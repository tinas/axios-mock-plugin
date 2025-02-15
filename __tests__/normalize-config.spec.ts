import { DEFAULT_MOCK_OPTIONS } from '../src/axios-mocker'
import { isObject, mergeObjects, mergeOptions } from '../src/utils'

describe('normalize config utils', () => {
  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
      expect(isObject(new Map())).toBe(true)
    })

    it('should return false for non-objects', () => {
      expect(isObject(undefined)).toBe(false)
      expect(isObject(null)).toBe(false)
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(false)).toBe(false)
      expect(isObject([])).toBe(false)
    })
  })

  describe('mergeObjects', () => {
    it('should merge objects', () => {
      const defaults = {
        a: 1,
        b: 'default',
        c: { key: 'default' }
      }

      const overrides = {
        b: 'override',
        c: { key: 'override' }
      }

      const merged = mergeObjects(defaults, overrides)

      expect(merged).toEqual({
        a: 1,
        b: 'override',
        c: { key: 'override' }
      })
    })
  })

  describe('mergeOptions', () => {
    let defaultOptions = { ...DEFAULT_MOCK_OPTIONS }

    afterEach(() => {
      defaultOptions = { ...DEFAULT_MOCK_OPTIONS }
    })

    it('should return default values if options is undefined', () => {
      const mergedOptions = mergeOptions(defaultOptions)

      expect(mergedOptions).toEqual(defaultOptions)
    })

    it('should return default values if options is true', () => {
      const mergedOptions = mergeOptions(defaultOptions, true)

      expect(mergedOptions).toEqual(defaultOptions)
    })

    it('should disable mocking if options is false', () => {
      const mergedOptions = mergeOptions(defaultOptions, false)

      expect(mergedOptions).toEqual({ ...defaultOptions, enabled: false })
    })

    it('should merge options with defaults', () => {
      const mergedOptions = mergeOptions(defaultOptions, {
        delay: 100,
        errorRate: 0.5,
        headers: { 'X-Custom-Header': 'value' },
        error: { status: 500, message: 'Internal Server Error' },
        getDelay: () => 200,
        enableLogging: true
      })

      expect(mergedOptions).toEqual({
        enabled: defaultOptions.enabled,
        delay: 100,
        errorRate: 0.5,
        headers: { ...defaultOptions.headers, 'X-Custom-Header': 'value' },
        error: { status: 500, message: 'Internal Server Error' },
        getDelay: expect.any(Function),
        enableLogging: true
      })
    })

    it('should merge options with defaults and override enabled', () => {
      const mergedOptions = mergeOptions(defaultOptions, { enabled: false })

      expect(mergedOptions).toEqual({ ...defaultOptions, enabled: false })
    })

    it('should return default values if options is not an object', () => {
      const mergedOptions = mergeOptions(defaultOptions, 123 as any)

      expect(mergedOptions).toEqual(defaultOptions)
    })
  })
})
