/**
 * Creates a throttled version of a function that only invokes
 * at most once per the specified milliseconds.
 *
 * @param fn - The function to throttle
 * @param ms - The throttle interval in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): ((...args: Parameters<T>) => void) & {cancel: () => void} {
  let lastCallTime: number | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined

  const throttled = (...args: Parameters<T>): void => {
    const now = Date.now()

    if (lastCallTime === undefined || now - lastCallTime >= ms) {
      lastCallTime = now
      fn(...args)
    } else {
      lastArgs = args
      if (timeoutId === undefined) {
        const remaining = ms - (now - lastCallTime)
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now()
          timeoutId = undefined
          if (lastArgs !== undefined) {
            fn(...(lastArgs as unknown[]))
            lastArgs = undefined
          }
        }, remaining)
      }
    }
  }

  throttled.cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    lastArgs = undefined
  }

  return throttled
}
