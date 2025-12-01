/**
 * Common utility types used across the monorepo.
 */

import type {Result} from '@bfra.me/es/result'

/** Makes all properties optional, recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Makes all properties readonly, recursively */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/** Value that may be null */
export type Nullable<T> = T | null

/** Value that may be null or undefined */
export type Optional<T> = T | null | undefined

/** Value that may be a Promise */
export type MaybePromise<T> = T | Promise<T>

/** Async operation result with standard error type */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>
