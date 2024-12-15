import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsPrettier} from '../options'
import {GLOB_MARKDOWN, GLOB_MARKDOWN_CODE} from '../globs'
import {interopDefault} from '../plugins'

/**
 * Represents the options for configuring Markdown files in the ESLint configuration.
 */
export type MarkdownOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsPrettier>

/**
 * Configures the ESLint rules for Markdown files.
 * @param options - The configuration options for Markdown files.
 * @see https://eslint.github.io/eslint-plugin-markdown/
 */
export async function markdown(options: MarkdownOptions = {}): Promise<Config[]> {
  const {files = [GLOB_MARKDOWN], overrides = {}, prettier = true} = options
  const pluginMarkdown = await interopDefault(import('@eslint/markdown'))
  return [
    ...(Array.isArray(pluginMarkdown.configs?.processor)
      ? pluginMarkdown.configs.processor.map(config => ({
          ...config,
          name: `@bfra.me/${config.name || 'unnamed'}`,
        }))
      : []),

    {
      name: '@bfra.me/markdown/overrides',
      files: [GLOB_MARKDOWN_CODE],
      rules: {
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/comma-dangle': 'off',
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',

        'import-x/newline-after-import': 'off',

        'no-alert': 'off',
        'no-console': 'off',
        'no-labels': 'off',
        'no-lone-blocks': 'off',
        'no-restricted-imports': 'off',
        'no-restricted-syntax': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-labels': 'off',

        'no-unused-vars': 'off',

        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': 'off',

        ...overrides,
      },
    },

    ...(prettier
      ? [
          {
            name: '@bfra.me/markdown/prettier',
            files,
            rules: {
              'prettier/prettier': [
                'error',
                {
                  ...(prettier === true ? {} : prettier),
                  embeddedLanguageFormatting: 'off',
                  parser: 'markdown',
                },
              ] as const,
            },
          },
        ]
      : []),
  ] as Config[]
}
