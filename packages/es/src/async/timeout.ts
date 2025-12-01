import type {Result} from '../result/types'
import {TimeoutError} from '../error/specialized'
import {err, ok} from '../result/factories'

export {TimeoutError}

/**
 * Wraps a promise with a timeout, returning a Result.
 *
 * @param promise - The promise to wrap
 * @param ms - The timeout in milliseconds
 * @returns A Result containing the resolved value or a TimeoutError
 *
 * @example
 * ```ts
 * const result = await timeout(fetch('/api/slow'), 5000)
 *
 * if (isErr(result) && result.error instanceof TimeoutError) {
 *   console.log('Request timed out after 5 seconds')
 * }
 * ```
 */
export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<Result<T, TimeoutError>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(ms))
    }, ms)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    return ok(result)
  } catch (error) {
    if (error instanceof TimeoutError) {
      return err(error)
    }
    throw error
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}
