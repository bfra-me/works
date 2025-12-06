/**
 * @bfra.me/doc-sync/parsers/export-analyzer - Public API surface analyzer for package exports
 */

import type {Project, SourceFile} from 'ts-morph'

import type {PackageAPI, ParseResult, ReExport} from '../types'

import {ok} from '@bfra.me/es/result'

import {createProject, extractPackageAPI, parseSourceFile} from './typescript-parser'

/**
 * Options for analyzing package exports
 */
export interface ExportAnalyzerOptions {
  readonly tsConfigPath?: string
  readonly followReExports?: boolean
  readonly maxDepth?: number
}

/**
 * Resolved export information including the original source
 */
export interface ResolvedExport {
  readonly name: string
  readonly kind: 'function' | 'type' | 'interface' | 'enum' | 'class' | 're-export'
  readonly source: string
  readonly isDefault: boolean
}

/**
 * Complete analysis of a package's public API
 */
export interface PublicAPIAnalysis {
  readonly packagePath: string
  readonly entryPoint: string
  readonly api: PackageAPI
  readonly resolvedExports: readonly ResolvedExport[]
}

/**
 * Analyzes the public API surface of a package from its entry point
 */
export function analyzePublicAPI(
  entryPointPath: string,
  options?: ExportAnalyzerOptions,
): ParseResult<PublicAPIAnalysis> {
  const project = createProject({tsConfigPath: options?.tsConfigPath})
  const sourceFileResult = parseSourceFile(project, entryPointPath)

  if (!sourceFileResult.success) {
    return sourceFileResult
  }

  const sourceFile = sourceFileResult.data
  const api = extractPackageAPI(sourceFile)
  const resolvedExports = resolveAllExports(sourceFile, api, project, options)

  return ok({
    packagePath: sourceFile.getDirectoryPath(),
    entryPoint: entryPointPath,
    api,
    resolvedExports,
  })
}

function resolveAllExports(
  sourceFile: SourceFile,
  api: PackageAPI,
  project: Project,
  options?: ExportAnalyzerOptions,
): readonly ResolvedExport[] {
  const exports: ResolvedExport[] = []
  const filePath = sourceFile.getFilePath()

  // Add direct function exports
  for (const func of api.functions) {
    exports.push({
      name: func.name,
      kind: 'function',
      source: filePath,
      isDefault: func.isDefault,
    })
  }

  // Add direct type exports
  for (const type of api.types) {
    exports.push({
      name: type.name,
      kind: type.kind,
      source: filePath,
      isDefault: type.isDefault,
    })
  }

  // Handle re-exports if enabled
  if (options?.followReExports !== false) {
    const maxDepth = options?.maxDepth ?? 5
    const reExportedItems = resolveReExports(
      sourceFile,
      api.reExports,
      project,
      maxDepth,
      new Set(),
    )
    exports.push(...reExportedItems)
  }

  return exports
}

function resolveReExports(
  sourceFile: SourceFile,
  reExports: readonly ReExport[],
  project: Project,
  remainingDepth: number,
  visited: Set<string>,
): readonly ResolvedExport[] {
  if (remainingDepth <= 0 || reExports.length === 0) {
    return []
  }

  const exports: ResolvedExport[] = []

  for (const reExport of reExports) {
    const resolvedPath = resolveModulePath(sourceFile, reExport.from)
    if (resolvedPath === undefined || visited.has(resolvedPath)) {
      // Add as unresolved re-export
      if (reExport.exports === '*') {
        exports.push({
          name: reExport.alias ?? '*',
          kind: 're-export',
          source: reExport.from,
          isDefault: false,
        })
      } else {
        for (const name of reExport.exports) {
          exports.push({
            name,
            kind: 're-export',
            source: reExport.from,
            isDefault: false,
          })
        }
      }
      continue
    }

    visited.add(resolvedPath)

    try {
      const reExportedFile = getOrAddSourceFile(project, resolvedPath)
      if (reExportedFile === undefined) continue

      const reExportedAPI = extractPackageAPI(reExportedFile)

      if (reExport.exports === '*') {
        // Namespace export - include all exports from the module
        for (const func of reExportedAPI.functions) {
          exports.push({
            name: func.name,
            kind: 'function',
            source: resolvedPath,
            isDefault: func.isDefault,
          })
        }

        for (const type of reExportedAPI.types) {
          exports.push({
            name: type.name,
            kind: type.kind,
            source: resolvedPath,
            isDefault: type.isDefault,
          })
        }

        // Recurse into nested re-exports
        const nestedExports = resolveReExports(
          reExportedFile,
          reExportedAPI.reExports,
          project,
          remainingDepth - 1,
          visited,
        )
        exports.push(...nestedExports)
      } else {
        // Named exports - only include specified exports
        for (const exportName of reExport.exports) {
          // Parse potential alias: "original as alias"
          const [originalName, alias] = parseExportName(exportName)

          // Check if this is a function export
          const func = reExportedAPI.functions.find(f => f.name === originalName)
          if (func !== undefined) {
            exports.push({
              name: alias ?? originalName,
              kind: 'function',
              source: resolvedPath,
              isDefault: func.isDefault,
            })
            continue
          }

          // Check if this is a type export
          const type = reExportedAPI.types.find(t => t.name === originalName)
          if (type !== undefined) {
            exports.push({
              name: alias ?? originalName,
              kind: type.kind,
              source: resolvedPath,
              isDefault: type.isDefault,
            })
          }
        }
      }
    } catch {
      // Failed to resolve re-export, skip
    }
  }

  return exports
}

