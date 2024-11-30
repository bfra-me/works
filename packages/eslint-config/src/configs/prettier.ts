import type {Config} from '../config'
import type {Flatten, OptionsIsInEditor, OptionsOverrides} from '../options'
import {interopDefault} from '../plugins'

/**
 * Represents the options for the ESLint Prettier configuration.
 */
export type PrettierOptions = Flatten<OptionsIsInEditor & OptionsOverrides>

/**
 * Generates an ESLint configuration for Prettier.
 * @param options - The options for the Prettier configuration.
 * @returns An array of ESLint configurations.
 */
export async function prettier(options: PrettierOptions = {}): Promise<Config[]> {
  const {isInEditor, overrides} = options
  const [configPrettier, pluginPrettier] = await Promise.all([
    interopDefault(import('eslint-config-prettier')),
    interopDefault(import('eslint-plugin-prettier')),
  ])

  return [
    {
      name: '@bfra.me/prettier',
      plugins: {
        prettier: pluginPrettier,
      },
      rules: {
        ...configPrettier.rules,
        ...(pluginPrettier.configs?.recommended as Config).rules,

        ...(isInEditor ? {} : {'prettier/prettier': 'error'}),

        ...overrides,
      },
    },
  ]
}
