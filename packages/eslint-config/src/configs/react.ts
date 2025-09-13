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
  'react/no-leaked-conditional-rendering': 'warn',
}

/**
 * Configuration options for React ESLint rules.
 *
 * Extends multiple option interfaces to provide a comprehensive set of configuration
 * options including file patterns, rule overrides, TypeScript parser options, and
 * TypeScript type checking options.
 */
export interface ReactOptions
  extends Flatten<
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
    ['@eslint-react/eslint-plugin', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh'],
    async () => {
      const [pluginReact, pluginReactHooks, pluginReactRefresh] = await Promise.all([
        interopDefault(import('@eslint-react/eslint-plugin')),
        interopDefault(import('eslint-plugin-react-hooks')),
        interopDefault(import('eslint-plugin-react-refresh')),
      ] as const)
      const plugins = pluginReact.configs.all.plugins
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
            react: plugins['@eslint-react'],
            'react-dom': plugins['@eslint-react/dom'],
            'react-hooks': pluginReactHooks,
            'react-hooks-extra': plugins['@eslint-react/hooks-extra'],
            'react-naming-convention': plugins['@eslint-react/naming-convention'],
            'react-refresh': pluginReactRefresh,
            'react-web-api': plugins['@eslint-react/web-api'],
          },
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
            // recommended rules from eslint-plugin-react-dom https://eslint-react.xyz/docs/rules/overview#dom-rules
            'react-dom/no-namespace': 'error',
            'react-dom/no-dangerously-set-innerhtml': 'warn',
            'react-dom/no-dangerously-set-innerhtml-with-children': 'error',
            'react-dom/no-find-dom-node': 'error',
            'react-dom/no-flush-sync': 'error',
            'react-dom/no-hydrate': 'error',
            'react-dom/no-missing-button-type': 'warn',
            'react-dom/no-missing-iframe-sandbox': 'warn',
            'react-dom/no-render': 'error',
            'react-dom/no-render-return-value': 'error',
            'react-dom/no-script-url': 'warn',
            'react-dom/no-unsafe-iframe-sandbox': 'warn',
            'react-dom/no-unsafe-target-blank': 'warn',
            'react-dom/no-use-form-state': 'error',
            'react-dom/no-void-elements-with-children': 'error',

            // recommended rules from eslint-plugin-react-hooks-extra https://eslint-react.xyz/docs/rules/overview#hooks-extra-rules
            'react-hooks-extra/no-direct-set-state-in-use-effect': 'warn',
            'react-hooks-extra/no-unnecessary-use-prefix': 'warn',
            'react-hooks-extra/prefer-use-state-lazy-initialization': 'warn',

            // recommended rules eslint-plugin-react-hooks https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks/src/rules
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',

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

            // recommended rules from eslint-plugin-react-web-api https://eslint-react.xyz/docs/rules/overview#web-api-rules
            'react-web-api/no-leaked-event-listener': 'warn',
            'react-web-api/no-leaked-interval': 'warn',
            'react-web-api/no-leaked-resize-observer': 'warn',
            'react-web-api/no-leaked-timeout': 'warn',

            // recommended rules from eslint-plugin-react-x https://eslint-react.xyz/docs/rules/overview#core-rules
            'react/jsx-no-duplicate-props': 'warn',
            'react/jsx-uses-vars': 'warn',
            'react/no-access-state-in-setstate': 'error',
            'react/no-array-index-key': 'warn',
            'react/no-children-count': 'warn',
            'react/no-children-for-each': 'warn',
            'react/no-children-map': 'warn',
            'react/no-children-only': 'warn',
            'react/no-children-to-array': 'warn',
            'react/no-clone-element': 'warn',
            'react/no-comment-textnodes': 'warn',
            'react/no-component-will-mount': 'error',
            'react/no-component-will-receive-props': 'error',
            'react/no-component-will-update': 'error',
            'react/no-context-provider': 'warn',
            'react/no-create-ref': 'error',
            'react/no-default-props': 'error',
            'react/no-direct-mutation-state': 'error',
            'react/no-duplicate-key': 'warn',
            'react/no-forward-ref': 'warn',
            'react/no-implicit-key': 'warn',
            'react/no-missing-key': 'error',
            'react/no-nested-component-definitions': 'error',
            'react/no-prop-types': 'error',
            'react/no-redundant-should-component-update': 'error',
            'react/no-set-state-in-component-did-mount': 'warn',
            'react/no-set-state-in-component-did-update': 'warn',
            'react/no-set-state-in-component-will-update': 'warn',
            'react/no-string-refs': 'error',
            'react/no-unsafe-component-will-mount': 'warn',
            'react/no-unsafe-component-will-receive-props': 'warn',
            'react/no-unsafe-component-will-update': 'warn',
            'react/no-unstable-context-value': 'warn',
            'react/no-unstable-default-props': 'warn',
            'react/no-unused-class-component-members': 'warn',
            'react/no-unused-state': 'warn',
            'react/no-use-context': 'warn',
            'react/no-useless-forward-ref': 'warn',

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
