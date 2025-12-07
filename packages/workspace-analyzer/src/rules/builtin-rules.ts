/**
 * Built-in architectural rules for workspace analysis.
 *
 * Provides rules for detecting common architectural anti-patterns:
 * - Layer violations (cross-layer imports)
 * - Barrel export misuse (export * in application code)
 * - Public API validation (explicit exports)
 * - Side effects in module initialization
 * - Import path alias violations
 * - Package boundary enforcement
 */

import type {SourceFile} from 'ts-morph'

import type {
  LayerConfiguration,
  Rule,
  RuleContext,
  RuleMetadata,
  RuleOptions,
  RuleResult,
  RuleViolation,
} from './rule-engine'

import {SyntaxKind} from 'ts-morph'

import {extractImports, isRelativeImport} from '../parser/import-extractor'
import {matchAnyPattern} from '../utils/pattern-matcher'

import {
  BUILTIN_RULE_IDS,
  DEFAULT_LAYER_CONFIG,
  getFileLayer,
  isLayerImportAllowed,
} from './rule-engine'

/**
 * Options for LayerViolationRule.
 */
export interface LayerViolationRuleOptions extends RuleOptions {
  readonly options?: {
    /** Custom layer configuration */
    readonly layerConfig?: LayerConfiguration
    /** Whether to report violations for unrecognized layers */
    readonly reportUnknownLayers?: boolean
  }
}

export const layerViolationRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.LAYER_VIOLATION,
  name: 'Layer Violation',
  description: 'Detects imports that violate architectural layer boundaries',
  defaultSeverity: 'warning',
  category: 'layer-violation',
}

/**
 * Creates a rule that detects layer boundary violations.
 *
 * @example
 * ```ts
 * const rule = createLayerViolationRule({
 *   options: {
 *     layerConfig: {
 *       layers: [
 *         {name: 'domain', allowedDependencies: []},
 *         {name: 'application', allowedDependencies: ['domain']},
 *       ],
 *       patterns: [
 *         {pattern: '**\/domain\/**', layer: 'domain'},
 *       ],
 *     },
 *   },
 * })
 * ```
 */
export function createLayerViolationRule(options: LayerViolationRuleOptions = {}): Rule {
  const layerConfig = options.options?.layerConfig ?? DEFAULT_LAYER_CONFIG
  const reportUnknownLayers = options.options?.reportUnknownLayers ?? false

  return {
    metadata: layerViolationRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile} = context
      const filePath = sourceFile.getFilePath()
      const config = context.layerConfig ?? layerConfig

      const sourceLayer = getFileLayer(filePath, config)

      if (sourceLayer === undefined) {
        if (reportUnknownLayers) {
          return {
            violations: [
              {
                ruleId: BUILTIN_RULE_IDS.LAYER_VIOLATION,
                location: {filePath, line: 1, column: 1},
                message: 'File does not belong to any recognized architectural layer',
                suggestion: 'Organize file into an appropriate layer directory',
              },
            ],
            success: true,
          }
        }
        return {violations: [], success: true}
      }

      const importResult = extractImports(sourceFile, {
        workspacePrefixes: ['@bfra.me/'],
        includeTypeImports: false,
      })

      for (const imp of importResult.imports) {
        if (!imp.isRelative) continue

        const resolvedPath = resolveRelativeImportPath(filePath, imp.moduleSpecifier)
        const targetLayer = getFileLayer(resolvedPath, config)

        if (targetLayer !== undefined && !isLayerImportAllowed(sourceLayer, targetLayer, config)) {
          violations.push({
            ruleId: BUILTIN_RULE_IDS.LAYER_VIOLATION,
            location: {
              filePath,
              line: imp.line,
              column: imp.column,
            },
            message: `Layer violation: '${sourceLayer}' cannot import from '${targetLayer}' (via '${imp.moduleSpecifier}')`,
            suggestion: `Move shared code to a common layer or invert the dependency direction`,
            relatedLocations: [{filePath: resolvedPath}],
            metadata: {
              sourceLayer,
              targetLayer,
              moduleSpecifier: imp.moduleSpecifier,
            },
          })
        }
      }

      return {violations, success: true}
    },
  }
}

/**
 * Options for BarrelExportRule.
 */
