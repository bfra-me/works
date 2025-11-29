import type {Awaitable} from 'eslint-flat-config-utils'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import isInCI from 'is-in-ci'
import {isPackageExists} from 'local-pkg'

const scopeUrl = fileURLToPath(new URL('.', import.meta.url))

/* #__NO_SIDE_EFFECTS__ */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return typeof resolved === 'object' && resolved !== null && 'default' in resolved
    ? interopDefault(resolved.default as Awaitable<T>)
    : (resolved as T extends {default: infer U} ? U : T)
}

export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, {paths: [scopeUrl]})
}

/**
 * Check if the process is running in a Git hook or under lint-staged.
 *
 * @example
 * ```ts
 * import {isInGitLifecycle} from '@bfra.me/eslint-config'
 *
 * if (isInGitLifecycle) {
 *   console.log('Running in a Git hook or under lint-staged')
 * }
 * ```
 */
export function isInGitLifecycle(): boolean {
  return !!(
    false ||
    (typeof process.env.GIT_PARAMS === 'string' && process.env.GIT_PARAMS.length > 0) ||
    (typeof process.env.VSCODE_GIT_COMMAND === 'string' &&
      process.env.VSCODE_GIT_COMMAND.length > 0) ||
    process.env.npm_lifecycle_script?.startsWith('lint-staged') ||
    process.env.npm_lifecycle_script?.startsWith('nano-staged')
  )
}

/**
 * Check if the process is running in an editor.
 *
 * @example
 * ```ts
 * import {isInEditor} from '@bfra.me/eslint-config'
 *
 * if (isInEditor) {
 *   console.log('Running in an editor')
 * }
 */
export function isInEditorEnv(): boolean {
  if (isInCI) return false
  if (isInGitLifecycle()) return false

  return !!(
    false ||
    (typeof process.env.VSCODE_PID === 'string' && process.env.VSCODE_PID.length > 0) ||
    (typeof process.env.VSCODE_CWD === 'string' && process.env.VSCODE_CWD.length > 0) ||
    (typeof process.env.JETBRAINS_IDE === 'string' && process.env.JETBRAINS_IDE.length > 0) ||
    (typeof process.env.VIM === 'string' && process.env.VIM.length > 0) ||
    (typeof process.env.NVIM === 'string' && process.env.NVIM.length > 0)
  )
}
