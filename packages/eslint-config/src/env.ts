import {env} from 'node:process'
import isInCI from 'is-in-ci'

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
export const isInGitLifecycle = !!(
  env.GIT_PARAMS ||
  env.VSCODE_GIT_COMMAND ||
  env.npm_lifecycle_script?.startsWith('lint-staged')
)

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
export const isInEditor =
  !isInCI &&
  !isInGitLifecycle &&
  !!(env.VSCODE_PID || env.VSCODE_CWD || env.JETBRAINS_IDE || env.VIM || env.NVIM)
