import type {Config, ConfigNames, FlatConfigComposer, ResolvableFlatConfig} from './config'
import type {Options} from './options'
import {isPackageExists} from 'local-pkg'
import {composeConfig} from './compose-config'
import {
  astro,
  command,
  epilogue,
  eslintComments,
  gitignore,
  ignores,
  imports,
  javascript,
  jsdoc,
  jsonc,
  markdown,
  node,
  packageJson,
  perfectionist,
  pnpm,
  prettier,
  regexp,
  sortPackageJson,
  sortRenovateConfig,
  sortTsconfig,
  toml,
  typescript,
  unicorn,
  vitest,
  yaml,
} from './configs'
import * as Env from './env'

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

/**
 * Define a new ESLint config.
 *
 * @param options - Options to configure the ESLint config.
 * @param userConfigs - Additional ESLint configs to include.
 * @returns A composable ESLint config.
 */
export async function defineConfig<C extends Config = Config, CN extends ConfigNames = ConfigNames>(
  options: Options = {},
  ...userConfigs: ResolvableFlatConfig<Config extends C ? C : Config>[]
  // @ts-expect-error - TypeScript insists that the return type should be `Promise<T>`, but it's actually
  // `FlatConfigComposer<>` which acts like a `Promise<T>`.
): FlatConfigComposer<Config extends C ? C : Config, CN> {
  const {
    astro: enableAstro = false,
    gitignore: enableGitignore = true,
    jsx: enableJsx = true,
    packageJson: enablePackageJson = false,
    perfectionist: enablePerfectionist = true,
    pnpm: enableCatalogs = false,
    prettier: enablePrettier = isPackageExists('prettier'),
    regexp: enableRegexp = true,
    typescript: enableTypeScript = isPackageExists('typescript'),
    unicorn: enableUnicorn = true,
  } = options

  const isInEditor = options.isInEditor ?? Env.isInEditor
  if (isInEditor)
    // eslint-disable-next-line no-console
    console.log(
      '[@bfra.me/eslint-config] Editor specific config is enabled. Some rules may be disabled.',
    )

  const configs: (Config[] | Promise<Config[]>)[] = []

  if (enableGitignore) {
    configs.push(gitignore(enableGitignore === true ? {strict: false} : enableGitignore))
  }

  configs.push(
    ignores(options.ignores),
    javascript({isInEditor, jsx: enableJsx, overrides: getOverrides(options, 'javascript')}),
    eslintComments(),
    node(),
    jsdoc(),
    imports(),
    command(),
  )

  if (enablePackageJson) {
    configs.push(packageJson(resolveSubOptions(options, 'packageJson')))
  }

  if (enablePerfectionist) {
    configs.push(
      perfectionist({
        isInEditor,
        overrides: getOverrides(options, 'perfectionist'),
        ...resolveSubOptions(options, 'perfectionist'),
      }),
    )
  }

  if (enableUnicorn) {
    configs.push(unicorn({overrides: getOverrides(options, 'unicorn')}))
  }

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

  if (enableRegexp) {
    configs.push(regexp({overrides: getOverrides(options, 'regexp')}))
  }

  if (options.vitest) {
    configs.push(
      vitest({
        overrides: getOverrides(options, 'vitest'),
      }),
    )
  }

  if (enableAstro) {
    configs.push(
      astro({
        ...resolveSubOptions(options, 'astro'),
        overrides: getOverrides(options, 'astro'),
      }),
    )
  }

  if (options.jsonc ?? true) {
    configs.push(
      jsonc({overrides: getOverrides(options, 'jsonc')}),
      sortPackageJson(),
      sortRenovateConfig(),
      sortTsconfig(),
    )
  }

  if (enableCatalogs) {
    configs.push(pnpm())
  }

  if (options.toml ?? true) {
    configs.push(
      toml({
        overrides: getOverrides(options, 'toml'),
      }),
    )
  }

  if (options.yaml ?? true) {
    configs.push(
      yaml({
        overrides: getOverrides(options, 'yaml'),
      }),
    )
  }

  if (options.markdown ?? true) {
    configs.push(
      markdown({
        overrides: getOverrides(options, 'markdown'),
      }),
    )
  }

  if (enablePrettier) {
    configs.push(
      prettier({
        isInEditor,
        overrides: getOverrides(options, 'prettier'),
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
  return (typeof options[key] === 'boolean' ? {} : (options[key] ?? {})) as ResolvedOptions<
    Options[K]
  >
}

function getOverrides<K extends keyof Options>(options: Options, key: K): Config['rules'] {
  const sub = resolveSubOptions(options, key)
  return 'overrides' in sub ? (sub.overrides as Config['rules']) : {}
}
