import type {CreateCommandOptions, TemplateSelection} from '../../src/types.js'
import * as clackPrompts from '@clack/prompts'
import * as packageManagerDetector from 'package-manager-detector'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {projectCustomization, validateCustomization} from '../../src/prompts/customization.js'

vi.mock('@clack/prompts')
vi.mock('package-manager-detector')
vi.mock('../../src/utils/ui.js', () => ({
  displayDependencyRecommendations: vi.fn(),
}))

describe('projectCustomization', () => {
  const mockTemplate: TemplateSelection = {
    type: 'builtin',
    location: 'default',
    metadata: {
      name: 'default',
      description: 'A default project template',
      version: '1.0.0',
    },
  }

  const initialOptions: CreateCommandOptions = {
    name: 'test-project',
    template: 'default',
    interactive: true,
    dryRun: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(clackPrompts.isCancel).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('description field', () => {
    it('should use provided description from options', async () => {
      const options = {...initialOptions, description: 'My custom description'}

      vi.mocked(clackPrompts.text).mockResolvedValue('1.0.0')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'pnpm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('pnpm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions: options,
      })

      expect(result.description).toBe('My custom description')
    })

    it('should prompt for description when not provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Custom project description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.description).toBe('Custom project description')
      expect(clackPrompts.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '📝 Describe your project (optional):',
          placeholder: 'A new default project',
        }),
      )
    })

    it('should use default description when empty string provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.description).toBe('')
    })

    it('should handle user cancellation in description prompt', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce(cancelSymbol as never)
      vi.mocked(clackPrompts.isCancel).mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })

  describe('author field', () => {
    it('should use provided author from options', async () => {
      const options = {...initialOptions, author: 'John Doe <john@example.com>'}

      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Test description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions: options,
      })

      expect(result.author).toBe('John Doe <john@example.com>')
    })

    it('should prompt for author when not provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Jane Smith')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.author).toBe('Jane Smith')
      expect(clackPrompts.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '👤 Project author (optional):',
          placeholder: 'Your Name <email@example.com>',
        }),
      )
    })

    it('should handle user cancellation in author prompt', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce(cancelSymbol as never)
      vi.mocked(clackPrompts.isCancel).mockReturnValueOnce(false).mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })

  describe('version field', () => {
    it('should use provided version from options', async () => {
      const options = {...initialOptions, version: '2.0.0-beta.1'}

      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions: options,
      })

      expect(result.version).toBe('2.0.0-beta.1')
    })

    it('should validate version format', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('invalid-version')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      const call = vi
        .mocked(clackPrompts.text)
        .mock.calls.find(call => call[0].message === '🏷️  Initial version:')
      expect(call).toBeDefined()
      const callParams = call?.[0]
      expect(callParams?.validate).toBeDefined()

      const validateFn = callParams?.validate
      expect(validateFn?.('invalid')).toBe('Version must follow semver format (e.g., 1.0.0)')
      expect(validateFn?.('')).toBe('Version is required')
      expect(validateFn?.('1.0.0')).toBeUndefined()
      expect(validateFn?.('2.1.0-beta.1')).toBeUndefined()
    })

    it('should use default version when not provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.version).toBe('1.0.0')
    })

    it('should handle user cancellation in version prompt', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce(cancelSymbol as never)
      vi.mocked(clackPrompts.isCancel)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })

  describe('package manager selection', () => {
    it('should use provided package manager from options', async () => {
      const options = {...initialOptions, packageManager: 'yarn' as const}

      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions: options,
      })

      expect(result.packageManager).toBe('yarn')
      expect(packageManagerDetector.detect).not.toHaveBeenCalled()
    })

    it('should auto-detect package manager when not provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'pnpm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('pnpm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(packageManagerDetector.detect).toHaveBeenCalled()
      expect(clackPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '📦 Choose package manager:',
          initialValue: 'pnpm',
        }),
      )
      expect(result.packageManager).toBe('pnpm')
    })

    it('should show detected package manager in options', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'bun'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      const selectCall = vi.mocked(clackPrompts.select).mock.calls[0]
      expect(selectCall?.[0]?.options).toContainEqual(
        expect.objectContaining({
          value: 'bun',
          hint: '(detected)',
        }),
      )
    })

    it('should default to npm when detection fails', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue(null as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          initialValue: 'npm',
        }),
      )
      expect(result.packageManager).toBe('npm')
    })

    it('should handle user cancellation in package manager prompt', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue(cancelSymbol as never)
      vi.mocked(clackPrompts.isCancel)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })

  describe('output directory', () => {
    it('should use provided output directory from options', async () => {
      const options = {...initialOptions, outputDir: './custom-output'}

      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions: options,
      })

      expect(result.outputDir).toBe('./custom-output')
    })

    it('should prompt for output directory when not provided', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./my-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.outputDir).toBe('./my-project')
      expect(clackPrompts.text).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '📁 Output directory:',
          placeholder: './test-project',
          defaultValue: './test-project',
        }),
      )
    })

    it('should validate output directory is not empty', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      const call = vi
        .mocked(clackPrompts.text)
        .mock.calls.find(call => call[0].message === '📁 Output directory:')
      expect(call).toBeDefined()
      const callParams = call?.[0]
      expect(callParams?.validate).toBeDefined()

      const validateFn = callParams?.validate
      expect(validateFn?.('')).toBe('Output directory is required')
      expect(validateFn?.('   ')).toBe('Output directory is required')
      expect(validateFn?.('./valid-dir')).toBeUndefined()
    })

    it('should handle user cancellation in output directory prompt', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce(cancelSymbol as never)
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.isCancel)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })
  })

  describe('optional features selection', () => {
    it('should handle features selection with no AI recommendations', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue(['prettier', 'eslint'])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.features).toEqual(['prettier', 'eslint'])
      expect(clackPrompts.multiselect).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '🔧 Select optional features to include:',
        }),
      )
    })

    it('should display AI recommendations in features list', async () => {
      const {displayDependencyRecommendations} = await import('../../src/utils/ui.js')

      const aiRecommendations = [
        {
          name: 'prettier',
          description: 'Code formatter',
          reason: 'Code formatting is recommended',
          confidence: 0.9,
          isDev: true,
        },
        {
          name: 'vitest',
          description: 'Testing framework',
          reason: 'Testing framework recommended',
          confidence: 0.85,
          isDev: true,
        },
      ]

      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
        aiRecommendations,
      })

      expect(displayDependencyRecommendations).toHaveBeenCalledWith(aiRecommendations)
    })

    it('should handle user cancellation in features selection', async () => {
      const cancelSymbol = Symbol('cancel')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue(cancelSymbol as never)
      vi.mocked(clackPrompts.isCancel)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      vi.mocked(clackPrompts.cancel).mockImplementation(() => undefined as never)

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(clackPrompts.cancel).toHaveBeenCalledWith('Project customization cancelled')
      expect(mockExit).toHaveBeenCalledWith(0)

      mockExit.mockRestore()
    })

    it('should handle empty features selection', async () => {
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Description')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('Author')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('1.0.0')
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./test-project')
      vi.mocked(packageManagerDetector.detect).mockResolvedValue({name: 'npm'} as never)
      vi.mocked(clackPrompts.select).mockResolvedValue('npm')
      vi.mocked(clackPrompts.multiselect).mockResolvedValue([])

      const result = await projectCustomization({
        projectName: 'test-project',
        template: mockTemplate,
        initialOptions,
      })

      expect(result.features).toEqual([])
    })
  })
})

