import { delayPromise } from '../src/utils'

describe('delayPromise', () => {
  it('resolves after the specified delay', async () => {
    vi.useFakeTimers()
    let resolved = false
    const promise = delayPromise(100).then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    vi.advanceTimersByTime(100)
    await promise
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })

  it('resolves immediately if the delay is zero', async () => {
    vi.useFakeTimers()
    let resolved = false
    const promise = delayPromise(0).then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    vi.advanceTimersByTime(0)
    await promise
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })
})
