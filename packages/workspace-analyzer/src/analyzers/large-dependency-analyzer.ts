/**
 * LargeDependencyAnalyzer - Identifies large dependencies that impact bundle size.
 *
 * Analyzes package dependencies to identify:
 * - Known large packages that significantly impact bundle size
 * - Dependencies with lighter alternatives
 * - Packages that may be overkill for the actual usage
 *
 * Uses a database of known package sizes and suggests optimizations.
 */

import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue, Severity} from '../types/index'
import type {Result} from '../types/result'
import type {AnalysisContext, Analyzer, AnalyzerError, AnalyzerMetadata} from './analyzer'

import {createProject} from '@bfra.me/doc-sync/parsers'
import {ok} from '@bfra.me/es/result'

import {extractImports, getPackageNameFromSpecifier} from '../parser/import-extractor'
import {createIssue, filterIssues} from './analyzer'

/**
 * Configuration options for LargeDependencyAnalyzer.
 */
export interface LargeDependencyAnalyzerOptions {
  /** Minimum size threshold in KB (gzipped) to report */
  readonly sizeThresholdKb?: number
  /** Report lighter alternatives when available */
  readonly suggestAlternatives?: boolean
  /** Check for packages with heavy transitive dependencies */
  readonly checkTransitiveDeps?: boolean
  /** Severity for large dependency warnings */
  readonly largeDependencySeverity?: Severity
  /** Severity for alternative suggestions */
  readonly alternativeSuggestionSeverity?: Severity
  /** Packages to ignore */
  readonly ignorePackages?: readonly string[]
}

const DEFAULT_OPTIONS: Required<LargeDependencyAnalyzerOptions> = {
  sizeThresholdKb: 50,
  suggestAlternatives: true,
  checkTransitiveDeps: true,
  largeDependencySeverity: 'info',
  alternativeSuggestionSeverity: 'info',
  ignorePackages: [],
}

export const largeDependencyAnalyzerMetadata: AnalyzerMetadata = {
  id: 'large-dependency',
  name: 'Large Dependency Analyzer',
  description: 'Identifies large dependencies that significantly impact bundle size',
  categories: ['performance'],
  defaultSeverity: 'info',
}

/**
 * Known package sizes and metadata.
 * Sizes are approximate gzipped KB.
 */
interface PackageInfo {
  /** Approximate gzipped size in KB */
  readonly sizeKb: number
  /** Category of the package */
  readonly category: string
  /** Lighter alternatives (if any) */
  readonly alternatives?: readonly AlternativePackage[]
  /** Whether the package supports tree-shaking */
  readonly treeShakable: boolean
  /** Notes about usage */
  readonly notes?: string
}

interface AlternativePackage {
  /** Package name */
  readonly name: string
  /** Approximate size in KB */
  readonly sizeKb: number
  /** Notes about the alternative */
  readonly notes?: string
}

