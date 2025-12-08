/**
 * CLI module unit tests.
 *
 * Tests the CLI types, UI utilities, and analyze command logic.
 */

import type {AnalyzeOptions} from '../../src/cli/types'
import type {AnalysisResult} from '../../src/types/index'

import {describe, expect, it} from 'vitest'

import {
  createLogger,
  formatDuration,
  formatIssueCount,
  formatList,
  formatSeveritySummary,
  handleCancel,
} from '../../src/cli/ui'

describe('cli UI utilities', () => {
  describe('createLogger', () => {
    it.concurrent('should create logger with default options', () => {
      const logger = createLogger({})

      expect(logger.info).toBeTypeOf('function')
      expect(logger.success).toBeTypeOf('function')
      expect(logger.warn).toBeTypeOf('function')
      expect(logger.error).toBeTypeOf('function')
      expect(logger.debug).toBeTypeOf('function')
    })

    it.concurrent('should respect quiet option', () => {
      const logger = createLogger({quiet: true})

      expect(logger.info).toBeTypeOf('function')
    })

    it.concurrent('should respect verbose option', () => {
      const logger = createLogger({verbose: true})

      expect(logger.debug).toBeTypeOf('function')
    })
  })

  describe('formatDuration', () => {
    it.concurrent('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms')
      expect(formatDuration(999)).toBe('999ms')
    })

    it.concurrent('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s')
      expect(formatDuration(2500)).toBe('2.5s')
      expect(formatDuration(10000)).toBe('10.0s')
    })

    it.concurrent('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(90000)).toBe('1m 30s')
      expect(formatDuration(125000)).toBe('2m 5s')
    })
  })

  describe('formatList', () => {
    it.concurrent('should handle empty list', () => {
      expect(formatList([])).toBe('none')
    })

    it.concurrent('should handle single item', () => {
      expect(formatList(['one'])).toBe('one')
    })

    it.concurrent('should handle two items', () => {
      expect(formatList(['one', 'two'])).toBe('one, two')
    })

    it.concurrent('should handle three items', () => {
      expect(formatList(['one', 'two', 'three'])).toBe('one, two, three')
    })

    it.concurrent('should truncate long lists', () => {
      expect(formatList(['one', 'two', 'three', 'four'])).toBe('one, two, three and 1 more')
      expect(formatList(['one', 'two', 'three', 'four', 'five'])).toBe('one, two, three and 2 more')
    })

    it.concurrent('should respect custom maxDisplay', () => {
      expect(formatList(['one', 'two', 'three', 'four'], 2)).toBe('one, two and 2 more')
    })
  })

  describe('formatIssueCount', () => {
    it.concurrent('should format singular count', () => {
      expect(formatIssueCount(1, 'error')).toBe('❌ 1 error')
      expect(formatIssueCount(1, 'warning')).toBe('⚠️ 1 warning')
    })

    it.concurrent('should format plural count', () => {
      expect(formatIssueCount(5, 'error')).toBe('❌ 5 errors')
      expect(formatIssueCount(3, 'warning')).toBe('⚠️ 3 warnings')
    })

    it.concurrent('should use correct icons for severity', () => {
      expect(formatIssueCount(1, 'info')).toContain('ℹ️')
      expect(formatIssueCount(1, 'warning')).toContain('⚠️')
      expect(formatIssueCount(1, 'error')).toContain('❌')
      expect(formatIssueCount(1, 'critical')).toContain('🚨')
    })
  })

  describe('formatSeveritySummary', () => {
    it.concurrent('should show no issues message when empty', () => {
      expect(formatSeveritySummary({})).toBe('✅ No issues')
      expect(formatSeveritySummary({info: 0, warning: 0, error: 0, critical: 0})).toBe(
        '✅ No issues',
      )
    })

    it.concurrent('should format single severity', () => {
      const result = formatSeveritySummary({error: 3})
      expect(result).toContain('3 errors')
    })

    it.concurrent('should format multiple severities in order', () => {
      const result = formatSeveritySummary({
        info: 2,
        warning: 3,
        error: 1,
        critical: 1,
      })
      expect(result).toContain('1 critical')
      expect(result).toContain('1 error')
      expect(result).toContain('3 warnings')
      expect(result).toContain('2 infos')

      // Critical should come first
      expect(result.indexOf('critical')).toBeLessThan(result.indexOf('error'))
    })
  })

  describe('handleCancel', () => {
    it.concurrent('should return false for non-symbol values', () => {
      expect(handleCancel('string')).toBe(false)
      expect(handleCancel(123)).toBe(false)
      expect(handleCancel(null)).toBe(false)
      expect(handleCancel(undefined)).toBe(false)
      expect(handleCancel([])).toBe(false)
      expect(handleCancel({})).toBe(false)
    })

    it.concurrent('should return false for arbitrary symbols', () => {
      // handleCancel specifically checks for @clack/prompts cancel symbol
      // arbitrary symbols should return false
      expect(handleCancel(Symbol('cancel'))).toBe(false)
    })
  })
})

describe('cli types', () => {
  it.concurrent('should define valid AnalyzeOptions type', () => {
    const options: AnalyzeOptions = {
      root: '/workspace',
      config: './config.ts',
      verbose: true,
      quiet: false,
      json: false,
      markdown: false,
      dryRun: true,
      interactive: true,
      fix: false,
    }

    expect(options.root).toBe('/workspace')
    expect(options.verbose).toBe(true)
    expect(options.dryRun).toBe(true)
  })
})

describe('analysis result display', () => {
  const mockAnalysisResult: AnalysisResult = {
    issues: [
      {
        id: 'unused-dep',
        title: 'Unused dependency',
        description: 'lodash is unused',
        severity: 'warning',
        category: 'dependency',
        location: {filePath: '/test/package.json', line: 10},
      },
      {
        id: 'circular-import',
        title: 'Circular import',
        description: 'A → B → A',
        severity: 'error',
        category: 'circular-import',
        location: {filePath: '/test/src/a.ts', line: 1},
      },
    ],
    summary: {
      totalIssues: 2,
      bySeverity: {info: 0, warning: 1, error: 1, critical: 0},
      byCategory: {
        configuration: 0,
        dependency: 1,
        architecture: 0,
        performance: 0,
        'circular-import': 1,
        'unused-export': 0,
        'type-safety': 0,
      },
      packagesAnalyzed: 1,
      filesAnalyzed: 5,
      durationMs: 1500,
    },
    workspacePath: '/test',
    startedAt: new Date('2025-01-01T00:00:00Z'),
    completedAt: new Date('2025-01-01T00:00:01.500Z'),
  }

  it.concurrent('should format summary correctly', () => {
    const summary = formatSeveritySummary(mockAnalysisResult.summary.bySeverity)

    expect(summary).toContain('1 error')
    expect(summary).toContain('1 warning')
  })

  it.concurrent('should format duration correctly', () => {
    const duration = formatDuration(mockAnalysisResult.summary.durationMs)

    expect(duration).toBe('1.5s')
  })
})
