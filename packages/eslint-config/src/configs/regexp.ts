import type {Config} from '../config'
import type {OptionsOverrides} from '../options'
import {configs} from 'eslint-plugin-regexp'

/**
 * Represents the options for configuring RegExp linting rules.
 */
export type RegexpOptions = OptionsOverrides

/**
 * Configures the ESLint rules for RegExp linting.
 * @param options - The configuration options for RegExp linting.
 * @see https://ota-meshi.github.io/eslint-plugin-regexp/
 */
export async function regexp(options: RegexpOptions = {}): Promise<Config[]> {
  const config = configs['flat/recommended'] as Config
  return [
    {
      ...config,
      name: '@bfra.me/regexp',
      rules: {
        ...config.rules,
        ...options.overrides,
      },
    },
  ]
}
