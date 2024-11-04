import type {ParserOptions} from '@typescript-eslint/types'
import type {Config, Flatten} from './types'
import type {FlatGitignoreOptions} from 'eslint-config-flat-gitignore'

export interface OptionsFiles {
  /**
   * Override the `files` option to provide custom globs.
   */
  files?: Config['files']
}

export interface OptionsIsInEditor {
  /**
   * Enable editor specific rules.
   */
  isInEditor?: boolean
}

export interface OptionsOverrides {
  /**
   * Override rules.
   */
  overrides?: Config['rules']
}

export interface OptionsTypeScriptParserOptions {
  /**
   * Additional parser options specific tos TypeScript.
   */
  parserOptions?: Partial<ParserOptions>

  /**
   * Override type aware rules.
   */
  typeAware?: {
    /**
     * Glob patterns for files that should be type aware.
     * @default ['**\/*.{ts,tsx}']
     */
    files?: Config['files']

    /**
     * Glob patterns for files that should not be type aware.
     * @default ['**\/*.md\/**', '**\/*.astro/*.ts']
     */
    ignores?: Config['ignores']
  }
}

export interface OptionsTypeScriptWithTypes {
  /**
   * When this options is provided, type aware rules will be enabled.
   * @see https://typescript-eslint.io/linting/typed-linting/
   */
  tsconfigPath?: string

  /**
   * Override type aware rules.
   */
  typeAware?: OptionsOverrides
}

export type OptionsTypeScript =
  | (OptionsTypeScriptParserOptions & OptionsOverrides)
  | (OptionsTypeScriptWithTypes & OptionsOverrides)

export type Options = Flatten<
  {
    /**
     * Enable gitignore support.
     *
     * @see https://github.com/antfu/eslint-config-flat-gitignore
     * @default true
     */
    gitignore?: boolean | FlatGitignoreOptions

    isInEditor?: boolean

    javascript?: OptionsOverrides

    /**
     * Enable support for vitest.
     *
     * @default false
     */
    vitest?: boolean | OptionsOverrides

    /**
     * Enable TypeScript support.
     *
     * Pass options to enable support for the TypeScript language and project services.
     *
     * @default auto-detect based on the dependencies
     */
    typescript?: OptionsTypeScript | boolean
  } & Omit<Config, 'files'>
>