function parseExportName(exportName: string): [string, string | undefined] {
  const asIndex = exportName.indexOf(' as ')
  if (asIndex > 0) {
    return [exportName.slice(0, asIndex), exportName.slice(asIndex + 4)]
  }
  return [exportName, undefined]
}

function resolveModulePath(sourceFile: SourceFile, modulePath: string): string | undefined {
  if (!modulePath.startsWith('.')) {
    // External module, cannot resolve
    return undefined
  }

  try {
    const directory = sourceFile.getDirectory()
    const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js', '.jsx']

    for (const ext of extensions) {
      const candidate = directory.getSourceFile(modulePath + ext)
      if (candidate !== undefined) {
        return candidate.getFilePath()
      }
    }

    // Try without extension
    const direct = directory.getSourceFile(modulePath)
    return direct?.getFilePath()
  } catch {
    return undefined
  }
}

function getOrAddSourceFile(project: Project, filePath: string): SourceFile | undefined {
  try {
    return project.getSourceFile(filePath) ?? project.addSourceFileAtPath(filePath)
  } catch {
    return undefined
  }
}

/**
 * Finds all exported symbols from a package entry point
 */
export function findExportedSymbols(
  entryPointPath: string,
  options?: ExportAnalyzerOptions,
): ParseResult<readonly string[]> {
  const analysisResult = analyzePublicAPI(entryPointPath, options)

  if (!analysisResult.success) {
    return analysisResult
  }

  const symbols = analysisResult.data.resolvedExports.map(exp => exp.name)
  return ok([...new Set(symbols)])
}

/**
 * Checks if a symbol is exported from a package
 */
export function isSymbolExported(
  entryPointPath: string,
  symbolName: string,
  options?: ExportAnalyzerOptions,
): ParseResult<boolean> {
  const analysisResult = analyzePublicAPI(entryPointPath, options)

  if (!analysisResult.success) {
    return analysisResult
  }

  const isExported = analysisResult.data.resolvedExports.some(exp => exp.name === symbolName)
  return ok(isExported)
}

/**
 * Gets detailed information about a specific exported symbol
 */
export function getExportedSymbolInfo(
  entryPointPath: string,
  symbolName: string,
  options?: ExportAnalyzerOptions,
): ParseResult<ResolvedExport | undefined> {
  const analysisResult = analyzePublicAPI(entryPointPath, options)

  if (!analysisResult.success) {
    return analysisResult
  }

  const exported = analysisResult.data.resolvedExports.find(exp => exp.name === symbolName)
  return ok(exported)
}

/**
 * Filters exports by kind
 */
export function getExportsByKind(
  entryPointPath: string,
  kind: ResolvedExport['kind'],
  options?: ExportAnalyzerOptions,
): ParseResult<readonly ResolvedExport[]> {
  const analysisResult = analyzePublicAPI(entryPointPath, options)

  if (!analysisResult.success) {
    return analysisResult
  }

  const filtered = analysisResult.data.resolvedExports.filter(exp => exp.kind === kind)
  return ok(filtered)
}
