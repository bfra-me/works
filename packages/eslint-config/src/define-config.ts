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
  nextjs,
  node,
  packageJson,
  perfectionist,
  pnpm,
  prettier,
  react,
  regexp,
  sortPackageJson,
  sortRenovateConfig,
  sortTsconfig,
  stylistic,
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
    imports: enableImports = true,
    jsx: enableJsx = true,
    nextjs: enableNextjs = false,
    packageJson: enablePackageJson = false,
    perfectionist: enablePerfectionist = true,
    pnpm: enableCatalogs = false,
    prettier: enablePrettier = isPackageExists('prettier'),
    react: enableReact = false,
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

  const stylisticOptions =
    options.stylistic === false
      ? false
      : typeof options.stylistic === 'object'
        ? options.stylistic
        : {}

  if (stylisticOptions && !('jsx' in stylisticOptions)) {
    stylisticOptions.jsx = typeof enableJsx === 'object' ? true : enableJsx
  }

  const configs: (Config[] | Promise<Config[]>)[] = []

  if (enableGitignore) {
    configs.push(gitignore(enableGitignore === true ? {strict: false} : enableGitignore))
  }

  configs.push(
    ignores(options.ignores),
    javascript({isInEditor, jsx: enableJsx, overrides: getOverrides(options, 'javascript')}),
    eslintComments(),
    node(),
    jsdoc({stylistic: stylisticOptions}),
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

  if (enableImports) {
    configs.push(
      imports({
        stylistic: stylisticOptions,
        ...(enableImports === true ? {} : enableImports),
      }),
    )
  }

  if (enableUnicorn) {
    configs.push(unicorn({overrides: getOverrides(options, 'unicorn')}))
  }

  const typescriptOptions = resolveSubOptions(options, 'typescript')
  const tsconfigPath =
    'tsconfigPath' in typescriptOptions ? typescriptOptions.tsconfigPath : undefined

  if (enableTypeScript) {
    configs.push(
      typescript({
        ...typescriptOptions,
        overrides: getOverrides(options, 'typescript'),
      }),
    )
  }

  if (stylisticOptions) {
    configs.push(
      stylistic({
        ...stylisticOptions,
        overrides: getOverrides(options, 'stylistic'),
      }),
    )
  }

  if (enableRegexp) {
    configs.push(regexp({overrides: getOverrides(options, 'regexp')}))
  }

  if (options.vitest) {
    configs.push(
      vitest({
        isInEditor,
        overrides: getOverrides(options, 'vitest'),
        tsconfigPath,
      }),
    )
  }

  if (enableReact) {
    configs.push(
      react({
        ...typescriptOptions,
        overrides: getOverrides(options, 'react'),
        tsconfigPath,
      }),
    )
  }

  if (enableNextjs) {
    configs.push(
      nextjs({
        overrides: getOverrides(options, 'nextjs'),
      }),
    )
  }

  if (enableAstro) {
    configs.push(
      astro({
        ...resolveSubOptions(options, 'astro'),
        overrides: getOverrides(options, 'astro'),
        stylistic: stylisticOptions,
      }),
    )
  }

  if (options.jsonc ?? true) {
    configs.push(
      jsonc({overrides: getOverrides(options, 'jsonc'), stylistic: stylisticOptions}),
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
        stylistic: stylisticOptions,
      }),
    )
  }

  if (options.yaml ?? true) {
    configs.push(
      yaml({
        overrides: getOverrides(options, 'yaml'),
        stylistic: stylisticOptions,
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
