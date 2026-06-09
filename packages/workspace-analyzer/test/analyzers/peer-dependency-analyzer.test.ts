/**
 * PeerDependencyAnalyzer tests for validating peer dependency declarations.
 */

import type {AnalysisContext} from '../../src/analyzers/analyzer'
import type {WorkspacePackage} from '../../src/scanner/workspace-scanner'

import {describe, expect, it} from 'vitest'

import {createPeerDependencyAnalyzer} from '../../src/analyzers/peer-dependency-analyzer'

function createMockPackage(overrides: Partial<WorkspacePackage> = {}): WorkspacePackage {
  return {
    name: '@test/pkg',
    version: '1.0.0',
    packagePath: '/workspace/packages/pkg',
    packageJsonPath: '/workspace/packages/pkg/package.json',
    srcPath: '/workspace/packages/pkg/src',
    sourceFiles: [],
    hasTsConfig: true,
    hasEslintConfig: true,
    packageJson: {
      name: '@test/pkg',
      version: '1.0.0',
      peerDependencies: {},
    },
    ...overrides,
  }
}

function createMockContext(packages: readonly WorkspacePackage[]): AnalysisContext {
  return {
    workspacePath: '/workspace',
    packages,
    config: {},
    reportProgress: () => {},
  }
}

describe('peer-dependency-analyzer', () => {
  it.concurrent('accepts valid comparator-only peer dependency ranges', async () => {
    const pkg = createMockPackage({
      packageJson: {
        name: '@test/pkg',
        version: '1.0.0',
        peerDependencies: {
          '@next/eslint-plugin-next': '>=15.5.3',
          'eslint-plugin-jsx-a11y': '>=6.10.2',
          'semantic-release': '>=23',
          'ts-morph': '>=27.0.0',
          typescript: '>=5.0.0',
        },
      },
    })
    const analyzer = createPeerDependencyAnalyzer()
    const context = createMockContext([pkg])

    const result = await analyzer.analyze(context)

    expect(result.success).toBe(true)
    expect(
      result.success ? result.data.filter(issue => issue.id === 'invalid-peer-version') : [],
    ).toHaveLength(0)
  })
})
