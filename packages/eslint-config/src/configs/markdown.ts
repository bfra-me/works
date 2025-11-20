import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {mergeProcessors, processorPassThrough} from 'eslint-merge-processors'
import {GLOB_MARKDOWN, GLOB_MARKDOWN_IN_MARKDOWN} from '../globs'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {markdownCodeBlocks} from './markdown-code-blocks'

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
 * Processor configuration for Markdown code block extraction and linting.
 *
 * The processor extracts fenced code blocks and lints them as separate virtual files,
 * enabling language-specific rules to apply to code examples.
 *
 * **⚠️ Warning**: Disabled by default due to compatibility issues with ESLint plugins
 * that require full SourceCode API support. Enable with caution and test thoroughly.
 *
 * @example
 * ```typescript
 * // Enable processor with code block extraction
 * defineConfig({
 *   markdown: {
 *     processor: { enabled: true, extractCodeBlocks: true }
 *   }
 * })
 *
 * // Disable code block processing
 * defineConfig({ markdown: { processor: { enabled: false } } })
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
   * When enabled, fenced code blocks (```ts, ```js, etc.) are extracted
   * and linted as separate virtual files.
   *
   * @default false
   */
  extractCodeBlocks?: boolean
}

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
 *     processor: { enabled: true, extractCodeBlocks: true },
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
   * Processor configuration for code block extraction and linting.
   *
   * Extracts fenced code blocks and lints them as separate virtual files.
   *
   * **⚠️ Warning**: Disabled by default due to compatibility issues with ESLint plugins
   * requiring full SourceCode API support.
   *
   * @default { enabled: false, extractCodeBlocks: false }
   */
  processor?: MarkdownProcessorOptions

  /**
   * Code block processing configuration.
   *
   * Configure which languages are extracted and linted from code blocks.
   *
   * @default { typescript: true, javascript: true, jsx: true }
   */
  codeBlocks?: MarkdownCodeBlockOptions

  /**
   * Markdown-specific rule overrides.
   *
   * @example
   * ```typescript
   * { rules: { 'markdown/no-html': 'off' } }
   * ```
   */
  rules?: Config['rules']
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
    codeBlocks = {javascript: true, jsx: true, typescript: true},
    files = [GLOB_MARKDOWN],
    frontmatter = 'yaml',
    language = 'gfm',
    processor = {enabled: false, extractCodeBlocks: false},
    rules = {},
  } = options

  return requireOf(
    ['@eslint/markdown'],
    async (): Promise<Config[]> => {
      const markdown = await interopDefault(import('@eslint/markdown'))

      const configs: Config[] = []

      configs.push({
        name: '@bfra.me/markdown/plugin',
        plugins: {
          markdown: markdown as unknown as Plugin,
        },
      })
      const languageConfig: Config = {
        name: '@bfra.me/markdown/language',
        files,
        ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
        language: `markdown/${language}`,
        ...(frontmatter !== false && {
          languageOptions: {frontmatter},
        }),
        ...(processor.enabled !== false && {
          processor:
            processor.extractCodeBlocks === false
              ? processorPassThrough
              : mergeProcessors([markdown.processors.markdown, processorPassThrough]),
        }),
      }

      configs.push(languageConfig)

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

      // Disable rules incompatible with Markdown processor's virtual files
      // The @eslint/markdown processor creates virtual files that lack complete ESLint SourceCode API
      // (getAllComments, getTokenBefore, etc.) and TypeScript parser services (esTreeNodeToTSNodeMap).
      // This causes failures in plugins that depend on these features.
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

      // Delegate to specialized module for language-specific code block handling
      if (processor.extractCodeBlocks !== false) {
        configs.push(...(await markdownCodeBlocks(codeBlocks)))
      }

      return configs
    },
    fallback,
  )
}