describe('validateCustomization', () => {
  it('should validate valid customization', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
      packageManager: 'npm' as const,
      outputDir: './test-project',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should reject invalid version format', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: 'invalid-version',
      packageManager: 'npm' as const,
      outputDir: './test-project',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Version must follow semver format (e.g., 1.0.0)')
  })

  it('should reject invalid package manager', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
      packageManager: 'invalid-pm' as 'npm' | 'yarn' | 'pnpm' | 'bun',
      outputDir: './test-project',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Package manager must be one of: npm, yarn, pnpm, bun')
  })

  it('should reject empty output directory', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
      packageManager: 'npm' as const,
      outputDir: '   ',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Output directory cannot be empty')
  })

  it('should accept valid semver with prerelease', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: '2.1.0-beta.1',
      packageManager: 'npm' as const,
      outputDir: './test-project',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('should accumulate multiple validation errors', () => {
    const customization = {
      description: 'A test project',
      author: 'Test Author',
      version: 'bad-version',
      packageManager: 'bad-pm' as 'npm' | 'yarn' | 'pnpm' | 'bun',
      outputDir: '',
      features: [],
      variables: {},
    }

    const result = validateCustomization(customization)

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
    expect(result.errors).toContain('Version must follow semver format (e.g., 1.0.0)')
    expect(result.errors).toContain('Package manager must be one of: npm, yarn, pnpm, bun')
    expect(result.errors).toContain('Output directory cannot be empty')
  })
})
