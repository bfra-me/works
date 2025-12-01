/**
 * Creates a debounced version of a function that delays invocation
 * until after the specified milliseconds have elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param ms - The debounce delay in milliseconds
 * @returns A debounced version of the function with a cancel method
 *
 * @example
 * ```ts
 * const saveInput = debounce((value: string) => {
 *   localStorage.setItem('draft', value)
 * }, 300)
 *
 * input.addEventListener('input', e => saveInput(e.target.value))
 *
 * // Cancel pending invocation
 * saveInput.cancel()
 * ```
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): ((...args: Parameters<T>) => void) & {cancel: () => void} {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: Parameters<T>): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = undefined
    }, ms)
  }

  debounced.cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}
