/**
 * Workspace analyzer configuration for the bfra.me/works monorepo.
 *
 * This configuration codifies project-specific rules and patterns
 * that ensure consistency across all packages in the monorepo.
 */

import {defineConfig} from '@bfra.me/workspace-analyzer'

export default defineConfig({
  include: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  exclude: [
    '**/node_modules/**',
    '**/lib/**',
    '**/dist/**',
    '**/coverage/**',
    '**/*.d.ts',
    '**/__mocks__/**',
    '**/test-temp-*/**',
  ],

  minSeverity: 'warning',
  categories: ['dependency', 'configuration', 'architecture', 'circular-import'],

  cache: true,
  cacheDir: '.workspace-analyzer-cache',
  concurrency: 4,

  packagePatterns: ['packages/*', 'scripts'],

  analyzers: {
    'circular-import': {
      enabled: true,
      severity: 'error',
    },
    'unused-dependency': {
      enabled: true,
      severity: 'warning',
    },
    'config-consistency': {
      enabled: true,
      severity: 'warning',
    },
    'version-alignment': {
      enabled: true,
      severity: 'warning',
    },
    'exports-field': {
      enabled: true,
      severity: 'warning',
    },
    'tree-shaking-blocker': {
      enabled: true,
      severity: 'info',
    },
    'dead-code': {
      enabled: false,
    },
    'duplicate-code': {
      enabled: false,
    },
    'large-dependency': {
      enabled: true,
      severity: 'info',
    },
  },

  architecture: {
    layers: [
      {
        name: 'types',
        patterns: ['**/types/**', '**/types.ts'],
        allowedImports: [],
      },
      {
        name: 'utils',
        patterns: ['**/utils/**', '**/helpers/**'],
        allowedImports: ['types'],
      },
      {
        name: 'core',
        patterns: ['**/core/**', '**/parser/**', '**/scanner/**'],
        allowedImports: ['types', 'utils'],
      },
      {
        name: 'analyzers',
        patterns: ['**/analyzers/**'],
        allowedImports: ['types', 'utils', 'core'],
      },
      {
        name: 'reporters',
        patterns: ['**/reporters/**'],
        allowedImports: ['types', 'utils', 'core', 'analyzers'],
      },
      {
        name: 'api',
        patterns: ['**/api/**'],
        allowedImports: ['types', 'utils', 'core', 'analyzers', 'reporters'],
      },
      {
        name: 'cli',
        patterns: ['**/cli/**', '**/cli.ts'],
        allowedImports: ['types', 'utils', 'core', 'analyzers', 'reporters', 'api'],
      },
    ],
    allowBarrelExports: ['**/index.ts'],
    enforcePublicApi: true,
  },
})
