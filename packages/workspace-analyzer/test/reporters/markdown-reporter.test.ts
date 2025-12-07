/**
 * Tests for Markdown reporter.
 */

import type {AnalysisResult, Issue, IssueCategory, Severity} from '../../src/types/index'

import {describe, expect, it} from 'vitest'

import {createMarkdownReporter} from '../../src/reporters/markdown-reporter'

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

describe('createMarkdownReporter', () => {
  it.concurrent('should create a valid reporter', () => {
    const reporter = createMarkdownReporter()
    expect(reporter.id).toBe('markdown')
    expect(reporter.name).toBe('Markdown Reporter')
    expect(typeof reporter.generate).toBe('function')
  })

  it.concurrent('should generate valid Markdown with title', () => {
    const reporter = createMarkdownReporter({title: 'My Analysis Report'})
    const result = createMockAnalysisResult([createMockIssue()])

    const output = reporter.generate(result)

    expect(output).toContain('# ')
    expect(output).toContain('My Analysis Report')
  })

  it.concurrent('should include summary section', () => {
    const reporter = createMarkdownReporter({includeSummary: true})
    const result = createMockAnalysisResult([
      createMockIssue({severity: 'error'}),
      createMockIssue({severity: 'warning'}),
    ])

    const output = reporter.generate(result)

    expect(output).toContain('## Summary')
    expect(output).toContain('Total Issues')
    expect(output).toContain('Issues by Severity')
  })

  it.concurrent('should include issues section', () => {
    const reporter = createMarkdownReporter()
    const issue = createMockIssue({
      title: 'Test Configuration Issue',
      description: 'This is a detailed description',
    })
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('## Issues')
    expect(output).toContain('Test Configuration Issue')
  })

  it.concurrent('should include GitHub alert when enabled', () => {
    const reporter = createMarkdownReporter({githubFlavored: true})
    const result = createMockAnalysisResult([createMockIssue({severity: 'error'})])

    const output = reporter.generate(result)

    expect(output).toContain('[!CAUTION]')
  })

  it.concurrent('should show success message for no issues', () => {
    const reporter = createMarkdownReporter({githubFlavored: true})
    const result = createMockAnalysisResult([])

    const output = reporter.generate(result)

    expect(output).toContain('[!TIP]')
    expect(output).toContain('No issues found')
  })

  it.concurrent('should include file location', () => {
    const reporter = createMarkdownReporter({includeLocation: true})
    const issue = createMockIssue({
      location: {filePath: '/workspace/src/test.ts', line: 42, column: 10},
    })
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('src/test.ts')
    expect(output).toContain(':42')
  })

  it.concurrent('should include suggestion when enabled', () => {
    const reporter = createMarkdownReporter({includeSuggestions: true})
    const issue = createMockIssue({suggestion: 'Fix by updating the config'})
    const result = createMockAnalysisResult([issue])

    const output = reporter.generate(result)

    expect(output).toContain('Suggestion')
    expect(output).toContain('Fix by updating the config')
  })

  it.concurrent('should use emoji when enabled', () => {
    const reporter = createMarkdownReporter({useEmoji: true})
    const result = createMockAnalysisResult([createMockIssue({severity: 'warning'})])

    const output = reporter.generate(result)

    expect(output).toContain('⚠️')
  })

  it.concurrent('should not use emoji when disabled', () => {
    const reporter = createMarkdownReporter({useEmoji: false})
    const result = createMockAnalysisResult([createMockIssue({severity: 'warning'})])

    const output = reporter.generate(result)

    expect(output).not.toContain('⚠️')
  })

  it.concurrent('should include table of contents when enabled', () => {
    const reporter = createMarkdownReporter({
      includeTableOfContents: true,
      groupBy: 'category',
    })
    const issues = [
      createMockIssue({category: 'configuration'}),
      createMockIssue({category: 'dependency'}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result)

    expect(output).toContain('Table of Contents')
  })

  it.concurrent('should use collapsible details when enabled', () => {
    const reporter = createMarkdownReporter({collapsibleDetails: true})
    const result = createMockAnalysisResult([createMockIssue()])

    const output = reporter.generate(result)

    expect(output).toContain('<details>')
    expect(output).toContain('<summary>')
    expect(output).toContain('</details>')
  })

  it.concurrent('should filter issues by severity', () => {
    const reporter = createMarkdownReporter()
    const issues = [
      createMockIssue({id: 'info-1', title: 'Info Issue', severity: 'info'}),
      createMockIssue({id: 'error-1', title: 'Error Issue', severity: 'error'}),
    ]
    const result = createMockAnalysisResult(issues)

    const output = reporter.generate(result, {minSeverity: 'error'})

    expect(output).toContain('Error Issue')
    expect(output).not.toContain('Info Issue')
  })
})
