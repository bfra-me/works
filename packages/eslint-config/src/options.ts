import type {ParserOptions} from '@typescript-eslint/types'
import type {FlatGitignoreOptions} from 'eslint-config-flat-gitignore'
import type {Config as PrettierConfig} from 'prettier'
import type {Config} from './config'

/**
  Flattens an object type to a mapped type with the same keys and values.
 */
export type Flatten<T> = T extends Function ? T : {[K in keyof T]: T[K]} & {}

/**
 * Provides an option to override the `files` option in the ESLint configuration.
 * This allows customizing the glob patterns used to include files in the linting process.
 */
export interface OptionsFiles {
  /**
   * Override the `files` option to provide custom globs.
   */
  files?: Config['files']
}

/**
 * Provides an option to enable editor-specific rules in the ESLint configuration.
 * When `isInEditor` is `true`, the ESLint configuration will include rules that are
 * specific to the editor environment, such as rules related to editor features or
 * integrations.
 */
export interface OptionsIsInEditor {
  /**
   * Enable editor specific rules.
   */
  isInEditor?: boolean
}

/**
 * Provides an option to override the rules in the ESLint configuration.
 * This allows customizing the rules that are applied during the linting process.
 */
export interface OptionsOverrides {
  /**
   * Override rules.
   */
  overrides?: Config['rules']
}

/**
 * Options for configuring the Perfectionist sorting behavior.
 */
export interface OptionsPerfectionist {
  /**
   * Whether to sort named exports.
   *
   * @default true
   */
  sortNamedExports?: boolean
  /**
   * Whether to sort named imports.
   * @default true
   */
  sortNamedImports?: boolean
  /**
   * Whether to sort exports.
   * @default true
   */
  sortExports?: boolean
  /**
   * Whether to sort imports.
   * @default true
   */
  sortImports?: boolean
}

export interface OptionsPrettier {
  /**
   * Whether to enable Prettier code formatting.
   * @default true
   */
  prettier?: boolean | PrettierConfig
}

/**
 * Provides options to configure the TypeScript parser and type-aware linting rules.
 *
 * The `parserOptions` property allows specifying additional options to be passed to the TypeScript parser.
 *
 * The `typeAware` property allows configuring which files should be type-aware for linting purposes. This includes
 * specifying glob patterns for files that should be type-aware, as well as files that should be ignored from
 * type-aware linting.
 */
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

/**
 * Provides options to configure type-aware linting rules when using TypeScript.
 *
 * The `tsconfigPath` option specifies the path to the TypeScript configuration file that should be used for type-aware linting.
 *
 * The `typeAware` option allows overriding the type-aware rules that are applied during linting.
 */
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

/**
 * Represents the options for configuring TypeScript support in the ESLint configuration.
 */
export type OptionsTypeScript =
  | (OptionsTypeScriptParserOptions & OptionsOverrides)
  | (OptionsTypeScriptWithTypes & OptionsOverrides)

/**
 * Configuration options for the ESLint setup.
 *
 * @remarks
 * This type represents the flattened configuration options that can be used to customize
 * the ESLint behavior. It extends the base {@link Config} type (excluding 'files' property) and
 * provides additional customization options.
 *
 * @example
 * ```ts
 * const options: Options = {
 *   gitignore: true,
 *   typescript: true,
 *   vitest: false
 * };
 * ```
 */
export type Options = Flatten<
  // @keep-sorted
  {
    /**
     * Enable gitignore support.
     *
     * @see https://github.com/antfu/eslint-config-flat-gitignore
     * @default true
     */
    gitignore?: boolean | FlatGitignoreOptions

    /**
     * Indicates whether the code is being executed in an editor environment.
     */
    isInEditor?: boolean

    /**
     * Options to override the behavior of JavaScript-related rules.
     */
    javascript?: OptionsOverrides

    /**
     * Options to override the behavior of linting JSON, JSON5 and JSONC files.
     */
    jsonc?: boolean | OptionsOverrides

    /**
     * Options to override the behavior of linting JSX files.
     *
     * @default true
     */
    jsx?: boolean

    /**
     * Options to override the behavior of linting Markdown files.
     */
    markdown?: boolean | (OptionsOverrides & OptionsPrettier)

    /**
     * Options to override the behavior of Perfectionist sorting rules.
     */
    perfectionist?: boolean | OptionsPerfectionist

    /**
     * Options to override the behavior of the Prettier code formatter.
     */
    prettier?: boolean | (OptionsOverrides & PrettierConfig)

    /**
     * Options to override the behavior of RegExp linting rules.
     */
    regexp?: boolean | OptionsOverrides

    /**
     * Options to override the behavior of the TOML parser and linting rules.
     */
    toml?: boolean | OptionsOverrides

    /**
     * Enable TypeScript support.
     *
     * Pass options to enable support for the TypeScript language and project services.
     *
     * @default auto-detect based on the dependencies
     */
    typescript?: OptionsTypeScript | boolean

    /**
     * Enable or override unicorn rules.
     *
     * @default true
     */
    unicorn?: boolean | OptionsOverrides

    /**
     * Enable support for vitest.
     *
     * @default false
     */
    vitest?: boolean | OptionsOverrides

    /**
     * Enable support for yaml.
     *
     * @default true
     */
    yaml?: boolean | (OptionsOverrides & OptionsPrettier)
  } & Omit<Config, 'files'>
>
