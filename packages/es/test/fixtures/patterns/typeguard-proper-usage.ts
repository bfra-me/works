/**
 * Proper type guard usage patterns - demonstrates correct type narrowing.
 * This file serves as a reference for detecting anti-patterns by comparison.
 */

import {
  assertType,
  hasProperty,
  isArray,
  isFunction,
  isNonNullable,
  isNumber,
  isObject,
  isString,
} from '../../../src/types'

/**
 * PATTERN 1: Use type guards for unknown values from external sources
 * API responses, user input, and parsed data should always be validated.
 */
export function processApiResponse(data: unknown): string {
  if (!isObject(data)) {
    throw new Error('Expected object response')
  }

  if (!hasProperty(data, 'name') || !isString(data.name)) {
    throw new Error('Expected name property of type string')
  }

  return data.name
}

/**
 * PATTERN 2: Type guards for discriminated union narrowing
 * Use specific guards instead of direct property access.
 */
import {isOk} from '../../../src/result'
import type {Result} from '../../../src/result'

export function processResult<T, E>(result: Result<T, E>): T | null {
  if (isOk(result)) {
    return result.data
  }
  return null
}

/**
 * PATTERN 3: Custom type guard functions for domain types
 * Create reusable guards for your domain objects.
 */
interface User {
  id: number
  name: string
  email: string
}

function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    hasProperty(value, 'id') &&
    isNumber(value.id) &&
    hasProperty(value, 'name') &&
    isString(value.name) &&
    hasProperty(value, 'email') &&
    isString(value.email)
  )
}

export function validateUser(data: unknown): User {
  if (!isUser(data)) {
    throw new Error('Invalid user data')
  }
  return data
}

/**
 * PATTERN 4: Narrowing arrays with type guards
 * Use isArray followed by element validation.
 */
export function sumNumbers(data: unknown): number {
  if (!isArray(data)) {
    throw new Error('Expected array')
  }

  return data.reduce<number>((sum, item) => {
    if (!isNumber(item)) {
      throw new Error('Expected array of numbers')
    }
    return sum + item
  }, 0)
}

/**
 * PATTERN 5: Using isNonNullable for optional chains
 * Filter out null/undefined safely before processing.
 */
export function processOptionalValues(values: (string | null | undefined)[]): string[] {
  return values.filter(isNonNullable)
}

/**
 * PATTERN 6: Combining guards for complex types
 * Build up validation through composition.
 */
interface Config {
  port: number
  host: string
  options?: {
    timeout: number
  }
}

function isConfig(value: unknown): value is Config {
  if (!isObject(value)) return false
  if (!hasProperty(value, 'port') || !isNumber(value.port)) return false
  if (!hasProperty(value, 'host') || !isString(value.host)) return false

  if (hasProperty(value, 'options')) {
    if (!isObject(value.options)) return false
    if (!hasProperty(value.options, 'timeout') || !isNumber(value.options.timeout)) {
      return false
    }
  }

  return true
}

export {isConfig}

/**
 * PATTERN 7: Using assertType for guaranteed narrowing
 * Assert type when you want to throw on failure.
 */
export function processStringInput(value: unknown): string {
  assertType(value, isString)
  return value.toUpperCase()
}

/**
 * PATTERN 8: Type guards with function parameters
 * Validate callbacks before invoking.
 */
export function safeInvoke(fn: unknown, arg: number): number | null {
  if (!isFunction(fn)) {
    return null
  }
  return fn(arg) as number
}

/**
 * PATTERN 9: Early return pattern with guards
 * Return early when validation fails for cleaner code.
 */
export function parseUserFromJson(json: unknown): User | null {
  if (!isObject(json)) return null
  if (!hasProperty(json, 'id') || !isNumber(json.id)) return null
  if (!hasProperty(json, 'name') || !isString(json.name)) return null
  if (!hasProperty(json, 'email') || !isString(json.email)) return null

  return {
    id: json.id,
    name: json.name,
    email: json.email,
  }
}

/**
 * PATTERN 10: Type narrowing in array methods
 * Use guards in filter/find for type-safe results.
 */
interface Item {
  type: 'product' | 'service'
  name: string
  price: number
}

interface Product extends Item {
  type: 'product'
  sku: string
}

interface Service extends Item {
  type: 'service'
  duration: number
}

function isProduct(item: Item): item is Product {
  return item.type === 'product' && hasProperty(item, 'sku')
}

function isService(item: Item): item is Service {
  return item.type === 'service' && hasProperty(item, 'duration')
}

export function filterProducts(items: Item[]): Product[] {
  return items.filter(isProduct)
}

export function filterServices(items: Item[]): Service[] {
  return items.filter(isService)
}
