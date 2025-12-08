/**
 * Import statement extractor for analyzing module dependencies.
 *
 * Extracts static imports, dynamic imports, and require() calls from TypeScript/JavaScript
 * source files for dependency analysis.
 *
 * Uses ts-morph types (SourceFile, SyntaxKind) which are provided as a peer dependency
 * via @bfra.me/doc-sync's transitive dependency on ts-morph.
 */

import type {SourceFile} from 'ts-morph'

import path from 'node:path'

import {SyntaxKind} from 'ts-morph'

/**
 * Type of import statement.
 */
export type ImportType = 'static' | 'dynamic' | 'require' | 'type-only'

/**
 * Represents an extracted import statement.
 */
export interface ExtractedImport {
  /** The module specifier (path or package name) */
  readonly moduleSpecifier: string
  /** Type of import */
  readonly type: ImportType
  /** Imported names (for named imports) */
  readonly importedNames?: readonly string[]
  /** Default import name (if present) */
  readonly defaultImport?: string
  /** Namespace import name (if present) */
  readonly namespaceImport?: string
  /** Whether this is a side-effect only import */
  readonly isSideEffectOnly: boolean
  /** Whether the import is from a relative path */
  readonly isRelative: boolean
  /** Whether the import is from a workspace package */
  readonly isWorkspacePackage: boolean
  /** Line number in the source file */
  readonly line: number
  /** Column number in the source file */
  readonly column: number
}

/**
 * Result of extracting imports from a source file.
 */
export interface ImportExtractionResult {
  /** All extracted imports */
  readonly imports: readonly ExtractedImport[]
  /** The source file path */
  readonly filePath: string
  /** External package dependencies (non-relative, non-workspace) */
  readonly externalDependencies: readonly string[]
  /** Workspace package dependencies */
  readonly workspaceDependencies: readonly string[]
  /** Relative imports within the package */
  readonly relativeImports: readonly string[]
}

/**
 * Options for import extraction.
 */
export interface ImportExtractorOptions {
  /** Workspace package name prefixes (e.g., ['@bfra.me/']) */
  readonly workspacePrefixes?: readonly string[]
  /** Include type-only imports */
  readonly includeTypeImports?: boolean
  /** Include dynamic imports */
  readonly includeDynamicImports?: boolean
  /** Include require() calls */
  readonly includeRequireCalls?: boolean
}

const DEFAULT_OPTIONS: Required<ImportExtractorOptions> = {
  workspacePrefixes: ['@bfra.me/'],
  includeTypeImports: true,
  includeDynamicImports: true,
  includeRequireCalls: true,
}

/**
 * Extracts all imports from a TypeScript/JavaScript source file.
 *
 * @example
 * ```ts
 * const project = createProject()
 * const sourceFile = project.addSourceFileAtPath('./src/index.ts')
 * const result = extractImports(sourceFile)
 *
 * for (const imp of result.imports) {
 *   console.log(`Import: ${imp.moduleSpecifier} (${imp.type})`)
 * }
 * ```
 */