export interface BarrelExportRuleOptions extends RuleOptions {
  readonly options?: {
    /** Allow export * in these file patterns (e.g., index.ts in libs) */
    readonly allowedPatterns?: readonly string[]
    /** Whether to allow export * from workspace packages */
    readonly allowWorkspaceReexports?: boolean
  }
}

export const barrelExportRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.BARREL_EXPORT,
  name: 'Barrel Export',
  description: 'Detects `export *` usage which can break tree-shaking and obscure the public API',
  defaultSeverity: 'warning',
  category: 'barrel-export',
}

/**
 * Creates a rule that detects export * (barrel export) misuse.
 *
 * @example
 * ```ts
 * const rule = createBarrelExportRule({
 *   options: {
 *     allowedPatterns: ['**\/index.ts'],
 *     allowWorkspaceReexports: false,
 *   },
 * })
 * ```
 */
export function createBarrelExportRule(options: BarrelExportRuleOptions = {}): Rule {
  const allowedPatterns = options.options?.allowedPatterns ?? []
  const allowWorkspaceReexports = options.options?.allowWorkspaceReexports ?? false

  return {
    metadata: barrelExportRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile} = context
      const filePath = sourceFile.getFilePath()

      if (matchAnyPattern(filePath, allowedPatterns)) {
        return {violations: [], success: true}
      }

      for (const exportDecl of sourceFile.getExportDeclarations()) {
        if (!exportDecl.isNamespaceExport()) continue

        const moduleSpecifier = exportDecl.getModuleSpecifierValue()
        if (moduleSpecifier === undefined) continue

        if (allowWorkspaceReexports && isWorkspacePackage(moduleSpecifier)) {
          continue
        }

        const {line, column} = sourceFile.getLineAndColumnAtPos(exportDecl.getStart())

        violations.push({
          ruleId: BUILTIN_RULE_IDS.BARREL_EXPORT,
          location: {filePath, line, column},
          message: `Avoid \`export * from '${moduleSpecifier}'\` - it breaks tree-shaking and obscures the public API`,
          suggestion: 'Use explicit named exports to maintain a clear public API surface',
          metadata: {
            moduleSpecifier,
            exportType: 'namespace',
          },
        })
      }

      return {violations, success: true}
    },
  }
}

/**
 * Options for PublicApiRule.
 */
export interface PublicApiRuleOptions extends RuleOptions {
  readonly options?: {
    /** Entry point files that define the public API */
    readonly entryPoints?: readonly string[]
    /** Require all exports to be re-exported from entry points */
    readonly requireReexport?: boolean
  }
}

export const publicApiRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.PUBLIC_API,
  name: 'Public API',
  description: 'Validates that the public API surface is explicitly defined via entry points',
  defaultSeverity: 'info',
  category: 'public-api',
}

/**
 * Creates a rule that validates public API surface definition.
 *
 * @example
 * ```ts
 * const rule = createPublicApiRule({
 *   options: {
 *     entryPoints: ['src/index.ts'],
 *     requireReexport: true,
 *   },
 * })
 * ```
 */
export function createPublicApiRule(options: PublicApiRuleOptions = {}): Rule {
  const entryPoints = options.options?.entryPoints ?? ['src/index.ts', 'index.ts']
  const requireReexport = options.options?.requireReexport ?? false

  return {
    metadata: publicApiRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile} = context
      const filePath = sourceFile.getFilePath()

      const isEntryPoint = entryPoints.some(ep => filePath.endsWith(ep))

      if (isEntryPoint) {
        const hasExportStar = sourceFile.getExportDeclarations().some(e => e.isNamespaceExport())

        if (hasExportStar) {
          const exportStarDecl = sourceFile.getExportDeclarations().find(e => e.isNamespaceExport())
          if (exportStarDecl !== undefined) {
            const {line, column} = sourceFile.getLineAndColumnAtPos(exportStarDecl.getStart())
            violations.push({
              ruleId: BUILTIN_RULE_IDS.PUBLIC_API,
              location: {filePath, line, column},
              message: 'Entry point should use explicit named exports instead of `export *`',
              suggestion:
                'Replace `export *` with explicit named exports to document the public API',
            })
          }
        }
      }

      if (requireReexport && !isEntryPoint) {
        const exports = sourceFile.getExportedDeclarations()

        for (const [name, declarations] of exports) {
          for (const decl of declarations) {
            if (decl.getSourceFile() === sourceFile) {
              const {line, column} = sourceFile.getLineAndColumnAtPos(decl.getStart())
              violations.push({
                ruleId: BUILTIN_RULE_IDS.PUBLIC_API,
                location: {filePath, line, column},
                message: `Export '${name}' should be re-exported from an entry point file`,
                suggestion: `Add this export to one of the entry points: ${entryPoints.join(', ')}`,
                metadata: {exportName: name},
              })
            }
          }
        }
      }

      return {violations, success: true}
    },
  }
}

