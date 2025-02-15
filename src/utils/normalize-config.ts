import { MockOptions, InternalMockOptions } from '../types'

export function isObject(item: any): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Recursively merge two objects.
 * The original `defaultOptions` is not mutated.
 */
export function mergeObjects<T extends object>(defaultOptions: T, options: Partial<T>): T {
  const result = { ...defaultOptions }
  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      const defaultValue = defaultOptions[key]
      const optionValue = options[key]
      if (isObject(defaultValue) && isObject(optionValue)) {
        result[key] = mergeObjects(defaultValue, optionValue)
      } else {
        result[key] = optionValue as any
      }
    }
  }
  return result
}

/**
 * Merge default mock options with overrides.
 */
export function mergeOptions(
  defaultOptions: InternalMockOptions,
  options?: boolean | Partial<MockOptions>
): InternalMockOptions {
  if (typeof options === 'boolean') {
    return { ...defaultOptions, enabled: options }
  }

  if (!isObject(options)) {
    return { ...defaultOptions }
  }

  return mergeObjects(defaultOptions, options) as InternalMockOptions
}
