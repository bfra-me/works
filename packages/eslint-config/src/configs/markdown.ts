import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {mergeProcessors, processorPassThrough} from 'eslint-merge-processors'
import {
  GLOB_JS,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_JSONC,
  GLOB_JSX,
  GLOB_MARKDOWN,
  GLOB_MARKDOWN_FILES,
  GLOB_MARKDOWN_IN_MARKDOWN,
  GLOB_TS,
  GLOB_TSX,
  GLOB_YAML,
} from '../globs'
import {plainParser} from '../parsers/plain-parser'
import {interopDefault} from '../utils'

/**
 * Markdown language mode for parsing.
 *
 * - `commonmark`: Standard CommonMark - strict, portable, widely compatible
 * - `gfm`: GitHub Flavored Markdown - adds tables, task lists, strikethrough, autolinks
 *
 * @example
 * ```typescript
 * // Use CommonMark for maximum portability
 * defineConfig({ markdown: { language: 'commonmark' } })
 *
 * // Use GFM for documentation sites
 * defineConfig({ markdown: { language: 'gfm' } })
 * ```
 *
 * @see {@link https://commonmark.org/ | CommonMark Specification}
 * @see {@link https://github.github.com/gfm/ | GitHub Flavored Markdown Specification}
 */
export type MarkdownLanguage = 'commonmark' | 'gfm'

/**
 * Frontmatter format options for Markdown files.
 *
 * Frontmatter is metadata at the beginning of a file, commonly used in static site generators.
 * When enabled, the parser extracts and validates the frontmatter block.
 *
 * @example
 * ```typescript
 * // YAML frontmatter (most common)
 * defineConfig({ markdown: { frontmatter: 'yaml' } })
 *
 * // TOML frontmatter
 * defineConfig({ markdown: { frontmatter: 'toml' } })
 *
 * // Disable frontmatter parsing
 * defineConfig({ markdown: { frontmatter: false } })
 * ```
 */
export type MarkdownFrontmatterOptions = false | 'yaml' | 'toml' | 'json'

/**
 * Code block processing configuration for Markdown files.
 *
 * Configure which languages are extracted and linted from code blocks,
 * including TypeScript, JavaScript, JSX, TSX, JSON, and YAML.
 *
 * @example
 * ```typescript
 * defineConfig({
 *   markdown: {
 *     codeBlocks: { typescript: true, javascript: true }
 *   }
 * })
 * ```
 */
export interface MarkdownCodeBlockOptions {
  /**
   * Enable TypeScript code block processing.
   *
   * @default true
   */
  typescript?: boolean

  /**
   * Enable JavaScript code block processing.
   *
   * @default true
   */
  javascript?: boolean

  /**
   * Enable JSX code block processing.
   *
   * @default true
   */
  jsx?: boolean

  /**
   * Enable JSON code block processing.
   *
   * @default true
   */
  json?: boolean

  /**
   * Enable YAML code block processing.
   *
   * @default true
   */
  yaml?: boolean
}

/**
 * Configuration options for Markdown linting.
 *
 * Provides control over Markdown parsing, frontmatter handling, code block extraction,
 * and rule configuration. Supports CommonMark and GitHub Flavored Markdown with optional
 * TypeScript-ESLint integration for code blocks.
 *
 * @example
 * ```typescript
 * // Documentation site with GFM and YAML frontmatter
 * defineConfig({
 *   markdown: {
 *     language: 'gfm',
 *     frontmatter: 'yaml',
 *     codeBlocks: { typescript: true, javascript: true }
 *   }
 * })
 *
 * // Simple README files
 * defineConfig({
 *   markdown: {
 *     language: 'commonmark',
 *     frontmatter: false,
 *     files: ['README.md']
 *   }
 * })
 * ```
 *
 * @see {@link https://github.com/eslint/markdown | @eslint/markdown}
 */
