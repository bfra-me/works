/**
 * Test fixture helpers for synthetic monorepo testing.
 * Provides utilities for loading and using the synthetic monorepo fixtures.
 */

import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Root directory of the synthetic monorepo fixtures */
export const FIXTURE_ROOT = resolve(__dirname, 'synthetic-monorepo')

/** Gets the absolute path to a fixture file or directory */
export function getFixturePath(...segments: string[]): string {
  return join(FIXTURE_ROOT, ...segments)
}

/** Package paths for easy access */
export const packagePaths = {
  core: getFixturePath('packages', 'core'),
  config: getFixturePath('packages', 'config'),
  types: getFixturePath('packages', 'types'),
  cli: getFixturePath('packages', 'cli'),
  apiClient: getFixturePath('packages', 'api-client'),
  webComponents: getFixturePath('packages', 'web-components'),
  nodeUtils: getFixturePath('packages', 'node-utils'),
  testing: getFixturePath('packages', 'testing'),
  buildTools: getFixturePath('packages', 'build-tools'),
  docsGenerator: getFixturePath('packages', 'docs-generator'),
  logger: getFixturePath('packages', 'logger'),
} as const

/** Application paths for easy access */
export const appPaths = {
  webApp: getFixturePath('apps', 'web-app'),
  apiServer: getFixturePath('apps', 'api-server'),
} as const

/** All fixture package names */
export const fixturePackageNames = [
  '@synthetic/core',
  '@synthetic/config',
  '@synthetic/types',
  '@synthetic/cli',
  '@synthetic/api-client',
  '@synthetic/web-components',
  '@synthetic/node-utils',
  '@synthetic/testing',
  '@synthetic/build-tools',
  '@synthetic/docs-generator',
  '@synthetic/logger',
] as const

/** All fixture app names */
export const fixtureAppNames = ['@synthetic/web-app', '@synthetic/api-server'] as const

/** Fixture package dependency graph */
export const dependencyGraph = {
  '@synthetic/core': [],
  '@synthetic/types': [],
  '@synthetic/config': ['@synthetic/core'],
  '@synthetic/cli': ['@synthetic/core', '@synthetic/config'],
  '@synthetic/api-client': ['@synthetic/types'],
  '@synthetic/web-components': [],
  '@synthetic/node-utils': [],
  '@synthetic/testing': [],
  '@synthetic/build-tools': ['@synthetic/node-utils'],
  '@synthetic/docs-generator': [
    '@synthetic/core',
    '@synthetic/config',
    '@synthetic/types',
    '@synthetic/node-utils',
  ],
  '@synthetic/logger': [],
  '@synthetic/web-app': [
    '@synthetic/core',
    '@synthetic/config',
    '@synthetic/api-client',
    '@synthetic/web-components',
    '@synthetic/logger',
  ],
  '@synthetic/api-server': [
    '@synthetic/core',
    '@synthetic/config',
    '@synthetic/node-utils',
    '@synthetic/logger',
  ],
} as const

/** Gets the source file path for a package */
export function getPackageSourcePath(packageName: keyof typeof packagePaths): string {
  return join(packagePaths[packageName], 'src', 'index.ts')
}

/** Gets the package.json path for a package */
export function getPackageJsonPath(packageName: keyof typeof packagePaths): string {
  return join(packagePaths[packageName], 'package.json')
}

/** Type representing the synthetic monorepo structure */
export interface SyntheticMonorepoStructure {
  root: string
  packages: typeof packagePaths
  apps: typeof appPaths
  packageNames: readonly string[]
  appNames: readonly string[]
}

/** Gets the complete synthetic monorepo structure */
export function getSyntheticMonorepoStructure(): SyntheticMonorepoStructure {
  return {
    root: FIXTURE_ROOT,
    packages: packagePaths,
    apps: appPaths,
    packageNames: fixturePackageNames,
    appNames: fixtureAppNames,
  }
}
