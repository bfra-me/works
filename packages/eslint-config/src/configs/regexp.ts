import type {Config} from '../config'
import type {OptionsOverrides} from '../options'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

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
  return requireOf(
    ['eslint-plugin-regexp'],
    async () => {
      const {configs} = await interopDefault(import('eslint-plugin-regexp'))
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
    },
    fallback,
  )
}
