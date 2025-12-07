/**
 * @fileoverview Tests for confirmation prompt module
 */

import type {ProjectCustomization, TemplateSelection} from '../../src/types.js'
import process from 'node:process'
import * as clackPrompts from '@clack/prompts'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@clack/prompts')

vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})

describe('confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockTemplate = (overrides?: Partial<TemplateSelection>): TemplateSelection => ({
    type: 'builtin',
    location: 'default',
    metadata: {
      name: 'default',
      description: 'Default template',
      version: '1.0.0',
    },
    ...overrides,
  })

  const createMockCustomization = (
    overrides?: Partial<ProjectCustomization>,
  ): ProjectCustomization => ({
    features: [],
    ...overrides,
  })

  describe('confirmationStep', () => {
    it('should display project summary and confirm', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      const result = await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization(),
      })

      expect(clackPrompts.note).toHaveBeenCalled()
      expect(clackPrompts.confirm).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when user denies', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(false)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      const result = await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization(),
      })

      expect(result).toBe(false)
    })

    it('should exit when user cancels', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(Symbol.for('cancel'))
      vi.mocked(clackPrompts.isCancel).mockReturnValue(true)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await expect(
        confirmationStep({
          projectName: 'my-project',
          template: createMockTemplate(),
          customization: createMockCustomization(),
        }),
      ).rejects.toThrow('process.exit')
    })

    it('should include project description in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          description: 'A test project',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('A test project')
    })

    it('should include author in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          author: 'Test Author',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('Test Author')
    })

    it('should include version in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          version: '2.0.0',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('2.0.0')
    })

    it('should include package manager in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          packageManager: 'pnpm',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('pnpm')
    })

    it('should include output directory in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          outputDir: '/custom/output',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('/custom/output')
    })

    it('should include features in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          features: ['typescript', 'eslint', 'prettier'],
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('typescript')
      expect(noteCall?.[0]).toContain('eslint')
    })

    it('should show GitHub template source with ref', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate({
          type: 'github',
          location: 'user/repo',
          ref: 'v1.0.0',
        }),
        customization: createMockCustomization(),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('GitHub')
      expect(noteCall?.[0]).toContain('user/repo')
      expect(noteCall?.[0]).toContain('v1.0.0')
    })

    it('should show URL template source', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate({
          type: 'url',
          location: 'https://example.com/template.zip',
        }),
        customization: createMockCustomization(),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('URL')
    })

    it('should show local template source', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate({
          type: 'local',
          location: './my-template',
        }),
        customization: createMockCustomization(),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('Local')
    })

    it('should show builtin template source', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate({type: 'builtin'}),
        customization: createMockCustomization(),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('Built-in')
    })

    it('should skip empty description', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmationStep} = await import('../../src/prompts/confirmation.js')

      await confirmationStep({
        projectName: 'my-project',
        template: createMockTemplate(),
        customization: createMockCustomization({
          description: '   ',
        }),
      })

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).not.toContain('Project Description')
    })
  })

  describe('confirmModification', () => {
    it('should display modification summary and confirm', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmModification} = await import('../../src/prompts/confirmation.js')

      const result = await confirmModification('/path/to/project', ['Add ESLint', 'Add Prettier'])

      expect(clackPrompts.note).toHaveBeenCalled()
      expect(clackPrompts.confirm).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when user denies modification', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(false)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmModification} = await import('../../src/prompts/confirmation.js')

      const result = await confirmModification('/path/to/project', ['Add ESLint'])

      expect(result).toBe(false)
    })

    it('should exit when user cancels modification', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(Symbol.for('cancel'))
      vi.mocked(clackPrompts.isCancel).mockReturnValue(true)

      const {confirmModification} = await import('../../src/prompts/confirmation.js')

      await expect(confirmModification('/path/to/project', ['Add ESLint'])).rejects.toThrow(
        'process.exit',
      )
    })

    it('should include all modifications in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmModification} = await import('../../src/prompts/confirmation.js')

      await confirmModification('/path/to/project', [
        'Add TypeScript',
        'Add ESLint',
        'Add Prettier',
      ])

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('Add TypeScript')
      expect(noteCall?.[0]).toContain('Add ESLint')
      expect(noteCall?.[0]).toContain('Add Prettier')
    })
  })

  describe('confirmFeatureAddition', () => {
    it('should display feature summary and confirm', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      const result = await confirmFeatureAddition(
        '/path/to/project',
        'eslint',
        ['eslint', '@eslint/js'],
        ['eslint.config.js'],
      )

      expect(clackPrompts.note).toHaveBeenCalled()
      expect(clackPrompts.confirm).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when user denies feature addition', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(false)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      const result = await confirmFeatureAddition('/path/to/project', 'eslint', [], [])

      expect(result).toBe(false)
    })

    it('should exit when user cancels feature addition', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(Symbol.for('cancel'))
      vi.mocked(clackPrompts.isCancel).mockReturnValue(true)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      await expect(confirmFeatureAddition('/path/to/project', 'eslint', [], [])).rejects.toThrow(
        'process.exit',
      )
    })

    it('should include dependencies in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      await confirmFeatureAddition(
        '/path/to/project',
        'prettier',
        ['prettier', 'prettier-plugin-sort-imports'],
        [],
      )

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('prettier')
      expect(noteCall?.[0]).toContain('prettier-plugin-sort-imports')
    })

    it('should include files in summary', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      await confirmFeatureAddition(
        '/path/to/project',
        'typescript',
        [],
        ['tsconfig.json', 'src/index.ts'],
      )

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).toContain('tsconfig.json')
      expect(noteCall?.[0]).toContain('src/index.ts')
    })

    it('should handle empty dependencies array', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      await confirmFeatureAddition('/path/to/project', 'custom', [], ['config.json'])

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).not.toContain('Dependencies')
    })

    it('should handle empty files array', async () => {
      vi.mocked(clackPrompts.confirm).mockResolvedValueOnce(true)
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {confirmFeatureAddition} = await import('../../src/prompts/confirmation.js')

      await confirmFeatureAddition('/path/to/project', 'custom', ['some-dep'], [])

      const noteCall = vi.mocked(clackPrompts.note).mock.calls[0]
      expect(noteCall?.[0]).not.toContain('Files')
    })
  })
})
