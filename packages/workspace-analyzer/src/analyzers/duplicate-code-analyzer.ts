/**
 * DuplicateCodeAnalyzer - Detects duplicate code patterns using AST fingerprinting.
 *
 * Identifies code duplication within and across packages in the workspace:
 * - Exact function duplicates with different names
 * - Similar code blocks that could be refactored
 * - Duplicated utility functions across packages
 *
 * Uses structural AST fingerprinting rather than text comparison to detect
 * semantically equivalent code regardless of variable naming or formatting.
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
 * Configuration options for DuplicateCodeAnalyzer.
 */
export interface DuplicateCodeAnalyzerOptions {
  /** Minimum number of statements for a block to be considered for duplication */
  readonly minStatements?: number
  /** Minimum fingerprint similarity threshold (0-1) for reporting */
  readonly similarityThreshold?: number
  /** Check for duplicates across packages (not just within) */
  readonly crossPackageAnalysis?: boolean
  /** Report duplicate functions */
  readonly reportFunctions?: boolean
  /** Report duplicate class methods */
  readonly reportMethods?: boolean
  /** Report similar code blocks */
  readonly reportCodeBlocks?: boolean
  /** Severity for exact duplicates */
  readonly exactDuplicateSeverity?: Severity
  /** Severity for similar code */
  readonly similarCodeSeverity?: Severity
  /** File patterns to exclude from analysis */
  readonly excludePatterns?: readonly string[]
}

const DEFAULT_OPTIONS: Required<DuplicateCodeAnalyzerOptions> = {
  minStatements: 5,
  similarityThreshold: 0.85,
  crossPackageAnalysis: true,
  reportFunctions: true,
  reportMethods: true,
  reportCodeBlocks: true,
  exactDuplicateSeverity: 'warning',
  similarCodeSeverity: 'info',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/__mocks__/**'],
}

export const duplicateCodeAnalyzerMetadata: AnalyzerMetadata = {
  id: 'duplicate-code',
  name: 'Duplicate Code Analyzer',
  description: 'Detects duplicate code patterns using AST fingerprinting',
  categories: ['performance'],
  defaultSeverity: 'warning',
}

/**
 * Creates a DuplicateCodeAnalyzer instance.
 */
export function createDuplicateCodeAnalyzer(options: DuplicateCodeAnalyzerOptions = {}): Analyzer {
  const resolvedOptions = {...DEFAULT_OPTIONS, ...options}

  return {
    metadata: duplicateCodeAnalyzerMetadata,
    analyze: async (context: AnalysisContext): Promise<Result<readonly Issue[], AnalyzerError>> => {
      const issues: Issue[] = []

      // Collect all fingerprints across packages
      const allFingerprints: CodeFingerprint[] = []

      for (const pkg of context.packages) {
        context.reportProgress?.(`Fingerprinting code in ${pkg.name}...`)

        const fingerprints = await collectPackageFingerprints(
          pkg,
          context.workspacePath,
          resolvedOptions,
        )
        allFingerprints.push(...fingerprints)
      }

      context.reportProgress?.('Detecting duplicates...')

      // Find duplicates
      const duplicates = findDuplicates(allFingerprints, resolvedOptions)

      // Create issues for duplicates
      for (const duplicate of duplicates) {
        issues.push(createDuplicateIssue(duplicate, resolvedOptions))
      }

      return ok(filterIssues(issues, context.config))
    },
  }
}

/**
 * Fingerprint of a code fragment for comparison.
 */
export interface CodeFingerprint {
  /** Unique hash of the structural fingerprint */
  readonly hash: string
  /** Type of code fragment */
  readonly type: 'function' | 'method' | 'block'
  /** Name of the function/method (if applicable) */
  readonly name?: string
  /** Package containing this code */
  readonly packageName: string
  /** File path */
  readonly filePath: string
  /** Location in the file */
  readonly location: IssueLocation
  /** Number of statements in the fragment */
  readonly statementCount: number
  /** Original code (for display) */
  readonly codePreview: string
  /** Structural elements for similarity comparison */
  readonly structure: readonly string[]
}

/**
 * Detected duplicate code pattern.
 */
export interface DuplicatePattern {
  /** Fingerprint hash */
  readonly hash: string
  /** All occurrences of this duplicate */
  readonly occurrences: readonly CodeFingerprint[]
  /** Whether this is an exact match or similar */
  readonly isExactMatch: boolean
  /** Similarity score (1.0 for exact matches) */
  readonly similarity: number
}

async function collectPackageFingerprints(
  pkg: WorkspacePackage,
  _workspacePath: string,
  options: Required<DuplicateCodeAnalyzerOptions>,
): Promise<CodeFingerprint[]> {
  const fingerprints: CodeFingerprint[] = []

  const sourceFiles = filterSourceFiles(pkg.sourceFiles, options.excludePatterns)
  if (sourceFiles.length === 0) {
    return fingerprints
  }

  const project = createProject()

  for (const filePath of sourceFiles) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath)
      const fileFingerprints = fingerprintFile(sourceFile, pkg, options)
      fingerprints.push(...fileFingerprints)
    } catch {
      // File may not be parseable
    }
  }

  return fingerprints
}

