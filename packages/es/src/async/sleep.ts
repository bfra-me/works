/**
 * Returns a promise that resolves after the specified delay.
 *
 * @param ms - The delay in milliseconds
 * @returns A promise that resolves after the delay
 *
 * @example
 * ```ts
 * await sleep(1000)  // Wait 1 second
 * console.log('One second later')
 * ```
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
