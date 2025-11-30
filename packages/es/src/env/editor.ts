import process from 'node:process'

import {isInCI} from './ci'
import {isInGitLifecycle} from './git'

/**
 * Check if the process is running in an editor environment.
 * Detects VS Code, JetBrains IDEs, Vim, and Neovim.
 */
export function isInEditorEnv(): boolean {
  if (isInCI()) return false
  if (isInGitLifecycle()) return false

  const env = process.env
  const hasNonEmptyEnv = (key: string): boolean => {
    const value = env[key]
    return typeof value === 'string' && value.length > 0
  }

  return (
    hasNonEmptyEnv('VSCODE_PID') ||
    hasNonEmptyEnv('VSCODE_CWD') ||
    hasNonEmptyEnv('JETBRAINS_IDE') ||
    hasNonEmptyEnv('VIM') ||
    hasNonEmptyEnv('NVIM')
  )
}
