/**
 * Tests for template metadata manager
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-035)
 */

import type {TemplateMetadata, TemplateVariable} from '../../src/types.js'
import {existsSync} from 'node:fs'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, expect, it, vi} from 'vitest'
import {TemplateMetadataManager} from '../../src/templates/metadata.js'

// Mock file system modules
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    existsSync: vi.fn(),
  }
})

vi.mock('node:fs/promises', async () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }
})

// Mock consola
vi.mock('consola', () => ({
  consola: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const mockExistsSync = vi.mocked(existsSync)
const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)

describe('TemplateMetadataManager', () => {
  describe('load', () => {
    it('returns default metadata when template.json does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      const manager = new TemplateMetadataManager()

      const result = await manager.load('/templates/my-template')

      expect(result.success).toBe(true)
      const data = result.success ? result.data : null
      expect(data?.name).toBe('my-template')
      expect(data?.description).toBe('Template description not available')
      expect(data?.version).toBe('1.0.0')
    })

    it('loads metadata from template.json', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          name: 'Test Template',
          description: 'Test description',
          version: '1.0.0',
        }),
      )

      const manager = new TemplateMetadataManager()
      const result = await manager.load('/templates/test-template')

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error('Expected success')
      }
      expect(result.data.name).toBe('Test Template')
      expect(result.data.description).toBe('Test description')
      expect(result.data.version).toBe('1.0.0')
    })

    it('returns error when JSON parsing fails', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue('{ invalid json }')

      const manager = new TemplateMetadataManager()
      const result = await manager.load('/templates/test-template')

      expect(result.success).toBe(false)
      const error = result.success ? null : result.error
      expect(error).toBeDefined()
    })

    it('returns error when metadata validation fails', async () => {
      mockExistsSync.mockReturnValue(true)
      // Missing required fields
      mockReadFile.mockResolvedValue(JSON.stringify({name: ''}))

      const manager = new TemplateMetadataManager()
      const result = await manager.load('/templates/test-template')

      expect(result.success).toBe(false)
    })

    it('merges partial metadata with defaults', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          name: 'partial-template',
          description: 'Partial description',
          version: '1.0.0',
        }),
      )

      const manager = new TemplateMetadataManager()
      const result = await manager.load('/templates/partial-template')

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error('Expected success')
      }
      expect(result.data.name).toBe('partial-template')
      expect(result.data.description).toBe('Partial description')
    })
  })

  describe('save', () => {
    it('saves valid metadata to template.json', async () => {
      mockWriteFile.mockResolvedValue(undefined)
      const metadata: TemplateMetadata = {
        name: 'test-template',
        description: 'A test template',
        version: '1.0.0',
      }

      const manager = new TemplateMetadataManager()
      const result = await manager.save('/templates/test-template', metadata)

      expect(result.success).toBe(true)
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join('/templates/test-template', 'template.json'),
        expect.any(String),
        'utf-8',
      )
    })

    it('returns error when validation fails', async () => {
      const metadata = {
        name: '',
        description: 'Invalid template',
        version: '1.0.0',
      } as TemplateMetadata

      const manager = new TemplateMetadataManager()
      const result = await manager.save('/templates/test-template', metadata)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected failure')
      }
      expect(result.error).toBeDefined()
    })

    it('returns error when write fails', async () => {
      mockWriteFile.mockRejectedValue(new Error('Permission denied'))
      const metadata: TemplateMetadata = {
        name: 'test-template',
        description: 'A test template',
        version: '1.0.0',
      }

      const manager = new TemplateMetadataManager()
      const result = await manager.save('/templates/test-template', metadata)

      expect(result.success).toBe(false)
      if (result.success) {
        throw new Error('Expected failure')
      }
      expect(result.error.message).toContain('Permission denied')
    })

    it('formats JSON with 2 spaces indentation', async () => {
      mockWriteFile.mockResolvedValue(undefined)
      const metadata: TemplateMetadata = {
        name: 'test-template',
        description: 'A test template',
        version: '1.0.0',
      }

      const manager = new TemplateMetadataManager()
      await manager.save('/templates/test-template', metadata)

      const savedContent = mockWriteFile.mock.calls[0]?.[1] as string
      expect(savedContent).toContain('  "name"')
      expect(savedContent.endsWith('\n')).toBe(true)
    })
  })

  describe('validate', () => {
    describe('required fields', () => {
      it('validates complete metadata', () => {
        const metadata: TemplateMetadata = {
          name: 'valid-template',
          description: 'A valid template',
          version: '1.0.0',
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeUndefined()
      })

      it('returns error for missing name', () => {
        const metadata = {
          description: 'A template',
          version: '1.0.0',
        } as Partial<TemplateMetadata>

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template name is required and must be a non-empty string')
      })

      it('returns error for empty name', () => {
        const metadata = {
          name: '',
          description: 'A template',
          version: '1.0.0',
        } as Partial<TemplateMetadata>

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template name is required and must be a non-empty string')
      })

      it('returns error for missing description', () => {
        const metadata = {
          name: 'test',
          version: '1.0.0',
        } as Partial<TemplateMetadata>

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template description is required and must be a string')
      })

      it('returns error for missing version', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
        } as Partial<TemplateMetadata>

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template version is required and must be a string')
      })
    })

    describe('optional fields', () => {
      it('validates author as string', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          author: 123 as unknown as string,
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template author must be a string')
      })

      it('validates tags as string array', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          tags: 'not-an-array' as unknown as string[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template tags must be an array')
      })

      it('validates all tags are strings', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          tags: ['valid', 123 as unknown as string],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('All template tags must be strings')
      })

      it('validates dependencies as string array', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          dependencies: 'not-an-array' as unknown as string[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template dependencies must be an array')
      })

      it('validates nodeVersion as string', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          nodeVersion: 18 as unknown as string,
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template nodeVersion must be a string')
      })
    })

    describe('semver validation', () => {
      it('accepts valid semver versions', () => {
        const metadata: TemplateMetadata = {
          name: 'test',
          description: 'A template',
          version: '1.2.3',
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(true)
        expect(result.warnings).toBeUndefined()
      })

      it('warns for invalid semver format', () => {
        const metadata: TemplateMetadata = {
          name: 'test',
          description: 'A template',
          version: 'not-semver',
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(true)
        expect(result.warnings).toContain('Template version "not-semver" is not a valid semver')
      })

      it('accepts semver with prerelease', () => {
        const metadata: TemplateMetadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0-beta.1',
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(true)
      })
    })

    describe('variables validation', () => {
      it('validates variables must be an array', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: 'not-an-array' as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Template variables must be an array')
      })

      it('validates variable must be an object', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: ['not-an-object'] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Variable at index 0 must be an object')
      })

      it('validates variable name is required', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [{description: 'test', type: 'string'}] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Variable at index 0 must have a valid name')
      })

      it('validates variable description is required', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [{name: 'var1', type: 'string'}] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Variable at index 0 must have a valid description')
      })

      it('validates variable type is valid', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [
            {name: 'var1', description: 'test', type: 'invalid'},
          ] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
          'Variable at index 0 must have a valid type (string, boolean, number, select)',
        )
      })

      it('validates select type requires options', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [
            {name: 'var1', description: 'test', type: 'select'},
          ] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain(
          "Variable at index 0 with type 'select' must have options array",
        )
      })

      it('accepts valid select variable with options', () => {
        const metadata: TemplateMetadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [
            {
              name: 'framework',
              description: 'Choose a framework',
              type: 'select',
              options: ['react', 'vue', 'svelte'],
            },
          ],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(true)
      })

      it('validates pattern must be a string', () => {
        const metadata = {
          name: 'test',
          description: 'A template',
          version: '1.0.0',
          variables: [
            {name: 'var1', description: 'test', type: 'string', pattern: 123},
          ] as unknown as TemplateVariable[],
        }

        const manager = new TemplateMetadataManager()
        const result = manager.validate(metadata)

        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Variable at index 0 pattern must be a string')
      })
    })
  })

  describe('create', () => {
    it('creates template.json with default values', async () => {
      mockWriteFile.mockResolvedValue(undefined)

      const manager = new TemplateMetadataManager()
      const result = await manager.create('/templates/new-template')

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error('Expected success')
      }
      expect(result.data.name).toBe('new-template')
      expect(result.data.version).toBe('1.0.0')
    })

    it('creates template.json with custom options', async () => {
      mockWriteFile.mockResolvedValue(undefined)

      const manager = new TemplateMetadataManager()
      const result = await manager.create('/templates/custom-template', {
        name: 'Custom Template',
        description: 'A custom template',
        author: 'John Doe',
        tags: ['custom', 'example'],
      })

      expect(result.success).toBe(true)
      if (!result.success) {
        throw new Error('Expected success')
      }
      expect(result.data.name).toBe('Custom Template')
      expect(result.data.description).toBe('A custom template')
      expect(result.data.author).toBe('John Doe')
      expect(result.data.tags).toEqual(['custom', 'example'])
    })

    it('returns error when save fails', async () => {
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      const manager = new TemplateMetadataManager()
      const result = await manager.create('/templates/fail-template')

      expect(result.success).toBe(false)
    })
  })
})
