export function parseUrl(
  url: string,
  base: string = 'http://localhost'
): { pathname: string; searchParams: Record<string, unknown> } {
  try {
    const urlObj = new URL(url, base)
    const searchParams: Record<string, unknown> = {}

    urlObj.searchParams.forEach((value, key) => {
      searchParams[key] = value
    })

    return {
      pathname: urlObj.pathname,
      searchParams
    }
  } catch (_error) {
    return { pathname: url, searchParams: {} }
  }
}
