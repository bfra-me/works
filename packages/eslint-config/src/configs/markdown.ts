import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

/**
 * Represents the options for configuring Markdown files in the ESLint configuration.
 */
export type MarkdownOptions = Flatten<OptionsFiles & OptionsOverrides>

export const mdFiles = [`*.md`].flatMap(p => [p, `**/${p}`])

export const codeInMdFiles = mdFiles.flatMap(p => [
  `${p}/*.js`,
  `${p}/*.jsx`,
  `${p}/*.cjs`,
  `${p}/*.mjs`,
  `${p}/*.ts`,
  `${p}/*.tsx`,
  `${p}/*.cts`,
  `${p}/*.mts`,
])

export const extInMdFiles = [
  ...codeInMdFiles,
  ...mdFiles.flatMap(p => [
    `${p}/*.json`,
    `${p}/*.json5`,
    `${p}/*.jsonc`,
    `${p}/*.toml`,
    `${p}/*.yml`,
    `${p}/*.yaml`,
    `${p}/*.vue`,
    `${p}/*.svelte`,
    `${p}/*.astro`,
  ]),
]

/**
 * Configures the ESLint rules for Markdown files.
 * @param options - The configuration options for Markdown files.
 * @see https://eslint.github.io/eslint-plugin-markdown/
 */
export async function markdown(options: MarkdownOptions = {}): Promise<Config[]> {
  const {files = mdFiles, overrides = {}} = options
  return requireOf(
    ['@eslint/markdown'],
    async () => {
      const pluginMarkdown = await interopDefault(import('@eslint/markdown'))
      return [
        ...(Array.isArray(pluginMarkdown.configs?.processor)
          ? pluginMarkdown.configs.processor.map(config => ({
              ...config,
              name: `@bfra.me/${config.name || 'unnamed'}`,
              ...(config.name?.endsWith('processor') ? {files} : {}),
            }))
          : []),

        {
          name: '@bfra.me/markdown/overrides',
          files: codeInMdFiles,
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
      ] as Config[]
    },
    fallback,
  )
}
