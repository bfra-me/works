import type {FlatGitignoreOptions} from 'eslint-config-flat-gitignore'
import {isPackageExists} from 'local-pkg'
import type {ParserOptions} from '@typescript-eslint/types'
import {composeConfig} from './compose-config'
import {
  command,
  epilogue,
  eslintComments,
  ignores,
  imports,
  javascript,
  jsdoc,
  perfectionist,
  typescript,
  vitest,
} from './configs'
import type {AwaitableFlatConfig, Config, ConfigComposer} from './types'
import * as Env from './env'
import {interopDefault} from './plugins'

// These are merged into the Options interface
type AllowedConfigForOptions = Omit<Config, 'files'>

const AllowedConfigPropertiesForOptions = [
  'name',
  'ignores',
  'language',
  'languageOptions',
  'linterOptions',
  'plugins',
  'processor',
  'rules',
  'settings',
] satisfies (keyof AllowedConfigForOptions)[]

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

type Flatten<T> = T extends object ? {[K in keyof T]: T[K]} : T

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

/**
 * Define a new ESLint config.
 *
 * @param options - Options to configure the ESLint config.
 * @param userConfigs - Additional ESLint configs to include.
 * @returns A composable ESLint config.
 */
export async function defineConfig(
  options: Options = {},
  ...userConfigs: AwaitableFlatConfig[]
  // @ts-expect-error - TypeScript insists that the return type should be `Promise<T>`, but it's actually
  // `FlatConfigComposer<>` which acts like a `Promise<T>`.
): ConfigComposer {
  const {
    gitignore: enableGitignore = true,
    typescript: enableTypeScript = isPackageExists('typescript'),
  } = options

  const isInEditor = options.isInEditor ?? Env.isInEditor
  if (isInEditor)
    console.log(
      '[@bfra.me/eslint-config] Editor specific config is enabled. Some rules may be disabled.',
    )

  const configs: (Config[] | Promise<Config[]>)[] = []

  if (enableGitignore) {
    const gitignoreOptions: FlatGitignoreOptions =
      typeof enableGitignore !== 'boolean' ? enableGitignore : {strict: false}

    configs.push(
      interopDefault(import('eslint-config-flat-gitignore')).then(ignore => [
        ignore({
          name: '@bfra.me/gitignore',
          ...gitignoreOptions,
        }),
      ]),
    )
  }

  configs.push(
    ignores(options.ignores),
    javascript({isInEditor, overrides: getOverrides(options, 'javascript')}),
    eslintComments(),
    jsdoc(),
    imports(),
    command(),
    perfectionist(),
  )

  const typescriptOptions = resolveSubOptions(options, 'typescript')
  // const tsconfigPath ='tsconfigPath' in typescriptOptions ? typescriptOptions.tsconfigPath : undefined

  if (enableTypeScript) {
    configs.push(
      typescript({
        ...typescriptOptions,
        overrides: getOverrides(options, 'typescript'),
      }),
    )
  }

  if (options.vitest) {
    configs.push(
      vitest({
        overrides: getOverrides(options, 'vitest'),
      }),
    )
  }

  // Epilogue config is always added last
  configs.push(epilogue())

  const optionsConfig = AllowedConfigPropertiesForOptions.reduce(
    (config, key) => ({
      ...config,
      ...(key in options ? {[key]: options[key]} : {}),
    }),
    {} as Config,
  )

  if (Object.keys(optionsConfig).length) {
    configs.push([optionsConfig])
  }

  return composeConfig(...configs, ...userConfigs)
}

type ResolvedOptions<T> = T extends boolean ? never : NonNullable<T>

function resolveSubOptions<K extends keyof Options>(
  options: Options,
  key: K,
): ResolvedOptions<Options[K]> {
  return typeof options[key] === 'boolean' ? ({} as any) : options[key] || {}
}

function getOverrides<K extends keyof Options>(options: Options, key: K): Config['rules'] {
  const sub = resolveSubOptions(options, key)
  return 'overrides' in sub ? (sub.overrides as Config['rules']) : {}
}