/**
 * Options for SideEffectRule.
 */
export interface SideEffectRuleOptions extends RuleOptions {
  readonly options?: {
    /** Allow side effects in these file patterns */
    readonly allowedPatterns?: readonly string[]
    /** Check for console.log/warn/error at module level */
    readonly checkConsoleCalls?: boolean
    /** Check for assignments to global objects */
    readonly checkGlobalAssignments?: boolean
  }
}

export const sideEffectRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.SIDE_EFFECT,
  name: 'Side Effect',
  description: 'Detects side effects in module initialization that can break tree-shaking',
  defaultSeverity: 'warning',
  category: 'side-effect',
}

/**
 * Creates a rule that detects side effects at module initialization.
 *
 * @example
 * ```ts
 * const rule = createSideEffectRule({
 *   options: {
 *     allowedPatterns: ['**\/polyfills.ts'],
 *     checkConsoleCalls: true,
 *   },
 * })
 * ```
 */
export function createSideEffectRule(options: SideEffectRuleOptions = {}): Rule {
  const allowedPatterns = options.options?.allowedPatterns ?? []
  const checkConsoleCalls = options.options?.checkConsoleCalls ?? true
  const checkGlobalAssignments = options.options?.checkGlobalAssignments ?? true

  return {
    metadata: sideEffectRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile} = context
      const filePath = sourceFile.getFilePath()

      if (matchAnyPattern(filePath, allowedPatterns)) {
        return {violations: [], success: true}
      }

      checkTopLevelSideEffects(sourceFile, filePath, violations, {
        checkConsoleCalls,
        checkGlobalAssignments,
      })

      return {violations, success: true}
    },
  }
}

/**
 * Options for PathAliasRule.
 */
export interface PathAliasRuleOptions extends RuleOptions {
  readonly options?: {
    /** Require path aliases for deep imports */
    readonly requireAliasForDeepImports?: boolean
    /** Depth threshold for requiring aliases */
    readonly deepImportThreshold?: number
  }
}

export const pathAliasRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.PATH_ALIAS,
  name: 'Path Alias',
  description: 'Validates import paths against tsconfig path aliases',
  defaultSeverity: 'info',
  category: 'layer-violation',
}

/**
 * Creates a rule that validates import path aliases against tsconfig.
 *
 * @example
 * ```ts
 * const rule = createPathAliasRule({
 *   options: {
 *     requireAliasForDeepImports: true,
 *     deepImportThreshold: 3,
 *   },
 * })
 * ```
 */
export function createPathAliasRule(options: PathAliasRuleOptions = {}): Rule {
  const requireAliasForDeepImports = options.options?.requireAliasForDeepImports ?? false
  const deepImportThreshold = options.options?.deepImportThreshold ?? 3

  return {
    metadata: pathAliasRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile, tsconfigPaths} = context
      const filePath = sourceFile.getFilePath()

      if (tsconfigPaths === undefined) {
        return {violations: [], success: true}
      }

      const importResult = extractImports(sourceFile, {
        workspacePrefixes: ['@bfra.me/'],
        includeTypeImports: true,
      })

      for (const imp of importResult.imports) {
        if (!imp.isRelative) continue

        const pathDepth = imp.moduleSpecifier.split('/').filter(p => p === '..').length

        if (requireAliasForDeepImports && pathDepth >= deepImportThreshold) {
          const {line, column} = {line: imp.line, column: imp.column}

          const suggestedAlias = findMatchingAlias(imp.moduleSpecifier, tsconfigPaths)

          violations.push({
            ruleId: BUILTIN_RULE_IDS.PATH_ALIAS,
            location: {filePath, line, column},
            message: `Deep relative import '${imp.moduleSpecifier}' (${pathDepth} levels up) should use a path alias`,
            suggestion:
              suggestedAlias === undefined
                ? 'Consider adding a path alias in tsconfig.json'
                : `Use path alias '${suggestedAlias}' instead`,
            metadata: {
              moduleSpecifier: imp.moduleSpecifier,
              pathDepth,
              suggestedAlias,
            },
          })
        }

        if (!isValidPathAlias(imp.moduleSpecifier, tsconfigPaths)) {
          const invalidAlias = imp.moduleSpecifier.split('/')[0]
          if (
            invalidAlias !== undefined &&
            !imp.isRelative &&
            invalidAlias.startsWith('@') &&
            !imp.isWorkspacePackage
          ) {
            violations.push({
              ruleId: BUILTIN_RULE_IDS.PATH_ALIAS,
              location: {filePath, line: imp.line, column: imp.column},
              message: `Import '${imp.moduleSpecifier}' uses an undefined path alias`,
              suggestion: `Define '${invalidAlias}' in tsconfig.json paths or use a valid import path`,
              metadata: {
                moduleSpecifier: imp.moduleSpecifier,
                invalidAlias,
              },
            })
          }
        }
      }

      return {violations, success: true}
    },
  }
}