export interface MarkdownOptions extends Flatten<OptionsFiles & OptionsOverrides> {
  /**
   * Markdown language mode.
   *
   * Choose between CommonMark (standard) and GitHub Flavored Markdown (GFM).
   * GFM adds tables, task lists, strikethrough, and autolinks.
   *
   * @default 'gfm'
   */
  language?: MarkdownLanguage

  /**
   * Frontmatter format to parse from Markdown files.
   *
   * Frontmatter is metadata at the beginning of a file, commonly used in static site generators.
   * Set to `false` to disable frontmatter parsing.
   *
   * @default 'yaml'
   */
  frontmatter?: MarkdownFrontmatterOptions

  /**
   * Code block processing configuration.
   *
   * Configure which languages are extracted and linted from code blocks.
   *
   * @default true (enables all supported languages)
   */
  codeBlocks?: boolean | MarkdownCodeBlockOptions
}

/**
 * Configures ESLint rules for Markdown files with support for CommonMark/GFM,
 * frontmatter parsing, and optional code block extraction.
 *
 * @param options - Configuration options for Markdown linting
 * @returns ESLint configuration array
 *
 * @see {@link https://github.com/eslint/markdown | @eslint/markdown}
 */
export async function markdown(options: MarkdownOptions = {}): Promise<Config[]> {
  const {
    codeBlocks = true,
    files = [GLOB_MARKDOWN],
    frontmatter = 'yaml',
    language = 'gfm',
    overrides = {},
  } = options

  const markdown = await interopDefault(import('@eslint/markdown'))

  const configs: Config[] = [
    {
      name: '@bfra.me/markdown/plugin',
      plugins: {
        markdown: markdown as unknown as Plugin,
      },
    },
    {
      name: '@bfra.me/markdown/processor',
      files,
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
      language: `markdown/${language}`,
      processor: mergeProcessors([markdown.processors.markdown, processorPassThrough]),
      ...(frontmatter !== false && {
        languageOptions: {frontmatter},
      }),
    },
    {
      name: '@bfra.me/markdown/parser',
      files,
      languageOptions: {
        parser: plainParser,
      },
    },

    // Disable rules incompatible with Markdown processor's virtual files
    // The @eslint/markdown processor creates virtual files that lack complete ESLint SourceCode API
    // (getAllComments, getTokenBefore, etc.) and TypeScript parser services (esTreeNodeToTSNodeMap).
    // This causes failures in plugins that depend on these features.
    {
      name: '@bfra.me/markdown/disabled',
      files,
      rules: {
        'jsdoc/check-property-names': 'off',
        'jsdoc/require-property-name': 'off',

        'unicorn/filename-case': 'off',

        'command/command': 'off',

        'jsdoc/check-access': 'off',
        'jsdoc/check-alignment': 'off',
        'jsdoc/check-types': 'off',
        'jsdoc/empty-tags': 'off',
        'jsdoc/multiline-blocks': 'off',
        'jsdoc/no-multi-asterisks': 'off',
        'jsdoc/require-property': 'off',
        'jsdoc/require-property-description': 'off',

        'no-irregular-whitespace': 'off',

        'perfectionist/sort-exports': 'off',
        'perfectionist/sort-imports': 'off',

        'regexp/no-legacy-features': 'off',
        'regexp/no-missing-g-flag': 'off',
        'regexp/no-useless-dollar-replacements': 'off',
        'regexp/no-useless-flag': 'off',
      },
    },
    {
      name: '@bfra.me/markdown/overrides',
      files,
      rules: {
        'markdown/fenced-code-language': 'warn',
        'markdown/heading-increment': 'error',
        'markdown/no-duplicate-definitions': 'error',
        'markdown/no-empty-definitions': 'error',
        'markdown/no-empty-images': 'error',
        'markdown/no-empty-links': 'error',
        'markdown/no-invalid-label-refs': 'error',
        'markdown/no-missing-atx-heading-space': 'error',
        'markdown/no-missing-label-refs':
          // Disable label warnings for admonitions if using GFM
          language === 'gfm'
            ? [
                'error',
                {
                  // @keep-sorted
                  allowLabels: ['!CAUTION', '!IMPORTANT', '!NOTE', '!TIP', '!WARNING'],
                },
              ]
            : 'error',
        'markdown/no-missing-link-fragments': 'error',
        'markdown/no-multiple-h1': 'error',
        'markdown/no-reference-like-urls': 'error',
        'markdown/no-reversed-media-syntax': 'error',
        'markdown/no-space-in-emphasis': 'error',
        'markdown/no-unused-definitions': 'error',
        'markdown/require-alt-text': 'error',
        'markdown/table-column-count': 'error',

        ...overrides,
      },
    },
  ]

  if (codeBlocks === false) {
    return configs
  }

  const {
    javascript = true,
    json = true,
    jsx = true,
    typescript = true,
    yaml = true,
  } = codeBlocks === true ? {} : codeBlocks

  if (typescript || javascript || jsx) {
    const tselint = await interopDefault(import('typescript-eslint'))

    const tsJsFiles: string[] = []
    if (typescript) {
      tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/${GLOB_TS}`))
    }
    if (typescript || jsx) {
      tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/${GLOB_TSX}`))
    }
    if (javascript) {
      tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/${GLOB_JS}`))
    }
    if (javascript || jsx) {
      tsJsFiles.push(...GLOB_MARKDOWN_FILES.map(p => `${p}/${GLOB_JSX}`))
    }

    configs.push({
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
      },
    })
  }

  if (json) {
    const pluginJsonc = await interopDefault(import('eslint-plugin-jsonc'))

    // Use plugin's base config to inherit parser configuration
    const baseConfigs = pluginJsonc.configs['flat/base']

    configs.push({
      name: '@bfra.me/markdown/code-blocks/json',
      files: GLOB_MARKDOWN_FILES.flatMap(p => [
        `${p}/${GLOB_JSON}`,
        `${p}/${GLOB_JSON5}`,
        `${p}/${GLOB_JSONC}`,
      ]),
      languageOptions: baseConfigs[1]?.languageOptions ?? {},
      rules: {
        // Examples may show JSON with trailing commas or explanatory comments
        'jsonc/comma-dangle': 'off',
        'jsonc/no-comments': 'off',
      },
    })
  }

  if (yaml) {
    const pluginYaml = await interopDefault(import('eslint-plugin-yml'))

    // Use plugin's standard config to inherit parser configuration
    const standardConfigs = (pluginYaml.configs.standard ?? pluginYaml.configs['flat/standard']) as
      | Config[]
      | Config
    const normalizedConfigs = Array.isArray(standardConfigs) ? standardConfigs : [standardConfigs]

    // Find language and parser setup from normalized configs with explicit type guards
    const languageSetup = normalizedConfigs.find(
      (c): c is Config & {language: string} =>
        c != null && 'language' in c && typeof c.language === 'string',
    )
    const parserSetup = normalizedConfigs.find(
      (c): c is Config & {languageOptions: Record<string, unknown>} =>
        c != null && 'languageOptions' in c && c.languageOptions != null,
    )

    configs.push({
      name: '@bfra.me/markdown/code-blocks/yaml',
      files: GLOB_MARKDOWN_FILES.map(p => `${p}/${GLOB_YAML}`),
      ...(languageSetup ? {language: languageSetup.language} : {}),
      ...(parserSetup ? {languageOptions: parserSetup.languageOptions} : {}),
      ...(languageSetup && 'plugins' in languageSetup ? {plugins: languageSetup.plugins} : {}),
      rules: {
        // Examples may show incomplete YAML mappings to focus on specific concepts
        'yml/no-empty-mapping-value': 'off',
      },
    })
  }

  return configs
}
