import { createError, createWarning, createLog } from '../src/utils/logger'

describe('logger utils', () => {
  it('should create error', () => {
    expect(() => createError('Test error')).toThrowError('[axios-mock-plugin] Test error')
  })

  it('should create warning', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

    createWarning('Test warning')

    expect(consoleWarnSpy).toHaveBeenCalledWith('[axios-mock-plugin] Test warning')
  })

  it('should create log', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

    createLog('Test log')

    expect(consoleLogSpy).toHaveBeenCalledWith('[axios-mock-plugin] Test log')
  })
})
