/**
 * @fileoverview Tests for template-selection prompt module
 */

import process from 'node:process'
import * as clackPrompts from '@clack/prompts'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@clack/prompts')
vi.mock('consola', () => ({
  consola: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})

describe('template-selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('templateSelection', () => {
    it('should return builtin selection when initial template default is provided', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('default')

      expect(result).toBeDefined()
      expect(result.type).toBe('builtin')
      expect(result.location).toBe('default')
      expect(result.metadata.name).toBe('default')
    })

    it('should return builtin selection for library template', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('library')

      expect(result.type).toBe('builtin')
      expect(result.location).toBe('library')
      expect(result.metadata.name).toBe('library')
    })

    it('should return builtin selection for cli template', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('cli')

      expect(result.type).toBe('builtin')
      expect(result.location).toBe('cli')
      expect(result.metadata.name).toBe('cli')
    })

    it('should return builtin selection for node template', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('node')

      expect(result.type).toBe('builtin')
      expect(result.location).toBe('node')
      expect(result.metadata.name).toBe('node')
    })

    it('should return builtin selection for react template', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('react')

      expect(result.type).toBe('builtin')
      expect(result.location).toBe('react')
      expect(result.metadata.name).toBe('react')
    })

    it('should resolve github: prefix templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('github:user/repo')

      expect(result.type).toBe('github')
      expect(result.location).toBe('user/repo')
    })

    it('should resolve short github user/repo format', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('owner/repository')

      expect(result.type).toBe('github')
      expect(result.location).toBe('owner/repository')
    })

    it('should resolve github templates with ref', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('github:user/repo#v1.0.0')

      expect(result.type).toBe('github')
      expect(result.location).toBe('user/repo')
      expect(result.ref).toBe('v1.0.0')
    })

    it('should resolve https URL templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('https://example.com/template.zip')

      expect(result.type).toBe('url')
      expect(result.location).toBe('https://example.com/template.zip')
    })

    it('should resolve http URL templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('http://example.com/template')

      expect(result.type).toBe('url')
      expect(result.location).toBe('http://example.com/template')
    })

    it('should resolve ./ local path templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('./my-template')

      expect(result.type).toBe('local')
      expect(result.location).toBe('./my-template')
    })

    it('should resolve / absolute path templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('/path/to/template')

      expect(result.type).toBe('local')
      expect(result.location).toBe('/path/to/template')
    })

    it('should resolve ~/ home path templates', async () => {
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('~/templates/my-template')

      expect(result.type).toBe('local')
      expect(result.location).toBe('~/templates/my-template')
    })

    it('should fallback unknown template to default with warning', async () => {
      const {consola} = await import('consola')
      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('unknown-single-word')

      expect(consola.warn).toHaveBeenCalled()
      expect(result.type).toBe('builtin')
      expect(result.location).toBe('default')
    })

    it('should show interactive selection when no template provided', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('default')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection()

      expect(clackPrompts.select).toHaveBeenCalled()
      expect(result.type).toBe('builtin')
    })

    it('should show interactive selection for empty string template', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('library')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('')

      expect(clackPrompts.select).toHaveBeenCalled()
      expect(result.type).toBe('builtin')
      expect(result.location).toBe('library')
    })

    it('should show interactive selection for whitespace template', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('cli')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection('   ')

      expect(clackPrompts.select).toHaveBeenCalled()
      expect(result.type).toBe('builtin')
    })

    it('should handle cancellation during interactive selection', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce(Symbol.for('cancel'))
      vi.mocked(clackPrompts.isCancel).mockReturnValue(true)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      await expect(templateSelection()).rejects.toThrow('process.exit')
    })

    it('should handle custom template selection option', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('custom')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('github:custom/template')

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection()

      expect(clackPrompts.text).toHaveBeenCalled()
      expect(result.type).toBe('github')
      expect(result.location).toBe('custom/template')
    })

    it('should handle custom template with local path', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('custom')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)
      vi.mocked(clackPrompts.text).mockResolvedValueOnce('./local/custom')

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      const result = await templateSelection()

      expect(result.type).toBe('local')
      expect(result.location).toBe('./local/custom')
    })

    it('should handle cancellation during custom template input', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('custom')
      vi.mocked(clackPrompts.isCancel).mockReturnValueOnce(false).mockReturnValueOnce(true)
      vi.mocked(clackPrompts.text).mockResolvedValueOnce(Symbol.for('cancel'))

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      await expect(templateSelection()).rejects.toThrow('process.exit')
    })

    it('should show template preview for builtin templates', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('react')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      await templateSelection()

      expect(clackPrompts.note).toHaveBeenCalled()
    })

    it('should include all builtin templates in options', async () => {
      vi.mocked(clackPrompts.select).mockResolvedValueOnce('default')
      vi.mocked(clackPrompts.isCancel).mockReturnValue(false)

      const {templateSelection} = await import('../../src/prompts/template-selection.js')

      await templateSelection()

      const selectCall = vi.mocked(clackPrompts.select).mock.calls[0]
      const options = selectCall?.[0]?.options as {value: string}[]

      expect(options.some(o => o.value === 'default')).toBe(true)
      expect(options.some(o => o.value === 'library')).toBe(true)
      expect(options.some(o => o.value === 'cli')).toBe(true)
      expect(options.some(o => o.value === 'node')).toBe(true)
      expect(options.some(o => o.value === 'react')).toBe(true)
      expect(options.some(o => o.value === 'custom')).toBe(true)
    })
  })

  describe('getBuiltinTemplates', () => {
    it('should return all builtin templates', async () => {
      const {getBuiltinTemplates} = await import('../../src/prompts/template-selection.js')

      const templates = getBuiltinTemplates()

      expect(templates).toBeDefined()
      expect(templates.default).toBeDefined()
      expect(templates.library).toBeDefined()
      expect(templates.cli).toBeDefined()
      expect(templates.node).toBeDefined()
      expect(templates.react).toBeDefined()
    })

    it('should return a copy of templates (not the original)', async () => {
      const {getBuiltinTemplates} = await import('../../src/prompts/template-selection.js')

      const templates1 = getBuiltinTemplates()
      const templates2 = getBuiltinTemplates()

      expect(templates1).not.toBe(templates2)
    })

    it('should include template metadata', async () => {
      const {getBuiltinTemplates} = await import('../../src/prompts/template-selection.js')

      const templates = getBuiltinTemplates()
      const defaultTemplate = templates.default

      expect(defaultTemplate?.name).toBe('default')
      expect(defaultTemplate?.description).toBeDefined()
      expect(defaultTemplate?.version).toBeDefined()
      expect(defaultTemplate?.tags).toBeDefined()
    })
  })

  describe('validateTemplateSource', () => {
    it('should validate empty source as invalid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('')

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate whitespace-only source as invalid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('   ')

      expect(result.valid).toBe(false)
    })

    it('should validate builtin template names as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      expect(validateTemplateSource('default').valid).toBe(true)
      expect(validateTemplateSource('library').valid).toBe(true)
      expect(validateTemplateSource('cli').valid).toBe(true)
      expect(validateTemplateSource('node').valid).toBe(true)
      expect(validateTemplateSource('react').valid).toBe(true)
    })

    it('should validate github: prefix as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('github:user/repo')

      expect(result.valid).toBe(true)
    })

    it('should validate user/repo shorthand as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('owner/repo')

      expect(result.valid).toBe(true)
    })

    it('should validate https URL as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('https://github.com/user/repo')

      expect(result.valid).toBe(true)
    })

    it('should validate http URL as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('http://example.com/template')

      expect(result.valid).toBe(true)
    })

    it('should validate ./ path as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('./my-template')

      expect(result.valid).toBe(true)
    })

    it('should validate / absolute path as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('/path/to/template')

      expect(result.valid).toBe(true)
    })

    it('should validate ~/ home path as valid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('~/templates/mytemplate')

      expect(result.valid).toBe(true)
    })

    it('should validate unknown single word as invalid', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('unknown-single-word')

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should include helpful error message for invalid sources', async () => {
      const {validateTemplateSource} = await import('../../src/prompts/template-selection.js')

      const result = validateTemplateSource('invalid')

      expect(result.error).toContain('builtin')
      expect(result.error).toContain('github')
    })
  })
})
