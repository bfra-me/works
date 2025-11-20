import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {mergeProcessors, processorPassThrough} from 'eslint-merge-processors'
import {GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN} from '../globs'
import {plainParser} from '../parsers/plain-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Markdown language mode for parsing.
 *
 * @remarks
 * - `'commonmark'`: Standard CommonMark specification - strict, portable, widely compatible
 * - `'gfm'`: GitHub Flavored Markdown - adds tables, task lists, strikethrough, and autolinks
 *
 * @example
 * ```typescript
 * // Use CommonMark for maximum portability
 * const config = defineConfig({
 *   markdown: {
 *     language: 'commonmark'
 *   }
 * });
 *
 * // Use GFM for documentation sites
 * const config = defineConfig({
 *   markdown: {
 *     language: 'gfm'
 *   }
 * });
 * ```
 *
 * @see {@link https://commonmark.org/ | CommonMark Specification}
 * @see {@link https://github.github.com/gfm/ | GitHub Flavored Markdown Specification}
 */
export type MarkdownLanguage = 'commonmark' | 'gfm'

/**
 * Frontmatter format options for Markdown files.
 *
 * @remarks
 * Frontmatter is metadata at the beginning of a Markdown file, commonly used in static site generators
 * and documentation systems. When enabled, the parser will extract and validate the frontmatter block.
 *
 * @example
 * ```typescript
 * // YAML frontmatter (most common)
 * const config = defineConfig({
 *   markdown: {
 *     frontmatter: 'yaml'
 *   }
 * });
 *
 * // Example Markdown file with YAML frontmatter:
 * // ---
 * // title: My Document
 * // date: 2025-01-20
 * // ---
 * // Content here...
 *
 * // TOML frontmatter
 * const config = defineConfig({
 *   markdown: {
 *     frontmatter: 'toml'
 *   }
 * });
 *
 * // Disable frontmatter parsing
 * const config = defineConfig({
 *   markdown: {
 *     frontmatter: false
 *   }
 * });
 * ```
 */
export type MarkdownFrontmatterOptions = false | 'yaml' | 'toml' | 'json'

/**
 * Processor configuration for Markdown code block extraction and linting.
 *
 * @remarks
 * The processor extracts fenced code blocks from Markdown files and lints them as separate
 * virtual files. This enables TypeScript-ESLint and other language-specific rules to apply
 * to code examples in documentation.
 *
 * **Note**: The processor is disabled by default due to compatibility issues with some ESLint
 * plugins that expect full SourceCode API support. Enable with caution and test thoroughly.
 *
 * @example
 * ```typescript
 * // Enable processor with code block extraction
 * const config = defineConfig({
 *   markdown: {
 *     processor: {
 *       enabled: true,
 *       extractCodeBlocks: true
 *     }
 *   }
 * });
 *
 * // Disable code block processing
 * const config = defineConfig({
 *   markdown: {
 *     processor: {
 *       enabled: false
 *     }
 *   }
 * });
 * ```
 */
export interface MarkdownProcessorOptions {
  /**
   * Enable the Markdown processor.
   *
   * @default false
   */
  enabled?: boolean

  /**
   * Extract and lint code blocks from Markdown files.
   *
   * @remarks
   * When enabled, fenced code blocks with language identifiers (```ts, ```js, etc.)
   * will be extracted and linted as separate virtual files.
   *
   * @default false
   */
  extractCodeBlocks?: boolean
}

/**
 * Code block processing configuration for Markdown files.
 *
 * @remarks
 * Configure how code blocks within Markdown files are processed and linted.
 * This includes TypeScript, JavaScript, JSX, TSX, JSON, YAML, and other supported languages.
 *
 * @example
 * ```typescript
 * // Basic code block configuration
 * const config = defineConfig({
 *   markdown: {
 *     codeBlocks: {
 *       typescript: true,
 *       javascript: true
 *     }
 *   }
 * });
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
 * Comprehensive configuration options for Markdown linting.
 *
 * @remarks
 * Provides fine-grained control over Markdown parsing, frontmatter handling, code block extraction,
 * and rule configuration. Supports both CommonMark and GitHub Flavored Markdown with optional
 * TypeScript-ESLint integration for code blocks.
 *
 * @example
 * ```typescript
 * // Documentation site with GFM and YAML frontmatter
 * const config = defineConfig({
 *   markdown: {
 *     language: 'gfm',
 *     frontmatter: 'yaml',
 *     processor: {
 *       enabled: true,
 *       extractCodeBlocks: true
 *     },
 *     codeBlocks: {
 *       typescript: true,
 *       javascript: true
 *     }
 *   }
 * });
 *
 * // Simple README files with CommonMark
 * const config = defineConfig({
 *   markdown: {
 *     language: 'commonmark',
 *     frontmatter: false,
 *     files: ['README.md']
 *   }
 * });
 *
 * // Blog posts with code examples
 * const config = defineConfig({
 *   markdown: {
 *     language: 'gfm',
 *     frontmatter: 'yaml',
 *     processor: {
 *       enabled: true,
 *       extractCodeBlocks: true
 *     },
 *     codeBlocks: {
 *       typescript: true,
 *       javascript: true,
 *       jsx: true,
 *       json: true
 *     },
 *     overrides: {
 *       'markdown/no-html': 'off'
 *     }
 *   }
 * });
 * ```
 *
 * @see {@link https://github.com/eslint/markdown | @eslint/markdown}
 */
export interface MarkdownOptions extends Flatten<OptionsFiles & OptionsOverrides> {
  /**
   * Markdown language mode for parsing.
   *
   * @remarks
   * Choose between CommonMark (standard) and GitHub Flavored Markdown (GFM).
   * GFM adds support for tables, task lists, strikethrough, and autolinks.
   *
   * @default 'gfm'
   */
  language?: MarkdownLanguage

  /**
   * Frontmatter format to parse from Markdown files.
   *
   * @remarks
   * Frontmatter is metadata at the beginning of a file, commonly used in static site generators.
   * Set to `false` to disable frontmatter parsing.
   *
   * @default 'yaml'
   */
  frontmatter?: MarkdownFrontmatterOptions

  /**
   * Processor configuration for code block extraction and linting.
   *
   * @remarks
   * The processor extracts fenced code blocks and lints them as separate virtual files,
   * enabling language-specific rules to apply to code examples in documentation.
   *
   * **Note**: The processor is disabled by default due to compatibility issues with some
   * ESLint plugins. Enable with caution and test thoroughly.
   *
   * @default { enabled: false, extractCodeBlocks: false }
   */
  processor?: MarkdownProcessorOptions

  /**
   * Code block processing configuration.
   *
   * @remarks
   * Configure which languages should be extracted and linted from code blocks.
   *
   * @default { typescript: true, javascript: true, jsx: true }
   */
  codeBlocks?: MarkdownCodeBlockOptions

  /**
   * Markdown-specific rule overrides.
   *
   * @remarks
   * Override default Markdown linting rules. Common overrides include disabling HTML
   * in Markdown or adjusting heading structure rules.
   *
   * @example
   * ```typescript
   * {
   *   rules: {
   *     'markdown/no-html': 'off',
   *     'markdown/heading-increment': 'warn'
   *   }
   * }
   * ```
   */
  rules?: Config['rules']
}

/**
 * Configures the ESLint rules for Markdown files.
 * @param options - The configuration options for Markdown files.
 * @see https://github.com/eslint/markdown
 */
export async function markdown(options: MarkdownOptions = {}): Promise<Config[]> {
  const {
    files = [GLOB_MARKDOWN],
    frontmatter = 'yaml',
    language = 'gfm',
    overrides = {},
    processor = {enabled: false, extractCodeBlocks: false},
    rules = {},
  } = options

  return requireOf(
    ['@eslint/markdown'],
    async (): Promise<Config[]> => {
      const markdown = await interopDefault(import('@eslint/markdown'))

      const configs: Config[] = []

      // Plugin registration
      configs.push({
        name: '@bfra.me/markdown/plugin',
        plugins: {
          markdown: markdown as unknown as Plugin,
        },
      })

      // Language and processor configuration
      const languageConfig: Config = {
        name: '@bfra.me/markdown/language',
        files,
        ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
        language: `markdown/${language}` as const,
      }

      // Configure frontmatter if enabled
      if (frontmatter !== false) {
        languageConfig.languageOptions = {
          frontmatter,
        }
      }

      // Configure processor if enabled
      if (processor.enabled !== false) {
        if (processor.extractCodeBlocks === false) {
          // Only use pass-through processor if code block extraction is disabled
          languageConfig.processor = processorPassThrough
        } else {
          // Use eslint-merge-processors to combine markdown processor with pass-through
          languageConfig.processor = mergeProcessors([
            markdown.processors.markdown,
            processorPassThrough,
          ])
        }
      }

      configs.push(languageConfig)

      // Recommended Markdown rules
      configs.push({
        name: '@bfra.me/markdown/rules',
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
          'markdown/no-missing-label-refs': 'error',
          'markdown/no-missing-link-fragments': 'error',
          'markdown/no-multiple-h1': 'error',
          'markdown/no-reference-like-urls': 'error',
          'markdown/no-reversed-media-syntax': 'error',
          'markdown/no-space-in-emphasis': 'error',
          'markdown/no-unused-definitions': 'error',
          'markdown/require-alt-text': 'error',
          'markdown/table-column-count': 'error',
          ...rules,
        },
      })

      // Disable conflicting rules for Markdown files
      // Many rules that depend on ESLint's SourceCode methods (like getAllComments, getTokenBefore)
      // or TypeScript parser services don't work with the markdown processor's virtual files.
      // This is a known limitation of the @eslint/markdown processor when combined with
      // other eslint plugins. For comprehensive code block linting, users may need to extract
      // code examples into separate files or accept these limitations.
      // TODO: Phase 3 will investigate alternative approaches for code block linting
      configs.push({
        name: '@bfra.me/markdown/disabled',
        files,
        rules: {
          'jsdoc/check-param-names': 'off',
          'jsdoc/check-property-names': 'off',
          'jsdoc/require-property-name': 'off',
          'perfectionist/sort-named-exports': 'off',
          'perfectionist/sort-named-imports': 'off',
          'unicorn/filename-case': 'off',
          'command/command': 'off',
          'jsdoc/check-access': 'off',
          'jsdoc/check-alignment': 'off',
          'jsdoc/check-types': 'off',
          'jsdoc/empty-tags': 'off',
          'jsdoc/implements-on-classes': 'off',
          'jsdoc/multiline-blocks': 'off',
          'jsdoc/no-defaults': 'off',
          'jsdoc/no-multi-asterisks': 'off',
          'jsdoc/require-property': 'off',
          'jsdoc/require-property-description': 'off',
          'jsdoc/require-returns-check': 'off',
          'jsdoc/require-returns-description': 'off',
          'jsdoc/require-yields-check': 'off',
          'no-irregular-whitespace': 'off',
          'perfectionist/sort-exports': 'off',
          'perfectionist/sort-imports': 'off',
          'regexp/no-legacy-features': 'off',
          'regexp/no-missing-g-flag': 'off',
          'regexp/no-super-linear-backtracking': 'off',
          'regexp/no-useless-dollar-replacements': 'off',
          'regexp/no-useless-flag': 'off',
          'regexp/optimal-quantifier-concatenation': 'off',
          'regexp/require-unicode-sets-regexp': 'off',
        },
      })

      // Code blocks configuration
      if (processor.extractCodeBlocks !== false) {
        configs.push({
          name: '@bfra.me/markdown/code-blocks',
          files: [GLOB_MARKDOWN_CODE],
          languageOptions: {
            parser: plainParser,
            parserOptions: {
              ecmaFeatures: {
                impliedStrict: true,
              },
            },
          },
          rules: {
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
        })
      }

      return configs
    },
    fallback,
  )
}
