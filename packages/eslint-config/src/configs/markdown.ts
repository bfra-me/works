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
    ['@eslint/markdown', 'typescript-eslint'],
    async () => {
      const [pluginMarkdown, tselint] = await Promise.all([
        interopDefault(import('@eslint/markdown')),
        interopDefault(import('typescript-eslint')),
      ])

      // Get the processor configs
      const processorConfigs = Array.isArray(pluginMarkdown.configs?.processor)
        ? pluginMarkdown.configs.processor.map(config => ({
            ...config,
            name: `@bfra.me/${config.name || 'unnamed'}`,
            ...(config.name?.endsWith('processor') ? {files} : {}),
          }))
        : []

      // Create the markdown code blocks config with type-checking disabled
      const markdownCodeConfig: Config = {
        name: '@bfra.me/markdown/overrides',
        files: codeInMdFiles,
        languageOptions: {
          parserOptions: {
            // Explicitly disable project for these files to prevent type-aware linting
            project: false,
          },
        },
        rules: {
          // Only disable non-type-aware rules we want to skip for markdown code blocks
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
      }

      // If typescript-eslint has the disableTypeChecked config, use it
      if (tselint.configs?.disableTypeChecked) {
        // Apply the disableTypeChecked config settings to our config
        Object.assign(markdownCodeConfig, {
          // We use the settings from disableTypeChecked while maintaining our own rules
          languageOptions: {
            ...tselint.configs.disableTypeChecked.languageOptions,
          },
        })
      }

      return [...processorConfigs, markdownCodeConfig] as Config[]
    },
    fallback,
  )
}
