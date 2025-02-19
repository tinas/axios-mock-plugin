import { parseUrl } from '../src/utils'

describe('parseUrl', () => {
  it('parses the URL and returns the pathname and query', () => {
    const url = 'http://localhost:3000/test?query=1&query=2'
    const result = parseUrl(url)

    expect(result).toEqual({
      pathname: '/test',
      searchParams: { query: '2' }
    })
  })

  it('returns the URL as the pathname when parsing fails', () => {
    const url = 'http://localhost:3000/test?query=1&query=2'
    const result = parseUrl(url, 'invalid')

    expect(result).toEqual({
      pathname: url,
      searchParams: {}
    })
  })

  it('should use default base ("http://localhost") when no base is provided', () => {
    const result = parseUrl('/api/users?id=1&name=John%20Doe')
    expect(result.pathname).toEqual('/api/users')
    expect(result.searchParams).toEqual({ id: '1', name: 'John Doe' })
  })

  it('should use the provided base URL when given', () => {
    const result = parseUrl('/api/users?id=1&name=John%20Doe', 'http://example.com')
    expect(result.pathname).toEqual('/api/users')
    expect(result.searchParams).toEqual({ id: '1', name: 'John Doe' })
  })

  it('should work correctly with an absolute URL regardless of the provided base', () => {
    const result = parseUrl('http://another.com/api/users?id=1&name=John%20Doe', 'http://example.com')
    expect(result.pathname).toEqual('/api/users')
    expect(result.searchParams).toEqual({ id: '1', name: 'John Doe' })
  })

  it('should return the original url as pathname and empty query on invalid URL', () => {
    const result = parseUrl('invalid-url')
    expect(result.pathname).toEqual('/invalid-url')
    expect(result.searchParams).toEqual({})
  })
})
