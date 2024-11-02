import {createPackage} from '../src'
import {beforeEach, describe, expect, it, vi as vitest} from 'vitest'
import {fs, vol} from 'memfs'
import {URL} from 'node:url'

const src = new URL('../src', import.meta.url).pathname

vitest.mock('node:fs')
vitest.mock('node:fs/promises')

describe('createPackage', () => {
  const mockConsoleLog = vitest.fn()

  beforeEach(() => {
    vitest.resetAllMocks()
    vol.reset()
    fs.mkdirSync(`${src}/templates/default`, {recursive: true})
    global.console = {...console, log: mockConsoleLog}
  })

  it('should create package with custom options', async () => {
    const root = `${src}/templates/default`
    vol.fromJSON(
      {
        'package.json':
          '{"name": "{{packageName}}", "version": "{{version}}", "description": "{{description}}", "author": "{{author}}"}',
        'index.ts': 'export const hello = () => "world"',
      },
      root,
    )

    await createPackage('test-package', {
      outputDir: '/custom/dir',
      version: '2.0.0',
      description: 'Custom description',
      author: 'John Doe',
      template: 'default',
    })

    expect(fs.existsSync('/custom/dir/test-package')).toBe(true)
    expect(fs.readFileSync('/custom/dir/test-package/package.json', 'utf-8')).toBe(
      '{"name": "test-package", "version": "2.0.0", "description": "Custom description", "author": "John Doe"}',
    )
    expect(mockConsoleLog).toHaveBeenCalledWith('Package test-package created successfully.')
  })

  it('should use default values when options are not provided', async () => {
    const root = `${src}/templates/default`
    vol.fromJSON(
      {
        'package.json':
          '{"name": "{{packageName}}", "version": "{{version}}", "description": "{{description}}", "author": "{{author}}"}',
        'index.ts': 'export const hello = () => "world"',
      },
      root,
    )

    await createPackage('minimal-package', {})

    expect(fs.existsSync('minimal-package')).toBe(true)
    expect(fs.readFileSync('minimal-package/package.json', 'utf-8')).toContain('version": "1.0.0"')
    expect(fs.readFileSync('minimal-package/package.json', 'utf-8')).toContain(
      '"description": "A new package"',
    )
  })

  it('should handle special characters in package name', async () => {
    const root = `${src}/templates/default`
    vol.fromJSON(
      {
        'package.json': '{"name": "{{packageName}}"}',
        'index.ts': 'export const hello = () => "world"',
      },
      root,
    )
    await createPackage('@scope/package-name', {
      outputDir: '/test/dir',
    })

    expect(fs.existsSync('/test/dir/@scope/package-name')).toBe(true)
    expect(fs.readFileSync('/test/dir/@scope/package-name/package.json', 'utf-8')).toBe(
      '{"name": "@scope/package-name"}',
    )
  })

  it('should throw error if template files are not found', async () => {
    await expect(
      createPackage('error-package', {
        template: 'nonexistent',
      }),
    ).rejects.toThrow()
  })
})
