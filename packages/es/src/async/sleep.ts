/**
 * Returns a promise that resolves after the specified delay.
 *
 * @param ms - The delay in milliseconds
 * @returns A promise that resolves after the delay
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
