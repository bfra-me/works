import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {mergeProcessors, processorPassThrough} from 'eslint-merge-processors'
import {GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN} from '../globs'
import {plainParser} from '../parsers/plain-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Represents the options for configuring Markdown files in the ESLint configuration.
 */
export type MarkdownOptions = Flatten<OptionsFiles & OptionsOverrides>

/**
 * Configures the ESLint rules for Markdown files.
 * @param options - The configuration options for Markdown files.
 * @see https://eslint.github.io/eslint-plugin-markdown/
 */
export async function markdown(options: MarkdownOptions = {}): Promise<Config[]> {
  const {files = [GLOB_MARKDOWN], overrides = {}} = options
  return requireOf(
    ['@eslint/markdown'],
    async (): Promise<Config[]> => {
      const markdown = await interopDefault(import('@eslint/markdown'))

      return [
        {
          name: '@bfra.me/markdown/plugin',
          plugins: {
            markdown,
          },
        },
        {
          name: '@bfra.me/markdown/processor',
          files,
          ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
          // `eslint-plugin-markdown` only creates virtual files for code blocks,
          // but not the markdown file itself. We use `eslint-merge-processors` to
          // add a pass-through processor for the markdown file itself.
          processor: mergeProcessors([markdown.processors.markdown, processorPassThrough]),
        },
        {
          name: '@bfra.me/markdown/code-blocks',
          files,
          languageOptions: {
            parser: plainParser,
          },
        },
        {
          name: '@bfra.me/markdown/disabled',
          files,
          rules: {
            'unicorn/filename-case': 'off',
          },
        },
        {
          name: '@bfra.me/markdown/overrides',
          files: [GLOB_MARKDOWN_CODE],
          languageOptions: {
            parserOptions: {
              ecmaFeatures: {
                impliedStrict: true,
              },
            },
          },
          rules: {
            // Only disable non-type-aware rules we want to skip for markdown code blocks

            '@typescript-eslint/no-namespace': 'off',

            '@stylistic/comma-dangle': 'off',
            '@stylistic/eol-last': 'off',
            '@stylistic/padding-line-between-statements': 'off',

            '@typescript-eslint/consistent-type-imports': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-redeclare': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-var-requires': 'off',

            'import-x/newline-after-import': 'off',

            'jsdoc/require-returns-check': 'off',

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

            'node/prefer-global/process': 'off',

            'unicode-bom': 'off',

            'unused-imports/no-unused-imports': 'off',
            'unused-imports/no-unused-vars': 'off',

            ...overrides,
          },
        },
      ]
    },
    fallback,
  )
}
