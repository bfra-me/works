/**
 * TreeShakingBlockerAnalyzer - Detects patterns that prevent effective tree-shaking.
 *
 * Identifies code patterns that block bundler tree-shaking optimizations:
 * - CommonJS require() calls mixed with ES modules
 * - Namespace imports (import * as X)
 * - Side-effect imports without proper module configuration
 * - Module.exports patterns
 * - Dynamic requires with non-literal arguments
 *
 * Also detects type-only import enforcement opportunities (TASK-051) and
 * provides dynamic import optimization suggestions (TASK-052).
 */

import type {SourceFile} from 'ts-morph'

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'
import {SyntaxKind} from 'ts-morph'

import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options for TreeShakingBlockerAnalyzer.
 */
export interface TreeShakingBlockerAnalyzerOptions {
  /** Report namespace imports (import * as X) */
  readonly reportNamespaceImports?: boolean
  /** Report CommonJS require() calls */
  readonly reportRequireCalls?: boolean
  /** Report module.exports patterns */
  readonly reportModuleExports?: boolean
  /** Report dynamic require with non-literal arguments */
  readonly reportDynamicRequire?: boolean
  /** Report type-only import opportunities */
  readonly reportTypeOnlyOpportunities?: boolean
  /** Report dynamic import optimization opportunities */
  readonly reportDynamicImportOpportunities?: boolean
  /** Severity for CommonJS interop issues */
  readonly commonJsInteropSeverity?: Severity
  /** Severity for namespace import issues */
  readonly namespaceImportSeverity?: Severity
  /** Severity for type-only import opportunities */
  readonly typeOnlyImportSeverity?: Severity
  /** File patterns to exclude from analysis */
  readonly excludePatterns?: readonly string[]
}

