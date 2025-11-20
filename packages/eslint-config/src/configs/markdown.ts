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
   * @default true
   */
  enabled?: boolean

  /**
   * Extract and lint code blocks from Markdown files.
   *
   * @remarks
   * When enabled, fenced code blocks with language identifiers (```ts, ```js, etc.)
   * will be extracted and linted as separate virtual files.
   *
   * @default true
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
   * @default { enabled: true, extractCodeBlocks: true }
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
            markdown: markdown as unknown as Plugin,
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
