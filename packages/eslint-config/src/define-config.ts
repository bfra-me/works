import {type Awaitable, FlatConfigComposer} from 'eslint-flat-config-utils'
import type {Linter} from 'eslint'
import {isPackageExists} from 'local-pkg'
import type {ParserOptions} from '@typescript-eslint/types'
import {ignores, typescript} from './configs'
import type {ComposableConfig, Config, ConfigNames} from './types'

type AllowedConfigForOptions = Omit<Config, 'files'>

type ConfigProperties = (keyof AllowedConfigForOptions)[]

const AllowedConfigPropertiesForOptions = [
  'name',
  'ignores',
  'languageOptions',
  'linterOptions',
  'processor',
  'plugins',
  'rules',
  'settings',
] as const satisfies ConfigProperties

export interface OptionsFiles {
  /**
   * Override the `files` option to provide custom globs.
   */
  files?: Config['files']
}

export interface OptionsOverrides {
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

export type Options = {
  /**
   * Enable TypeScript support.
   *
   * Passing an object to enable TypeScript Language Server support.
   *
   * @default auto-detect based on the dependencies
   */
  typescript?: OptionsTypeScript | boolean
} & AllowedConfigForOptions

export function defineConfig(
  options: Options = {},
  ...userConfigs: Awaitable<Config | Config[] | FlatConfigComposer | Linter.Config[]>[]
): ComposableConfig {
  const {typescript: enableTypeScript = isPackageExists('typescript')} = options
  const configs: Awaitable<Config[]>[] = []

  configs.push(ignores(options.ignores))

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

  const optionsConfig = AllowedConfigPropertiesForOptions.reduce((config, key) => {
    if (key in options) {
      config[key] = options[key] as any
    }
    return config
  }, {} as Config)

  if (Object.keys(optionsConfig).length) {
    configs.push([optionsConfig])
  }

  const composer = new FlatConfigComposer<Config, ConfigNames>().append(
    ...configs,
    ...(userConfigs as any),
  )

  return composer
}

export type ResolvedOptions<T> = T extends boolean ? never : NonNullable<T>

export function resolveSubOptions<K extends keyof Options>(
  options: Options,
  key: K,
): ResolvedOptions<Options[K]> {
  return typeof options[key] === 'boolean' ? ({} as any) : options[key] || {}
}

export function getOverrides<K extends keyof Options>(options: Options, key: K): Config['rules'] {
  const sub = resolveSubOptions(options, key)
  return 'overrides' in sub ? (sub.overrides as Config['rules']) : {}
}
