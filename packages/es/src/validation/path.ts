import type {Result} from '../result/types'
import type {Brand} from '../types/brand'
import {err, ok} from '../result/factories'

/**
 * A validated file path that has been checked for safety.
 */
export type ValidPath = Brand<string, 'ValidPath'>

/**
 * Error returned when validation fails.
 */
export interface ValidationError {
  readonly code: string
  readonly message: string
  readonly field?: string
}

/**
 * Options for path validation.
 */
export interface PathValidationOptions {
  /** Allow relative paths (default: true) */
  readonly allowRelative?: boolean
  /** Allow absolute paths (default: true) */
  readonly allowAbsolute?: boolean
  /** Maximum path length (default: 4096) */
  readonly maxLength?: number
}

const TRAVERSAL_PATTERNS = [/\.\.\//, /\.\.\\/, /^\.\.$/]

/**
 * Validates a path for safety, checking for traversal attacks.
 *
 * @param path - The path to validate
 * @param options - Validation options
 * @returns A Result containing a ValidPath or a ValidationError
 *
 * @example
 * ```ts
 * const result = validatePath('../etc/passwd')
 * if (isErr(result)) {
 *   console.log(result.error.code)  // 'PATH_TRAVERSAL'
 * }
 *
 * const valid = validatePath('src/index.ts')
 * // valid: Ok<ValidPath>
 * ```
 */
export function validatePath(
  path: string,
  options: PathValidationOptions = {},
): Result<ValidPath, ValidationError> {
  const {allowRelative = true, allowAbsolute = true, maxLength = 4096} = options

  if (path.length === 0) {
    return err({code: 'EMPTY_PATH', message: 'Path cannot be empty'})
  }

  if (path.length > maxLength) {
    return err({code: 'PATH_TOO_LONG', message: `Path exceeds maximum length of ${maxLength}`})
  }

  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(path)) {
      return err({code: 'PATH_TRAVERSAL', message: 'Path contains directory traversal sequences'})
    }
  }

  const isAbsolute = path.startsWith('/') || /^[a-z]:[\\/]/i.test(path)

  if (isAbsolute && !allowAbsolute) {
    return err({code: 'ABSOLUTE_NOT_ALLOWED', message: 'Absolute paths are not allowed'})
  }

  if (!isAbsolute && !allowRelative) {
    return err({code: 'RELATIVE_NOT_ALLOWED', message: 'Relative paths are not allowed'})
  }

  return ok(path as ValidPath)
}

/**
 * Checks if a path is within a specified boundary directory.
 *
 * @param path - The path to check
 * @param boundary - The boundary directory
 * @returns True if the path is within the boundary
 *
 * @example
 * ```ts
 * isWithinBoundary('/app/uploads/file.txt', '/app/uploads')  // true
 * isWithinBoundary('/etc/passwd', '/app/uploads')            // false
 * ```
 */
export function isWithinBoundary(path: string, boundary: string): boolean {
  const normalizedPath = path.replaceAll('\\', '/').replaceAll(/\/+/g, '/')
  const normalizedBoundary = boundary.replaceAll('\\', '/').replaceAll(/\/+/g, '/')

  const boundaryWithSlash = normalizedBoundary.endsWith('/')
    ? normalizedBoundary
    : `${normalizedBoundary}/`

  return normalizedPath.startsWith(boundaryWithSlash) || normalizedPath === normalizedBoundary
}