function fingerprintFile(
  sourceFile: SourceFile,
  pkg: WorkspacePackage,
  options: Required<DuplicateCodeAnalyzerOptions>,
): CodeFingerprint[] {
  const fingerprints: CodeFingerprint[] = []
  const filePath = sourceFile.getFilePath()

  // Fingerprint functions
  if (options.reportFunctions) {
    for (const func of sourceFile.getFunctions()) {
      const body = func.getBody()
      if (body === undefined) continue

      // Check if body is a block with statements
      if (body.getKind() !== SyntaxKind.Block) continue
      const block = body.asKind(SyntaxKind.Block)
      if (block === undefined) continue

      const statements = block.getStatements()
      if (statements.length < options.minStatements) continue

      const structure = extractStructure(block)
      const hash = computeHash(structure)
      const {line, column} = sourceFile.getLineAndColumnAtPos(func.getStart())

      fingerprints.push({
        hash,
        type: 'function',
        name: func.getName(),
        packageName: pkg.name,
        filePath,
        location: {
          filePath,
          line,
          column,
          endLine: sourceFile.getLineAndColumnAtPos(func.getEnd()).line,
        },
        statementCount: statements.length,
        codePreview: truncateCode(func.getText(), 100),
        structure,
      })
    }
  }

  // Fingerprint class methods
  if (options.reportMethods) {
    for (const classDecl of sourceFile.getClasses()) {
      for (const method of classDecl.getMethods()) {
        const body = method.getBody()
        if (body === undefined) continue

        // Check if body is a block with statements
        if (body.getKind() !== SyntaxKind.Block) continue
        const block = body.asKind(SyntaxKind.Block)
        if (block === undefined) continue

        const statements = block.getStatements()
        if (statements.length < options.minStatements) continue

        const structure = extractStructure(block)
        const hash = computeHash(structure)
        const {line, column} = sourceFile.getLineAndColumnAtPos(method.getStart())

        fingerprints.push({
          hash,
          type: 'method',
          name: `${classDecl.getName()}.${method.getName()}`,
          packageName: pkg.name,
          filePath,
          location: {
            filePath,
            line,
            column,
            endLine: sourceFile.getLineAndColumnAtPos(method.getEnd()).line,
          },
          statementCount: statements.length,
          codePreview: truncateCode(method.getText(), 100),
          structure,
        })
      }
    }
  }

  // Fingerprint arrow function expressions assigned to variables
  if (options.reportFunctions) {
    for (const varDecl of sourceFile.getVariableDeclarations()) {
      const initializer = varDecl.getInitializer()
      if (initializer === undefined) continue

      if (initializer.getKind() !== SyntaxKind.ArrowFunction) continue

      const arrowFunc = initializer.asKind(SyntaxKind.ArrowFunction)
      if (arrowFunc === undefined) continue

      const body = arrowFunc.getBody()
      if (body === undefined) continue

      // Only process block bodies, not expression bodies
      if (body.getKind() !== SyntaxKind.Block) continue

      const block = body.asKind(SyntaxKind.Block)
      if (block === undefined) continue

      const statements = block.getStatements()
      if (statements.length < options.minStatements) continue

      const structure = extractStructure(block)
      const hash = computeHash(structure)
      const {line, column} = sourceFile.getLineAndColumnAtPos(varDecl.getStart())

      fingerprints.push({
        hash,
        type: 'function',
        name: varDecl.getName(),
        packageName: pkg.name,
        filePath,
        location: {
          filePath,
          line,
          column,
          endLine: sourceFile.getLineAndColumnAtPos(varDecl.getEnd()).line,
        },
        statementCount: statements.length,
        codePreview: truncateCode(varDecl.getText(), 100),
        structure,
      })
    }
  }

  return fingerprints
}

