import type {Config} from '../config'
import type {
  Flatten,
  OptionsFiles,
  OptionsOverrides,
  OptionsTypeScriptParserOptions,
  OptionsTypeScriptWithTypes,
} from '../options'
import {isPackageExists} from 'local-pkg'
import {GLOB_ASTRO_TS, GLOB_MARKDOWN, GLOB_SRC, GLOB_TS, GLOB_TSX} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

const ReactRefreshAllowConstantExportPackages = ['vite']
const RemixPackages = ['@remix-run/node', '@remix-run/react', '@remix-run/serve', '@remix-run/dev']
const ReactRouterPackages = [
  '@react-router/node',
  '@react-router/react',
  '@react-router/serve',
  '@react-router/dev',
]
const NextJsPackages = ['next']

const ReactTypeAwareRules: Config['rules'] = {
  '@eslint-react/no-implicit-key': 'warn',
  '@eslint-react/no-leaked-conditional-rendering': 'warn',
}

/**
 * Configuration options for React ESLint rules.
 *
 * Extends multiple option interfaces to provide a comprehensive set of configuration
 * options including file patterns, rule overrides, TypeScript parser options, and
 * TypeScript type checking options.
 */
export interface ReactOptions extends Flatten<
  OptionsFiles & OptionsOverrides & OptionsTypeScriptParserOptions & OptionsTypeScriptWithTypes
> {}

/**
 * Creates ESLint configuration for React applications with comprehensive rule sets.
 *
 * This function sets up ESLint rules for React development including:
 * - React DOM rules for proper DOM usage
 * - React Hooks rules for hooks best practices
 * - React Refresh rules for hot reloading compatibility
 * - React Web API rules for preventing memory leaks
 * - Core React rules for component development
 * - Optional type-aware rules when TypeScript is configured
 *
 * The configuration automatically detects common React frameworks (Next.js, Remix, React Router)
 * and adjusts rules accordingly to allow framework-specific exports.
 *
 * @param options - Configuration options for the React ESLint setup
 * @param options.files - File patterns to apply React rules to. Defaults to source files.
 * @param options.overrides - Custom rule overrides to merge with the base configuration
 * @param options.tsconfigPath - Path to TypeScript configuration file for type-aware linting
 * @param options.typeAware - Configuration for type-aware rules including file patterns and ignores
 * @param options.typeAware.files - File patterns for type-aware linting (TypeScript files)
 * @param options.typeAware.ignores - File patterns to exclude from type-aware linting
 *
 * @returns Promise resolving to an array of ESLint configuration objects
 */
export async function react(options: ReactOptions = {}): Promise<Config[]> {
  const {
    files = [GLOB_SRC],
    overrides = {},
    tsconfigPath,
    typeAware = {
      files: [GLOB_TS, GLOB_TSX],
      ignores: [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS],
    },
  } = options
  const isTypeAware = typeof tsconfigPath === 'string' && tsconfigPath.trim().length > 0

  return requireOf(
    ['@eslint-react/eslint-plugin', 'eslint-plugin-react-refresh'],
    async () => {
      const [pluginReact, pluginReactRefresh] = await Promise.all([
        interopDefault(import('@eslint-react/eslint-plugin')),
        import('eslint-plugin-react-refresh').then(m => m.reactRefresh),
      ] as const)

      const plugins = pluginReact.configs.all.plugins as NonNullable<Config['plugins']>
      const isAllowConstantExport = ReactRefreshAllowConstantExportPackages.some(i =>
        isPackageExists(i),
      )
      const isUsingRemix = RemixPackages.some(i => isPackageExists(i))
      const isUsingReactRouter = ReactRouterPackages.some(i => isPackageExists(i))
      const isUsingNext = NextJsPackages.some(i => isPackageExists(i))

      return [
        {
          name: '@bfra.me/react/setup',
          plugins: {
            ...plugins,
            'react-refresh': pluginReactRefresh.plugin,
          } as Config['plugins'],
        },
        {
          name: '@bfra.me/react/rules',
          files,
          languageOptions: {
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
            sourceType: 'module',
          },
          rules: {
            ...pluginReact.configs.recommended.rules,

            // preconfigured rules from eslint-plugin-react-refresh https://github.com/ArnaudBarre/eslint-plugin-react-refresh/tree/main/src
            'react-refresh/only-export-components': [
              'warn',
              {
                allowConstantExport: isAllowConstantExport,
                allowExportNames: [
                  ...(isUsingNext
                    ? [
                        'dynamic',
                        'dynamicParams',
                        'revalidate',
                        'fetchCache',
                        'runtime',
                        'preferredRegion',
                        'maxDuration',
                        'config',
                        'generateStaticParams',
                        'metadata',
                        'generateMetadata',
                        'viewport',
                        'generateViewport',
                      ]
                    : []),
                  ...(isUsingRemix || isUsingReactRouter
                    ? [
                        'meta',
                        'links',
                        'headers',
                        'loader',
                        'action',
                        'clientLoader',
                        'clientAction',
                        'handle',
                        'shouldRevalidate',
                      ]
                    : []),
                ],
              },
            ],

            ...overrides,
          },
        },
        ...(isTypeAware
          ? [
              {
                name: '@bfra.me/react/type-aware-rules',
                files: typeAware.files,
                ignores: typeAware.ignores,
                rules: {
                  ...ReactTypeAwareRules,
                },
              },
            ]
          : []),
      ]
    },
    async missingList => fallback(missingList, {files, languageOptions: {parser: anyParser}}),
  )
}
