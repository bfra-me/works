/**
 * Main entry point for <%= it.name %> library.
 */

/**
 * A sample function that greets a user.
 *
 * @param name - The name to greet
 * @returns A greeting message
 *
 * @example
 * ```typescript
 * const message = greet('World')
 * console.log(message) // "Hello, World!"
 * ```
 */
export function greet(name: string): string {
  return `Hello, ${name}!`
}

/**
 * A sample utility function that adds two numbers.
 *
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 *
 * @example
 * ```typescript
 * const result = add(2, 3)
 * console.log(result) // 5
 * ```
 */
export function add(a: number, b: number): number {
  return a + b
}

// Export everything as default for convenience
export default {
  greet,
  add,
}
