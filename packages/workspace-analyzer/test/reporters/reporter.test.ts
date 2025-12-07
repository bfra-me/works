/**
 * Tests for reporter interface utilities and helper functions.
 */

import type {AnalysisResult, Issue, IssueCategory, Severity} from '../../src/types/index'

import {describe, expect, it} from 'vitest'

import {
  calculateSummary,
  filterIssuesForReport,
  formatDuration,
  formatLocation,
  getRelativePath,
  groupIssues,
  truncateText,
} from '../../src/reporters/reporter'

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

describe('filterIssuesForReport', () => {
  const issues: Issue[] = [
    createMockIssue({id: 'info-1', severity: 'info', category: 'configuration'}),
    createMockIssue({id: 'warning-1', severity: 'warning', category: 'dependency'}),
    createMockIssue({id: 'error-1', severity: 'error', category: 'architecture'}),
    createMockIssue({id: 'critical-1', severity: 'critical', category: 'performance'}),
  ]

  it.concurrent('should return all issues when no filters applied', () => {
    const filtered = filterIssuesForReport(issues, {})
    expect(filtered).toHaveLength(4)
  })

  it.concurrent('should filter by minimum severity', () => {
    const filtered = filterIssuesForReport(issues, {minSeverity: 'warning'})
    expect(filtered).toHaveLength(3)
    expect(filtered.every(i => i.severity !== 'info')).toBe(true)
  })

  it.concurrent('should filter by category', () => {
    const filtered = filterIssuesForReport(issues, {categories: ['configuration', 'dependency']})
    expect(filtered).toHaveLength(2)
    expect(filtered.map(i => i.category)).toEqual(['configuration', 'dependency'])
  })

  it.concurrent('should combine severity and category filters', () => {
    const filtered = filterIssuesForReport(issues, {
      minSeverity: 'error',
      categories: ['architecture', 'performance'],
    })
    expect(filtered).toHaveLength(2)
  })
})

describe('groupIssues', () => {
  const issues: Issue[] = [
    createMockIssue({
      id: 'issue-1',
      severity: 'warning',
      category: 'configuration',
      location: {filePath: '/workspace/src/a.ts'},
    }),
    createMockIssue({
      id: 'issue-2',
      severity: 'error',
      category: 'configuration',
      location: {filePath: '/workspace/src/a.ts'},
    }),
    createMockIssue({
      id: 'issue-3',
      severity: 'warning',
      category: 'dependency',
      location: {filePath: '/workspace/src/b.ts'},
    }),
  ]

  it.concurrent('should group by file', () => {
    const groups = groupIssues(issues, 'file')
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.key === '/workspace/src/a.ts')?.count).toBe(2)
    expect(groups.find(g => g.key === '/workspace/src/b.ts')?.count).toBe(1)
  })

  it.concurrent('should group by severity', () => {
    const groups = groupIssues(issues, 'severity')
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.key === 'warning')?.count).toBe(2)
    expect(groups.find(g => g.key === 'error')?.count).toBe(1)
  })

  it.concurrent('should group by category', () => {
    const groups = groupIssues(issues, 'category')
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.key === 'configuration')?.count).toBe(2)
    expect(groups.find(g => g.key === 'dependency')?.count).toBe(1)
  })

  it.concurrent('should return single group when groupBy is none', () => {
    const groups = groupIssues(issues, 'none')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.count).toBe(3)
  })
})

describe('calculateSummary', () => {
  it.concurrent('should calculate summary statistics correctly', () => {
    const issues: Issue[] = [
      createMockIssue({severity: 'error', category: 'configuration'}),
      createMockIssue({severity: 'warning', category: 'dependency'}),
      createMockIssue({severity: 'warning', category: 'dependency'}),
    ]
    const result = createMockAnalysisResult(issues)

    const summary = calculateSummary(result)

    expect(summary.totalIssues).toBe(3)
    expect(summary.bySeverity.error).toBe(1)
    expect(summary.bySeverity.warning).toBe(2)
    expect(summary.byCategory.dependency).toBe(2)
    expect(summary.highestSeverity).toBe('error')
  })

  it.concurrent('should handle empty issues', () => {
    const result = createMockAnalysisResult([])
    const summary = calculateSummary(result)

    expect(summary.totalIssues).toBe(0)
    expect(summary.highestSeverity).toBeNull()
  })

  it.concurrent('should count files with issues', () => {
    const issues: Issue[] = [
      createMockIssue({location: {filePath: '/a.ts'}}),
      createMockIssue({location: {filePath: '/a.ts'}}),
      createMockIssue({location: {filePath: '/b.ts'}}),
    ]
    const result = createMockAnalysisResult(issues)

    const summary = calculateSummary(result)
    expect(summary.filesWithIssues).toBe(2)
  })
})

describe('formatLocation', () => {
  it.concurrent('should format file path only', () => {
    const location = formatLocation({filePath: '/workspace/src/test.ts'})
    expect(location).toBe('/workspace/src/test.ts')
  })

  it.concurrent('should format with line number', () => {
    const location = formatLocation({filePath: '/workspace/src/test.ts', line: 42})
    expect(location).toBe('/workspace/src/test.ts:42')
  })

  it.concurrent('should format with line and column', () => {
    const location = formatLocation(
      {filePath: '/workspace/src/test.ts', line: 42, column: 10},
      {includeColumn: true},
    )
    expect(location).toBe('/workspace/src/test.ts:42:10')
  })

  it.concurrent('should not include column without flag', () => {
    const location = formatLocation({filePath: '/workspace/src/test.ts', line: 42, column: 10})
    expect(location).toBe('/workspace/src/test.ts:42')
  })
})

describe('formatDuration', () => {
  it.concurrent('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it.concurrent('should format seconds', () => {
    expect(formatDuration(1500)).toBe('1.50s')
    expect(formatDuration(30000)).toBe('30.00s')
  })

  it.concurrent('should format minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s')
    expect(formatDuration(90000)).toBe('1m 30s')
  })
})

describe('truncateText', () => {
  it.concurrent('should not truncate short text', () => {
    expect(truncateText('Hello', 10)).toBe('Hello')
  })

  it.concurrent('should truncate long text with ellipsis', () => {
    expect(truncateText('Hello World', 8)).toBe('Hello...')
  })

  it.concurrent('should handle exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello')
  })
})

describe('getRelativePath', () => {
  it.concurrent('should return relative path from workspace', () => {
    const relative = getRelativePath('/workspace/src/test.ts', '/workspace')
    expect(relative).toBe('src/test.ts')
  })

  it.concurrent('should return original path if not in workspace', () => {
    const relative = getRelativePath('/other/path/test.ts', '/workspace')
    expect(relative).toBe('/other/path/test.ts')
  })

  it.concurrent('should handle trailing slash in workspace path', () => {
    const relative = getRelativePath('/workspace/src/test.ts', '/workspace/')
    expect(relative).toBe('src/test.ts')
  })
})
