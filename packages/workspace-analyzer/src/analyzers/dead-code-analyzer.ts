/**
 * DeadCodeAnalyzer - Detects unreachable exports and unused code.
 *
 * Identifies code that is exported but never imported or used:
 * - Exported functions never imported anywhere
 * - Exported classes never instantiated or extended
 * - Exported constants never referenced
 * - Public API surface that could be reduced
 *
 * This helps identify code that can be safely removed to reduce bundle size
 * and maintenance burden.
 */

import type {SourceFile} from 'ts-morph'

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, IssueLocation, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'
import {SyntaxKind} from 'ts-morph'

import {extractImports} from '../parser/import-extractor'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options for DeadCodeAnalyzer.
 */
export interface DeadCodeAnalyzerOptions {
  /** Check for unused exports */
  readonly checkUnusedExports?: boolean
  /** Check for unreachable code paths */
  readonly checkUnreachableCode?: boolean
  /** Analyze cross-package usage (exports used in other workspace packages) */
  readonly crossPackageAnalysis?: boolean
  /** Consider re-exports as usage */
  readonly countReexportsAsUsage?: boolean
  /** Export patterns to ignore (e.g., 'index.ts' entry points) */
  readonly ignoreExportPatterns?: readonly string[]
  /** Severity for unused export warnings */
  readonly unusedExportSeverity?: Severity
  /** Severity for unreachable code warnings */
  readonly unreachableCodeSeverity?: Severity
  /** File patterns to exclude from analysis */
  readonly excludePatterns?: readonly string[]
}

