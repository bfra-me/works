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
  (typeof env.GIT_PARAMS === 'string' && env.GIT_PARAMS.length > 0) ||
  (typeof env.VSCODE_GIT_COMMAND === 'string' && env.VSCODE_GIT_COMMAND.length > 0) ||
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
  Boolean(
    (typeof env.VSCODE_PID === 'string' && env.VSCODE_PID.length > 0) ||
      (typeof env.VSCODE_CWD === 'string' && env.VSCODE_CWD.length > 0) ||
      (typeof env.JETBRAINS_IDE === 'string' && env.JETBRAINS_IDE.length > 0) ||
      (typeof env.VIM === 'string' && env.VIM.length > 0) ||
      (typeof env.NVIM === 'string' && env.NVIM.length > 0),
  )
