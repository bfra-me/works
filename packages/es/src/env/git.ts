import process from 'node:process'

/**
 * Check if the process is running in a Git hook or under lint-staged.
 */
export function isInGitLifecycle(): boolean {
  const env = process.env
  const hasNonEmptyEnv = (key: string): boolean => {
    const value = env[key]
    return typeof value === 'string' && value.length > 0
  }

  const lifecycleScript = env.npm_lifecycle_script
  const isLintStaged =
    typeof lifecycleScript === 'string' &&
    (lifecycleScript.startsWith('lint-staged') || lifecycleScript.startsWith('nano-staged'))

  return hasNonEmptyEnv('GIT_PARAMS') || hasNonEmptyEnv('VSCODE_GIT_COMMAND') || isLintStaged
}
