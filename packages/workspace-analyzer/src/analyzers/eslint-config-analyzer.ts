/**
 * EslintConfigAnalyzer - Validates ESLint configuration for consistency and best practices.
 *
 * Detects issues such as:
 * - Missing ESLint configuration files
 * - Inconsistent config patterns across packages
 * - Missing recommended plugins for TypeScript packages
 */

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import fs from 'node:fs/promises'
import path from 'node:path'

import {ok} from '@bfra.me/es/result'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options specific to EslintConfigAnalyzer.
 */
export interface EslintConfigAnalyzerOptions {
  /** Whether to require ESLint config for all packages */
  readonly requireConfig?: boolean
  /** Expected config file pattern (e.g., 'eslint.config.ts') */
  readonly expectedConfigFile?: string
  /** Whether to check for flat config usage */
  readonly requireFlatConfig?: boolean
  /** Package names exempt from checks */
  readonly exemptPackages?: readonly string[]
}

const DEFAULT_OPTIONS: EslintConfigAnalyzerOptions = {
  requireConfig: true,
  expectedConfigFile: 'eslint.config.ts',
  requireFlatConfig: true,
  exemptPackages: [],
}

const METADATA: AnalyzerMetadata = {
  id: 'eslint-config',
  name: 'ESLint Config Analyzer',
  description: 'Validates ESLint configuration for consistency and best practices',
  categories: ['configuration'],
  defaultSeverity: 'warning',
}

const ESLINT_CONFIG_FILES = [
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  '.eslintrc',
] as const

/**
 * Creates an EslintConfigAnalyzer instance.
 */
export function createEslintConfigAnalyzer(options: EslintConfigAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: METADATA,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        if (isExemptPackage(pkg.name, resolvedOptions.exemptPackages)) {
          continue
        }

        const packageIssues = await analyzePackageEslint(pkg, resolvedOptions)
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

function isExemptPackage(name: string, exemptPackages: readonly string[] | undefined): boolean {
  return exemptPackages?.includes(name) ?? false
}

function createLocation(filePath: string): IssueLocation {
  return {filePath}
}

async function analyzePackageEslint(
  pkg: WorkspacePackage,
  options: EslintConfigAnalyzerOptions,
): Promise<Issue[]> {
  const issues: Issue[] = []

  // Find existing ESLint config
  const configResult = await findEslintConfig(pkg.packagePath)

  if (!configResult.found) {
    if (options.requireConfig) {
      issues.push(
        createIssue({
          id: 'eslint-no-config',
          title: 'Missing ESLint configuration',
          description: `Package "${pkg.name}" has no ESLint configuration file`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(path.join(pkg.packagePath, 'package.json')),
          suggestion: `Create "${options.expectedConfigFile ?? 'eslint.config.ts'}" for code quality enforcement`,
        }),
      )
    }
    return issues
  }

  // Check for legacy config files
  if (options.requireFlatConfig && configResult.isLegacy) {
    issues.push(
      createIssue({
        id: 'eslint-legacy-config',
        title: 'Using legacy ESLint configuration',
        description: `Package "${pkg.name}" uses legacy config format "${configResult.fileName}"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configResult.filePath),
        suggestion: 'Migrate to flat config format (eslint.config.ts) for ESLint v9+',
      }),
    )
  }

  // Check if expected config file is used
  if (
    options.expectedConfigFile !== undefined &&
    configResult.fileName !== options.expectedConfigFile &&
    !configResult.isLegacy
  ) {
    issues.push(
      createIssue({
        id: 'eslint-unexpected-config-file',
        title: 'Unexpected ESLint config file name',
        description: `Package "${pkg.name}" uses "${configResult.fileName}" instead of "${options.expectedConfigFile}"`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configResult.filePath),
        suggestion: `Consider renaming to "${options.expectedConfigFile}" for consistency`,
      }),
    )
  }

  // Analyze config content for common issues
  if (!configResult.isLegacy) {
    const contentIssues = await analyzeEslintConfigContent(pkg, configResult.filePath)
    issues.push(...contentIssues)
  }

  return issues
}

interface EslintConfigResult {
  found: boolean
  fileName: string
  filePath: string
  isLegacy: boolean
}

async function findEslintConfig(packagePath: string): Promise<EslintConfigResult> {
  for (const configFile of ESLINT_CONFIG_FILES) {
    const configPath = path.join(packagePath, configFile)
    if (await fileExists(configPath)) {
      return {
        found: true,
        fileName: configFile,
        filePath: configPath,
        isLegacy: isLegacyConfig(configFile),
      }
    }
  }

  return {
    found: false,
    fileName: '',
    filePath: '',
    isLegacy: false,
  }
}

function isLegacyConfig(fileName: string): boolean {
  return fileName.startsWith('.eslintrc')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function analyzeEslintConfigContent(
  pkg: WorkspacePackage,
  configPath: string,
): Promise<Issue[]> {
  const issues: Issue[] = []

  let content: string
  try {
    content = await fs.readFile(configPath, 'utf-8')
  } catch {
    return issues
  }

  // Check for defineConfig usage
  if (!content.includes('defineConfig')) {
    issues.push(
      createIssue({
        id: 'eslint-no-define-config',
        title: 'ESLint config not using defineConfig',
        description: `Package "${pkg.name}" ESLint config may not be using defineConfig() helper`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configPath),
        suggestion: 'Use defineConfig() from your ESLint config package for better type safety',
      }),
    )
  }

  // Check for TypeScript plugin in TS packages
  if (pkg.hasTsConfig) {
    const hasTypescriptPlugin =
      content.includes('typescript-eslint') ||
      content.includes('@typescript-eslint') ||
      content.includes('tseslint')

    if (!hasTypescriptPlugin) {
      issues.push(
        createIssue({
          id: 'eslint-no-typescript-plugin',
          title: 'ESLint config missing TypeScript support',
          description: `Package "${pkg.name}" is a TypeScript package but ESLint config may not include TypeScript plugin`,
          severity: 'warning',
          category: 'configuration',
          location: createLocation(configPath),
          suggestion: 'Add @typescript-eslint/eslint-plugin for TypeScript-specific linting rules',
        }),
      )
    }
  }

  // Check for Prettier integration
  const hasPrettierConfig =
    content.includes('prettier') || content.includes('eslint-config-prettier')

  if (!hasPrettierConfig) {
    issues.push(
      createIssue({
        id: 'eslint-no-prettier',
        title: 'ESLint config may not include Prettier integration',
        description: `Package "${pkg.name}" ESLint config may not disable Prettier-conflicting rules`,
        severity: 'info',
        category: 'configuration',
        location: createLocation(configPath),
        suggestion:
          'Consider adding eslint-config-prettier to avoid formatting conflicts with Prettier',
      }),
    )
  }

  return issues
}

export {METADATA as eslintConfigAnalyzerMetadata}
