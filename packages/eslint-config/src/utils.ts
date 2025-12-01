import type {Awaitable} from 'eslint-flat-config-utils'
import {fileURLToPath} from 'node:url'
import {
  interopDefault as esInteropDefault,
  isInEditorEnv as esIsInEditorEnv,
  isInGitLifecycle as esIsInGitLifecycle,
} from '@bfra.me/es'
import {isPackageExists} from 'local-pkg'

const scopeUrl = fileURLToPath(new URL('.', import.meta.url))

/**
 * Unwraps the default export from a module.
 * Handles both ES modules with default exports and CommonJS modules.
 *
 * @deprecated Use `interopDefault` from `@bfra.me/es/module` instead.
 * This function is re-exported for backward compatibility and will be removed in a future major version.
 *
 * @param m - The module or promise of a module to unwrap
 * @returns The unwrapped default export
 */
/* #__NO_SIDE_EFFECTS__ */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  return esInteropDefault(m)
}

/**
 * Check if a package exists within the eslint-config package scope.
 *
 * @param name - The package name to check
 * @returns True if the package exists within this package's scope
 */
export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, {paths: [scopeUrl]})
}

/**
 * Check if the process is running in a Git hook or under lint-staged.
 *
 * @deprecated Use `isInGitLifecycle` from `@bfra.me/es/env` instead.
 * This function is re-exported for backward compatibility and will be removed in a future major version.
 *
 * @returns True if running in a git lifecycle context
 */
export function isInGitLifecycle(): boolean {
  return esIsInGitLifecycle()
}

/**
 * Check if the process is running in an editor environment.
 * Detects VS Code, JetBrains IDEs, Vim, and Neovim.
 *
 * @deprecated Use `isInEditorEnv` from `@bfra.me/es/env` instead.
 * This function is re-exported for backward compatibility and will be removed in a future major version.
 *
 * @returns True if running in an editor environment
 */
export function isInEditorEnv(): boolean {
  return esIsInEditorEnv()
}
