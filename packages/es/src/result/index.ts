/**
 * @bfra.me/es/result - Result type for discriminated union error handling
 */

// Factory functions
export {err, ok} from './factories'

// Type guards
export {isErr, isOk} from './guards'

// Operators
export {flatMap, fromPromise, fromThrowable, map, mapErr, unwrap, unwrapOr} from './operators'

// Types
export type {Err, Ok, Result} from './types'
