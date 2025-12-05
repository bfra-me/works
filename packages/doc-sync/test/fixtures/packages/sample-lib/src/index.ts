/**
 * @module sample-lib
 * A sample library for testing documentation synchronization
 */

/**
 * Adds two numbers together
 * @param a - The first number to add
 * @param b - The second number to add
 * @returns The sum of a and b
 * @example
 * ```typescript
 * const result = add(2, 3)
 * console.log(result) // 5
 * ```
 */
export function add(a: number, b: number): number {
  return a + b
}

/**
 * Subtracts the second number from the first
 * @param a - The number to subtract from
 * @param b - The number to subtract
 * @returns The difference between a and b
 */
export function subtract(a: number, b: number): number {
  return a - b
}

/**
 * Multiplies two numbers
 * @param a - First factor
 * @param b - Second factor
 * @returns The product of a and b
 * @example
 * ```typescript
 * multiply(4, 5) // returns 20
 * ```
 * @since 1.0.0
 */
export function multiply(a: number, b: number): number {
  return a * b
}

/**
 * Divides the first number by the second
 * @param dividend - The number to divide
 * @param divisor - The number to divide by
 * @returns The quotient of dividend / divisor
 * @throws {Error} When divisor is zero
 * @deprecated Use `safeDivide` instead for better error handling
 */
export function divide(dividend: number, divisor: number): number {
  if (divisor === 0) {
    throw new Error('Cannot divide by zero')
  }
  return dividend / divisor
}

/**
 * Configuration options for the library
 */
export interface Config {
  /** Name of the configuration */
  readonly name: string
  /** Whether debug mode is enabled */
  readonly debug: boolean
  /** Maximum retry attempts */
  readonly maxRetries?: number
}

/**
 * Operation status codes
 */
export enum Status {
  /** Operation completed successfully */
  Success = 'success',
  /** Operation failed with an error */
  Error = 'error',
  /** Operation is in progress */
  Pending = 'pending',
}

/**
 * Result type for operations that may fail
 */
export type Result<T, E = Error> =
  | {readonly success: true; readonly data: T}
  | {readonly success: false; readonly error: E}

/**
 * A utility class for managing calculations
 */
export class Calculator {
  private value: number

  /**
   * Creates a new Calculator instance
   * @param initialValue - The starting value
   */
  constructor(initialValue = 0) {
    this.value = initialValue
  }

  /**
   * Gets the current value
   * @returns The current calculated value
   */
  getValue(): number {
    return this.value
  }

  /**
   * Adds a number to the current value
   * @param n - The number to add
   * @returns This calculator for chaining
   */
  add(n: number): this {
    this.value += n
    return this
  }

  /**
   * Resets the calculator to zero
   */
  reset(): void {
    this.value = 0
  }
}

export {add as sum}