const DEFAULT_OPTIONS: Required<DeadCodeAnalyzerOptions> = {
  checkUnusedExports: true,
  checkUnreachableCode: true,
  crossPackageAnalysis: true,
  countReexportsAsUsage: true,
  ignoreExportPatterns: ['**/index.ts', '**/index.tsx'],
  unusedExportSeverity: 'info',
  unreachableCodeSeverity: 'warning',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/__mocks__/**'],
}

export const deadCodeAnalyzerMetadata: AnalyzerMetadata = {
  id: 'dead-code',
  name: 'Dead Code Analyzer',
  description: 'Detects unreachable exports and unused code that can be safely removed',
  categories: ['unused-export', 'performance'],
  defaultSeverity: 'info',
}

/**
 * Information about an exported symbol.
 */
export interface ExportedSymbol {
  /** Symbol name */
  readonly name: string
  /** Export type */
  readonly type: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'namespace'
  /** File where exported */
  readonly filePath: string
  /** Location of the export */
  readonly location: IssueLocation
  /** Whether this is a re-export */
  readonly isReexport: boolean
  /** Whether this is a default export */
  readonly isDefault: boolean
  /** Package containing this export */
  readonly packageName: string
}

/**
 * Creates a DeadCodeAnalyzer instance.
 */
export function createDeadCodeAnalyzer(options: DeadCodeAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: deadCodeAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      // Step 1: Collect all exports from all packages
      context.reportProgress?.('Collecting exports...')
      const allExports = new Map<string, ExportedSymbol[]>()

      for (const pkg of context.packages) {
        const exports = await collectPackageExports(pkg, resolvedOptions)
        allExports.set(pkg.name, exports)
      }

      // Step 2: Collect all imports from all packages
      context.reportProgress?.('Collecting imports...')
      const allImports = new Map<string, ImportInfo[]>()

      for (const pkg of context.packages) {
        const imports = await collectPackageImports(pkg, resolvedOptions)
        allImports.set(pkg.name, imports)
      }

      // Step 3: Analyze export usage
      context.reportProgress?.('Analyzing export usage...')

      for (const pkg of context.packages) {
        const packageIssues = analyzePackageDeadCode(pkg, allExports, allImports, resolvedOptions)
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

interface ImportInfo {
  /** Module specifier */
  readonly moduleSpecifier: string
  /** Imported names */
  readonly importedNames: readonly string[]
  /** File where the import is */
  readonly filePath: string
  /** Package name */
  readonly packageName: string
}

async function collectPackageExports(
  pkg: WorkspacePackage,
  options: Required<DeadCodeAnalyzerOptions>,
): Promise<ExportedSymbol[]> {
  const exports: ExportedSymbol[] = []

  const sourceFiles = filterSourceFiles(pkg.sourceFiles, options.excludePatterns)
  if (sourceFiles.length === 0) {
    return exports
  }

  const project = createProject()

  for (const filePath of sourceFiles) {
    // Skip index files if configured
    if (shouldIgnoreFile(filePath, options.ignoreExportPatterns)) {
      continue
    }

    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const fileExports = collectFileExports(sourceFile, pkg, filePath)
      exports.push(...fileExports)
    } catch {
      // File may not be parseable
    }
  }

  return exports
}

function collectFileExports(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  filePath: string,
): ExportedSymbol[] {
  const exports: ExportedSymbol[] = []

  // Collect exported declarations
  for (const stmt of sourceFile.getStatements()) {
    // Function declarations
    if (stmt.getKind() === SyntaxKind.FunctionDeclaration) {
      const funcDecl = stmt.asKind(SyntaxKind.FunctionDeclaration)
      if (funcDecl === undefined) continue

      if (funcDecl.isExported()) {
        const name = funcDecl.getName()
        if (name === undefined) continue

        const {line, column} = sourceFile.getLineAndColumnAtPos(funcDecl.getStart())

        exports.push({
          name,
          type: 'function',
          filePath,
          location: {filePath, line, column},
          isReexport: false,
          isDefault: funcDecl.isDefaultExport(),
          packageName: pkg.name,
        })
      }
    }

    // Class declarations
    if (stmt.getKind() === SyntaxKind.ClassDeclaration) {
      const classDecl = stmt.asKind(SyntaxKind.ClassDeclaration)
      if (classDecl === undefined) continue

      if (classDecl.isExported()) {
        const name = classDecl.getName()
        if (name === undefined) continue

        const {line, column} = sourceFile.getLineAndColumnAtPos(classDecl.getStart())

        exports.push({
          name,
          type: 'class',
          filePath,
          location: {filePath, line, column},
          isReexport: false,
          isDefault: classDecl.isDefaultExport(),
          packageName: pkg.name,
        })
      }
    }

    // Variable statements
    if (stmt.getKind() === SyntaxKind.VariableStatement) {
      const varStmt = stmt.asKind(SyntaxKind.VariableStatement)
      if (varStmt === undefined) continue

      if (varStmt.isExported()) {
        for (const decl of varStmt.getDeclarations()) {
          const name = decl.getName()
          const {line, column} = sourceFile.getLineAndColumnAtPos(decl.getStart())

          exports.push({
            name,
            type: 'variable',
            filePath,
            location: {filePath, line, column},
            isReexport: false,
            isDefault: false,
            packageName: pkg.name,
          })
        }
      }
    }

    // Type aliases
    if (stmt.getKind() === SyntaxKind.TypeAliasDeclaration) {
      const typeDecl = stmt.asKind(SyntaxKind.TypeAliasDeclaration)
      if (typeDecl === undefined) continue

      if (typeDecl.isExported()) {
        const name = typeDecl.getName()
        const {line, column} = sourceFile.getLineAndColumnAtPos(typeDecl.getStart())

        exports.push({
          name,
          type: 'type',
          filePath,
          location: {filePath, line, column},
          isReexport: false,
          isDefault: false,
          packageName: pkg.name,
        })
      }
    }

    // Interfaces
    if (stmt.getKind() === SyntaxKind.InterfaceDeclaration) {
      const ifaceDecl = stmt.asKind(SyntaxKind.InterfaceDeclaration)
      if (ifaceDecl === undefined) continue

      if (ifaceDecl.isExported()) {
        const name = ifaceDecl.getName()
        const {line, column} = sourceFile.getLineAndColumnAtPos(ifaceDecl.getStart())

        exports.push({
          name,
          type: 'interface',
          filePath,
          location: {filePath, line, column},
          isReexport: false,
          isDefault: false,
          packageName: pkg.name,
        })
      }
    }

    // Enums
    if (stmt.getKind() === SyntaxKind.EnumDeclaration) {
      const enumDecl = stmt.asKind(SyntaxKind.EnumDeclaration)
      if (enumDecl === undefined) continue

      if (enumDecl.isExported()) {
        const name = enumDecl.getName()
        const {line, column} = sourceFile.getLineAndColumnAtPos(enumDecl.getStart())

        exports.push({
          name,
          type: 'enum',
          filePath,
          location: {filePath, line, column},
          isReexport: false,
          isDefault: false,
          packageName: pkg.name,
        })
      }
    }
  }

  // Collect re-exports from export declarations
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue()
    if (moduleSpecifier === undefined) continue

    const {line, column} = sourceFile.getLineAndColumnAtPos(exportDecl.getStart())

    // Named re-exports
    for (const namedExport of exportDecl.getNamedExports()) {
      const name = namedExport.getName()
      exports.push({
        name,
        type: 'variable', // Type is unknown from re-export
        filePath,
        location: {filePath, line, column},
        isReexport: true,
        isDefault: false,
        packageName: pkg.name,
      })
    }
  }

  return exports
}

async function collectPackageImports(
  pkg: WorkspacePackage,
  options: Required<DeadCodeAnalyzerOptions>,
): Promise<ImportInfo[]> {
  const imports: ImportInfo[] = []

  const sourceFiles = filterSourceFiles(pkg.sourceFiles, options.excludePatterns)
  if (sourceFiles.length === 0) {
    return imports
  }

  const project = createProject()

  for (const filePath of sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const result = extractImports(sourceFile)

      for (const imp of result.imports) {
        const importedNames: string[] = []

        if (imp.defaultImport !== undefined) {
          importedNames.push('default')
        }
        if (imp.namespaceImport !== undefined) {
          importedNames.push('*')
        }
        if (imp.importedNames !== undefined) {
          importedNames.push(...imp.importedNames)
        }

        imports.push({
          moduleSpecifier: imp.moduleSpecifier,
          importedNames,
          filePath,
          packageName: pkg.name,
        })
      }
    } catch {
      // File may not be parseable
    }
  }

  return imports
}

