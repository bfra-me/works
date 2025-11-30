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
