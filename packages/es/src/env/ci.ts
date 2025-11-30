import process from 'node:process'

/**
 * Check if the process is running in a CI environment.
 * This is a placeholder that will be enhanced to use is-in-ci package.
 */
export function isInCI(): boolean {
  const env = process.env
  return (
    env.CI !== undefined ||
    env.CONTINUOUS_INTEGRATION !== undefined ||
    env.GITHUB_ACTIONS !== undefined ||
    env.GITLAB_CI !== undefined ||
    env.CIRCLECI !== undefined ||
    env.TRAVIS !== undefined
  )
}
