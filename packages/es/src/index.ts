/**
 * @bfra.me/es - High-quality reusable types and utilities for ES development
 *
 * This package provides a comprehensive set of utilities for ES (JavaScript/TypeScript)
 * development including Result types, functional utilities, module interop, and more.
 *
 * Subpath exports are available for tree-shaking:
 * - @bfra.me/es/result - Result type for error handling
 * - @bfra.me/es/functional - Functional programming utilities
 * - @bfra.me/es/module - Module interoperability utilities
 * - @bfra.me/es/types - Type utilities including branded types
 * - @bfra.me/es/async - Async utilities
 * - @bfra.me/es/validation - Validation utilities
 * - @bfra.me/es/error - Error factory utilities
 * - @bfra.me/es/watcher - File watcher abstraction
 * - @bfra.me/es/env - Environment detection utilities
 */

// Async utilities
export {pAll, pLimit} from './async/concurrency'
export {debounce} from './async/debounce'
export {retry} from './async/retry'
export type {RetryOptions} from './async/retry'
export {sleep} from './async/sleep'
export {throttle} from './async/throttle'
export {timeout, TimeoutError} from './async/timeout'

// Environment detection
export {isInCI} from './env/ci'
export {isInEditorEnv} from './env/editor'
export {isInGitLifecycle} from './env/git'
export {getEnvironment, isBrowser, isDeno, isNode} from './env/runtime'
export type {EnvironmentInfo} from './env/runtime'

// Error utilities
export {BaseError} from './error/base'
export type {ErrorContext} from './error/base'
export {createError, formatError, withErrorContext} from './error/factory'
export {
  NotFoundError,
  PermissionError,
  ValidationError as ValidationErrorClass,
} from './error/specialized'

// Functional utilities
export {compose} from './functional/compose'
export {constant} from './functional/constant'
export {curry} from './functional/curry'
export type {Curried} from './functional/curry'
export {flip} from './functional/flip'
export {identity} from './functional/identity'
export {noop, noopAsync} from './functional/noop'
export {partial} from './functional/partial'
export {pipe} from './functional/pipe'
export {tap} from './functional/tap'

// Module utilities
export {
  dynamicImport,
  interopDefault,
  isESModule,
  isPackageInScope,
  resolveModule,
} from './module/interop'
export type {Awaitable, IsPackageInScopeOptions} from './module/interop'

// Result types and utilities
export {err, ok} from './result/factories'
export {isErr, isOk} from './result/guards'
export {
  flatMap,
  fromPromise,
  fromThrowable,
  map,
  mapErr,
  unwrap,
  unwrapOr,
} from './result/operators'
export type {Err, Ok, Result} from './result/types'

// Type utilities
export {assertType} from './types/assertions'
export {brand, unbrand} from './types/brand'
export type {Brand, NonEmptyString, Opaque, PositiveInteger} from './types/brand'
export {
  hasProperty,
  isArray,
  isFunction,
  isNonNullable,
  isNumber,
  isObject,
  isString,
} from './types/guards'

// Validation utilities
export {isWithinBoundary, validatePath} from './validation/path'
export type {PathValidationOptions, ValidationError, ValidPath} from './validation/path'
export {sanitizeInput} from './validation/sanitize'
export type {SanitizeOptions} from './validation/sanitize'
export {combineValidators, createValidator, fromGuard} from './validation/validator'
export type {
  ValidationRule,
  ValidationSchema,
  Validator,
  ValidatorOptions,
} from './validation/validator'
export {isEmail, isSemver, isUrl, isUuid} from './validation/validators'

// Watcher utilities (requires chokidar peer dependency)
export {createChangeDetector} from './watcher/change-detector'
export {createDebouncer} from './watcher/debouncer'
export type {Debouncer} from './watcher/debouncer'
export {createFileWatcher} from './watcher/file-watcher'
export {createFileHasher} from './watcher/hasher'
export type {
  ChangeDetector,
  ChangeDetectorOptions,
  FileChange,
  FileHasher,
  FileWatcher,
  WatcherEvent,
  WatcherOptions,
} from './watcher/types'
