/**
 * Report generation integration tests with snapshot testing.
 *
 * These tests verify report generation using fixtures and snapshot comparisons
 * to ensure consistent output across changes.
 */

import type {JsonReport} from '../../src/reporters/json-reporter'
import type {AnalysisResult, Issue, IssueCategory, Severity} from '../../src/types/index'

import {describe, expect, it} from 'vitest'

import {createConsoleReporter} from '../../src/reporters/console-reporter'
import {createJsonReporter} from '../../src/reporters/json-reporter'
import {createMarkdownReporter} from '../../src/reporters/markdown-reporter'

function createIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'test-issue',
    title: 'Test Issue',
    description: 'A test issue description',
    severity: 'warning' as Severity,
    category: 'configuration' as IssueCategory,
    location: {filePath: '/workspace/src/test.ts'},
    ...overrides,
  }
}

function createAnalysisResult(issues: Issue[]): AnalysisResult {
  return {
    issues,
    summary: {
      totalIssues: issues.length,
      bySeverity: {
        info: issues.filter(i => i.severity === 'info').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        error: issues.filter(i => i.severity === 'error').length,
        critical: issues.filter(i => i.severity === 'critical').length,
      },
      byCategory: {
        configuration: issues.filter(i => i.category === 'configuration').length,
        dependency: issues.filter(i => i.category === 'dependency').length,
        architecture: issues.filter(i => i.category === 'architecture').length,
        performance: issues.filter(i => i.category === 'performance').length,
        'circular-import': issues.filter(i => i.category === 'circular-import').length,
        'unused-export': issues.filter(i => i.category === 'unused-export').length,
        'type-safety': issues.filter(i => i.category === 'type-safety').length,
      },
      packagesAnalyzed: 3,
      filesAnalyzed: 50,
      durationMs: 1234,
    },
    workspacePath: '/workspace',
    startedAt: new Date('2025-01-01T00:00:00Z'),
    completedAt: new Date('2025-01-01T00:00:01.234Z'),
  }
}

function parseJsonReport(output: string): JsonReport {
  return JSON.parse(output) as JsonReport
}

const mixedSeverityIssues: Issue[] = [
  createIssue({
    id: 'critical-1',
    title: 'Critical Security Vulnerability',
    description: 'A critical security issue that needs immediate attention',
    severity: 'critical',
    category: 'configuration',
    location: {filePath: '/workspace/packages/core/src/auth.ts', line: 42, column: 5},
    suggestion: 'Update authentication mechanism to use secure tokens',
  }),
  createIssue({
    id: 'error-1',
    title: 'Circular Import Detected',
    description: 'modules/a.ts → modules/b.ts → modules/a.ts',
    severity: 'error',
    category: 'circular-import',
    location: {filePath: '/workspace/packages/utils/src/modules/a.ts', line: 1},
    relatedLocations: [{filePath: '/workspace/packages/utils/src/modules/b.ts', line: 3}],
    metadata: {cycleLength: 2, nodes: ['a.ts', 'b.ts']},
  }),
  createIssue({
    id: 'warning-1',
    title: 'Unused Dependency',
    description: 'Package "lodash" is declared but never imported',
    severity: 'warning',
    category: 'dependency',
    location: {filePath: '/workspace/packages/app/package.json'},
    suggestion: 'Remove unused dependency to reduce bundle size',
    metadata: {dependency: 'lodash', type: 'dependencies'},
  }),
  createIssue({
    id: 'warning-2',
    title: 'Missing TypeScript Config',
    description: 'Package is missing rootDir configuration',
    severity: 'warning',
    category: 'configuration',
    location: {filePath: '/workspace/packages/lib/tsconfig.json'},
    suggestion: 'Add "rootDir": "./src" for cleaner output structure',
  }),
  createIssue({
    id: 'info-1',
    title: 'Consider ESM Migration',
    description: 'Package uses CommonJS but workspace is mostly ESM',
    severity: 'info',
    category: 'configuration',
    location: {filePath: '/workspace/packages/legacy/package.json'},
    suggestion: 'Add "type": "module" to migrate to ESM',
  }),
]