/**
 * Extracts structural elements from a code block for fingerprinting.
 *
 * This creates a normalized representation of code structure,
 * ignoring variable names and formatting.
 */
function extractStructure(node: {
  forEachDescendant: (cb: (n: {getKind: () => number}) => void) => void
}): string[] {
  const structure: string[] = []

  node.forEachDescendant(descendant => {
    const kind = descendant.getKind()

    // Include structural elements, exclude identifiers and literals
    switch (kind) {
      case SyntaxKind.IfStatement:
        structure.push('IF')
        break
      case SyntaxKind.ForStatement:
      case SyntaxKind.ForInStatement:
      case SyntaxKind.ForOfStatement:
        structure.push('FOR')
        break
      case SyntaxKind.WhileStatement:
        structure.push('WHILE')
        break
      case SyntaxKind.DoStatement:
        structure.push('DO')
        break
      case SyntaxKind.SwitchStatement:
        structure.push('SWITCH')
        break
      case SyntaxKind.TryStatement:
        structure.push('TRY')
        break
      case SyntaxKind.ReturnStatement:
        structure.push('RETURN')
        break
      case SyntaxKind.ThrowStatement:
        structure.push('THROW')
        break
      case SyntaxKind.AwaitExpression:
        structure.push('AWAIT')
        break
      case SyntaxKind.CallExpression:
        structure.push('CALL')
        break
      case SyntaxKind.PropertyAccessExpression:
        structure.push('PROP')
        break
      case SyntaxKind.ElementAccessExpression:
        structure.push('ELEM')
        break
      case SyntaxKind.BinaryExpression:
        structure.push('BIN')
        break
      case SyntaxKind.ConditionalExpression:
        structure.push('COND')
        break
      case SyntaxKind.ArrayLiteralExpression:
        structure.push('ARR')
        break
      case SyntaxKind.ObjectLiteralExpression:
        structure.push('OBJ')
        break
      case SyntaxKind.NewExpression:
        structure.push('NEW')
        break
      case SyntaxKind.VariableStatement:
        structure.push('VAR')
        break
      case SyntaxKind.ExpressionStatement:
        structure.push('EXPR')
        break
    }
  })

  return structure
}

/**
 * Computes a hash for a structural fingerprint.
 */
