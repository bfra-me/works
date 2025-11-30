import type {Result} from '../result/types'
import {fileURLToPath} from 'node:url'
import {err, ok} from '../result/factories'

/**
 * Represents an awaitable value - either a value or a Promise of that value.
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Options for package scope checking.
 */
export interface IsPackageInScopeOptions {
  /**
   * The scope URL to check from. If not provided, uses the caller's module URL.
   * Can be a file URL string or a URL object.
   */
  scopeUrl?: string | URL
}

/**
 * Checks if a package exists within a specific scope (directory context).
 *
 * This is a generalized version that allows specifying the scope URL.
 * Useful for checking if a package is available from a specific location
 * in the file system, particularly in monorepo scenarios.
 *
 * @param name - The package name to check
 * @param options - Configuration options including the scope URL
 * @returns True if the package exists within the given scope
 */
export function isPackageInScope(name: string, options: IsPackageInScopeOptions = {}): boolean {
  const {scopeUrl} = options

  if (typeof name !== 'string' || name.trim().length === 0) {
    return false
  }

  let resolveFromPath: string | undefined

  if (scopeUrl != null) {
    if (typeof scopeUrl === 'string') {
      resolveFromPath = scopeUrl.startsWith('file://') ? fileURLToPath(scopeUrl) : scopeUrl
    } else if (scopeUrl instanceof URL) {
      resolveFromPath = fileURLToPath(scopeUrl)
    }
  }

  try {
    const resolvePaths = resolveFromPath == null ? undefined : {paths: [resolveFromPath]}
    require.resolve(name, resolvePaths)
    return true
  } catch {
    return false
  }
}

/**
 * Unwraps the default export from a module.
 * Handles both ES modules with default exports and CommonJS modules.
 *
 * @param m - The module or promise of a module to unwrap
 * @returns The unwrapped default export
 */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return typeof resolved === 'object' && resolved !== null && 'default' in resolved
    ? interopDefault(resolved.default as Awaitable<T>)
    : (resolved as T extends {default: infer U} ? U : T)
}

/**
 * Checks if a value is an ES module (has __esModule flag or is a Module object).
 *
 * @param module - The value to check
 * @returns True if the value appears to be an ES module
 */
export function isESModule(module: unknown): boolean {
  if (typeof module !== 'object' || module === null) {
    return false
  }
  return (
    '__esModule' in module ||
    (Symbol.toStringTag in module && module[Symbol.toStringTag] === 'Module')
  )
}

/**
 * Resolves a module specifier to its exports, returning a Result.
 *
 * @param specifier - The module specifier to resolve
 * @returns A Result containing the module exports or an error
 */
export async function resolveModule<T>(specifier: string): Promise<Result<T, Error>> {
  try {
    const module = (await import(specifier)) as T
    const resolved = await interopDefault(module)
    return ok(resolved as T)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Dynamically imports a module at the given path, returning a Result.
 *
 * @param path - The path to import
 * @returns A Result containing the module exports or an error
 */
export async function dynamicImport<T>(path: string): Promise<Result<T, Error>> {
  return resolveModule<T>(path)
}
