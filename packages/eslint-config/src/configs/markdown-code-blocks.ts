import type {Config} from '../config'
import type {MarkdownCodeBlockOptions} from './markdown'
import {GLOB_MARKDOWN_FILES} from '../globs'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configures ESLint rules for code blocks extracted from Markdown files.
 *
 * Code blocks in documentation are treated differently from production code because
 * they serve as examples and may intentionally show incomplete or simplified patterns.
 * This configuration relaxes rules that would be inappropriate for documentation snippets.
 *
 * @param options - Code block processing options
 * @returns ESLint configuration array for Markdown code blocks
 *
 * @see {@link https://github.com/eslint/markdown | @eslint/markdown}
 */
export async function markdownCodeBlocks(
  options: MarkdownCodeBlockOptions = {},
): Promise<Config[]> {
  const {javascript = true, json = true, jsx = true, typescript = true, yaml = true} = options

  const configs: Config[] = []

  if (typescript || javascript || jsx) {
    const tsJsConfig = await requireOf(
      ['typescript-eslint'],
      async (): Promise<Config[]> => {
        const tselint = await interopDefault(import('typescript-eslint'))

        const tsJsFiles: string[] = []
        if (typescript) {
          tsJsFiles.push(
            ...GLOB_MARKDOWN_FILES.flatMap(p => [`${p}/*.ts`, `${p}/*.cts`, `${p}/*.mts`]),
          )
        }
        if (typescript || jsx) {
          tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/*.tsx`))
        }
        if (javascript) {
          tsJsFiles.push(
            ...GLOB_MARKDOWN_FILES.flatMap(p => [`${p}/*.js`, `${p}/*.cjs`, `${p}/*.mjs`]),
          )
        }
        if (javascript || jsx) {
          tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/*.jsx`))
        }

        return [
          {
            name: '@bfra.me/markdown/code-blocks/typescript-javascript',
            files: tsJsFiles,
            languageOptions: {
              parser: tselint.parser,
              parserOptions: {
                ecmaFeatures: {
                  impliedStrict: true,
                  jsx: jsx || javascript,
                },
                ecmaVersion: 'latest',
                // Type-aware rules disabled: documentation snippets lack tsconfig context
                project: null,
                sourceType: 'module',
              },
            },
            rules: {
              '@typescript-eslint/no-namespace': 'off',
              // Stylistic: documentation examples prioritize readability over formatting consistency
              '@stylistic/comma-dangle': 'off',
              '@stylistic/eol-last': 'off',

              '@stylistic/padding-line-between-statements': 'off',
              // TypeScript: examples may show incomplete patterns or use legacy syntax
              '@typescript-eslint/consistent-type-imports': 'off',
              '@typescript-eslint/explicit-function-return-type': 'off',
              '@typescript-eslint/no-redeclare': 'off',
              '@typescript-eslint/no-require-imports': 'off',
              '@typescript-eslint/no-unused-expressions': 'off',
              '@typescript-eslint/no-unused-vars': 'off',
              '@typescript-eslint/no-use-before-define': 'off',
              '@typescript-eslint/no-var-requires': 'off',

              // Imports: snippets are isolated and don't need import organization
              'import-x/newline-after-import': 'off',

              // JSDoc: examples demonstrate usage, not full API documentation
              'jsdoc/require-returns-check': 'off',

              // Core: examples may demonstrate concepts like console logging or alerts
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
            },
          },
        ]
      },
      fallback,
    )

    configs.push(...tsJsConfig)
  }

  if (json) {
    const jsonConfig = await requireOf(
      ['eslint-plugin-jsonc'],
      async (): Promise<Config[]> => {
        const pluginJsonc = await interopDefault(import('eslint-plugin-jsonc'))

        // Use plugin's base config to inherit parser configuration
        const baseConfigs = pluginJsonc.configs['flat/base'] as unknown as Config[]

        return [
          {
            name: '@bfra.me/markdown/code-blocks/json',
            files: GLOB_MARKDOWN_FILES.flatMap(p => [
              `${p}/*.json`,
              `${p}/*.json5`,
              `${p}/*.jsonc`,
            ]),
            languageOptions: baseConfigs[0]?.languageOptions ?? {},
            rules: {
              // Examples may show JSON with trailing commas or explanatory comments
              'jsonc/comma-dangle': 'off',
              'jsonc/no-comments': 'off',
            },
          },
        ]
      },
      fallback,
    )

    configs.push(...jsonConfig)
  }

  if (yaml) {
    const yamlConfig = await requireOf(
      ['eslint-plugin-yml'],
      async (): Promise<Config[]> => {
        const pluginYaml = await interopDefault(import('eslint-plugin-yml'))

        // Use plugin's standard config to inherit parser configuration
        const standardConfigs = pluginYaml.configs['flat/standard'] as Config[]

        return [
          {
            name: '@bfra.me/markdown/code-blocks/yaml',
            files: GLOB_MARKDOWN_FILES.flatMap(p => [`${p}/*.yml`, `${p}/*.yaml`]),
            languageOptions: standardConfigs[0]?.languageOptions ?? {},
            rules: {
              // Examples may show incomplete YAML mappings to focus on specific concepts
              'yml/no-empty-mapping-value': 'off',
            },
          },
        ]
      },
      fallback,
    )

    configs.push(...yamlConfig)
  }

  return configs
}
