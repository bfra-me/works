import type {Result} from '../result/types'
import {err, ok} from '../result/factories'
import {sleep} from './sleep'

/**
 * Options for the retry function.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  readonly maxAttempts?: number
  /** Initial delay between retries in milliseconds */
  readonly initialDelay?: number
  /** Maximum delay between retries in milliseconds */
  readonly maxDelay?: number
  /** Exponential backoff factor */
  readonly backoffFactor?: number
  /** Optional function to determine if an error should be retried */
  readonly shouldRetry?: (error: Error, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 10000,
  backoffFactor: 2,
}

/**
 * Retries a function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns A Result containing the successful value or the last error
 *
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 100,
 *     shouldRetry: (error) => error.message !== 'Not Found'
 *   }
 * )
 *
 * if (isOk(result)) {
 *   console.log(result.data)
 * }
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<Result<T, Error>> {
  const {maxAttempts, initialDelay, maxDelay, backoffFactor} = {...DEFAULT_OPTIONS, ...options}
  const {shouldRetry} = options

  let lastError: Error = new Error('No attempts made')
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      return ok(result)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt >= maxAttempts) {
        break
      }

      if (shouldRetry !== undefined && !shouldRetry(lastError, attempt)) {
        break
      }

      await sleep(delay)
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  return err(lastError)
}