function analyzePackageDeadCode(
  pkg: WorkspacePackage,
  allExports: Map<string, ExportedSymbol[]>,
  allImports: Map<string, ImportInfo[]>,
  options: Required<DeadCodeAnalyzerOptions>,
): Issue[] {
  const issues: Issue[] = []

  const packageExports = allExports.get(pkg.name) ?? []
  if (packageExports.length === 0) {
    return issues
  }

  // Build a set of all imported symbols across the workspace
  const usedSymbols = new Set<string>()

  for (const [pkgName, imports] of allImports) {
    // Skip same-package imports if not doing cross-package analysis
    if (!options.crossPackageAnalysis && pkgName !== pkg.name) {
      continue
    }

    for (const imp of imports) {
      // Check if this import refers to the current package
      const isCurrentPackage =
        imp.moduleSpecifier.startsWith(`.`) ||
        imp.moduleSpecifier === pkg.name ||
        imp.moduleSpecifier.startsWith(`${pkg.name}/`)

      if (isCurrentPackage) {
        for (const name of imp.importedNames) {
          usedSymbols.add(name)
        }
      }
    }
  }

  // Also consider exports from index files as "using" internal exports
  if (options.countReexportsAsUsage) {
    for (const exp of packageExports) {
      if (exp.isReexport) {
        // The re-exported symbol is considered used
        usedSymbols.add(exp.name)
      }
    }
  }

  // Check each export for usage
  for (const exp of packageExports) {
    // Skip re-exports (they're tracked separately)
    if (exp.isReexport) continue

    // Skip types and interfaces (they're erased at runtime)
    if (exp.type === 'type' || exp.type === 'interface') continue

    const isUsed = usedSymbols.has(exp.name) || (exp.isDefault && usedSymbols.has('default'))

    if (!isUsed) {
      issues.push(
        createIssue({
          id: 'unused-export',
          title: `Unused export: '${exp.name}'`,
          description:
            `The ${exp.type} '${exp.name}' is exported but never imported within the workspace. ` +
            `This may indicate dead code that can be removed to reduce bundle size.`,
          severity: options.unusedExportSeverity,
          category: 'unused-export',
          location: exp.location,
          suggestion:
            `If '${exp.name}' is only used externally (outside this workspace), consider documenting it as public API. ` +
            `Otherwise, consider removing the export or the entire declaration if unused.`,
          metadata: {
            packageName: pkg.name,
            exportName: exp.name,
            exportType: exp.type,
            isDefault: exp.isDefault,
          },
        }),
      )
    }
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
      return fileName.includes(pattern.replaceAll('*', ''))
    })
  })
}

function shouldIgnoreFile(filePath: string, ignorePatterns: readonly string[]): boolean {
  const fileName = filePath.split('/').pop() ?? ''

  return ignorePatterns.some(pattern => {
    if (pattern.includes('**')) {
      const regex = patternToRegex(pattern)
      return regex.test(filePath)
    }
    return (
      fileName === pattern.replaceAll('*', '') ||
      fileName.includes(pattern.replaceAll('**/', '').replaceAll('*', ''))
    )
  })
}

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replaceAll('.', String.raw`\.`)
    .replaceAll('**', '.*')
    .replaceAll('*', '[^/]*')
  return new RegExp(escaped)
}

/**
 * Computes statistics about dead code in a package.
 */
export interface DeadCodeStats {
  /** Total exports analyzed */
  readonly totalExports: number
  /** Number of unused exports */
  readonly unusedExports: number
  /** Number of used exports */
  readonly usedExports: number
  /** Usage percentage */
  readonly usagePercentage: number
  /** Breakdown by export type */
  readonly byType: Readonly<Record<string, {total: number; unused: number}>>
}

/**
 * Computes dead code statistics from analysis results.
 */
export function computeDeadCodeStats(
  exports: readonly ExportedSymbol[],
  unusedExportNames: readonly string[],
): DeadCodeStats {
  const unusedSet = new Set(unusedExportNames)

  const byType: Record<string, {total: number; unused: number}> = {}

  for (const exp of exports) {
    const existing = byType[exp.type]
    if (existing === undefined) {
      byType[exp.type] = {
        total: 1,
        unused: unusedSet.has(exp.name) ? 1 : 0,
      }
    } else {
      existing.total++
      if (unusedSet.has(exp.name)) {
        existing.unused++
      }
    }
  }

  const totalExports = exports.length
  const unusedExports = unusedExportNames.length
  const usedExports = totalExports - unusedExports
  const usagePercentage = totalExports === 0 ? 100 : (usedExports / totalExports) * 100

  return {
    totalExports,
    unusedExports,
    usedExports,
    usagePercentage,
    byType,
  }
}