function computeHash(structure: readonly string[]): string {
  const str = structure.join(':')
  // Simple hash function for fingerprinting
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Calculates similarity between two structural fingerprints.
 *
 * Uses Jaccard similarity coefficient.
 */
function calculateSimilarity(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0

  const setA = new Set(a)
  const setB = new Set(b)

  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Finds duplicate patterns in collected fingerprints.
 */
function findDuplicates(
  fingerprints: readonly CodeFingerprint[],
  options: Required<DuplicateCodeAnalyzerOptions>,
): DuplicatePattern[] {
  const duplicates: DuplicatePattern[] = []
  const processed = new Set<string>()

  // Group by hash for exact matches
  const byHash = new Map<string, CodeFingerprint[]>()
  for (const fp of fingerprints) {
    const existing = byHash.get(fp.hash)
    if (existing === undefined) {
      byHash.set(fp.hash, [fp])
    } else {
      existing.push(fp)
    }
  }

  // Report exact duplicates
  for (const [hash, occurrences] of byHash) {
    if (occurrences.length < 2) continue

    // Filter to cross-package only if configured
    const filteredOccurrences = options.crossPackageAnalysis
      ? occurrences
      : filterSamePackageOccurrences(occurrences)

    if (filteredOccurrences.length < 2) continue

    duplicates.push({
      hash,
      occurrences: filteredOccurrences,
      isExactMatch: true,
      similarity: 1,
    })

    for (const occ of filteredOccurrences) {
      processed.add(`${occ.filePath}:${occ.location.line}`)
    }
  }

  // Find similar code (if similarity threshold < 1)
  if (options.similarityThreshold < 1) {
    for (let i = 0; i < fingerprints.length; i++) {
      const fpA = fingerprints[i]
      if (fpA === undefined) continue

      const keyA = `${fpA.filePath}:${fpA.location.line}`
      if (processed.has(keyA)) continue

      for (let j = i + 1; j < fingerprints.length; j++) {
        const fpB = fingerprints[j]
        if (fpB === undefined) continue

        const keyB = `${fpB.filePath}:${fpB.location.line}`
        if (processed.has(keyB)) continue

        // Skip if same file and close locations
        if (fpA.filePath === fpB.filePath) {
          const lineDiff = Math.abs((fpA.location.line ?? 0) - (fpB.location.line ?? 0))
          if (lineDiff < 20) continue
        }

        // Skip if not cross-package and configured
        if (!options.crossPackageAnalysis && fpA.packageName === fpB.packageName) {
          continue
        }

        const similarity = calculateSimilarity(fpA.structure, fpB.structure)
        if (similarity >= options.similarityThreshold && similarity < 1) {
          duplicates.push({
            hash: `similar-${i}-${j}`,
            occurrences: [fpA, fpB],
            isExactMatch: false,
            similarity,
          })

          processed.add(keyA)
          processed.add(keyB)
          break // Move to next fpA
        }
      }
    }
  }

  return duplicates
}

function filterSamePackageOccurrences(occurrences: CodeFingerprint[]): CodeFingerprint[] {
  // Keep only if there are duplicates across different files in the same package
  const byFile = new Map<string, CodeFingerprint[]>()
  for (const occ of occurrences) {
    const existing = byFile.get(occ.filePath)
    if (existing === undefined) {
      byFile.set(occ.filePath, [occ])
    } else {
      existing.push(occ)
    }
  }

  // Only return if duplicates are in different files
  if (byFile.size >= 2) {
    return occurrences
  }

  return []
}

function createDuplicateIssue(
  duplicate: DuplicatePattern,
  options: Required<DuplicateCodeAnalyzerOptions>,
): Issue {
  const [first, ...rest] = duplicate.occurrences
  if (first === undefined) {
    // This should never happen, but handle gracefully
    return createIssue({
      id: 'duplicate-code',
      title: 'Duplicate code detected',
      description: 'Duplicate code pattern detected',
      severity: options.exactDuplicateSeverity,
      category: 'performance',
      location: {filePath: 'unknown'},
    })
  }

  const otherLocations = rest.map(occ => ({
    filePath: occ.filePath,
    line: occ.location.line,
    column: occ.location.column,
  }))

  const locationStrings = duplicate.occurrences
    .map(occ => `${occ.packageName}:${getFileName(occ.filePath)}:${occ.location.line}`)
    .join(', ')

  const typeLabel =
    first.type === 'function' ? 'function' : first.type === 'method' ? 'method' : 'code block'

  const title = duplicate.isExactMatch
    ? `Duplicate ${typeLabel}: ${first.name ?? 'anonymous'}`
    : `Similar ${typeLabel}s (${Math.round(duplicate.similarity * 100)}% match)`

  return createIssue({
    id: duplicate.isExactMatch ? 'exact-duplicate' : 'similar-code',
    title,
    description:
      `${duplicate.isExactMatch ? 'Identical' : 'Similar'} ${typeLabel} found in ${duplicate.occurrences.length} locations: ${locationStrings}. ` +
      `This increases bundle size and maintenance burden.`,
    severity: duplicate.isExactMatch ? options.exactDuplicateSeverity : options.similarCodeSeverity,
    category: 'performance',
    location: first.location,
    relatedLocations: otherLocations,
    suggestion:
      `Consider extracting this ${typeLabel} into a shared utility module that can be imported by all usages. ` +
      `This reduces bundle size through deduplication and centralizes maintenance.`,
    metadata: {
      duplicateHash: duplicate.hash,
      similarity: duplicate.similarity,
      isExactMatch: duplicate.isExactMatch,
      occurrenceCount: duplicate.occurrences.length,
      statementCount: first.statementCount,
      codePreview: first.codePreview,
    },
  })
}

function truncateCode(code: string, maxLength: number): string {
  if (code.length <= maxLength) return code
  return `${code.slice(0, maxLength)}...`
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
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

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replaceAll('.', String.raw`\.`)
    .replaceAll('**', '.*')
    .replaceAll('*', '[^/]*')
  return new RegExp(escaped)
}
