/**
 * Options for customizing cache key generation.
 */
export interface KeyResolverOptions {
  /** Maximum depth for serializing nested objects */
  readonly maxDepth?: number
  /** Whether to include function names in the key */
  readonly includeFunctions?: boolean
}

/**
 * Creates a string key from function arguments for cache lookup.
 *
 * Handles primitives, objects, arrays, and nested structures.
 * Objects are serialized consistently regardless of property order.
 *
 * @param args - The arguments to create a key from
 * @param options - Key generation options
 * @returns A string key for cache lookup
 *
 * @example
 * ```ts
 * createKeyResolver(1, 'hello', { a: 1 }) // => '1|"hello"|{"a":1}'
 * createKeyResolver([1, 2, 3]) // => '[1,2,3]'
 * ```
 */
export function createKeyResolver(args: unknown[], options: KeyResolverOptions = {}): string {
  const {maxDepth = 10, includeFunctions = false} = options

  function serialize(value: unknown, depth: number): string {
    if (depth > maxDepth) {
      return '"[max depth]"'
    }

    if (value === null) {
      return 'null'
    }

    if (value === undefined) {
      return 'undefined'
    }

    const type = typeof value

    if (type === 'string') {
      return JSON.stringify(value)
    }

    if (type === 'number' || type === 'boolean') {
      return String(value)
    }

    if (type === 'bigint') {
      return `${String(value)}n`
    }

    if (type === 'symbol') {
      return value.toString()
    }

    if (type === 'function') {
      if (includeFunctions) {
        const fn = value as (...args: unknown[]) => unknown
        const name = fn.name === '' ? 'anonymous' : fn.name
        return `[fn:${name}]`
      }
      return '[fn]'
    }

    if (Array.isArray(value)) {
      const items = value.map(item => serialize(item, depth + 1))
      return `[${items.join(',')}]`
    }

    if (value instanceof Date) {
      return `Date(${value.toISOString()})`
    }

    if (value instanceof RegExp) {
      return value.toString()
    }

    if (value instanceof Map) {
      const entries = [...value.entries()]
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .map(([k, v]) => `${serialize(k, depth + 1)}:${serialize(v, depth + 1)}`)
      return `Map{${entries.join(',')}}`
    }

    if (value instanceof Set) {
      const items = [...value].map(item => serialize(item, depth + 1)).sort()
      return `Set{${items.join(',')}}`
    }

    // Plain object - sort keys for consistent cache hits across different property orderings
    if (type === 'object') {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj).sort()
      const pairs = keys.map(key => `${JSON.stringify(key)}:${serialize(obj[key], depth + 1)}`)
      return `{${pairs.join(',')}}`
    }

    return String(value)
  }

  if (args.length === 0) {
    return '()'
  }

  if (args.length === 1) {
    return serialize(args[0], 0)
  }

  return args.map(arg => serialize(arg, 0)).join('|')
}

/**
 * Creates a custom key resolver function with pre-configured options.
 *
 * @param options - Key generation options
 * @returns A key resolver function
 *
 * @example
 * ```ts
 * const resolver = createCustomKeyResolver({ maxDepth: 3 })
 * const memoizedFn = memoize(expensiveFn, { keyResolver: resolver })
 * ```
 */
export function createCustomKeyResolver(options: KeyResolverOptions): (args: unknown[]) => string {
  return (args: unknown[]) => createKeyResolver(args, options)
}
