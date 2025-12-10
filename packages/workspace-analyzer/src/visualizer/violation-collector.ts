/**
 * Violation collection utilities for gathering architectural issues from RuleEngine.
 *
 * Provides functions to collect violations from the rule engine and associate them
 * with visualization nodes for display in the interactive graph.
 */

import type {Project, SourceFile} from 'ts-morph'

import type {createRuleEngine, RuleContext} from '../rules/rule-engine'
import type {WorkspacePackage} from '../scanner/workspace-scanner'
import type {Issue} from '../types/index'
import type {Result} from '../types/result'
import type {VisualizationError, VisualizationNode} from './types'

import path from 'node:path'

import {createProject} from '@bfra.me/doc-sync'
import {err, isErr, ok} from '@bfra.me/es/result'

import {getHighestSeverity} from './types'

/**
 * Context for collecting violations from the workspace.
 */
export interface ViolationCollectionContext {
  /** The rule engine instance to use for evaluation */
  readonly ruleEngine: ReturnType<typeof createRuleEngine>
  /** All packages in the workspace */
  readonly packages: readonly WorkspacePackage[]
  /** Root path of the workspace */
  readonly workspacePath: string
  /** Optional tsconfig path mappings */
  readonly tsconfigPaths?: Readonly<Record<string, readonly string[]>>
  /** Optional progress reporting callback */
  readonly reportProgress?: (message: string) => void
}

/**
 * Options for violation collection.
 */
export interface ViolationCollectionOptions {
  /** Whether to include info-level issues */
  readonly includeInfo: boolean
  /** Maximum number of issues to collect (for performance) */
  readonly maxIssues: number
  /** File patterns to exclude from analysis */
  readonly excludePatterns: readonly string[]
}

/**
 * Default options for violation collection.
 */
export const DEFAULT_VIOLATION_COLLECTION_OPTIONS: ViolationCollectionOptions = {
  includeInfo: true,
  maxIssues: 10000,
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
}

/**
 * Collects architectural violations using the RuleEngine.
 *
 * Evaluates all source files in the workspace packages against the configured
 * architectural rules and collects the resulting issues for visualization.
 *
 * @param context - Context containing rule engine and workspace information
 * @param options - Options for controlling collection behavior
 * @returns Result containing collected issues or an error
 */
export async function collectVisualizationViolations(
  context: ViolationCollectionContext,
  options: Partial<ViolationCollectionOptions> = {},
): Promise<Result<readonly Issue[], VisualizationError>> {
  const opts: ViolationCollectionOptions = {
    ...DEFAULT_VIOLATION_COLLECTION_OPTIONS,
    ...options,
  }

  const {ruleEngine, packages, workspacePath, tsconfigPaths, reportProgress} = context

  const allIssues: Issue[] = []

  try {
    for (const pkg of packages) {
      reportProgress?.(`Collecting violations from ${pkg.name}...`)

      const tsconfigPath = path.join(pkg.packagePath, 'tsconfig.json')

      let project: Project
      try {
        project = createProject({
          tsConfigPath: tsconfigPath,
        })
      } catch {
        continue
      }

      const sourceFiles = getSourceFiles(project)

      for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath()

        if (shouldSkipFile(filePath, opts.excludePatterns)) {
          continue
        }

        const ruleContext: RuleContext = {
          sourceFile,
          pkg,
          workspacePath,
          allPackages: packages,
          tsconfigPaths,
        }

        const result = await ruleEngine.evaluateFile(ruleContext)

        if (isErr(result)) {
          continue
        }

        const issues = result.data

        const filteredIssues = opts.includeInfo
          ? issues
          : issues.filter(issue => issue.severity !== 'info')

        allIssues.push(...filteredIssues)

        if (allIssues.length >= opts.maxIssues) {
          reportProgress?.(`Reached maximum issue limit (${opts.maxIssues})`)
          break
        }
      }

      if (allIssues.length >= opts.maxIssues) {
        break
      }
    }

    return ok(allIssues)
  } catch (error) {
    return err({
      code: 'TRANSFORM_FAILED',
      message: `Error collecting violations: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

/**
 * Maps issues to their corresponding visualization nodes.
 *
 * Associates each issue with the node(s) it affects by matching file paths.
 * Updates nodes with their violations and highest severity level.
 *
 * @param nodes - Visualization nodes to annotate with violations
 * @param issues - Issues collected from rule engine
 * @returns Updated nodes with violation information
 */
export function mapIssuesToNodes(
  nodes: readonly VisualizationNode[],
  issues: readonly Issue[],
): readonly VisualizationNode[] {
  const nodesByPath = new Map<string, VisualizationNode>()

  for (const node of nodes) {
    const normalizedPath = normalizePath(node.filePath)
    nodesByPath.set(normalizedPath, node)
  }

  const issuesByPath = new Map<string, Issue[]>()
  for (const issue of issues) {
    const normalizedPath = normalizePath(issue.location.filePath)
    const existing = issuesByPath.get(normalizedPath) ?? []
    existing.push(issue)
    issuesByPath.set(normalizedPath, existing)
  }

  return nodes.map(node => {
    const normalizedPath = normalizePath(node.filePath)
    const nodeIssues = issuesByPath.get(normalizedPath) ?? []

    if (nodeIssues.length === 0) {
      return node
    }

    const violations = nodeIssues.map((issue, index) => ({
      id: `${issue.id}-${index}`,
      message: issue.description,
      severity: issue.severity,
      ruleId: issue.id,
    }))

    const severities = violations.map(v => v.severity)
    const highestSeverity = getHighestSeverity(severities)

    return {
      ...node,
      violations,
      highestViolationSeverity: highestSeverity,
    }
  })
}

/**
 * Gets source files from a TypeScript project.
 *
 * @param project - The ts-morph project
 * @returns Array of source files for analysis
 */
function getSourceFiles(project: Project): readonly SourceFile[] {
  return project.getSourceFiles().filter(sf => {
    const filePath = sf.getFilePath()
    return (
      (filePath.endsWith('.ts') ||
        filePath.endsWith('.tsx') ||
        filePath.endsWith('.js') ||
        filePath.endsWith('.jsx')) &&
      !filePath.includes('node_modules') &&
      !filePath.includes('.test.') &&
      !filePath.includes('.spec.')
    )
  })
}

/**
 * Determines if a file should be skipped based on exclude patterns.
 */
function shouldSkipFile(filePath: string, excludePatterns: readonly string[]): boolean {
  if (excludePatterns.length === 0) {
    return false
  }

  const normalized = normalizePath(filePath)

  return excludePatterns.some(pattern => {
    const normalizedPattern = pattern.replaceAll('\\', '/').toLowerCase()
    return normalized.includes(normalizedPattern.replaceAll('**', '').replaceAll('*', ''))
  })
}

/**
 * Normalizes a file path for comparison.
 */
function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/').toLowerCase()
}
