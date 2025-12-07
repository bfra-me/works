/**
 * Tests for Console reporter.
 */

import type {AnalysisResult, Issue, IssueCategory, Severity} from '../../src/types/index'

import {describe, expect, it, vi} from 'vitest'

import {createConsoleReporter} from '../../src/reporters/console-reporter'

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

describe('createConsoleReporter', () => {
  it.concurrent('should create a valid reporter', () => {
    const reporter = createConsoleReporter()
    expect(reporter.id).toBe('console')
    expect(reporter.name).toBe('Console Reporter')
    expect(typeof reporter.generate).toBe('function')
  })

  it.concurrent('should generate output with header', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([createMockIssue()])

    const output = reporter.generate(result)

    expect(output).toContain('Workspace Analysis Report')
  })

  it.concurrent('should show issue count in header', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([createMockIssue(), createMockIssue()])

    const output = reporter.generate(result)

    expect(output).toContain('2 issue(s) found')
  })

  it.concurrent('should show no issues message', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([])

    const output = reporter.generate(result)

    expect(output).toContain('No issues')
  })

  it.concurrent('should include summary when enabled', () => {
    const reporter = createConsoleReporter({includeSummary: true})
    const result = createMockAnalysisResult([
      createMockIssue({severity: 'error'}),
      createMockIssue({severity: 'warning'}),
    ])

    const output = reporter.generate(result)

    expect(output).toContain('Summary')
    expect(output).toContain('packages')
    expect(output).toContain('files')
  })

  it.concurrent('should format issues in compact mode', () => {
    const reporter = createConsoleReporter({compact: true})
    const issue = createMockIssue({
      title: 'Test Configuration Issue',
      location: {filePath: '/workspace/src/test.ts', line: 42},
    })
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('src/test.ts:42')
  })

  it.concurrent('should format issues in detailed mode', () => {
    const reporter = createConsoleReporter({compact: false, verbose: true})
    const issue = createMockIssue({
      title: 'Test Configuration Issue',
      description: 'This is a longer description of the issue',
    })
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('Test Configuration Issue')
    expect(output).toContain('longer description')
  })

  it.concurrent('should include suggestions when enabled', () => {
    const reporter = createConsoleReporter({includeSuggestions: true})
    const issue = createMockIssue({suggestion: 'Update the configuration file'})
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('Update the configuration file')
  })

  it.concurrent('should filter issues by severity', () => {
    const reporter = createConsoleReporter()
    const issues = [
      createMockIssue({id: 'info-1', title: 'Info Issue', severity: 'info'}),
      createMockIssue({id: 'error-1', title: 'Error Issue', severity: 'error'}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result, {minSeverity: 'error'})

    expect(output).toContain('Error Issue')
    expect(output).not.toContain('Info Issue')
  })

  it.concurrent('should include footer with recommendations', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([createMockIssue({severity: 'error'})])

    const output = reporter.generate(result)

    expect(output).toContain('Recommendations')
  })

  it.concurrent('should show success message for no issues', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([])

    const output = reporter.generate(result)

    expect(output).toContain('looks great')
  })

  it.concurrent('should truncate long issue lists', () => {
    const reporter = createConsoleReporter({maxIssuesPerGroup: 2})
    const issues = [
      createMockIssue({id: '1'}),
      createMockIssue({id: '2'}),
      createMockIssue({id: '3'}),
      createMockIssue({id: '4'}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result)

    expect(output).toContain('more issue(s)')
  })

  it.concurrent('should support stream method', () => {
    const reporter = createConsoleReporter()
    const result = createMockAnalysisResult([createMockIssue()])
    const chunks: string[] = []
    const write = vi.fn((chunk: string) => chunks.push(chunk))

    reporter.stream?.(result, write)

    expect(write).toHaveBeenCalled()
    expect(chunks.join('')).toContain('Workspace Analysis Report')
  })
})
