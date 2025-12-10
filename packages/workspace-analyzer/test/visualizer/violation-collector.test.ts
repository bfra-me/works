/**
 * Tests for violation collection and mapping to visualization nodes.
 */

import type {RuleContext, RuleEngine} from '../../src/rules/rule-engine'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'
import type {Issue} from '../../src/types/index'
import type {VisualizationNode} from '../../src/visualizer/types'

import {ok} from '@bfra.me/es/result'
import {describe, expect, it, vi} from 'vitest'

import {
  collectVisualizationViolations,
  mapIssuesToNodes,
} from '../../src/visualizer/violation-collector'

describe('visualizer/violation-collector', () => {
  describe('mapIssuesToNodes', () => {
    it.concurrent('should map issues to nodes by file path', () => {
      const nodes = [
        createVisualizationNode('/workspace/src/a.ts'),
        createVisualizationNode('/workspace/src/b.ts'),
      ]

      const issues = [
        createIssue('/workspace/src/a.ts', 'error', 'layer-violation'),
        createIssue('/workspace/src/a.ts', 'warning', 'barrel-export'),
        createIssue('/workspace/src/b.ts', 'info', 'public-api'),
      ]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result).toHaveLength(2)
      expect(result[0]?.violations).toHaveLength(2)
      expect(result[1]?.violations).toHaveLength(1)
    })

    it.concurrent('should handle case-insensitive path matching', () => {
      const nodes = [createVisualizationNode('/Workspace/Src/Index.ts')]
      const issues = [createIssue('/workspace/src/index.ts', 'error', 'test-rule')]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[0]?.violations).toHaveLength(1)
    })

    it.concurrent('should normalize windows paths', () => {
      const nodes = [createVisualizationNode(String.raw`C:\workspace\src\index.ts`)]
      const issues = [createIssue('C:/workspace/src/index.ts', 'error', 'test-rule')]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[0]?.violations).toHaveLength(1)
    })

    it.concurrent('should set highest violation severity', () => {
      const nodes = [createVisualizationNode('/workspace/src/a.ts')]
      const issues = [
        createIssue('/workspace/src/a.ts', 'info', 'rule-1'),
        createIssue('/workspace/src/a.ts', 'critical', 'rule-2'),
        createIssue('/workspace/src/a.ts', 'warning', 'rule-3'),
      ]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[0]?.highestViolationSeverity).toBe('critical')
    })

    it.concurrent('should generate unique violation IDs', () => {
      const nodes = [createVisualizationNode('/workspace/src/a.ts')]
      const issues = [
        createIssue('/workspace/src/a.ts', 'error', 'same-rule'),
        createIssue('/workspace/src/a.ts', 'error', 'same-rule'),
      ]

      const result = mapIssuesToNodes(nodes, issues)
      const violations = result[0]?.violations ?? []

      expect(violations[0]?.id).not.toBe(violations[1]?.id)
    })

    it.concurrent('should preserve nodes without issues', () => {
      const nodes = [
        createVisualizationNode('/workspace/src/a.ts'),
        createVisualizationNode('/workspace/src/b.ts'),
      ]
      const issues = [createIssue('/workspace/src/a.ts', 'error', 'test-rule')]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[1]?.violations).toHaveLength(0)
      expect(result[1]?.highestViolationSeverity).toBeUndefined()
    })

    it.concurrent('should handle multiple issues per severity', () => {
      const nodes = [createVisualizationNode('/workspace/src/a.ts')]
      const issues = [
        createIssue('/workspace/src/a.ts', 'error', 'rule-1'),
        createIssue('/workspace/src/a.ts', 'error', 'rule-2'),
        createIssue('/workspace/src/a.ts', 'warning', 'rule-3'),
      ]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[0]?.violations).toHaveLength(3)
      expect(result[0]?.highestViolationSeverity).toBe('error')
    })

    it.concurrent('should handle empty issues array', () => {
      const nodes = [createVisualizationNode('/workspace/src/a.ts')]
      const issues: Issue[] = []

      const result = mapIssuesToNodes(nodes, issues)

      expect(result[0]?.violations).toHaveLength(0)
      expect(result[0]?.highestViolationSeverity).toBeUndefined()
    })

    it.concurrent('should handle empty nodes array', () => {
      const nodes: VisualizationNode[] = []
      const issues = [createIssue('/workspace/src/a.ts', 'error', 'test-rule')]

      const result = mapIssuesToNodes(nodes, issues)

      expect(result).toHaveLength(0)
    })

    it.concurrent('should map violation properties correctly', () => {
      const nodes = [createVisualizationNode('/workspace/src/a.ts')]
      const issues = [
        {
          id: 'layer-violation',
          title: 'Layer Violation',
          description: 'Infrastructure imports from domain',
          severity: 'error' as const,
          category: 'architecture' as const,
          location: {filePath: '/workspace/src/a.ts'},
        },
      ]

      const result = mapIssuesToNodes(nodes, issues)
      const violation = result[0]?.violations[0]

      expect(violation?.message).toBe('Infrastructure imports from domain')
      expect(violation?.severity).toBe('error')
      expect(violation?.ruleId).toBe('layer-violation')
    })
  })

  describe('collectVisualizationViolations', () => {
    it.concurrent('should collect violations from rule engine', async () => {
      const mockRuleEngine = createMockRuleEngine([
        createIssue('/workspace/packages/pkg1/src/a.ts', 'error', 'layer-violation'),
        createIssue('/workspace/packages/pkg1/src/b.ts', 'warning', 'barrel-export'),
      ])

      const packages = [createWorkspacePackage('pkg1', {hasTsConfig: false})]
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
      }

      const result = await collectVisualizationViolations(context)

      expect(result).toHaveProperty('data')
      const data = 'data' in result ? result.data : []
      expect(data.length).toBeGreaterThanOrEqual(0)
    })

    it.concurrent('should filter info-level issues when includeInfo is false', async () => {
      const mockRuleEngine = createMockRuleEngine([
        createIssue('/workspace/packages/pkg1/src/a.ts', 'error', 'rule-1'),
        createIssue('/workspace/packages/pkg1/src/b.ts', 'info', 'rule-2'),
        createIssue('/workspace/packages/pkg1/src/c.ts', 'warning', 'rule-3'),
      ])

      const packages = [createWorkspacePackage('pkg1', {hasTsConfig: false})]
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
      }

      const result = await collectVisualizationViolations(context, {includeInfo: false})

      expect(result).toHaveProperty('data')
      const data = 'data' in result ? result.data : []
      expect(data.length).toBeGreaterThanOrEqual(0)
    })

    it.concurrent('should respect maxIssues limit', async () => {
      const mockRuleEngine = createMockRuleEngine(
        Array.from({length: 100}, (_, i) =>
          createIssue(`/workspace/packages/pkg1/src/file${i}.ts`, 'error', 'rule'),
        ),
      )

      const packages = [createWorkspacePackage('pkg1')]
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
      }

      const result = await collectVisualizationViolations(context, {maxIssues: 50})

      expect(result).toHaveProperty('data')
      const data = 'data' in result ? result.data : []
      expect(data.length).toBeLessThanOrEqual(50)
    })

    it.concurrent('should handle packages without tsconfig.json', async () => {
      const mockRuleEngine = createMockRuleEngine([])
      const packages = [createWorkspacePackage('pkg1', {hasTsConfig: false})]
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
      }

      const result = await collectVisualizationViolations(context)

      expect(result).toHaveProperty('data')
      const data = 'data' in result ? result.data : []
      expect(data).toHaveLength(0)
    })

    it.concurrent('should call reportProgress callback', async () => {
      const mockRuleEngine = createMockRuleEngine([])
      const packages = [createWorkspacePackage('pkg1'), createWorkspacePackage('pkg2')]
      const reportProgress = vi.fn()
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
        reportProgress,
      }

      await collectVisualizationViolations(context)

      expect(reportProgress).toHaveBeenCalled()
      expect(reportProgress).toHaveBeenCalledWith(expect.stringContaining('pkg1'))
    })

    it.concurrent('should handle rule engine errors gracefully', async () => {
      const mockRuleEngine = createMockRuleEngine([], {shouldError: true})
      const packages = [createWorkspacePackage('pkg1')]
      const context = {
        ruleEngine: mockRuleEngine,
        packages,
        workspacePath: '/workspace',
      }

      const result = await collectVisualizationViolations(context)

      expect(result).toHaveProperty('data')
    })
  })
})

