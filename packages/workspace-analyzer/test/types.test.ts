import type {AnalysisError, AnalysisResult, Issue, Severity} from '../src/types/index'

import {describe, expect, it} from 'vitest'
import {err, isErr, isOk, ok} from '../src/types/result'

describe('types', () => {
  describe('result type utilities', () => {
    it.concurrent('should create Ok result with ok()', () => {
      const result = ok(42)
      expect(result.success).toBe(true)
      expect(result.data).toBe(42)
    })

    it.concurrent('should create Err result with err()', () => {
      const error: AnalysisError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
      }
      const result = err(error)
      expect(result.success).toBe(false)
      expect(result.error).toEqual(error)
    })

    it.concurrent('should identify Ok results with isOk()', () => {
      const okResult = ok('test')
      const errResult = err({code: 'ERR', message: 'error'})

      expect(isOk(okResult)).toBe(true)
      expect(isOk(errResult)).toBe(false)
    })

    it.concurrent('should identify Err results with isErr()', () => {
      const okResult = ok('test')
      const errResult = err({code: 'ERR', message: 'error'})

      expect(isErr(okResult)).toBe(false)
      expect(isErr(errResult)).toBe(true)
    })
  })

  describe('issue type', () => {
    it.concurrent('should represent a complete issue structure', () => {
      const issue: Issue = {
        id: 'unused-dep',
        title: 'Unused dependency',
        description: 'The dependency "lodash" is declared but never imported',
        severity: 'warning',
        category: 'dependency',
        location: {
          filePath: '/workspace/package.json',
          line: 15,
          column: 5,
        },
        suggestion: 'Remove "lodash" from dependencies',
      }

      expect(issue.id).toBe('unused-dep')
      expect(issue.severity).toBe('warning')
      expect(issue.category).toBe('dependency')
      expect(issue.location.filePath).toBe('/workspace/package.json')
    })

    it.concurrent('should support related locations for complex issues', () => {
      const issue: Issue = {
        id: 'circular-import',
        title: 'Circular import detected',
        description: 'A → B → C → A',
        severity: 'error',
        category: 'circular-import',
        location: {filePath: '/workspace/src/a.ts', line: 1},
        relatedLocations: [
          {filePath: '/workspace/src/b.ts', line: 3},
          {filePath: '/workspace/src/c.ts', line: 5},
        ],
      }

      expect(issue.relatedLocations).toHaveLength(2)
    })
  })

  describe('severity type', () => {
    it.concurrent('should support all severity levels', () => {
      const severities: Severity[] = ['info', 'warning', 'error', 'critical']

      expect(severities).toContain('info')
      expect(severities).toContain('warning')
      expect(severities).toContain('error')
      expect(severities).toContain('critical')
    })
  })

  describe('analysisResult type', () => {
    it.concurrent('should represent a complete analysis result', () => {
      const result: AnalysisResult = {
        issues: [],
        summary: {
          totalIssues: 0,
          bySeverity: {info: 0, warning: 0, error: 0, critical: 0},
          byCategory: {
            configuration: 0,
            dependency: 0,
            architecture: 0,
            performance: 0,
            'circular-import': 0,
            'unused-export': 0,
            'type-safety': 0,
          },
          packagesAnalyzed: 5,
          filesAnalyzed: 100,
          durationMs: 1500,
        },
        workspacePath: '/workspace',
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: new Date('2025-01-01T00:00:01.5Z'),
      }

      expect(result.summary.totalIssues).toBe(0)
      expect(result.summary.packagesAnalyzed).toBe(5)
      expect(result.summary.filesAnalyzed).toBe(100)
    })
  })
})
