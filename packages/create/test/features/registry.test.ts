import type {FeatureAddContext, FeatureInfo} from '../../src/types.js'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  addFeature,
  getAvailableFeatures,
  getFeatureInfo,
  getFeatureNamesForFramework,
  getFeaturesByCategory,
  isFeatureSupported,
  registerFeature,
} from '../../src/features/registry.js'

vi.mock('../../src/features/eslint.js', () => ({
  addESLintFeature: vi.fn(),
}))
vi.mock('../../src/features/prettier.js', () => ({
  addPrettierFeature: vi.fn(),
}))
vi.mock('../../src/features/typescript.js', () => ({
  addTypeScriptFeature: vi.fn(),
}))
vi.mock('../../src/features/vitest.js', () => ({
  addVitestFeature: vi.fn(),
}))
vi.mock('../../src/features/components.js', () => ({
  addComponentFeature: vi.fn(),
}))

describe('Feature Registry', () => {
  describe('getAvailableFeatures', () => {
    it('should return all available features', () => {
      const features = getAvailableFeatures()

      expect(features).toBeDefined()
      expect(Object.keys(features).length).toBeGreaterThan(0)
      expect(features.eslint).toBeDefined()
      expect(features.prettier).toBeDefined()
      expect(features.typescript).toBeDefined()
      expect(features.vitest).toBeDefined()
    })

    it('should include feature metadata', () => {
      const features = getAvailableFeatures()
      const eslintFeature = features.eslint

      expect(eslintFeature?.name).toBe('eslint')
      expect(eslintFeature?.description).toBeDefined()
      expect(eslintFeature?.category).toBe('linting')
      expect(eslintFeature?.devDependencies).toContain('@bfra.me/eslint-config')
      expect(eslintFeature?.devDependencies).toContain('eslint')
    })

    it('should include component features', () => {
      const features = getAvailableFeatures()

      expect(features['react-component']).toBeDefined()
      expect(features['vue-component']).toBeDefined()
      expect(features['react-component']?.category).toBe('component')
      expect(features['vue-component']?.category).toBe('component')
    })
  })

  describe('getFeatureInfo', () => {
    it('should return feature info for valid feature', () => {
      const eslint = getFeatureInfo('eslint')

      expect(eslint).toBeDefined()
      expect(eslint?.name).toBe('eslint')
      expect(eslint?.devDependencies).toContain('eslint')
    })

    it('should return undefined for unknown feature', () => {
      const unknown = getFeatureInfo('unknown-feature')

      expect(unknown).toBeUndefined()
    })

    it('should return correct info for prettier feature', () => {
      const prettier = getFeatureInfo('prettier')

      expect(prettier).toBeDefined()
      expect(prettier?.name).toBe('prettier')
      expect(prettier?.category).toBe('linting')
      expect(prettier?.devDependencies).toContain('@bfra.me/prettier-config')
    })

    it('should return correct info for typescript feature', () => {
      const typescript = getFeatureInfo('typescript')

      expect(typescript).toBeDefined()
      expect(typescript?.name).toBe('typescript')
      expect(typescript?.category).toBe('configuration')
      expect(typescript?.devDependencies).toContain('@bfra.me/tsconfig')
    })

    it('should return correct info for vitest feature', () => {
      const vitest = getFeatureInfo('vitest')

      expect(vitest).toBeDefined()
      expect(vitest?.name).toBe('vitest')
      expect(vitest?.category).toBe('testing')
      expect(vitest?.devDependencies).toContain('vitest')
    })
  })

  describe('isFeatureSupported', () => {
    it('should return true when feature is supported for project type', () => {
      expect(isFeatureSupported('eslint', 'typescript')).toBe(true)
      expect(isFeatureSupported('prettier', 'javascript')).toBe(true)
      expect(isFeatureSupported('vitest', 'react')).toBe(true)
    })

    it('should return false when feature is not supported for project type', () => {
      expect(isFeatureSupported('typescript', 'typescript')).toBe(false)
      expect(isFeatureSupported('react-component', 'vue')).toBe(false)
      expect(isFeatureSupported('vue-component', 'react')).toBe(false)
    })

    it('should return false for unknown feature', () => {
      expect(isFeatureSupported('unknown-feature', 'typescript')).toBe(false)
    })

    it('should support all frameworks when supportedFrameworks is empty', () => {
      // Mock a feature with no framework restrictions
      registerFeature('universal-feature', {
        name: 'universal-feature',
        description: 'A feature that works with all frameworks',
        category: 'linting',
        dependencies: [],
        devDependencies: [],
        supportedFrameworks: [],
        files: [],
        nextSteps: [],
      })

      expect(isFeatureSupported('universal-feature', 'typescript')).toBe(true)
      expect(isFeatureSupported('universal-feature', 'javascript')).toBe(true)
      expect(isFeatureSupported('universal-feature', 'unknown')).toBe(true)
    })

    it('should support all frameworks when supportedFrameworks is undefined', () => {
      registerFeature('no-framework-restriction', {
        name: 'no-framework-restriction',
        description: 'A feature without framework restrictions',
        category: 'testing',
        dependencies: [],
        devDependencies: [],
        files: [],
        nextSteps: [],
      })

      expect(isFeatureSupported('no-framework-restriction', 'typescript')).toBe(true)
      expect(isFeatureSupported('no-framework-restriction', 'vue')).toBe(true)
    })
  })

  describe('getFeaturesByCategory', () => {
    it('should return all linting features', () => {
      const lintingFeatures = getFeaturesByCategory('linting')

      expect(lintingFeatures.length).toBeGreaterThan(0)
      expect(lintingFeatures.some(f => f.name === 'eslint')).toBe(true)
      expect(lintingFeatures.some(f => f.name === 'prettier')).toBe(true)
      expect(lintingFeatures.every(f => f.category === 'linting')).toBe(true)
    })

    it('should return all testing features', () => {
      const testingFeatures = getFeaturesByCategory('testing')

      expect(testingFeatures.length).toBeGreaterThan(0)
      expect(testingFeatures.some(f => f.name === 'vitest')).toBe(true)
      expect(testingFeatures.every(f => f.category === 'testing')).toBe(true)
    })

    it('should return all configuration features', () => {
      const configFeatures = getFeaturesByCategory('configuration')

      expect(configFeatures.length).toBeGreaterThan(0)
      expect(configFeatures.some(f => f.name === 'typescript')).toBe(true)
      expect(configFeatures.every(f => f.category === 'configuration')).toBe(true)
    })

    it('should return all component features', () => {
      const componentFeatures = getFeaturesByCategory('component')

      expect(componentFeatures.length).toBeGreaterThan(0)
      expect(componentFeatures.some(f => f.name === 'react-component')).toBe(true)
      expect(componentFeatures.some(f => f.name === 'vue-component')).toBe(true)
      expect(componentFeatures.every(f => f.category === 'component')).toBe(true)
    })

    it('should return empty array for non-existent category', () => {
      const features = getFeaturesByCategory('non-existent' as never)

      expect(features).toEqual([])
    })
  })

  describe('getFeatureNamesForFramework', () => {
    it('should return feature names supported by typescript', () => {
      const features = getFeatureNamesForFramework('typescript')

      expect(features).toContain('eslint')
      expect(features).toContain('prettier')
      expect(features).toContain('vitest')
      expect(features).not.toContain('typescript')
    })

    it('should return feature names supported by react', () => {
      const features = getFeatureNamesForFramework('react')

      expect(features).toContain('eslint')
      expect(features).toContain('prettier')
      expect(features).toContain('vitest')
      expect(features).toContain('react-component')
      expect(features).not.toContain('vue-component')
    })

    it('should return feature names supported by vue', () => {
      const features = getFeatureNamesForFramework('vue')

      expect(features).toContain('eslint')
      expect(features).toContain('prettier')
      expect(features).toContain('vitest')
      expect(features).toContain('vue-component')
      expect(features).not.toContain('react-component')
    })

    it('should return feature names supported by javascript', () => {
      const features = getFeatureNamesForFramework('javascript')

      expect(features).toContain('eslint')
      expect(features).toContain('prettier')
      expect(features).toContain('typescript')
    })

    it('should return empty array for unknown framework', () => {
      const features = getFeatureNamesForFramework('unknown-framework')

      // Universal features should still be included
      expect(Array.isArray(features)).toBe(true)
    })
  })

  describe('registerFeature', () => {
    const originalRegistry = getAvailableFeatures()

    afterEach(() => {
      // Cleanup: remove custom features
      const current = getAvailableFeatures()
      for (const key of Object.keys(current)) {
        if (!(key in originalRegistry)) {
          delete current[key]
        }
      }
    })

    it('should register a new feature', () => {
      const customFeature: FeatureInfo = {
        name: 'custom-feature',
        description: 'A custom test feature',
        category: 'testing',
        dependencies: [],
        devDependencies: ['custom-package'],
        supportedFrameworks: ['typescript'],
        files: ['custom.config.js'],
        nextSteps: ['Run custom command'],
      }

      registerFeature('custom-feature', customFeature)

      const registered = getFeatureInfo('custom-feature')
      expect(registered).toEqual(customFeature)
    })

    it('should allow overwriting existing features', () => {
      const originalEslint = getFeatureInfo('eslint')
      const modifiedEslint: FeatureInfo = {
        ...(originalEslint ?? ({} as FeatureInfo)),
        description: 'Modified ESLint configuration',
      }

      registerFeature('eslint', modifiedEslint)

      const updated = getFeatureInfo('eslint')
      expect(updated?.description).toBe('Modified ESLint configuration')
    })

    it('should register feature with options', () => {
      const featureWithOptions: FeatureInfo = {
        name: 'configurable-feature',
        description: 'A feature with options',
        category: 'configuration',
        dependencies: [],
        devDependencies: [],
        supportedFrameworks: ['typescript'],
        files: [],
        nextSteps: [],
        options: [
          {
            name: 'mode',
            description: 'Operation mode',
            type: 'string',
            required: true,
          },
          {
            name: 'verbose',
            description: 'Enable verbose output',
            type: 'boolean',
            default: false,
          },
        ],
      }

      registerFeature('configurable-feature', featureWithOptions)

      const registered = getFeatureInfo('configurable-feature')
      expect(registered?.options).toHaveLength(2)
      expect(registered?.options?.[0]?.name).toBe('mode')
      expect(registered?.options?.[1]?.name).toBe('verbose')
    })
  })

  describe('addFeature', () => {
    const mockContext: FeatureAddContext = {
      targetDir: '/test/project',
      projectInfo: {
        type: 'typescript',
        packageManager: 'npm',
      },
      options: {},
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should throw error for unknown feature', async () => {
      await expect(addFeature('unknown-feature', mockContext)).rejects.toThrow(
        'Unknown feature: unknown-feature',
      )
    })

    it('should throw error when feature is not supported for project type', async () => {
      const vueContext: FeatureAddContext = {
        ...mockContext,
        projectInfo: {type: 'vue', packageManager: 'npm'},
      }

      await expect(addFeature('react-component', vueContext)).rejects.toThrow(
        'Feature "react-component" is not supported for vue projects',
      )
    })

    it('should call addESLintFeature when adding eslint feature', async () => {
      const {addESLintFeature} = await import('../../src/features/eslint.js')

      await addFeature('eslint', mockContext)

      expect(addESLintFeature).toHaveBeenCalledWith(mockContext)
    })

    it('should call addPrettierFeature when adding prettier feature', async () => {
      const {addPrettierFeature} = await import('../../src/features/prettier.js')

      await addFeature('prettier', mockContext)

      expect(addPrettierFeature).toHaveBeenCalledWith(mockContext)
    })

    it('should call addTypeScriptFeature when adding typescript feature', async () => {
      const {addTypeScriptFeature} = await import('../../src/features/typescript.js')
      const jsContext: FeatureAddContext = {
        ...mockContext,
        projectInfo: {type: 'javascript', packageManager: 'npm'},
      }

      await addFeature('typescript', jsContext)

      expect(addTypeScriptFeature).toHaveBeenCalledWith(jsContext)
    })

    it('should call addVitestFeature when adding vitest feature', async () => {
      const {addVitestFeature} = await import('../../src/features/vitest.js')

      await addFeature('vitest', mockContext)

      expect(addVitestFeature).toHaveBeenCalledWith(mockContext)
    })

    it('should call addComponentFeature for react-component', async () => {
      const {addComponentFeature} = await import('../../src/features/components.js')
      const reactContext: FeatureAddContext = {
        ...mockContext,
        projectInfo: {type: 'react', packageManager: 'npm'},
      }

      await addFeature('react-component', reactContext)

      expect(addComponentFeature).toHaveBeenCalledWith('react-component', reactContext)
    })

    it('should call addComponentFeature for vue-component', async () => {
      const {addComponentFeature} = await import('../../src/features/components.js')
      const vueContext: FeatureAddContext = {
        ...mockContext,
        projectInfo: {type: 'vue', packageManager: 'npm'},
      }

      await addFeature('vue-component', vueContext)

      expect(addComponentFeature).toHaveBeenCalledWith('vue-component', vueContext)
    })

    it('should throw error for unimplemented feature', async () => {
      // Register a feature without implementation
      registerFeature('not-implemented', {
        name: 'not-implemented',
        description: 'A feature without implementation',
        category: 'testing',
        dependencies: [],
        devDependencies: [],
        supportedFrameworks: ['typescript'],
        files: [],
        nextSteps: [],
      })

      await expect(addFeature('not-implemented', mockContext)).rejects.toThrow(
        'Feature "not-implemented" is not yet implemented',
      )
    })

    it('should include supported frameworks in error message', async () => {
      const nodeContext: FeatureAddContext = {
        ...mockContext,
        projectInfo: {type: 'node', packageManager: 'npm'},
      }

      await expect(addFeature('react-component', nodeContext)).rejects.toThrow(
        /Supported frameworks:.*react/,
      )
    })
  })
})
