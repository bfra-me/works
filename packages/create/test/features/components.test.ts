import type {FeatureAddContext} from '../../src/types.js'
import {existsSync, mkdirSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {addComponentFeature} from '../../src/features/components.js'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('consola', () => ({
  consola: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const mockExistsSync = vi.mocked(existsSync)
const mockMkdirSync = vi.mocked(mkdirSync)
const mockWriteFile = vi.mocked(writeFile)

describe('addComponentFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExistsSync.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validation', () => {
    it('should throw error when component name is not provided', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'react'},
        options: {},
      }

      await expect(addComponentFeature('react-component', context)).rejects.toThrow(
        'Component name is required',
      )
    })

    it('should throw error when component name is not PascalCase', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'react'},
        options: {name: 'myComponent'},
      }

      await expect(addComponentFeature('react-component', context)).rejects.toThrow(
        'Component name must be PascalCase',
      )
    })

    it('should throw error for lowercase component name', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'react'},
        options: {name: 'mycomponent'},
      }

      await expect(addComponentFeature('react-component', context)).rejects.toThrow(
        'Component name must be PascalCase',
      )
    })

    it('should throw error for component name starting with number', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'react'},
        options: {name: '1Component'},
      }

      await expect(addComponentFeature('react-component', context)).rejects.toThrow(
        'Component name must be PascalCase',
      )
    })

    it('should accept valid PascalCase component names', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'MyComponent'},
      }

      await expect(addComponentFeature('react-component', context)).resolves.not.toThrow()
    })

    it('should throw error for unsupported component type', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'react'},
        options: {name: 'MyComponent'},
      }

      await expect(addComponentFeature('angular-component', context)).rejects.toThrow(
        'Unsupported component type: angular-component',
      )
    })
  })

  describe('react-component', () => {
    it('should create component directory if it does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('components'), {
        recursive: true,
      })
    })

    it('should not create directory if it already exists', async () => {
      mockExistsSync.mockReturnValue(true)
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockMkdirSync).not.toHaveBeenCalled()
    })

    it('should create TSX component file for TypeScript projects', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.tsx'),
        expect.stringContaining('export default function Button'),
        'utf-8',
      )
    })

    it('should create JSX component file for JavaScript projects', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'javascript'},
        options: {name: 'Button', withTest: false},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.jsx'),
        expect.stringContaining('export default function Button'),
        'utf-8',
      )
    })

    it('should create test file by default', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.test.tsx'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should not create test file when withTest is false', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button', withTest: false},
      }

      await addComponentFeature('react-component', context)

      const writeFileCalls = mockWriteFile.mock.calls
      const testFileCreated = writeFileCalls.some(call => String(call[0]).includes('.test.'))
      expect(testFileCreated).toBe(false)
    })

    it('should create story file when withStory is true', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button', withStory: true},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.stories.tsx'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should not create story file by default', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      const writeFileCalls = mockWriteFile.mock.calls
      const storyFileCreated = writeFileCalls.some(call => String(call[0]).includes('.stories.'))
      expect(storyFileCreated).toBe(false)
    })

    it('should create index file for easy imports', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('index.ts'),
        expect.stringContaining("export { default } from './Button'"),
        'utf-8',
      )
    })

    it('should use custom component path when provided', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button', path: 'ui/atoms'},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/ui\/atoms.*Button\.tsx$/),
        expect.any(String),
        'utf-8',
      )
    })

    it('should include TypeScript interface in TSX component', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Card', withTest: false},
      }

      await addComponentFeature('react-component', context)

      const componentCall = mockWriteFile.mock.calls.find(call =>
        String(call[0]).includes('Card.tsx'),
      )
      expect(componentCall).toBeDefined()
      expect(componentCall?.[1]).toContain('export interface CardProps')
    })
  })

  describe('vue-component', () => {
    it('should create Vue component file', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('vue-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.vue'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should create Vue component with TypeScript script', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button', withTest: false},
      }

      await addComponentFeature('vue-component', context)

      const vueCall = mockWriteFile.mock.calls.find(call => String(call[0]).includes('Button.vue'))
      expect(vueCall?.[1]).toContain('lang="ts"')
    })

    it('should create Vue test file with TypeScript when project is TypeScript', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('vue-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.test.ts'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should create Vue test file with JavaScript when project is JavaScript', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'javascript'},
        options: {name: 'Button'},
      }

      await addComponentFeature('vue-component', context)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('Button.test.js'),
        expect.any(String),
        'utf-8',
      )
    })
  })

  describe('dry run mode', () => {
    it('should not create files in dry run mode', async () => {
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        dryRun: true,
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it('should not create directories in dry run mode', async () => {
      mockExistsSync.mockReturnValue(false)
      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        dryRun: true,
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockMkdirSync).not.toHaveBeenCalled()
    })
  })

  describe('verbose mode', () => {
    it('should log messages in verbose mode', async () => {
      const {consola} = await import('consola')
      const mockConsola = vi.mocked(consola)

      const context: FeatureAddContext = {
        targetDir: '/test/project',
        projectInfo: {type: 'typescript'},
        verbose: true,
        options: {name: 'Button'},
      }

      await addComponentFeature('react-component', context)

      expect(mockConsola.info).toHaveBeenCalledWith('Adding react-component...')
      expect(mockConsola.success).toHaveBeenCalled()
    })
  })
})
