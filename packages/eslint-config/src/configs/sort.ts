import type {Config} from '../config'
import {sortOrder} from 'sort-package-json'
import {GLOB_RENOVATE_CONFIG, GLOB_TS_CONFIG} from '../globs'
import {jsonSchema} from './json-schema'

/**
 * Creates an ESLint configuration for sorting package.json files.
 *
 * This function returns a configuration that enforces consistent ordering of:
 * - Array values in the `files` field (ascending order)
 * - Object keys at the root level using a custom sort order
 * - Dependencies sections (dependencies, devDependencies, etc.) in alphabetical order
 * - Package manager overrides (resolutions, overrides, pnpm.overrides) in alphabetical order
 * - Workspace catalog entries in alphabetical order
 * - Export conditions in a specific order (types, import, require, default)
 * - Git hooks in execution order for client-side hooks
 *
 * @returns An array containing a single ESLint configuration object for package.json files
 */
export function sortPackageJson(): Config[] {
  return [
    {
      name: '@bfra.me/sort/package-json',
      files: ['**/package.json'],
      rules: {
        'jsonc/sort-array-values': [
          'error',
          {
            order: {type: 'asc'},
            pathPattern: '^files$',
          },
        ],
        'jsonc/sort-keys': [
          'error',
          {
            order: sortOrder,
            pathPattern: '^$',
          },
          {
            order: {type: 'asc'},
            pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$',
          },
          {
            order: {type: 'asc'},
            pathPattern: '^(?:resolutions|overrides|pnpm.overrides)$',
          },
          {
            order: {type: 'asc'},
            pathPattern: String.raw`^workspaces\.catalog$`,
          },
          {
            order: {type: 'asc'},
            pathPattern: String.raw`^workspaces\.catalogs\.[^.]+$`,
          },
          {
            order: ['types', 'import', 'require', 'default'],
            pathPattern: '^exports.*$',
          },
          {
            order: [
              // client hooks only
              'pre-commit',
              'prepare-commit-msg',
              'commit-msg',
              'post-commit',
              'pre-rebase',
              'post-rewrite',
              'post-checkout',
              'post-merge',
              'pre-push',
              'pre-auto-gc',
            ],
            pathPattern: '^(?:gitHooks|husky|simple-git-hooks)$',
          },
        ],
      },
    },
  ]
}

/**
 * Creates ESLint configuration for sorting Renovate configuration files.
 *
 * This function returns an array of ESLint configurations that enforce sorting rules
 * for Renovate config files, including:
 * - Sorting array values in ascending order (except for 'extends' arrays where order matters)
 * - Sorting object keys according to Renovate's recommended structure
 *
 * The key sorting order follows the pattern defined in the Sanity.io renovate-config
 * repository for consistent configuration structure.
 *
 * @returns A promise that resolves to an array of ESLint configurations for Renovate files
 */
export async function sortRenovateConfig(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/sort/renovate-config',
      files: GLOB_RENOVATE_CONFIG,
      rules: {
        'jsonc/sort-array-values': [
          'error',
          {
            // Don't sort 'extends' arrays, as order matters
            order: {type: 'asc'},
            pathPattern: '^(?!extends$).*',
          },
        ],
        'jsonc/sort-keys': [
          'error',
          {
            // Based on the order defined here:
            // https://github.com/sanity-io/renovate-config/blob/8c1fdebe125f16087924216f97838e93824109d1/scripts/update-sorting.js#L30
            order: [
              '$schema',
              'description',
              'extends',
              'onboardingConfigFileName',
              'lockFileMaintenance',
              'packageRules',
            ],
            pathPattern: '^$',
          },
        ],
      },
    },

    ...(await jsonSchema('renovate-config', GLOB_RENOVATE_CONFIG)),
  ]
}

/**
 * Creates ESLint configuration for sorting TypeScript configuration files.
 *
 * This function generates rules to enforce a specific order of properties in tsconfig.json files:
 * - Root level properties are ordered: extends, compilerOptions, references, files, include, exclude
 * - CompilerOptions properties are grouped and ordered by TypeScript compiler categories:
 *   Projects, Language and Environment, Modules, JavaScript Support, Type Checking,
 *   Emit, Interop Constraints, and Completeness
 *
 * @returns A promise that resolves to an array of ESLint configurations for tsconfig files
 */
export async function sortTsconfig(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/sort/tsconfig',
      files: GLOB_TS_CONFIG,
      rules: {
        'jsonc/sort-keys': [
          'error',
          {
            order: ['extends', 'compilerOptions', 'references', 'files', 'include', 'exclude'],
            pathPattern: '^$',
          },
          {
            order: [
              /* Projects */
              'incremental',
              'composite',
              'tsBuildInfoFile',
              'disableSourceOfProjectReferenceRedirect',
              'disableSolutionSearching',
              'disableReferencedProjectLoad',

              /* Language and Environment */
              'target',
              'jsx',
              'jsxFactory',
              'jsxFragmentFactory',
              'jsxImportSource',
              'lib',
              'moduleDetection',
              'noLib',
              'reactNamespace',
              'useDefineForClassFields',
              'emitDecoratorMetadata',
              'experimentalDecorators',
              'libReplacement',

              /* Modules */
              'baseUrl',
              'rootDir',
              'rootDirs',
              'customConditions',
              'module',
              'moduleResolution',
              'moduleSuffixes',
              'noResolve',
              'paths',
              'resolveJsonModule',
              'resolvePackageJsonExports',
              'resolvePackageJsonImports',
              'typeRoots',
              'types',
              'allowArbitraryExtensions',
              'allowImportingTsExtensions',
              'allowUmdGlobalAccess',

              /* JavaScript Support */
              'allowJs',
              'checkJs',
              'maxNodeModuleJsDepth',

              /* Type Checking */
              'strict',
              'strictBindCallApply',
              'strictFunctionTypes',
              'strictNullChecks',
              'strictPropertyInitialization',
              'allowUnreachableCode',
              'allowUnusedLabels',
              'alwaysStrict',
              'exactOptionalPropertyTypes',
              'noFallthroughCasesInSwitch',
              'noImplicitAny',
              'noImplicitOverride',
              'noImplicitReturns',
              'noImplicitThis',
              'noPropertyAccessFromIndexSignature',
              'noUncheckedIndexedAccess',
              'noUnusedLocals',
              'noUnusedParameters',
              'useUnknownInCatchVariables',

              /* Emit */
              'declaration',
              'declarationDir',
              'declarationMap',
              'downlevelIteration',
              'emitBOM',
              'emitDeclarationOnly',
              'importHelpers',
              'importsNotUsedAsValues',
              'inlineSourceMap',
              'inlineSources',
              'mapRoot',
              'newLine',
              'noEmit',
              'noEmitHelpers',
              'noEmitOnError',
              'outDir',
              'outFile',
              'preserveConstEnums',
              'preserveValueImports',
              'removeComments',
              'sourceMap',
              'sourceRoot',
              'stripInternal',

              /* Interop Constraints */
              'allowSyntheticDefaultImports',
              'esModuleInterop',
              'forceConsistentCasingInFileNames',
              'isolatedDeclarations',
              'isolatedModules',
              'preserveSymlinks',
              'verbatimModuleSyntax',
              'erasableSyntaxOnly',

              /* Completeness */
              'skipDefaultLibCheck',
              'skipLibCheck',
            ],
            pathPattern: '^compilerOptions$',
          },
        ],
      },
    },

    ...(await jsonSchema('tsconfig', GLOB_TS_CONFIG)),
  ]
}