const KNOWN_PACKAGES: Readonly<Record<string, PackageInfo>> = {
  lodash: {
    sizeKb: 71,
    category: 'utility',
    alternatives: [
      {name: 'lodash-es', sizeKb: 71, notes: 'ES module version with tree-shaking'},
      {name: 'es-toolkit', sizeKb: 10, notes: 'Modern ES alternative with smaller footprint'},
      {name: 'radash', sizeKb: 8, notes: 'TypeScript-first utility library'},
    ],
    treeShakable: false,
    notes: 'CommonJS build prevents tree-shaking. Use lodash-es or individual imports.',
  },
  'lodash-es': {
    sizeKb: 71,
    category: 'utility',
    alternatives: [{name: 'es-toolkit', sizeKb: 10, notes: 'Modern ES alternative'}],
    treeShakable: true,
  },
  moment: {
    sizeKb: 67,
    category: 'date',
    alternatives: [
      {name: 'dayjs', sizeKb: 3, notes: 'API-compatible, much smaller'},
      {name: 'date-fns', sizeKb: 25, notes: 'Tree-shakable, functional API'},
      {name: 'luxon', sizeKb: 20, notes: 'Modern API, immutable'},
    ],
    treeShakable: false,
    notes: 'Moment is in maintenance mode. Consider migrating to a modern alternative.',
  },
  'moment-timezone': {
    sizeKb: 95,
    category: 'date',
    alternatives: [
      {
        name: 'dayjs + dayjs/plugin/timezone',
        sizeKb: 6,
        notes: 'Much smaller with timezone support',
      },
      {name: 'date-fns-tz', sizeKb: 5, notes: 'Timezone support for date-fns'},
    ],
    treeShakable: false,
  },
  rxjs: {
    sizeKb: 40,
    category: 'reactive',
    treeShakable: true,
    notes: 'Ensure you use the tree-shakable imports (rxjs/operators)',
  },
  d3: {
    sizeKb: 80,
    category: 'visualization',
    alternatives: [{name: 'd3-* submodules', sizeKb: 5, notes: 'Import only needed D3 modules'}],
    treeShakable: false,
    notes: 'Import specific D3 modules (d3-selection, d3-scale) instead of the full bundle.',
  },
  'chart.js': {
    sizeKb: 65,
    category: 'visualization',
    alternatives: [
      {name: 'lightweight-charts', sizeKb: 45, notes: 'For financial/trading charts'},
      {name: 'uplot', sizeKb: 8, notes: 'Ultra-lightweight time series charts'},
    ],
    treeShakable: true,
  },
  three: {
    sizeKb: 150,
    category: '3d-graphics',
    treeShakable: true,
    notes: 'Three.js is large but often necessary for 3D. Use code splitting for lazy loading.',
  },
  '@mui/material': {
    sizeKb: 120,
    category: 'ui-framework',
    alternatives: [
      {name: '@radix-ui/*', sizeKb: 30, notes: 'Headless UI primitives, smaller footprint'},
      {name: '@headlessui/react', sizeKb: 10, notes: 'Unstyled, accessible components'},
    ],
    treeShakable: true,
    notes: 'Ensure proper tree-shaking by using named imports.',
  },
  antd: {
    sizeKb: 200,
    category: 'ui-framework',
    alternatives: [
      {name: '@arco-design/web-react', sizeKb: 100, notes: 'Similar component library, smaller'},
    ],
    treeShakable: true,
    notes: 'Very large. Consider using code splitting and lazy loading components.',
  },
  axios: {
    sizeKb: 13,
    category: 'http',
    alternatives: [
      {name: 'ky', sizeKb: 3, notes: 'Smaller fetch wrapper'},
      {name: 'native fetch', sizeKb: 0, notes: 'Built into modern browsers and Node.js 18+'},
    ],
    treeShakable: false,
  },
  underscore: {
    sizeKb: 18,
    category: 'utility',
    alternatives: [
      {name: 'lodash-es', sizeKb: 71, notes: 'More features but tree-shakable'},
      {name: 'es-toolkit', sizeKb: 10, notes: 'Modern TypeScript utilities'},
    ],
    treeShakable: false,
  },
  jquery: {
    sizeKb: 30,
    category: 'dom',
    alternatives: [
      {name: 'native DOM APIs', sizeKb: 0, notes: 'Modern browsers have good DOM APIs'},
    ],
    treeShakable: false,
    notes: 'jQuery is rarely needed in modern applications with frameworks.',
  },
  'monaco-editor': {
    sizeKb: 2000,
    category: 'editor',
    treeShakable: false,
    notes: 'Very large (~2MB). Use dynamic imports and load only needed language workers.',
  },
  'highlight.js': {
    sizeKb: 100,
    category: 'syntax-highlighting',
    alternatives: [
      {name: 'prismjs', sizeKb: 10, notes: 'Smaller with selective language loading'},
      {name: 'shiki', sizeKb: 30, notes: 'VS Code highlighting engine'},
    ],
    treeShakable: false,
    notes: 'Import only needed languages to reduce size.',
  },
  typescript: {
    sizeKb: 150,
    category: 'compiler',
    treeShakable: false,
    notes: 'Usually a devDependency. Should not be in production bundles.',
  },
  'ts-morph': {
    sizeKb: 150,
    category: 'ast',
    treeShakable: false,
    notes: 'Usually for build tools. Should not be in production bundles.',
  },
  typeorm: {
    sizeKb: 180,
    category: 'orm',
    alternatives: [
      {name: 'drizzle-orm', sizeKb: 30, notes: 'Lightweight TypeScript ORM'},
      {name: 'prisma', sizeKb: 40, notes: 'Type-safe database client'},
    ],
    treeShakable: false,
  },
  yup: {
    sizeKb: 22,
    category: 'validation',
    alternatives: [
      {name: 'zod', sizeKb: 12, notes: 'TypeScript-first validation, smaller'},
      {name: 'valibot', sizeKb: 3, notes: 'Modular validation library'},
    ],
    treeShakable: false,
  },
  joi: {
    sizeKb: 35,
    category: 'validation',
    alternatives: [
      {name: 'zod', sizeKb: 12, notes: 'TypeScript-first validation'},
      {name: 'valibot', sizeKb: 3, notes: 'Modular validation library'},
    ],
    treeShakable: false,
  },
  validator: {
    sizeKb: 25,
    category: 'validation',
    alternatives: [{name: 'is-* packages', sizeKb: 1, notes: 'Individual validation functions'}],
    treeShakable: false,
  },
  'pdf-lib': {
    sizeKb: 300,
    category: 'pdf',
    treeShakable: false,
    notes: 'Large but feature-rich. Use dynamic imports for PDF generation features.',
  },
  xlsx: {
    sizeKb: 200,
    category: 'spreadsheet',
    treeShakable: false,
    notes: 'Very large. Consider server-side processing or dynamic imports.',
  },
  jszip: {
    sizeKb: 45,
    category: 'compression',
    treeShakable: false,
  },
  'core-js': {
    sizeKb: 150,
    category: 'polyfill',
    treeShakable: true,
    notes: 'Often unnecessary with modern browser targets. Check your browserslist.',
  },
  'babel-polyfill': {
    sizeKb: 100,
    category: 'polyfill',
    alternatives: [{name: 'core-js/stable', sizeKb: 50, notes: 'Selective polyfills'}],
    treeShakable: false,
    notes: 'Deprecated. Use core-js directly with selective imports.',
  },
}