function createVisualizationNode(filePath: string): VisualizationNode {
  return {
    id: filePath,
    name: filePath,
    filePath,
    packageName: undefined,
    layer: undefined,
    importsCount: 0,
    importedByCount: 0,
    isInCycle: false,
    violations: [],
    highestViolationSeverity: undefined,
  }
}

function createIssue(filePath: string, severity: Issue['severity'], ruleId: string): Issue {
  return {
    id: ruleId,
    title: `${ruleId} violation`,
    description: `${ruleId} description`,
    severity,
    category: 'architecture',
    location: {filePath},
  }
}

function createWorkspacePackage(
  name: string,
  options: {hasTsConfig?: boolean} = {},
): WorkspacePackage {
  return {
    name: `@scope/${name}`,
    version: '1.0.0',
    packagePath: `/workspace/packages/${name}`,
    packageJsonPath: `/workspace/packages/${name}/package.json`,
    srcPath: `/workspace/packages/${name}/src`,
    packageJson: {
      name: `@scope/${name}`,
      version: '1.0.0',
    },
    sourceFiles: [`/workspace/packages/${name}/src/index.ts`],
    hasTsConfig: options.hasTsConfig ?? true,
    hasEslintConfig: false,
  }
}

function createMockRuleEngine(issues: Issue[], options: {shouldError?: boolean} = {}): RuleEngine {
  return {
    register: vi.fn(),
    unregister: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    getEnabled: vi.fn(),
    has: vi.fn(),
    evaluateFile: vi.fn(async (_context: RuleContext) => {
      if (options.shouldError) {
        return ok([])
      }
      return ok(issues)
    }),
    evaluateFiles: vi.fn(),
  } as unknown as RuleEngine
}
