const ERROR_PREFIX = '[axios-mock-plugin]'

export function createError(message: string): never {
  throw new Error(`${ERROR_PREFIX} ${message}`)
}

export function createWarning(message: string): void {
  console.warn(`${ERROR_PREFIX} ${message}`)
}

export function createLog(message: string): void {
  console.log(`${ERROR_PREFIX} ${message}`)
}