describe('report generation', () => {
  describe('json reporter snapshots', () => {
    it.concurrent('should generate consistent JSON for empty results', () => {
      const reporter = createJsonReporter({prettyPrint: true})
      const result = createAnalysisResult([])

      const output = reporter.generate(result)
      const parsed = parseJsonReport(output)

      expect(parsed.summary.totalIssues).toBe(0)
      expect(parsed.issues).toHaveLength(0)
      expect(parsed.metadata.workspacePath).toBe('/workspace')
    })

    it.concurrent('should generate consistent JSON for mixed severity issues', () => {
      const reporter = createJsonReporter({
        prettyPrint: true,
        includeGroupedIssues: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result, {groupBy: 'severity'})
      const parsed = parseJsonReport(output)

      expect(parsed.summary.totalIssues).toBe(5)
      expect(parsed.summary.bySeverity.critical).toBe(1)
      expect(parsed.summary.bySeverity.error).toBe(1)
      expect(parsed.summary.bySeverity.warning).toBe(2)
      expect(parsed.summary.bySeverity.info).toBe(1)

      expect(parsed.groupedIssues).toBeDefined()
      expect(parsed.groupedIssues?.length).toBeGreaterThanOrEqual(4)
    })

    it.concurrent('should include metadata in JSON output', () => {
      const reporter = createJsonReporter({prettyPrint: true, includeMetadata: true})
      const circularImportIssue = mixedSeverityIssues.find(i => i.id === 'error-1')
      expect(circularImportIssue).toBeDefined()
      const result = createAnalysisResult(circularImportIssue ? [circularImportIssue] : [])

      const output = reporter.generate(result)
      const parsed = parseJsonReport(output)

      const issue = parsed.issues[0]
      expect(issue?.metadata).toBeDefined()
      expect(issue?.metadata?.cycleLength).toBe(2)
    })

    it.concurrent('should filter issues by category in JSON', () => {
      const reporter = createJsonReporter({prettyPrint: true})
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result, {categories: ['circular-import']})
      const parsed = parseJsonReport(output)

      expect(parsed.issues).toHaveLength(1)
      expect(parsed.issues[0]?.category).toBe('circular-import')
    })
  })

  describe('markdown reporter snapshots', () => {
    it.concurrent('should generate consistent markdown for empty results', () => {
      const reporter = createMarkdownReporter({
        title: 'Empty Analysis Report',
        githubFlavored: true,
        useEmoji: true,
      })
      const result = createAnalysisResult([])

      const output = reporter.generate(result)

      expect(output).toContain('# ')
      expect(output).toContain('Empty Analysis Report')
      expect(output).toContain('[!TIP]')
      expect(output).toContain('No issues found')
    })

    it.concurrent('should generate markdown with severity grouping', () => {
      const reporter = createMarkdownReporter({
        title: 'Severity Grouped Report',
        githubFlavored: true,
        useEmoji: true,
        includeTableOfContents: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result, {groupBy: 'severity'})

      expect(output).toContain('Critical Security Vulnerability')
      expect(output).toContain('Circular Import Detected')
      expect(output).toContain('🚨')
      expect(output).toContain('❌')
      expect(output).toContain('⚠️')
    })

    it.concurrent('should generate markdown with category grouping', () => {
      const reporter = createMarkdownReporter({
        title: 'Category Grouped Report',
        githubFlavored: true,
        useEmoji: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result, {groupBy: 'category'})

      expect(output).toContain('Configuration')
      expect(output).toContain('Circular Import')
      expect(output).toContain('Dependency')
    })

    it.concurrent('should generate markdown with file grouping', () => {
      const reporter = createMarkdownReporter({
        title: 'File Grouped Report',
        githubFlavored: true,
        includeLocation: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result, {groupBy: 'file'})

      expect(output).toContain('packages/core')
      expect(output).toContain('packages/utils')
      expect(output).toContain('packages/app')
    })

    it.concurrent('should include suggestions in markdown', () => {
      const reporter = createMarkdownReporter({
        includeSuggestions: true,
        githubFlavored: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).toContain('Suggestion')
      expect(output).toContain('Update authentication mechanism')
      expect(output).toContain('Remove unused dependency')
    })

    it.concurrent('should use collapsible sections', () => {
      const reporter = createMarkdownReporter({
        collapsibleDetails: true,
        githubFlavored: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).toContain('<details>')
      expect(output).toContain('<summary>')
      expect(output).toContain('</details>')
    })

    it.concurrent('should generate markdown without emoji', () => {
      const reporter = createMarkdownReporter({
        useEmoji: false,
        githubFlavored: true,
      })
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).not.toContain('🚨')
      expect(output).not.toContain('❌')
      expect(output).not.toContain('⚠️')
      expect(output).not.toContain('ℹ️')
    })
  })

  describe('console reporter snapshots', () => {
    it.concurrent('should generate consistent console output for empty results', () => {
      const reporter = createConsoleReporter({colors: false})
      const result = createAnalysisResult([])

      const output = reporter.generate(result)

      expect(output).toContain('No issues found')
    })

    it.concurrent('should generate console output with severity indicators', () => {
      const reporter = createConsoleReporter({colors: false})
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).toContain('Critical Security Vulnerability')
      expect(output).toContain('Circular Import Detected')
      expect(output).toContain('Unused Dependency')
    })

    it.concurrent('should generate console output with colors disabled', () => {
      const reporter = createConsoleReporter({colors: false})
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).not.toContain('\u001B[')
    })

    it.concurrent('should include summary in console output', () => {
      const reporter = createConsoleReporter({colors: false, includeSummary: true})
      const result = createAnalysisResult(mixedSeverityIssues)

      const output = reporter.generate(result)

      expect(output).toContain('5')
      expect(output).toContain('issue')
    })
  })

  describe('cross-reporter consistency', () => {
    it.concurrent('should report same issue count across reporters', () => {
      const jsonReporter = createJsonReporter()
      const markdownReporter = createMarkdownReporter()
      const consoleReporter = createConsoleReporter({colors: false})

      const result = createAnalysisResult(mixedSeverityIssues)

      const jsonOutput = jsonReporter.generate(result)
      const markdownOutput = markdownReporter.generate(result)
      const consoleOutput = consoleReporter.generate(result)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.summary.totalIssues).toBe(5)

      for (const issue of mixedSeverityIssues) {
        expect(markdownOutput).toContain(issue.title)
        expect(consoleOutput).toContain(issue.title)
      }
    })

    it.concurrent('should apply same filters across reporters', () => {
      const jsonReporter = createJsonReporter()
      const markdownReporter = createMarkdownReporter()

      const result = createAnalysisResult(mixedSeverityIssues)
      const filterOptions = {minSeverity: 'error' as Severity}

      const jsonOutput = jsonReporter.generate(result, filterOptions)
      const markdownOutput = markdownReporter.generate(result, filterOptions)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.issues.length).toBe(2)

      expect(markdownOutput).toContain('Critical Security Vulnerability')
      expect(markdownOutput).toContain('Circular Import Detected')
      expect(markdownOutput).not.toContain('Unused Dependency')
      expect(markdownOutput).not.toContain('Consider ESM Migration')
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle issues without location', () => {
      const jsonReporter = createJsonReporter({prettyPrint: true})
      const markdownReporter = createMarkdownReporter()

      const issueWithoutLine = createIssue({
        id: 'no-line',
        title: 'Issue Without Line',
        location: {filePath: '/workspace/package.json'},
      })
      const result = createAnalysisResult([issueWithoutLine])

      const jsonOutput = jsonReporter.generate(result)
      const markdownOutput = markdownReporter.generate(result)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.issues[0]?.location.line).toBeUndefined()
      expect(markdownOutput).toContain('Issue Without Line')
    })

    it.concurrent('should handle issues with related locations', () => {
      const jsonReporter = createJsonReporter({prettyPrint: true})
      const markdownReporter = createMarkdownReporter()

      const issueWithRelated = createIssue({
        id: 'related',
        title: 'Issue With Related',
        relatedLocations: [
          {filePath: '/workspace/a.ts', line: 1},
          {filePath: '/workspace/b.ts', line: 2},
          {filePath: '/workspace/c.ts', line: 3},
        ],
      })
      const result = createAnalysisResult([issueWithRelated])

      const jsonOutput = jsonReporter.generate(result)
      const markdownOutput = markdownReporter.generate(result)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.issues[0]?.relatedLocations).toHaveLength(3)
      expect(markdownOutput).toContain('Issue With Related')
    })

    it.concurrent('should handle very long descriptions', () => {
      const longDescription = 'This is a very long description. '.repeat(50)
      const jsonReporter = createJsonReporter({prettyPrint: true})
      const markdownReporter = createMarkdownReporter()

      const issueWithLongDesc = createIssue({
        id: 'long-desc',
        title: 'Long Description Issue',
        description: longDescription,
      })
      const result = createAnalysisResult([issueWithLongDesc])

      const jsonOutput = jsonReporter.generate(result)
      const markdownOutput = markdownReporter.generate(result)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.issues[0]?.description).toBe(longDescription)
      expect(markdownOutput).toContain('Long Description Issue')
    })

    it.concurrent('should handle special characters in titles', () => {
      const jsonReporter = createJsonReporter({prettyPrint: true})
      const markdownReporter = createMarkdownReporter()

      const issueWithSpecialChars = createIssue({
        id: 'special-chars',
        title: 'Issue with <html> & "quotes" and `backticks`',
        description: 'Description with **markdown** and [links](url)',
      })
      const result = createAnalysisResult([issueWithSpecialChars])

      const jsonOutput = jsonReporter.generate(result)
      const markdownOutput = markdownReporter.generate(result)

      const jsonParsed = parseJsonReport(jsonOutput)
      expect(jsonParsed.issues[0]?.title).toContain('<html>')
      expect(jsonParsed.issues[0]?.title).toContain('"quotes"')
      expect(markdownOutput).toContain('Issue with')
    })
  })
})
