/**
 * @bfra.me/es/types - Type utilities including branded types and type guards
 */

// Assertion utilities
export {assertType} from './assertions'
// Branded types
export type {Brand, NonEmptyString, Opaque, PositiveInteger} from './brand'

export {brand, unbrand} from './brand'

// Type guards
export {
  hasProperty,
  isArray,
  isFunction,
  isNonNullable,
  isNumber,
  isObject,
  isString,
} from './guards'