/**
 * Options for PackageBoundaryRule.
 */
export interface PackageBoundaryRuleOptions extends RuleOptions {
  readonly options?: {
    /** Allowed cross-package import patterns */
    readonly allowedCrossPackagePatterns?: readonly string[]
    /** Packages that can be imported from anywhere */
    readonly sharedPackages?: readonly string[]
    /** Enforce importing only from package entry points */
    readonly enforceEntryPointImports?: boolean
  }
}

export const packageBoundaryRuleMetadata: RuleMetadata = {
  id: BUILTIN_RULE_IDS.PACKAGE_BOUNDARY,
  name: 'Package Boundary',
  description: 'Enforces proper package boundaries in monorepo imports',
  defaultSeverity: 'warning',
  category: 'boundary',
}

/**
 * Creates a rule that enforces monorepo package boundaries.
 *
 * @example
 * ```ts
 * const rule = createPackageBoundaryRule({
 *   options: {
 *     sharedPackages: ['@bfra.me/es', '@bfra.me/tsconfig'],
 *     enforceEntryPointImports: true,
 *   },
 * })
 * ```
 */
export function createPackageBoundaryRule(options: PackageBoundaryRuleOptions = {}): Rule {
  const sharedPackages = options.options?.sharedPackages ?? []
  const enforceEntryPointImports = options.options?.enforceEntryPointImports ?? true

  return {
    metadata: packageBoundaryRuleMetadata,
    evaluate: async (context: RuleContext): Promise<RuleResult> => {
      const violations: RuleViolation[] = []
      const {sourceFile, pkg, allPackages} = context
      const filePath = sourceFile.getFilePath()

      const importResult = extractImports(sourceFile, {
        workspacePrefixes: ['@bfra.me/'],
        includeTypeImports: true,
      })

      for (const imp of importResult.imports) {
        if (!imp.isWorkspacePackage) continue

        const packageName = getPackageNameFromImport(imp.moduleSpecifier)
        if (packageName === undefined) continue

        if (sharedPackages.includes(packageName)) continue

        if (enforceEntryPointImports) {
          const hasSubpath = imp.moduleSpecifier !== packageName

          if (hasSubpath) {
            const importedPkg = allPackages.find(p => p.name === packageName)

            if (importedPkg !== undefined) {
              const subpath = imp.moduleSpecifier.slice(packageName.length + 1)
              const isValidExport = isExportedSubpath(importedPkg, subpath)

              if (!isValidExport) {
                violations.push({
                  ruleId: BUILTIN_RULE_IDS.PACKAGE_BOUNDARY,
                  location: {filePath, line: imp.line, column: imp.column},
                  message: `Import '${imp.moduleSpecifier}' accesses internal module - use a documented export`,
                  suggestion: `Import from '${packageName}' entry point or request the subpath be exported`,
                  metadata: {
                    sourcePackage: pkg.name,
                    targetPackage: packageName,
                    subpath,
                  },
                })
              }
            }
          }
        }
      }

      return {violations, success: true}
    },
  }
}