/**
 * Creates a LargeDependencyAnalyzer instance.
 */
export function createLargeDependencyAnalyzer(
  options: LargeDependencyAnalyzerOptions = {},
): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: largeDependencyAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Analyzing dependencies in ${pkg.name}...`)

        const packageIssues = await analyzePackageDependencies(pkg, resolvedOptions)
        issues.push(...packageIssues)
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

async function analyzePackageDependencies(
  pkg: WorkspacePackage,
  options: Required<LargeDependencyAnalyzerOptions>,
): Promise<Issue[]> {
  const issues: Issue[] = []

  // Collect all dependencies
  const allDeps = collectAllDependencies(pkg)

  // Check each dependency against known large packages
  for (const [depName, depVersion] of allDeps) {
    if (options.ignorePackages.includes(depName)) continue

    const info = KNOWN_PACKAGES[depName]
    if (info === undefined) continue

    if (info.sizeKb < options.sizeThresholdKb) continue

    // Create issue for large dependency
    issues.push(createLargeDependencyIssue(pkg, depName, depVersion, info, options))

    // Suggest alternatives if available and configured
    if (
      options.suggestAlternatives &&
      info.alternatives !== undefined &&
      info.alternatives.length > 0
    ) {
      issues.push(createAlternativeSuggestionIssue(pkg, depName, info, options))
    }
  }

  // Check for problematic patterns in how dependencies are used
  const usageIssues = await analyzeDependencyUsage(pkg, allDeps, options)
  issues.push(...usageIssues)

  return issues
}

function collectAllDependencies(pkg: WorkspacePackage): Map<string, string> {
  const deps = new Map<string, string>()
  const pkgJson = pkg.packageJson

  if (pkgJson.dependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.dependencies)) {
      deps.set(name, version)
    }
  }

  // Also check devDependencies for build tools that shouldn't be bundled
  if (pkgJson.devDependencies !== undefined) {
    for (const [name, version] of Object.entries(pkgJson.devDependencies)) {
      const info = KNOWN_PACKAGES[name]
      if (info?.category === 'compiler' || info?.category === 'ast') {
        deps.set(name, version)
      }
    }
  }

  return deps
}

async function analyzeDependencyUsage(
  pkg: WorkspacePackage,
  allDeps: Map<string, string>,
  options: Required<LargeDependencyAnalyzerOptions>,
): Promise<Issue[]> {
  const issues: Issue[] = []
  const project = createProject()

  // Analyze usage patterns for specific problematic imports
  const importCounts = new Map<string, {count: number; locations: string[]}>()

  for (const filePath of pkg.sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const result = extractImports(sourceFile)

      for (const imp of result.imports) {
        const baseName = getPackageNameFromSpecifier(imp.moduleSpecifier)
        if (!allDeps.has(baseName)) continue

        const existing = importCounts.get(baseName)
        if (existing === undefined) {
          importCounts.set(baseName, {count: 1, locations: [filePath]})
        } else {
          existing.count++
          if (!existing.locations.includes(filePath)) {
            existing.locations.push(filePath)
          }
        }

        // Check for problematic import patterns
        const info = KNOWN_PACKAGES[baseName]
        if (info === undefined) continue

        // Check for full package import of non-tree-shakable packages
        if (!info.treeShakable && imp.namespaceImport !== undefined) {
          issues.push(
            createIssue({
              id: 'non-treeshakable-namespace-import',
              title: `Namespace import of non-tree-shakable package '${baseName}'`,
              description:
                `'${baseName}' (${info.sizeKb}KB) doesn't support tree-shaking and is imported with a namespace ` +
                `import, resulting in the entire package being bundled.`,
              severity: options.largeDependencySeverity,
              category: 'performance',
              location: {filePath, line: imp.line, column: imp.column},
              suggestion:
                info.notes ??
                `Consider using named imports for only the functions you need, or switch to a tree-shakable alternative.`,
              metadata: {
                packageName: pkg.name,
                dependency: baseName,
                sizeKb: info.sizeKb,
                importPattern: 'namespace',
              },
            }),
          )
        }
      }
    } catch {
      // File may not be parseable
    }
  }

  return issues
}

