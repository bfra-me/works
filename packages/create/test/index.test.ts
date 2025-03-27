import fs from 'node:fs/promises'
import process from 'node:process'
import {run} from '@sxzz/create'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createPackage} from '../src/index.js'

// Mock external modules
vi.mock('node:fs/promises')
vi.mock('@sxzz/create')
vi.mock('node:path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
  },
}))

describe('createPackage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset all mocks after each test
    vi.resetAllMocks()
  })

  it('should create a package with default template', async () => {
    const options = {
      outputDir: '/test/output',
    }

    await createPackage(options)

    // Verify mkdir was called with correct arguments
    expect(fs.mkdir).toHaveBeenCalledWith('/test/output', {recursive: true})

    // Verify run was called with correct arguments
    expect(run).toHaveBeenCalledWith({
      config: {
        templates: [
          {
            name: 'default',
            url: expect.stringContaining('/templates/default'),
          },
        ],
      },
      projectPath: '/test/output',
    })
  })

  it('should create a package with custom template', async () => {
    const options = {
      template: 'custom',
      outputDir: '/test/output',
    }

    await createPackage(options)

    expect(fs.mkdir).toHaveBeenCalledWith('/test/output', {recursive: true})
    expect(run).toHaveBeenCalledWith({
      config: {
        templates: [
          {
            name: 'default',
            url: expect.stringContaining('/templates/custom'),
          },
        ],
      },
      projectPath: '/test/output',
    })
  })

  it('should use current working directory when no outputDir is specified', async () => {
    const options = {}
    const cwd = process.cwd()

    await createPackage(options)

    expect(fs.mkdir).toHaveBeenCalledWith(cwd, {recursive: true})
    expect(run).toHaveBeenCalledWith({
      config: {
        templates: [
          {
            name: 'default',
            url: expect.stringContaining('/templates/default'),
          },
        ],
      },
      projectPath: cwd,
    })
  })

  it('should handle filesystem errors', async () => {
    const mockError = new Error('Failed to create directory')
    vi.mocked(fs.mkdir).mockRejectedValueOnce(mockError)

    const options = {
      outputDir: '/test/output',
    }

    await expect(createPackage(options)).rejects.toThrow('Failed to create directory')
  })
})
