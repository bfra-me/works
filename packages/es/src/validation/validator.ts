import type {Result} from '../result/types'
import type {ValidationError} from './path'
import {err, ok} from '../result/factories'

/**
 * A validation rule that checks a value and returns an error message if invalid.
 */
export type ValidationRule<T> = (value: T) => string | undefined

/**
 * Schema definition for creating validators.
 * Maps field names to arrays of validation rules.
 */
export type ValidationSchema<T> = {
  readonly [K in keyof T]?: readonly ValidationRule<T[K]>[]
}

/**
 * A validator function created from a schema.
 */
export type Validator<T> = (value: unknown) => Result<T, ValidationError>

/**
 * Options for the createValidator factory.
 */
export interface ValidatorOptions {
  /** Whether to stop on first error (default: false, collect all errors) */
  readonly stopOnFirst?: boolean
}

/**
 * Creates a validator function from a validation schema.
 *
 * @param schema - Object mapping field names to validation rules
 * @param options - Validator options
 * @returns A validator function that returns a Result
 */
export function createValidator<T extends object>(
  schema: ValidationSchema<T>,
  options: ValidatorOptions = {},
): Validator<T> {
  const {stopOnFirst = false} = options

  return (value: unknown): Result<T, ValidationError> => {
    if (typeof value !== 'object' || value === null) {
      return err({
        code: 'INVALID_TYPE',
        message: 'Value must be an object',
      })
    }

    const record = value as Record<string, unknown>
    const errors: string[] = []

    for (const [field, rules] of Object.entries(schema)) {
      if (rules == null) continue

      const fieldValue = record[field]

      for (const rule of rules as readonly ((value: unknown) => string | undefined)[]) {
        const errorMessage = rule(fieldValue)
        if (errorMessage != null) {
          if (stopOnFirst) {
            return err({
              code: 'VALIDATION_FAILED',
              message: errorMessage,
              field,
            })
          }
          errors.push(`${field}: ${errorMessage}`)
        }
      }
    }

    if (errors.length > 0) {
      return err({
        code: 'VALIDATION_FAILED',
        message: errors.join('; '),
      })
    }

    return ok(record as T)
  }
}

/**
 * Creates a simple validator from a type guard function.
 *
 * @param guard - Type guard function
 * @param errorMessage - Error message when validation fails
 * @returns A validator function
 */
export function fromGuard<T>(
  guard: (value: unknown) => value is T,
  errorMessage: string,
): Validator<T> {
  return (value: unknown): Result<T, ValidationError> => {
    if (guard(value)) {
      return ok(value)
    }
    return err({
      code: 'TYPE_GUARD_FAILED',
      message: errorMessage,
    })
  }
}

/**
 * Combines multiple validators into one, running them in sequence.
 * Stops at the first validation failure.
 *
 * @param validators - Array of validators to combine
 * @returns A combined validator
 */
export function combineValidators<T>(...validators: readonly Validator<T>[]): Validator<T> {
  return (value: unknown): Result<T, ValidationError> => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.success) {
        return result
      }
    }

    const lastValidator = validators.at(-1)
    if (lastValidator != null) {
      return lastValidator(value)
    }

    return err({
      code: 'NO_VALIDATORS',
      message: 'No validators provided',
    })
  }
}
