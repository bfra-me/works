/**
 * Tests for JSON reporter.
 */

import type {JsonReport} from '../../src/reporters/json-reporter'
import type {AnalysisResult, Issue, IssueCategory, Severity} from '../../src/types/index'

import {describe, expect, it} from 'vitest'

import {createJsonReporter} from '../../src/reporters/json-reporter'

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'test-issue',
    title: 'Test Issue',
    description: 'A test issue description',
    severity: 'warning' as Severity,
    category: 'configuration' as IssueCategory,
    location: {
      filePath: '/workspace/src/test.ts',
      line: 10,
      column: 5,
    },
    ...overrides,
  }
}

function createMockAnalysisResult(issues: Issue[]): AnalysisResult {
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
      packagesAnalyzed: 5,
      filesAnalyzed: 100,
      durationMs: 1500,
    },
    workspacePath: '/workspace',
    startedAt: new Date('2025-01-01T00:00:00Z'),
    completedAt: new Date('2025-01-01T00:00:01.5Z'),
  }
}

describe('createJsonReporter', () => {
  it.concurrent('should create a valid reporter', () => {
    const reporter = createJsonReporter()
    expect(reporter.id).toBe('json')
    expect(reporter.name).toBe('JSON Reporter')
    expect(typeof reporter.generate).toBe('function')
  })

  it.concurrent('should generate valid JSON', () => {
    const reporter = createJsonReporter()
    const issues = [createMockIssue()]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result)
    expect(() => JSON.parse(output)).not.toThrow()
  })

  it.concurrent('should include metadata in output', () => {
    const reporter = createJsonReporter()
    const result = createMockAnalysisResult([createMockIssue()])

    const output = reporter.generate(result)
    const report: JsonReport = JSON.parse(output)

    expect(report.metadata).toBeDefined()
    expect(report.metadata.workspacePath).toBe('/workspace')
    expect(report.metadata.analysisStartedAt).toBeDefined()
    expect(report.metadata.analysisCompletedAt).toBeDefined()
    expect(report.metadata.generatedAt).toBeDefined()
  })

  it.concurrent('should include summary in output', () => {
    const reporter = createJsonReporter()
    const issues = [createMockIssue({severity: 'error'}), createMockIssue({severity: 'warning'})]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result)
    const report: JsonReport = JSON.parse(output)

    expect(report.summary.totalIssues).toBe(2)
    expect(report.summary.bySeverity.error).toBe(1)
    expect(report.summary.bySeverity.warning).toBe(1)
  })

  it.concurrent('should include issues with location', () => {
    const reporter = createJsonReporter({includeLocation: true})
    const issue = createMockIssue({
      location: {filePath: '/workspace/src/test.ts', line: 42, column: 10},
    })
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)
    const report: JsonReport = JSON.parse(output)

    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.location.file).toBe('src/test.ts')
    expect(report.issues[0]?.location.line).toBe(42)
    expect(report.issues[0]?.location.column).toBe(10)
  })

  it.concurrent('should respect pretty print option', () => {
    const compactReporter = createJsonReporter({prettyPrint: false})
    const prettyReporter = createJsonReporter({prettyPrint: true})
    const result = createMockAnalysisResult([createMockIssue()])

    const compactOutput = compactReporter.generate(result)
    const prettyOutput = prettyReporter.generate(result)

    expect(compactOutput).not.toContain('\n')
    expect(prettyOutput).toContain('\n')
  })

  it.concurrent('should filter issues by severity', () => {
    const reporter = createJsonReporter()
    const issues = [
      createMockIssue({id: 'info-1', severity: 'info'}),
      createMockIssue({id: 'error-1', severity: 'error'}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result, {minSeverity: 'error'})
    const report: JsonReport = JSON.parse(output)

    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.id).toBe('error-1')
  })

  it.concurrent('should include grouped issues when enabled', () => {
    const reporter = createJsonReporter({includeGroupedIssues: true})
    const issues = [
      createMockIssue({location: {filePath: '/workspace/a.ts'}}),
      createMockIssue({location: {filePath: '/workspace/b.ts'}}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result, {groupBy: 'file'})
    const report: JsonReport = JSON.parse(output)

    expect(report.groupedIssues).toBeDefined()
    expect(report.groupedIssues).toHaveLength(2)
  })

  it.concurrent('should include $schema when schemaUrl provided', () => {
    const reporter = createJsonReporter({schemaUrl: 'https://example.com/schema.json'})
    const result = createMockAnalysisResult([])

    const output = reporter.generate(result)
    const report: JsonReport = JSON.parse(output)

    expect(report.$schema).toBe('https://example.com/schema.json')
  })
})
