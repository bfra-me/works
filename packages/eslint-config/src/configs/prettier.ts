import type {Config} from '../config'
import type {Flatten, OptionsIsInEditor, OptionsOverrides} from '../options'
import process from 'node:process'
import {isPackageExists} from 'local-pkg'
import {GLOB_EXT_IN_MARKDOWN_FILES, GLOB_MARKDOWN_FILES, GLOB_TOML_FILES} from '../globs'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

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
  return requireOf(
    ['eslint-config-prettier', 'eslint-plugin-prettier', 'prettier'],
    async () => {
      // Disable deprecated rules before importing eslint-config-prettier
      process.env.ESLINT_CONFIG_PRETTIER_NO_DEPRECATED ??= 'true'
      const [configPrettier, pluginPrettier, pluginJsonc, pluginYaml] = await Promise.all([
        interopDefault(import('eslint-config-prettier')),
        interopDefault(import('eslint-plugin-prettier')),
        isPackageExists('eslint-plugin-jsonc')
          ? interopDefault(import('eslint-plugin-jsonc'))
          : Promise.resolve(undefined),
        isPackageExists('eslint-plugin-yml')
          ? interopDefault(import('eslint-plugin-yml'))
          : Promise.resolve(undefined),
      ])

      return [
        {
          name: '@bfra.me/prettier',
          plugins: {
            prettier: pluginPrettier,
          },
          rules: {
            'prettier/prettier': isInEditor ? 'warn' : 'error',

            ...configPrettier.rules,

            ...(pluginJsonc?.configs.prettier.rules as OptionsOverrides['overrides']),

            'toml/array-bracket-newline': 'off',
            'toml/array-bracket-spacing': 'off',
            'toml/array-element-newline': 'off',
            'toml/indent': 'off',
            'toml/inline-table-curly-spacing': 'off',
            'toml/key-spacing': 'off',
            'toml/table-bracket-spacing': 'off',

            ...(pluginYaml?.configs.prettier.rules as OptionsOverrides['overrides']),

            ...overrides,
          },
        },
        {
          name: '@bfra.me/prettier/markdown',
          files: GLOB_MARKDOWN_FILES,
          rules: {
            'prettier/prettier': [
              'error',
              {
                embeddedLanguageFormatting: 'off',
                parser: 'markdown',
              },
            ],
          },
        },
        {
          name: '@bfra.me/prettier/toml',
          files: GLOB_TOML_FILES,
          rules: {
            // TODO: Detect if the TOML plugin for Prettier is installed
            // and if so, use the Prettier rules
            'prettier/prettier': 'off',
          },
        },
        {
          name: '@bfra.me/prettier/overrides',
          files: GLOB_EXT_IN_MARKDOWN_FILES,
          rules: {
            'prettier/prettier': 'off',
          },
        },
      ] as Config[]
    },
    fallback,
  )
}