function resolveRelativeImportPath(fromPath: string, specifier: string): string {
  const dir = fromPath.slice(0, Math.max(0, fromPath.lastIndexOf('/')))
  const parts = [...dir.split('/')]

  for (const segment of specifier.split('/')) {
    if (segment === '..') {
      parts.pop()
    } else if (segment !== '.') {
      parts.push(segment)
    }
  }

  return parts.join('/')
}

function isWorkspacePackage(specifier: string): boolean {
  return specifier.startsWith('@bfra.me/')
}

function checkTopLevelSideEffects(
  sourceFile: SourceFile,
  filePath: string,
  violations: RuleViolation[],
  options: {checkConsoleCalls: boolean; checkGlobalAssignments: boolean},
): void {
  const statements = sourceFile.getStatements()

  for (const stmt of statements) {
    if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
      const expr = stmt.getChildAtIndex(0)
      if (expr === undefined) continue

      if (options.checkConsoleCalls && expr.getKind() === SyntaxKind.CallExpression) {
        const text = expr.getText()
        if (
          text.startsWith('console.') ||
          text.includes('console.log') ||
          text.includes('console.warn') ||
          text.includes('console.error')
        ) {
          const {line, column} = sourceFile.getLineAndColumnAtPos(stmt.getStart())
          violations.push({
            ruleId: BUILTIN_RULE_IDS.SIDE_EFFECT,
            location: {filePath, line, column},
            message: 'Console call at module initialization level is a side effect',
            suggestion: 'Move console calls inside functions or wrap in conditional checks',
          })
        }
      }

      if (options.checkGlobalAssignments && expr.getKind() === SyntaxKind.BinaryExpression) {
        const text = expr.getText()
        if (text.includes('window.') || text.includes('globalThis.') || text.includes('global.')) {
          const {line, column} = sourceFile.getLineAndColumnAtPos(stmt.getStart())
          violations.push({
            ruleId: BUILTIN_RULE_IDS.SIDE_EFFECT,
            location: {filePath, line, column},
            message: 'Global assignment at module initialization level is a side effect',
            suggestion: 'Wrap global assignments in initialization functions',
          })
        }
      }
    }

    if (stmt.getKind() === SyntaxKind.ImportDeclaration) {
      const importDecl = stmt.asKind(SyntaxKind.ImportDeclaration)
      if (importDecl !== undefined) {
        const namedBindings = importDecl.getImportClause()?.getNamedBindings()
        const defaultImport = importDecl.getImportClause()?.getDefaultImport()

        if (namedBindings === undefined && defaultImport === undefined) {
          const {line, column} = sourceFile.getLineAndColumnAtPos(stmt.getStart())
          const moduleSpecifier = importDecl.getModuleSpecifierValue()
          violations.push({
            ruleId: BUILTIN_RULE_IDS.SIDE_EFFECT,
            location: {filePath, line, column},
            message: `Side-effect only import '${moduleSpecifier}' may affect tree-shaking`,
            suggestion:
              'Ensure this import is necessary and consider if it could be moved to an entry point',
            metadata: {moduleSpecifier},
          })
        }
      }
    }
  }
}

function findMatchingAlias(
  specifier: string,
  paths: Readonly<Record<string, readonly string[]>>,
): string | undefined {
  for (const [alias, targets] of Object.entries(paths)) {
    for (const target of targets) {
      const normalizedTarget = target.replaceAll('*', '')
      if (specifier.includes(normalizedTarget)) {
        // eslint-disable-next-line unicorn/prefer-string-replace-all
        return alias.replace(/\*/g, specifier.replace(normalizedTarget, ''))
      }
    }
  }
  return undefined
}

function isValidPathAlias(
  specifier: string,
  paths: Readonly<Record<string, readonly string[]>>,
): boolean {
  if (isRelativeImport(specifier)) return true
  if (specifier.startsWith('@') && !Object.keys(paths).some(p => specifier.startsWith(p))) {
    return false
  }
  return true
}

function getPackageNameFromImport(specifier: string): string | undefined {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
  }
  return specifier.split('/')[0]
}

function isExportedSubpath(pkg: {packageJson: {exports?: unknown}}, subpath: string): boolean {
  const exports = pkg.packageJson.exports

  if (exports === null || exports === undefined) {
    return true
  }

  if (typeof exports === 'string') {
    return subpath === ''
  }

  if (typeof exports === 'object') {
    const exportKey = `./${subpath}`
    return exportKey in (exports as Record<string, unknown>)
  }

  return false
}
