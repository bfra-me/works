import type {Err, Ok, Result} from './types'

/** Type guard that narrows a Result to Ok. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success
}

/** Type guard that narrows a Result to Err. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success
}