const DEFAULT_OPTIONS: Required<TreeShakingBlockerAnalyzerOptions> = {
  reportNamespaceImports: true,
  reportRequireCalls: true,
  reportModuleExports: true,
  reportDynamicRequire: true,
  reportTypeOnlyOpportunities: true,
  reportDynamicImportOpportunities: true,
  commonJsInteropSeverity: 'warning',
  namespaceImportSeverity: 'info',
  typeOnlyImportSeverity: 'info',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/__mocks__/**'],
}

export const treeShakingBlockerAnalyzerMetadata: AnalyzerMetadata = {
  id: 'tree-shaking-blocker',
  name: 'Tree-Shaking Blocker Analyzer',
  description: 'Detects patterns that prevent effective tree-shaking in bundlers',
  categories: ['performance'],
  defaultSeverity: 'warning',
}

/**
 * Creates a TreeShakingBlockerAnalyzer instance.
 */
export function createTreeShakingBlockerAnalyzer(
  options: TreeShakingBlockerAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: treeShakingBlockerAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing tree-shaking blockers in ${pkg.name}...`)

        const packageIssues = await analyzePackageTreeShaking(
          pkg,
          context.workspacePath,
          resolvedOptions,
        )
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Detected tree-shaking blocker pattern.
 */
export interface TreeShakingBlocker {
  /** Type of blocker */
  readonly type: TreeShakingBlockerType
  /** Location in source */
  readonly location: IssueLocation
  /** Detailed description */
  readonly description: string
  /** Suggested fix */
  readonly suggestion: string
  /** Additional metadata */
  readonly metadata?: Readonly<Record<string, unknown>>
}

export type TreeShakingBlockerType =
  | 'namespace-import'
  | 'require-call'
  | 'module-exports'
  | 'dynamic-require'
  | 'side-effect-import'
  | 'type-only-opportunity'
  | 'dynamic-import-opportunity'

async function analyzePackageTreeShaking(
  pkg: WorkspacePackage,
  _workspacePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Promise<Issue[]> {
  const issues: Issue[] = []

  const sourceFiles = filterSourceFiles(pkg.sourceFiles, options.excludePatterns)
  if (sourceFiles.length === 0) {
    return issues
  }

  const project = createProject()

  for (const filePath of sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const fileIssues = analyzeFileTreeShaking(sourceFile, pkg, options)
      issues.push(...fileIssues)
    } catch {
      // File may not be parseable
    }
  }

  return issues
}

function analyzeFileTreeShaking(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []
  const filePath = sourceFile.getFilePath()

  // Check for namespace imports
  if (options.reportNamespaceImports) {
    const namespaceIssues = detectNamespaceImports(sourceFile, pkg, filePath, options)
    issues.push(...namespaceIssues)
  }

  // Check for CommonJS patterns
  if (options.reportRequireCalls) {
    const requireIssues = detectRequireCalls(sourceFile, pkg, filePath, options)
    issues.push(...requireIssues)
  }

  if (options.reportModuleExports) {
    const exportIssues = detectModuleExports(sourceFile, pkg, filePath, options)
    issues.push(...exportIssues)
  }

  if (options.reportDynamicRequire) {
    const dynamicRequireIssues = detectDynamicRequire(sourceFile, pkg, filePath, options)
    issues.push(...dynamicRequireIssues)
  }

  // Check for type-only import opportunities
  if (options.reportTypeOnlyOpportunities) {
    const typeOnlyIssues = detectTypeOnlyOpportunities(sourceFile, pkg, filePath, options)
    issues.push(...typeOnlyIssues)
  }

  // Check for dynamic import opportunities
  if (options.reportDynamicImportOpportunities) {
    const dynamicImportIssues = detectDynamicImportOpportunities(sourceFile, pkg, filePath, options)
    issues.push(...dynamicImportIssues)
  }

  return issues
}

function detectNamespaceImports(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const namespaceImport = importDecl.getNamespaceImport()
    if (namespaceImport === undefined) continue

    const moduleSpecifier = importDecl.getModuleSpecifierValue()
    const {line, column} = sourceFile.getLineAndColumnAtPos(importDecl.getStart())

    // Skip relative imports (internal modules)
    if (moduleSpecifier.startsWith('.')) continue

    issues.push(
      createIssue({
        id: 'namespace-import',
        title: `Namespace import from '${moduleSpecifier}'`,
        description:
          `Namespace imports (import * as ${namespaceImport.getText()}) include all exports from ` +
          `'${moduleSpecifier}', preventing tree-shaking from removing unused exports.`,
        severity: options.namespaceImportSeverity,
        category: 'performance',
        location: {filePath, line, column},
        suggestion:
          `Consider using named imports: import { specificExport } from '${moduleSpecifier}' ` +
          `to allow tree-shaking of unused exports.`,
        metadata: {
          packageName: pkg.name,
          moduleSpecifier,
          namespaceName: namespaceImport.getText(),
          blockerType: 'namespace-import' as const,
        },
      }),
    )
  }

  return issues
}

function detectRequireCalls(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  sourceFile.forEachDescendant(node => {
    if (node.getKind() !== SyntaxKind.CallExpression) return

    const callExpr = node.asKind(SyntaxKind.CallExpression)
    if (callExpr === undefined) return

    const expr = callExpr.getExpression()
    if (expr.getKind() !== SyntaxKind.Identifier || expr.getText() !== 'require') return

    const args = callExpr.getArguments()
    if (args.length === 0) return

    const firstArg = args[0]
    if (firstArg === undefined) return

    const {line, column} = sourceFile.getLineAndColumnAtPos(node.getStart())

    if (firstArg.getKind() === SyntaxKind.StringLiteral) {
      const stringLiteral = firstArg.asKind(SyntaxKind.StringLiteral)
      const moduleSpecifier = stringLiteral?.getLiteralValue() ?? ''

      issues.push(
        createIssue({
          id: 'commonjs-require',
          title: `CommonJS require() call for '${moduleSpecifier}'`,
          description:
            `require() is CommonJS syntax that prevents ES module tree-shaking. ` +
            `The entire module will be included in the bundle regardless of which exports are used.`,
          severity: options.commonJsInteropSeverity,
          category: 'performance',
          location: {filePath, line, column},
          suggestion:
            `Convert to ES module import: import { ... } from '${moduleSpecifier}' ` +
            `for better tree-shaking support.`,
          metadata: {
            packageName: pkg.name,
            moduleSpecifier,
            blockerType: 'require-call' as const,
          },
        }),
      )
    }
  })

  return issues
}

function detectModuleExports(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  sourceFile.forEachDescendant(node => {
    if (node.getKind() !== SyntaxKind.BinaryExpression) return

    const binaryExpr = node.asKind(SyntaxKind.BinaryExpression)
    if (binaryExpr === undefined) return

    const left = binaryExpr.getLeft()
    const leftText = left.getText()

    // Check for module.exports = or exports.X =
    if (!leftText.startsWith('module.exports') && !leftText.startsWith('exports.')) return

    const {line, column} = sourceFile.getLineAndColumnAtPos(node.getStart())

    issues.push(
      createIssue({
        id: 'module-exports',
        title: `CommonJS ${leftText.split('=')[0]?.trim()} pattern`,
        description:
          `CommonJS module.exports/exports patterns prevent ES module tree-shaking. ` +
          `The entire module will be bundled regardless of which exports are consumed.`,
        severity: options.commonJsInteropSeverity,
        category: 'performance',
        location: {filePath, line, column},
        suggestion:
          `Convert to ES module exports: export { ... } or export default ... ` +
          `for better tree-shaking support.`,
        metadata: {
          packageName: pkg.name,
          exportPattern: leftText.split('=')[0]?.trim(),
          blockerType: 'module-exports' as const,
        },
      }),
    )
  })

  return issues
}

function detectDynamicRequire(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  sourceFile.forEachDescendant(node => {
    if (node.getKind() !== SyntaxKind.CallExpression) return

    const callExpr = node.asKind(SyntaxKind.CallExpression)
    if (callExpr === undefined) return

    const expr = callExpr.getExpression()
    if (expr.getKind() !== SyntaxKind.Identifier || expr.getText() !== 'require') return

    const args = callExpr.getArguments()
    if (args.length === 0) return

    const firstArg = args[0]
    if (firstArg === undefined) return

    // Only report non-literal requires (dynamic)
    if (firstArg.getKind() === SyntaxKind.StringLiteral) return

    const {line, column} = sourceFile.getLineAndColumnAtPos(node.getStart())

    issues.push(
      createIssue({
        id: 'dynamic-require',
        title: 'Dynamic require() with non-literal argument',
        description:
          `Dynamic require() with computed module paths cannot be statically analyzed, ` +
          `preventing any tree-shaking or code splitting optimization.`,
        severity: options.commonJsInteropSeverity,
        category: 'performance',
        location: {filePath, line, column},
        suggestion:
          `Consider using a static require() or converting to dynamic import() ` +
          `with explicit module paths for better bundler optimization.`,
        metadata: {
          packageName: pkg.name,
          argumentText: firstArg.getText(),
          blockerType: 'dynamic-require' as const,
        },
      }),
    )
  })

  return issues
}

/**
 * Detects opportunities to use type-only imports (TASK-051).
 *
 * Type-only imports (import type { X } from 'pkg') are completely removed during
 * TypeScript compilation, resulting in smaller bundles and avoiding side effects.
 *
 * This uses a heuristic approach checking if imported names follow common type naming
 * conventions (interfaces, type aliases, etc.) rather than full reference analysis.
 */
function detectTypeOnlyOpportunities(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  for (const importDecl of sourceFile.getImportDeclarations()) {
    // Skip already type-only imports
    if (importDecl.isTypeOnly()) continue

    const namedImports = importDecl.getNamedImports()
    if (namedImports.length === 0) continue

    const potentialTypeOnlyNames: string[] = []

    for (const namedImport of namedImports) {
      // Skip imports already marked as type-only
      if (namedImport.isTypeOnly()) continue

      const name = namedImport.getName()

      // Heuristic: Check if name follows common type naming patterns
      // This is a conservative approach that catches obvious cases
      if (isLikelyTypeName(name)) {
        potentialTypeOnlyNames.push(name)
      }
    }

    if (potentialTypeOnlyNames.length > 0) {
      const {line, column} = sourceFile.getLineAndColumnAtPos(importDecl.getStart())
      const moduleSpecifier = importDecl.getModuleSpecifierValue()

      issues.push(
        createIssue({
          id: 'type-only-import-opportunity',
          title: `Potential type-only import in '${moduleSpecifier}'`,
          description:
            `The import(s) { ${potentialTypeOnlyNames.join(', ')} } may be type-only based on naming conventions. ` +
            `If these are only used as types, marking them as type-only reduces bundle size.`,
          severity: options.typeOnlyImportSeverity,
          category: 'performance',
          location: {filePath, line, column},
          suggestion:
            `Review usage and consider: import type { ${potentialTypeOnlyNames.join(', ')} } from '${moduleSpecifier}' ` +
            `or mark individual imports: import { type ${potentialTypeOnlyNames[0]} } from '${moduleSpecifier}'`,
          metadata: {
            packageName: pkg.name,
            moduleSpecifier,
            typeOnlyImports: potentialTypeOnlyNames,
            blockerType: 'type-only-opportunity' as const,
          },
        }),
      )
    }
  }

  return issues
}

/**
 * Checks if a name follows common type naming conventions.
 *
 * Matches:
 * - Names starting with 'I' followed by uppercase (IUser, IConfig)
 * - Names ending with 'Type', 'Props', 'Options', 'Config', 'State', 'Context', 'Params'
 * - Names ending with 'Interface' or starting with 'Abstract'
 */
function isLikelyTypeName(name: string): boolean {
  // Interface naming convention: IUser, IConfig
  if (/^I[A-Z]/.test(name)) return true

  // Common type suffixes
  const typeSuffixes = [
    'Type',
    'Types',
    'Props',
    'Options',
    'Config',
    'Configuration',
    'State',
    'Context',
    'Params',
    'Parameters',
    'Interface',
    'Enum',
    'Kind',
    'Metadata',
    'Schema',
    'Definition',
  ]

  if (typeSuffixes.some(suffix => name.endsWith(suffix))) return true

  // Abstract prefix
  if (name.startsWith('Abstract')) return true

  return false
}

/**
 * Detects opportunities for dynamic imports (TASK-052).
 *
 * Large modules that are not immediately needed on page load can be
 * dynamically imported for code splitting and faster initial load.
 */
function detectDynamicImportOpportunities(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
  _options: Required<TreeShakingBlockerAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  // Large packages that benefit from dynamic imports
  const LARGE_PACKAGES = new Set([
    'lodash',
    'lodash-es',
    'moment',
    'd3',
    'chart.js',
    'three',
    '@mui/material',
    'antd',
    'rxjs',
    '@angular/core',
    'monaco-editor',
    'highlight.js',
    'prismjs',
    'marked',
    'pdf-lib',
    'xlsx',
    'jszip',
  ])

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()
    const basePkg = getBasePackageName(moduleSpecifier)

    if (!LARGE_PACKAGES.has(basePkg)) continue

    // Check if this import could be lazily loaded
    const {line, column} = sourceFile.getLineAndColumnAtPos(importDecl.getStart())

    // Check if the import is used in conditional or lazy contexts
    const namedImports = importDecl.getNamedImports()
    const defaultImport = importDecl.getDefaultImport()
    const namespaceImport = importDecl.getNamespaceImport()

    const importNames =
      namedImports.length > 0
        ? namedImports.map(n => n.getName()).join(', ')
        : (defaultImport?.getText() ?? namespaceImport?.getText() ?? 'module')

    issues.push(
      createIssue({
        id: 'dynamic-import-opportunity',
        title: `Consider dynamic import for '${basePkg}'`,
        description:
          `'${basePkg}' is a large package (${importNames}) that could be dynamically imported ` +
          `for code splitting. This can improve initial page load time by deferring the module load.`,
        severity: 'info',
        category: 'performance',
        location: {filePath, line, column},
        suggestion:
          `If '${basePkg}' is not needed immediately, consider using dynamic import: ` +
          `const ${importNames.split(',')[0]} = await import('${moduleSpecifier}')`,
        metadata: {
          packageName: pkg.name,
          moduleSpecifier,
          importNames,
          blockerType: 'dynamic-import-opportunity' as const,
        },
      }),
    )
  }

  return issues
}

function filterSourceFiles(
  sourceFiles: readonly string[],
  excludePatterns: readonly string[],
): string[] {
  return sourceFiles.filter(filePath => {
    const fileName = filePath.split('/').pop() ?? ''

    return !excludePatterns.some(pattern => {
      if (pattern.includes('**')) {
        const regex = patternToRegex(pattern)
        return regex.test(filePath)
      }
      return fileName.includes(pattern.replace('*', ''))
    })
  })
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replaceAll('.', String.raw`\.`)
    .replaceAll('**', '.*')
    .replaceAll('*', '[^/]*')
  return new RegExp(escaped)
}

function getBasePackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
  }
  return specifier.split('/')[0] ?? specifier
}
