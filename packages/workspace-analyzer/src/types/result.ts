/**
 * Re-export Result types from @bfra.me/es/result for discriminated union error handling.
 *
 * The Result pattern provides type-safe error handling without exceptions.
 * Prefer this pattern over throwing for expected/recoverable errors in analysis operations.
 */

export {err, ok} from '@bfra.me/es/result'
export {isErr, isOk} from '@bfra.me/es/result'
export {
  flatMap,
  fromPromise,
  fromThrowable,
  map,
  mapErr,
  unwrap,
  unwrapOr,
} from '@bfra.me/es/result'
export type {Err, Ok, Result} from '@bfra.me/es/result'
