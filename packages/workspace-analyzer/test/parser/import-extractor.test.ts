/**
 * Import extractor tests for verifying import statement extraction from TypeScript/JavaScript files.
 */

import {createProject} from '@bfra.me/doc-sync/parsers'
import {describe, expect, it} from 'vitest'

import {
  extractImports,
  getPackageNameFromSpecifier,
  getUniqueDependencies,
  isRelativeImport,
  isWorkspacePackageImport,
  resolveRelativeImport,
} from '../../src/parser/import-extractor'

describe('import-extractor', () => {
  describe('extractImports', () => {
    it.concurrent('should extract static imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import {foo, bar} from 'some-package'
import type {SomeType} from 'type-package'
import defaultExport from 'default-pkg'
import * as namespace from 'namespace-pkg'
import './relative-module'
import '@bfra.me/workspace-pkg'
`.trim(),
      )

      const result = extractImports(sourceFile)

      expect(result.imports).toHaveLength(6)
      expect(result.externalDependencies).toContain('some-package')
      expect(result.externalDependencies).toContain('type-package')
      expect(result.externalDependencies).toContain('default-pkg')
      expect(result.externalDependencies).toContain('namespace-pkg')
      expect(result.relativeImports).toContain('./relative-module')
      expect(result.workspaceDependencies).toContain('@bfra.me/workspace-pkg')
    })

    it.concurrent('should extract named imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import {foo, bar, baz} from 'package'`,
      )

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.importedNames).toEqual(['foo', 'bar', 'baz'])
    })

    it.concurrent('should extract default imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile('test.ts', `import React from 'react'`)

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.defaultImport).toBe('React')
    })

    it.concurrent('should extract namespace imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile('test.ts', `import * as path from 'node:path'`)

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.namespaceImport).toBe('path')
    })

    it.concurrent('should identify type-only imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import type {SomeType} from 'types-pkg'`,
      )

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.type).toBe('type-only')
    })

    it.concurrent('should identify side-effect only imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile('test.ts', `import 'side-effect-module'`)

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.isSideEffectOnly).toBe(true)
    })

    it.concurrent('should extract dynamic imports', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
const module = await import('dynamic-module')
const lazy = import('./lazy-component')
`.trim(),
      )

      const result = extractImports(sourceFile)
      const dynamicImports = result.imports.filter(i => i.type === 'dynamic')

      expect(dynamicImports).toHaveLength(2)
      expect(dynamicImports[0]?.moduleSpecifier).toBe('dynamic-module')
      expect(dynamicImports[1]?.moduleSpecifier).toBe('./lazy-component')
    })

    it.concurrent('should extract require() calls', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
const fs = require('fs')
const localModule = require('./local')
`.trim(),
      )

      const result = extractImports(sourceFile)
      const requireImports = result.imports.filter(i => i.type === 'require')

      expect(requireImports).toHaveLength(2)
    })

    it.concurrent('should respect includeTypeImports option', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import type {TypeA} from 'types'
import {value} from 'values'
`.trim(),
      )

      const resultWithTypes = extractImports(sourceFile, {includeTypeImports: true})
      const resultWithoutTypes = extractImports(sourceFile, {includeTypeImports: false})

      expect(resultWithTypes.imports).toHaveLength(2)
      expect(resultWithoutTypes.imports).toHaveLength(1)
    })

    it.concurrent('should respect includeDynamicImports option', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import {foo} from 'static'
const bar = await import('dynamic')
`.trim(),
      )

      const resultWithDynamic = extractImports(sourceFile, {includeDynamicImports: true})
      const resultWithoutDynamic = extractImports(sourceFile, {includeDynamicImports: false})

      expect(resultWithDynamic.imports).toHaveLength(2)
      expect(resultWithoutDynamic.imports).toHaveLength(1)
    })

    it.concurrent('should respect includeRequireCalls option', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import {foo} from 'static'
const bar = require('cjs-module')
`.trim(),
      )

      const resultWithRequire = extractImports(sourceFile, {includeRequireCalls: true})
      const resultWithoutRequire = extractImports(sourceFile, {includeRequireCalls: false})

      expect(resultWithRequire.imports).toHaveLength(2)
      expect(resultWithoutRequire.imports).toHaveLength(1)
    })

    it.concurrent('should include line and column information', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile('test.ts', `import {foo} from 'package'`)

      const result = extractImports(sourceFile)
      const imp = result.imports[0]

      expect(imp?.line).toBe(1)
      expect(imp?.column).toBeGreaterThan(0)
    })

    it.concurrent('should support custom workspace prefixes', () => {
      const project = createProject()
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import {a} from '@custom/pkg'
import {b} from '@bfra.me/pkg'
import {c} from 'external'
`.trim(),
      )

      const result = extractImports(sourceFile, {
        workspacePrefixes: ['@custom/', '@bfra.me/'],
      })

      expect(result.workspaceDependencies).toContain('@custom/pkg')
      expect(result.workspaceDependencies).toContain('@bfra.me/pkg')
      expect(result.externalDependencies).toContain('external')
    })
  })

  describe('isRelativeImport', () => {
    it.concurrent('should identify relative imports starting with ./', () => {
      expect(isRelativeImport('./module')).toBe(true)
      expect(isRelativeImport('./deep/path')).toBe(true)
    })

    it.concurrent('should identify relative imports starting with ../', () => {
      expect(isRelativeImport('../parent')).toBe(true)
      expect(isRelativeImport('../../grandparent')).toBe(true)
    })

    it.concurrent('should identify absolute path imports', () => {
      expect(isRelativeImport('/absolute/path')).toBe(true)
    })

    it.concurrent('should identify non-relative imports', () => {
      expect(isRelativeImport('lodash')).toBe(false)
      expect(isRelativeImport('@scope/pkg')).toBe(false)
      expect(isRelativeImport('node:fs')).toBe(false)
    })
  })

  describe('isWorkspacePackageImport', () => {
    it.concurrent('should identify workspace packages by prefix', () => {
      expect(isWorkspacePackageImport('@bfra.me/es', ['@bfra.me/'])).toBe(true)
      expect(isWorkspacePackageImport('@bfra.me/doc-sync', ['@bfra.me/'])).toBe(true)
    })

    it.concurrent('should not identify external packages as workspace packages', () => {
      expect(isWorkspacePackageImport('lodash', ['@bfra.me/'])).toBe(false)
      expect(isWorkspacePackageImport('@types/node', ['@bfra.me/'])).toBe(false)
    })

    it.concurrent('should support multiple workspace prefixes', () => {
      expect(isWorkspacePackageImport('@custom/pkg', ['@bfra.me/', '@custom/'])).toBe(true)
    })
  })

  describe('getPackageNameFromSpecifier', () => {
    it.concurrent('should extract scoped package name', () => {
      expect(getPackageNameFromSpecifier('@scope/pkg')).toBe('@scope/pkg')
      expect(getPackageNameFromSpecifier('@scope/pkg/subpath')).toBe('@scope/pkg')
      expect(getPackageNameFromSpecifier('@scope/pkg/deep/path')).toBe('@scope/pkg')
    })

    it.concurrent('should extract unscoped package name', () => {
      expect(getPackageNameFromSpecifier('lodash')).toBe('lodash')
      expect(getPackageNameFromSpecifier('lodash/fp')).toBe('lodash')
      expect(getPackageNameFromSpecifier('lodash/collection/map')).toBe('lodash')
    })

    it.concurrent('should return relative imports unchanged', () => {
      expect(getPackageNameFromSpecifier('./relative')).toBe('./relative')
      expect(getPackageNameFromSpecifier('../parent')).toBe('../parent')
    })
  })

  describe('resolveRelativeImport', () => {
    it.concurrent('should resolve relative imports to absolute paths', () => {
      const result = resolveRelativeImport('/workspace/src/index.ts', './utils')
      expect(result).toContain('/workspace/src/utils')
    })

    it.concurrent('should resolve parent directory imports', () => {
      const result = resolveRelativeImport('/workspace/src/deep/module.ts', '../helpers')
      expect(result).toContain('/workspace/src/helpers')
    })
  })

  describe('getUniqueDependencies', () => {
    it.concurrent('should aggregate unique dependencies from multiple files', () => {
      const results = [
        {
          imports: [],
          filePath: '/a.ts',
          externalDependencies: ['lodash', 'express'],
          workspaceDependencies: ['@bfra.me/es'],
          relativeImports: [],
        },
        {
          imports: [],
          filePath: '/b.ts',
          externalDependencies: ['lodash', 'axios'],
          workspaceDependencies: ['@bfra.me/es', '@bfra.me/doc-sync'],
          relativeImports: [],
        },
      ]

      const unique = getUniqueDependencies(results)

      expect(unique.external).toEqual(['axios', 'express', 'lodash'])
      expect(unique.workspace).toEqual(['@bfra.me/doc-sync', '@bfra.me/es'])
    })

    it.concurrent('should return sorted arrays', () => {
      const results = [
        {
          imports: [],
          filePath: '/test.ts',
          externalDependencies: ['z-pkg', 'a-pkg', 'm-pkg'],
          workspaceDependencies: ['@z/pkg', '@a/pkg'],
          relativeImports: [],
        },
      ]

      const unique = getUniqueDependencies(results)

      expect(unique.external).toEqual(['a-pkg', 'm-pkg', 'z-pkg'])
      expect(unique.workspace).toEqual(['@a/pkg', '@z/pkg'])
    })
  })
})
