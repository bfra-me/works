import type {Result} from '../result/types'
import {err, ok} from '../result/factories'

/**
 * Creates a concurrency limiter that restricts the number of concurrent operations.
 *
 * @param concurrency - Maximum number of concurrent operations
 * @returns A function that queues operations to respect the concurrency limit
 */
export function pLimit(concurrency: number): <T>(fn: () => Promise<T>) => Promise<T> {
  if (concurrency < 1) {
    throw new Error('Concurrency must be at least 1')
  }

  let activeCount = 0
  const queue: (() => void)[] = []

  const next = (): void => {
    if (queue.length > 0 && activeCount < concurrency) {
      activeCount++
      const run = queue.shift()
      run?.()
    }
  }

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const run = (): void => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            activeCount--
            next()
          })
      }

      queue.push(run)
      next()
    })
  }
}

/**
 * Options for pAll.
 */
export interface PAllOptions {
  /** Maximum concurrent operations (default: Infinity) */
  readonly concurrency?: number
}

/**
 * Runs an array of promise-returning functions with optional concurrency control.
 *
 * @param tasks - Array of functions that return promises
 * @param options - Options including concurrency limit
 * @returns A Result containing an array of results or the first error
 */
export async function pAll<T>(
  tasks: readonly (() => Promise<T>)[],
  options: PAllOptions = {},
): Promise<Result<T[], Error>> {
  const {concurrency = Infinity} = options

  try {
    if (concurrency === Infinity) {
      const results = await Promise.all(tasks.map(async fn => fn()))
      return ok(results)
    }

    const limit = pLimit(concurrency)
    const results = await Promise.all(tasks.map(async fn => limit(fn)))
    return ok(results)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}
