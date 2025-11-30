import process from 'node:process'

import {hasNonEmptyEnv} from './helpers'

/**
 * Check if the process is running in a Git hook or under lint-staged.
 */
export function isInGitLifecycle(): boolean {
  const lifecycleScript = process.env.npm_lifecycle_script
  const isLintStaged =
    typeof lifecycleScript === 'string' &&
    (lifecycleScript.startsWith('lint-staged') || lifecycleScript.startsWith('nano-staged'))

  return hasNonEmptyEnv('GIT_PARAMS') || hasNonEmptyEnv('VSCODE_GIT_COMMAND') || isLintStaged
}