export function extractImports(
  sourceFile: SourceFile,
  options?: ImportExtractorOptions,
): ImportExtractionResult {
  const opts = {...DEFAULT_OPTIONS, ...options}
  const imports: ExtractedImport[] = []
  const filePath = sourceFile.getFilePath()

  // Extract static import declarations
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()
    const isTypeOnly = importDecl.isTypeOnly()

    if (isTypeOnly && !opts.includeTypeImports) {
      continue
    }

    const {line, column} = sourceFile.getLineAndColumnAtPos(importDecl.getStart())

    const importedNames: string[] = []
    let defaultImport: string | undefined
    let namespaceImport: string | undefined

    const defaultImportNode = importDecl.getDefaultImport()
    if (defaultImportNode !== undefined) {
      defaultImport = defaultImportNode.getText()
    }

    const namespaceImportNode = importDecl.getNamespaceImport()
    if (namespaceImportNode !== undefined) {
      namespaceImport = namespaceImportNode.getText()
    }

    for (const namedImport of importDecl.getNamedImports()) {
      importedNames.push(namedImport.getName())
    }

    const isSideEffectOnly =
      defaultImport === undefined && namespaceImport === undefined && importedNames.length === 0

    imports.push({
      moduleSpecifier,
      type: isTypeOnly ? 'type-only' : 'static',
      importedNames: importedNames.length > 0 ? importedNames : undefined,
      defaultImport,
      namespaceImport,
      isSideEffectOnly,
      isRelative: isRelativeImport(moduleSpecifier),
      isWorkspacePackage: isWorkspacePackageImport(moduleSpecifier, opts.workspacePrefixes),
      line,
      column,
    })
  }

  // Extract dynamic imports
  if (opts.includeDynamicImports) {
    sourceFile.forEachDescendant(node => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression)
        if (callExpr === undefined) return

        const expr = callExpr.getExpression()
        if (expr.getKind() === SyntaxKind.ImportKeyword) {
          const args = callExpr.getArguments()
          if (args.length > 0) {
            const firstArg = args[0]
            if (firstArg !== undefined && firstArg.getKind() === SyntaxKind.StringLiteral) {
              const stringLiteral = firstArg.asKind(SyntaxKind.StringLiteral)
              if (stringLiteral !== undefined) {
                const moduleSpecifier = stringLiteral.getLiteralValue()
                const {line: dynamicLine, column: dynamicColumn} = sourceFile.getLineAndColumnAtPos(
                  node.getStart(),
                )

                imports.push({
                  moduleSpecifier,
                  type: 'dynamic',
                  isSideEffectOnly: false,
                  isRelative: isRelativeImport(moduleSpecifier),
                  isWorkspacePackage: isWorkspacePackageImport(
                    moduleSpecifier,
                    opts.workspacePrefixes,
                  ),
                  line: dynamicLine,
                  column: dynamicColumn,
                })
              }
            }
          }
        }
      }
    })
  }

  // Extract require() calls
  if (opts.includeRequireCalls) {
    sourceFile.forEachDescendant(node => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression)
        if (callExpr === undefined) return

        const expr = callExpr.getExpression()
        if (expr.getKind() === SyntaxKind.Identifier && expr.getText() === 'require') {
          const args = callExpr.getArguments()
          if (args.length > 0) {
            const firstArg = args[0]
            if (firstArg !== undefined && firstArg.getKind() === SyntaxKind.StringLiteral) {
              const stringLiteral = firstArg.asKind(SyntaxKind.StringLiteral)
              if (stringLiteral !== undefined) {
                const moduleSpecifier = stringLiteral.getLiteralValue()
                const {line: requireLine, column: requireColumn} = sourceFile.getLineAndColumnAtPos(
                  node.getStart(),
                )

                imports.push({
                  moduleSpecifier,
                  type: 'require',
                  isSideEffectOnly: false,
                  isRelative: isRelativeImport(moduleSpecifier),
                  isWorkspacePackage: isWorkspacePackageImport(
                    moduleSpecifier,
                    opts.workspacePrefixes,
                  ),
                  line: requireLine,
                  column: requireColumn,
                })
              }
            }
          }
        }
      }
    })
  }

  // Categorize imports
  const externalDependencies: string[] = []
  const workspaceDependencies: string[] = []
  const relativeImports: string[] = []

  for (const imp of imports) {
    const pkgName = getPackageNameFromSpecifier(imp.moduleSpecifier)

    if (imp.isRelative) {
      if (!relativeImports.includes(imp.moduleSpecifier)) {
        relativeImports.push(imp.moduleSpecifier)
      }
    } else if (imp.isWorkspacePackage) {
      if (!workspaceDependencies.includes(pkgName)) {
        workspaceDependencies.push(pkgName)
      }
    } else if (!externalDependencies.includes(pkgName)) {
      externalDependencies.push(pkgName)
    }
  }

  return {
    imports,
    filePath,
    externalDependencies,
    workspaceDependencies,
    relativeImports,
  }
}

/**
 * Checks if a module specifier is a relative import.
 */
export function isRelativeImport(moduleSpecifier: string): boolean {
  return moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')
}

/**
 * Checks if a module specifier is a workspace package import.
 */
export function isWorkspacePackageImport(
  moduleSpecifier: string,
  workspacePrefixes: readonly string[],
): boolean {
  return workspacePrefixes.some(prefix => moduleSpecifier.startsWith(prefix))
}

/**
 * Extracts the package name from a module specifier.
 *
 * For scoped packages like '@scope/pkg/path', returns '@scope/pkg'.
 * For unscoped packages like 'lodash/fp', returns 'lodash'.
 */
export function getPackageNameFromSpecifier(moduleSpecifier: string): string {
  if (isRelativeImport(moduleSpecifier)) {
    return moduleSpecifier
  }

  // Scoped package
  if (moduleSpecifier.startsWith('@')) {
    const parts = moduleSpecifier.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
    return moduleSpecifier
  }

  // Unscoped package
  const slashIndex = moduleSpecifier.indexOf('/')
  if (slashIndex > 0) {
    return moduleSpecifier.slice(0, slashIndex)
  }

  return moduleSpecifier
}

/**
 * Resolves a relative import to an absolute file path.
 */
export function resolveRelativeImport(fromFile: string, moduleSpecifier: string): string {
  const fromDir = path.dirname(fromFile)
  return path.resolve(fromDir, moduleSpecifier)
}

/**
 * Gets unique package dependencies from imports.
 */
export function getUniqueDependencies(results: readonly ImportExtractionResult[]): {
  readonly external: readonly string[]
  readonly workspace: readonly string[]
} {
  const external = new Set<string>()
  const workspace = new Set<string>()

  for (const result of results) {
    for (const dep of result.externalDependencies) {
      external.add(dep)
    }
    for (const dep of result.workspaceDependencies) {
      workspace.add(dep)
    }
  }

  return {
    external: [...external].sort(),
    workspace: [...workspace].sort(),
  }
}
