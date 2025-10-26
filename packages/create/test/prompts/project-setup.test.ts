import type {CreateCommandOptions} from '../../src/types.js'
import {confirm, intro, isCancel, multiselect, outro, select, text} from '@clack/prompts'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {projectSetup} from '../../src/prompts/project-setup.js'
import {testUtils} from '../test-utils.js'

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  confirm: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock project-specific modules
vi.mock('../../src/prompts/template-selection.js', () => ({
  templateSelection: vi.fn(),
}))

vi.mock('../../src/prompts/customization.js', () => ({
  projectCustomization: vi.fn(),
}))

vi.mock('../../src/prompts/confirmation.js', () => ({
  confirmationStep: vi.fn(),
}))

// Mock process.exit to prevent actual process termination during tests
const mockExit = vi.fn()
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
})

describe('cLI interaction prompts', () => {
  beforeEach(() => {
    testUtils.setup()
    vi.clearAllMocks()

    // Reset the process.exit mock
    mockExit.mockReset()

    // Default mock implementations
    vi.mocked(intro).mockImplementation(() => {})
    vi.mocked(outro).mockImplementation(() => {})
    vi.mocked(isCancel).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('project setup prompts', () => {
    it('handles non-interactive mode correctly', async () => {
      const options: CreateCommandOptions = {
        name: 'non-interactive-test',
        template: 'cli',
        packageManager: 'npm',
        author: 'Non-Interactive Author',
        description: 'Non-interactive project',
        interactive: false,
      }

      const result = await projectSetup(options)

      expect(result).toMatchObject({
        projectName: 'non-interactive-test',
        options: expect.objectContaining({
          template: 'cli',
          packageManager: 'npm',
        }) as Record<string, unknown>,
      })

      // Prompts should not be called in non-interactive mode
      expect(text).not.toHaveBeenCalled()
      expect(select).not.toHaveBeenCalled()
      expect(multiselect).not.toHaveBeenCalled()
      expect(confirm).not.toHaveBeenCalled()
    })

    it('handles skip prompts mode correctly', async () => {
      const options: CreateCommandOptions = {
        name: 'skip-prompts-test',
        template: 'library',
        skipPrompts: true,
      }

      const result = await projectSetup(options)

      expect(result).toMatchObject({
        projectName: 'skip-prompts-test',
        options: expect.objectContaining({
          template: 'library',
        }) as Record<string, unknown>,
      })

      // Prompts should not be called when skipPrompts is true
      expect(text).not.toHaveBeenCalled()
      expect(intro).not.toHaveBeenCalled()
    })

    it('validates project name input', async () => {
      const invalidNames = ['', '   ', 'Invalid Name', 'invalid_name', 'INVALID']

      vi.mocked(text).mockImplementation(async ({validate}) => {
        if (validate) {
          // Test all invalid names
          for (const invalidName of invalidNames) {
            const validationResult = validate(invalidName)
            expect(validationResult).toBeTruthy() // Should return error message
          }

          // Test valid name
          const validResult = validate('valid-project-name')
          expect(validResult).toBeUndefined() // Should return undefined for valid input
        }

        return 'valid-project-name'
      })

      // Mock the other prompt functions to avoid errors
      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      const {projectCustomization} = await import('../../src/prompts/customization.js')
      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      vi.mocked(templateSelection).mockResolvedValue({
        type: 'builtin',
        location: 'default',
        metadata: {name: 'default', description: 'Default template', version: '1.0.0'},
      })

      vi.mocked(projectCustomization).mockResolvedValue({
        description: 'Test description',
        author: 'Test Author',
        features: ['typescript', 'eslint'],
      })

      vi.mocked(confirmationStep).mockResolvedValue(true)

      const result = await projectSetup({interactive: true})
      expect(result.projectName).toBe('valid-project-name')
    })

    it('handles cancellation in project name prompt', async () => {
      vi.mocked(text).mockResolvedValue(Symbol('CANCEL'))
      vi.mocked(isCancel).mockReturnValue(true)

      await expect(projectSetup({interactive: true})).rejects.toThrow('Process exit called')
    })

    it('uses provided project name when available', async () => {
      const options: CreateCommandOptions = {
        name: 'provided-name',
        interactive: true,
      }

      // Mock the prompt functions to avoid undefined errors
      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      const {projectCustomization} = await import('../../src/prompts/customization.js')
      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      vi.mocked(templateSelection).mockResolvedValue({
        type: 'builtin',
        location: 'default',
        metadata: {name: 'default', description: 'Default template', version: '1.0.0'},
      })

      vi.mocked(projectCustomization).mockResolvedValue({
        description: 'Test description',
        features: ['typescript'],
      })

      vi.mocked(confirmationStep).mockResolvedValue(true)

      const result = await projectSetup(options)

      expect(result.projectName).toBe('provided-name')
      // Project name prompt should not be called when name is provided
      expect(text).not.toHaveBeenCalled()
    })
  })

  describe('prompt error handling', () => {
    it('handles template selection errors', async () => {
      const options: CreateCommandOptions = {
        name: 'error-test',
        interactive: true,
      }

      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      vi.mocked(templateSelection).mockRejectedValue(new Error('Template selection failed'))

      await expect(projectSetup(options)).rejects.toThrow('Template selection failed')
    })

    it('handles customization errors', async () => {
      const options: CreateCommandOptions = {
        name: 'customization-error-test',
        interactive: true,
      }

      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      const {projectCustomization} = await import('../../src/prompts/customization.js')

      vi.mocked(templateSelection).mockResolvedValue({
        type: 'builtin',
        location: 'default',
        metadata: {name: 'default', description: 'Default template', version: '1.0.0'},
      })

      vi.mocked(projectCustomization).mockRejectedValue(new Error('Customization failed'))

      await expect(projectSetup(options)).rejects.toThrow('Customization failed')
    })

    it('requires project name when not provided', async () => {
      const options: CreateCommandOptions = {
        interactive: false, // No interactive prompts
        // No name provided
      }

      await expect(projectSetup(options)).rejects.toThrow('Project name is required')
    })
  })

  describe('workflow integration', () => {
    it('completes full interactive workflow', async () => {
      const options: CreateCommandOptions = {
        interactive: true,
      }

      // Mock project name input
      vi.mocked(text).mockResolvedValue('complete-workflow-test')

      // Mock all workflow steps
      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      const {projectCustomization} = await import('../../src/prompts/customization.js')
      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      const mockTemplate = {
        type: 'builtin' as const,
        location: 'library',
        metadata: {
          name: 'library',
          description: 'TypeScript library template',
          version: '1.0.0',
        },
      }

      const mockCustomization = {
        description: 'Test library project',
        author: 'Test Author',
        packageManager: 'pnpm' as const,
        features: ['typescript', 'vitest'],
      }

      vi.mocked(templateSelection).mockResolvedValue(mockTemplate)
      vi.mocked(projectCustomization).mockResolvedValue(mockCustomization)
      vi.mocked(confirmationStep).mockResolvedValue(true)

      const result = await projectSetup(options)

      expect(result).toMatchObject({
        projectName: 'complete-workflow-test',
        template: mockTemplate,
        customization: mockCustomization,
      })

      // Verify all workflow steps were called
      expect(intro).toHaveBeenCalled()
      expect(templateSelection).toHaveBeenCalledExactlyOnceWith(undefined)
      expect(projectCustomization).toHaveBeenCalled()
      expect(confirmationStep).toHaveBeenCalled()
      expect(outro).toHaveBeenCalled()
    })

    it('handles confirmation cancellation', async () => {
      const options: CreateCommandOptions = {
        name: 'confirmation-cancel-test',
        interactive: true,
      }

      // Mock successful steps leading to confirmation
      const {templateSelection} = await import('../../src/prompts/template-selection.js')
      const {projectCustomization} = await import('../../src/prompts/customization.js')
      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      vi.mocked(templateSelection).mockResolvedValue({
        type: 'builtin',
        location: 'default',
        metadata: {name: 'default', description: 'Default template', version: '1.0.0'},
      })

      vi.mocked(projectCustomization).mockResolvedValue({
        description: 'Test description',
        features: ['typescript'],
      })

      // Mock confirmation cancellation
      vi.mocked(confirmationStep).mockResolvedValue(false)

      await expect(projectSetup(options)).rejects.toThrow()
    })
  })
})
