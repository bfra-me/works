import {isInCI} from './ci'
import {isInGitLifecycle} from './git'
import {hasNonEmptyEnv} from './helpers'

/**
 * Check if the process is running in an editor environment.
 * Detects VS Code, JetBrains IDEs, Vim, and Neovim.
 *
 * @returns True if running in an editor environment
 *
 * @example
 * ```ts
 * if (isInEditorEnv()) {
 *   // Adjust behavior for editor context
 * }
 * ```
 */
export function isInEditorEnv(): boolean {
  if (isInCI()) return false
  if (isInGitLifecycle()) return false

  return (
    hasNonEmptyEnv('VSCODE_PID') ||
    hasNonEmptyEnv('VSCODE_CWD') ||
    hasNonEmptyEnv('JETBRAINS_IDE') ||
    hasNonEmptyEnv('VIM') ||
    hasNonEmptyEnv('NVIM')
  )
}
