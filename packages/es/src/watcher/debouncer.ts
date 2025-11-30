/**
 * A debouncer that batches items and emits them after a delay.
 */
export interface Debouncer<T> {
  /** Add an item to be debounced */
  readonly add: (item: T) => void
  /** Flush all pending items immediately */
  readonly flush: () => void
  /** Cancel all pending items without emitting */
  readonly cancel: () => void
}

/**
 * Creates a debouncer that batches items and emits them after a delay.
 *
 * @param fn - The function to call with batched items
 * @param ms - The debounce delay in milliseconds
 * @returns A Debouncer instance
 */
export function createDebouncer<T>(fn: (items: T[]) => void, ms: number): Debouncer<T> {
  let items: T[] = []
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  function flush(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    if (items.length > 0) {
      const batch = items
      items = []
      fn(batch)
    }
  }

  function cancel(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    items = []
  }

  function add(item: T): void {
    items.push(item)
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(flush, ms)
  }

  return {add, flush, cancel}
}