function createLargeDependencyIssue(
  pkg: WorkspacePackage,
  depName: string,
  depVersion: string,
  info: PackageInfo,
  options: Required<LargeDependencyAnalyzerOptions>,
): Issue {
  const pkgJsonPath = `${pkg.packagePath}/package.json`

  return createIssue({
    id: 'large-dependency',
    title: `Large dependency: '${depName}' (~${info.sizeKb}KB gzipped)`,
    description:
      `'${depName}@${depVersion}' adds approximately ${info.sizeKb}KB to your bundle (gzipped). ` +
      `Category: ${info.category}. ${info.treeShakable ? 'Supports tree-shaking.' : 'Does NOT support tree-shaking.'}`,
    severity: options.largeDependencySeverity,
    category: 'performance',
    location: {filePath: pkgJsonPath},
    suggestion: info.notes ?? `Review if all features of '${depName}' are needed.`,
    metadata: {
      packageName: pkg.name,
      dependency: depName,
      version: depVersion,
      sizeKb: info.sizeKb,
      category: info.category,
      treeShakable: info.treeShakable,
      hasAlternatives: info.alternatives !== undefined && info.alternatives.length > 0,
    },
  })
}

function createAlternativeSuggestionIssue(
  pkg: WorkspacePackage,
  depName: string,
  info: PackageInfo,
  options: Required<LargeDependencyAnalyzerOptions>,
): Issue {
  const pkgJsonPath = `${pkg.packagePath}/package.json`
  const alternatives = info.alternatives ?? []

  const alternativeList = alternatives
    .map(alt => {
      const notes = alt.notes
      return notes === undefined
        ? `• ${alt.name} (~${alt.sizeKb}KB)`
        : `• ${alt.name} (~${alt.sizeKb}KB): ${notes}`
    })
    .join('\n')

  const firstAlt = alternatives[0]
  const bestAlt =
    firstAlt === undefined
      ? undefined
      : alternatives.reduce((best, alt) => (alt.sizeKb < best.sizeKb ? alt : best), firstAlt)

  const potentialSavings = bestAlt === undefined ? 0 : info.sizeKb - bestAlt.sizeKb

  return createIssue({
    id: 'lighter-alternative-available',
    title: `Lighter alternatives available for '${depName}'`,
    description: `'${depName}' (~${info.sizeKb}KB) has lighter alternatives that could save up to ~${potentialSavings}KB:\n${alternativeList}`,
    severity: options.alternativeSuggestionSeverity,
    category: 'performance',
    location: {filePath: pkgJsonPath},
    suggestion:
      `Consider switching to a lighter alternative if your use case is supported. ` +
      `Potential bundle size savings: ~${potentialSavings}KB gzipped.`,
    metadata: {
      packageName: pkg.name,
      dependency: depName,
      currentSizeKb: info.sizeKb,
      alternatives: alternatives.map(alt => ({name: alt.name, sizeKb: alt.sizeKb})),
      potentialSavingsKb: potentialSavings,
    },
  })
}

/**
 * Gets known package information for a dependency.
 */
export function getPackageInfo(packageName: string): PackageInfo | undefined {
  return KNOWN_PACKAGES[packageName]
}

/**
 * Gets all known large packages.
 */
export function getKnownLargePackages(): readonly string[] {
  return Object.keys(KNOWN_PACKAGES)
}
