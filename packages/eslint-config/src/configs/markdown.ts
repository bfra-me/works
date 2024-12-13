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
                  ...(typeof prettier !== 'boolean' ? prettier : {}),
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
